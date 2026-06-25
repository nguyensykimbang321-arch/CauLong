import { Op } from 'sequelize';
import models from '../models/index.js';
import type { CreateBookingInput, UpdateBookingStatusInput } from '../validations/booking.validation.js';
import dayjs from 'dayjs';
import sequelize from '../config/database.js';
import ApiError from '../utils/ErrorClass.js';
import { BOOKING_STATUS_TRANSITIONS, PAYMENT_STATUS_TRANSITIONS } from '../constants/booking.constant.js';
import { PricingService } from './pricing.service.js';
import { VNPayUtils } from '../utils/vnpay.js';
import { UserService } from './user.service.js';

export class BookingService {
    static async getAvailableCourts(
        facilityId: number,
        startDateTime: Date,
        endDateTime: Date,
        courtType?: string
    ) {
        const bookedSlots = await models.BookingSlot.findAll({
            where: {
                [Op.and]: [
                    { start_at: { [Op.lt]: endDateTime } },
                    { end_at: { [Op.gt]: startDateTime } }
                ]
            },
            include: [{
                model: models.Booking,
                as: 'booking',
                where: { facility_id: facilityId, status: { [Op.ne]: 'cancelled' } },
                attributes: []
            }],
            attributes: ['court_id'],
            raw: true
        });

        const bookedCourtIds = bookedSlots.map(slot => slot.court_id);

        const whereCondition: any = {
            facility_id: facilityId,
            id: { [Op.notIn]: bookedCourtIds },
            is_active: true
        };

        if (courtType) {
            whereCondition.court_type = courtType;
        }


        // 2. Lấy danh sách sân của cơ sở
        const allCourtsOfThisType = await models.Court.findAll({
            where: { facility_id: facilityId, court_type: courtType, is_active: true }
        });

        if (allCourtsOfThisType.length === 0) {
            throw new ApiError(`Cơ sở này hiện không có sân ${courtType === 'badminton' ? 'cầu lông' : courtType} nào.`, 404);
        }

        const availableCourts = await models.Court.findAll({
            where: whereCondition,
            include: [{
                model: models.Facility,
                as: 'facility',
                attributes: ['id', 'name', 'address']
            }]
        });

        if (availableCourts.length === 0) {
            throw new ApiError('Tất cả sân trong khung giờ này đã được đặt hết. Vui lòng chọn giờ khác!', 404);
        }

        let lastError: any = null;
        const results = await Promise.all(availableCourts.map(async (court) => {
            try {
                if (!court.court_type) {
                    throw new ApiError('Sân không có thông tin loại sân!', 400);
                }

                const totalPrice = await PricingService.calculateTotalPrice(
                    court.facility_id,
                    court.court_type,
                    startDateTime,
                    endDateTime
                );

                return {
                    ...court.toJSON(),
                    total_price: totalPrice,
                    price_per_hour: totalPrice / (dayjs(endDateTime).diff(dayjs(startDateTime), 'minute') / 60)
                };
            } catch (error) {
                lastError = error;
                return null;
            }
        }));

        const validResults = results.filter(court => court !== null);

        if (validResults.length === 0) {
            if (lastError) throw lastError;
            throw new ApiError('Tất cả sân trong khung giờ này đã được đặt hết. Vui lòng chọn giờ khác!', 404);
        }

        return validResults;
    }

    static async getDailyBookedSlots(facilityId: number, date: string, courtType: string) {
        const facility = await models.Facility.findOne({
            where: { id: facilityId, is_active: true }
        });

        const open_time = facility?.open_time || '06:00:00';
        const close_time = facility?.close_time || '22:00:00';
        const openHourPart = open_time.split(':')[0];
        const closeHourPart = close_time.split(':')[0];
        const START_HOUR = (openHourPart !== undefined ? parseInt(openHourPart, 10) : 6) || 6;
        const END_HOUR = (closeHourPart !== undefined ? parseInt(closeHourPart, 10) : 22) || 22;

        // 1. Lấy danh sách sân của cơ sở và loại sân này
        const courts = await models.Court.findAll({
            where: {
                facility_id: facilityId,
                court_type: courtType,
                is_active: true
            },
            attributes: ['id', 'name', 'court_type', 'facility_id'],
            raw: true
        });

        if (courts.length === 0) {
            return {
                courts: [],
                slotsByCourtId: {},
                rawBookedSlots: [],
                open_time,
                close_time,
                min_booking_minutes: 30
            };
        }

        const startOfDay = dayjs(date).startOf('day').toDate();
        const endOfDay = dayjs(date).endOf('day').toDate();

        const bookedSlots = await models.BookingSlot.findAll({
            where: {
                court_id: { [Op.in]: courts.map(c => c.id) },
                [Op.and]: [
                    { start_at: { [Op.gte]: startOfDay } },
                    { start_at: { [Op.lte]: endOfDay } }
                ]
            },
            include: [{
                model: models.Booking,
                as: 'booking',
                where: { status: { [Op.ne]: 'cancelled' } },
                attributes: []
            }],
            attributes: ['court_id', 'start_at', 'end_at', 'booking_id', 'price_cents'],
            raw: true
        });

        const priceConfigs = await models.PriceConfig.findAll({
            where: {
                facility_id: facilityId,
                court_type: courtType
            },
            raw: true
        });

        const slotsByCourtId: Record<number, any[]> = {};

        courts.forEach(court => {
            const courtSlots = [];

            for (let h = START_HOUR; h < END_HOUR; h++) {
                const slotStart = dayjs(date).hour(h).minute(0).second(0);
                const slotEnd = dayjs(date).hour(h + 1).minute(0).second(0);

                const isBooked = bookedSlots.some(bs => {
                    return bs.court_id === court.id &&
                        dayjs(bs.start_at).isBefore(slotEnd) &&
                        dayjs(bs.end_at).isAfter(slotStart);
                });

                const { totalPrice } = PricingService.calculateFromConfigs(
                    priceConfigs,
                    slotStart.toDate(),
                    slotEnd.toDate()
                );

                courtSlots.push({
                    start: slotStart.format('HH:mm'),
                    end: slotEnd.format('HH:mm'),
                    available: !isBooked,
                    price_cents: Math.ceil(totalPrice)
                });
            }

            slotsByCourtId[court.id] = courtSlots;
        });

        const rawSlots = bookedSlots.map(slot => ({
            booking_id: slot.booking_id,
            price_cents: slot.price_cents,
            court_id: slot.court_id,
            start_time: dayjs(slot.start_at).format('HH:mm'),
            end_time: dayjs(slot.end_at).format('HH:mm')
        }));

        return {
            courts,
            slotsByCourtId,
            rawBookedSlots: rawSlots,
            open_time,
            close_time,
            min_booking_minutes: 30
        };
    }

    static async createBooking(userId: number, data: CreateBookingInput) {
        const startDateTime = dayjs(`${data.date} ${data.start_time}`, 'YYYY-MM-DD HH:mm').toDate();
        const endDateTime = dayjs(`${data.date} ${data.end_time}`, 'YYYY-MM-DD HH:mm').toDate();

        const facility = await models.Facility.findOne({
            where: { id: data.facility_id, is_active: true }
        });

        if (!facility) {
            throw new ApiError('Cơ sở không tồn tại hoặc tạm đóng cửa!', 404);
        }

        const open_time = facility.open_time || '06:00:00';
        const close_time = facility.close_time || '22:00:00';
        const openDateTime = dayjs(`${data.date} ${open_time.slice(0, 5)}`, 'YYYY-MM-DD HH:mm');
        const closeDateTime = dayjs(`${data.date} ${close_time.slice(0, 5)}`, 'YYYY-MM-DD HH:mm');
        const start = dayjs(startDateTime);
        const end = dayjs(endDateTime);

        if (start.isBefore(openDateTime) || end.isAfter(closeDateTime)) {
            throw new ApiError(
                `Thời gian đặt sân phải nằm trong giờ hoạt động của cơ sở (${open_time.slice(0, 5)} - ${close_time.slice(0, 5)})`,
                400
            );
        }

        const durationMinutes = end.diff(start, 'minute');
        if (durationMinutes < 30) {
            throw new ApiError('Thời lượng đặt sân tối thiểu là 30 phút', 400);
        }

        const court = await models.Court.findOne({
            where: { id: data.court_id, is_active: true }
        });

        if (!court) {
            throw new ApiError('Sân không tồn tại hoặc đang bảo trì!', 404);
        }

        if (court.facility_id !== data.facility_id) {
            throw new ApiError('Sân này không thuộc cơ sở bạn đã chọn!', 400);
        }

        if (!court.court_type) {
            throw new ApiError('Sân không có thông tin loại sân!', 400);
        }

        const calculatedPrice = await PricingService.calculateTotalPrice(
            data.facility_id,
            court.court_type,
            startDateTime,
            endDateTime,
            userId
        );

        const t = await sequelize.transaction();

        try {
            // Tìm các slot trùng trên cùng court + time range (loại trừ cancelled)
            const conflictingSlots = await models.BookingSlot.findAll({
                where: {
                    court_id: data.court_id,
                    [Op.and]: [
                        { start_at: { [Op.lt]: endDateTime } },
                        { end_at: { [Op.gt]: startDateTime } }
                    ]
                },
                include: [{
                    model: models.Booking,
                    as: 'booking',
                    where: { status: { [Op.ne]: 'cancelled' } },
                    attributes: ['id', 'user_id', 'status']
                }],
                transaction: t,
                lock: t.LOCK.UPDATE
            });

            if (conflictingSlots.length > 0) {
                // Tách ra: slot của chính user (pending) vs slot của người khác
                const ownPendingSlots = conflictingSlots.filter(
                    (s: any) => Number(s.booking?.user_id) === Number(userId) && s.booking?.status === 'pending'
                );
                const otherSlots = conflictingSlots.filter(
                    (s: any) => !(Number(s.booking?.user_id) === Number(userId) && s.booking?.status === 'pending')
                );

                console.log(`[Conflict Check] court_id=${data.court_id}, userId=${userId}, total=${conflictingSlots.length}, own_pending=${ownPendingSlots.length}, other=${otherSlots.length}`);

                // Nếu có slot của người khác (hoặc slot confirmed/completed của chính mình) → block
                if (otherSlots.length > 0) {
                    throw new ApiError('Rất tiếc, sân này vừa có người đặt mất rồi. Vui lòng chọn sân khác!', 400);
                }

                // Hủy booking pending cũ của chính user trước khi tạo mới
                for (const slot of ownPendingSlots) {
                    const bookingToCancel = (slot as any).booking;
                    if (bookingToCancel) {
                        await models.BookingSlot.destroy({
                            where: { booking_id: bookingToCancel.id },
                            transaction: t
                        });
                        await models.Payment.destroy({
                            where: { booking_id: bookingToCancel.id },
                            transaction: t
                        });
                        await models.Booking.update(
                            { status: 'cancelled', cancel_reason: 'Tự động hủy do đặt lại', cancelled_at: new Date() },
                            { where: { id: bookingToCancel.id }, transaction: t }
                        );
                    }
                }
            }

            const newBooking = await models.Booking.create({
                user_id: userId,
                facility_id: data.facility_id,
                total_cents: calculatedPrice,
            }, { transaction: t });

            await models.Payment.create({
                provider: (data.payment_method as any) || 'cash',
                amount_cents: calculatedPrice,
                booking_id: newBooking.id,
                status: 'pending'
            }, { transaction: t });

            await models.BookingSlot.create({
                booking_id: newBooking.id,
                court_id: data.court_id,
                start_at: startDateTime,
                end_at: endDateTime,
                price_cents: calculatedPrice
            }, { transaction: t });

            await t.commit();

            return newBooking;
        } catch (error) {
            await t.rollback();
            throw error;
        }
    }

    static async getMyBookings(userId: number) {
        const bookings = await (models.Booking as any).findAll({
            where: { user_id: userId },
            include: [
                { model: models.Facility, as: 'facility' },
                { model: models.Payment, as: 'payments' },
                {
                    model: models.BookingSlot,
                    as: 'slots',
                    include: [
                        {
                            model: models.Court,
                            as: 'court'
                        }
                    ]
                }
            ],
            order: [['created_at', 'DESC']]
        });

        return bookings;
    }

    static async getAllBookings(facilityId?: number) {
        const whereCondition: any = {};

        if (facilityId) {
            whereCondition.facility_id = facilityId;
        }

        return await models.Booking.findAll({
            where: whereCondition,
            include: [
                {
                    model: models.User,
                    as: 'user',
                    attributes: ['id', 'email', 'phone', 'full_name']
                },
                {
                    model: models.Facility,
                    as: 'facility',
                    attributes: ['name']
                },
                {
                    model: models.BookingSlot,
                    as: 'slots',
                    include: [
                        {
                            model: models.Court,
                            as: 'court',
                            attributes: ['name']
                        }
                    ]
                },
                {
                    model: models.Payment,
                    as: 'payments',
                    attributes: ['provider', 'status', 'amount_cents']
                }
            ]
        });
    }

    static async getByBookingId(bookingId: number) {
        const booking = await models.Booking.findByPk(bookingId, {
            include: [
                {
                    model: models.User,
                    as: 'user',
                    attributes: ['id', 'full_name', 'phone', 'email']
                },
                {
                    model: models.Facility,
                    as: 'facility',
                    attributes: ['id', 'name']
                },
                {
                    model: models.BookingSlot,
                    as: 'slots',
                    attributes: ['id', 'court_id', 'start_at', 'end_at', 'price_cents'],
                    include: [
                        {
                            model: models.Court,
                            as: 'court',
                            attributes: ['id', 'name']
                        }
                    ]
                },
                {
                    model: models.Payment,
                    as: 'payments',
                    attributes: ['id', 'provider', 'status', 'amount_cents']
                }
            ]
        });

        if (!booking) {
            throw new ApiError('Không tìm thấy thông tin đơn đặt sân này!', 404);
        }

        return booking;
    }

    static async updateBookingStatus(id: number, data: UpdateBookingStatusInput) {
        const t = await sequelize.transaction();

        try {
            const booking = await models.Booking.findByPk(id, { transaction: t });
            if (!booking) throw new ApiError('Không tìm thấy lịch đặt này', 404);

            if (data.status && data.status !== booking.status) {
                const validNextStates = BOOKING_STATUS_TRANSITIONS[booking.status] || [];

                if (!validNextStates.includes(data.status)) {
                    throw new ApiError(`Không thể chuyển trạng thái từ '${booking.status}' sang '${data.status}'`, 400);
                }
            }

            if (data.payment_status && data.payment_status !== booking.payment_status) {
                const validNextPaymentStates = PAYMENT_STATUS_TRANSITIONS[booking.payment_status] || [];

                if (!validNextPaymentStates.includes(data.payment_status)) {
                    throw new ApiError(
                        `Không thể chuyển trạng thái thanh toán từ '${booking.payment_status}' sang '${data.payment_status}'`,
                        400
                    );
                }
            }

            await booking.update(data as any, { transaction: t });

            if (booking.payment_status === 'paid' && booking.payment_method === 'cash') {
                const existingCashPayment = await models.Payment.findOne({
                    where: {
                        booking_id: booking.id,
                        provider: 'cash',
                        status: 'paid'
                    },
                    transaction: t
                });

                if (!existingCashPayment) {
                    await models.Payment.create({
                        booking_id: booking.id,
                        provider: 'cash',
                        status: 'paid',
                        amount_cents: booking.total_cents,
                        paid_at: new Date()
                    }, { transaction: t });

                    if (booking.user_id) {
                        await UserService.addPointsAndUpgrade(booking.user_id, booking.total_cents, t);
                    }
                }
            }

            await t.commit();
            return booking;
        } catch (error) {
            await t.rollback();
            throw error;
        }
    }

    static async validateBookingTimes(date: string, startTime: string, endTime: string) {
        const startDateTime = dayjs(`${date} ${startTime}`, 'YYYY-MM-DD HH:mm');
        const endDateTime = dayjs(`${date} ${endTime}`, 'YYYY-MM-DD HH:mm');

        if (!startDateTime.isValid() || !endDateTime.isValid()) {
            throw new ApiError('Thời gian không hợp lệ', 400);
        }

        if (startDateTime.isBefore(dayjs())) {
            throw new ApiError('Không thể đặt sân ở thời điểm trong quá khứ', 400);
        }

        if (endDateTime.isBefore(startDateTime) || endDateTime.isSame(startDateTime)) {
            throw new ApiError('Giờ kết thúc phải sau giờ bắt đầu', 400);
        }

        const durationMinutes = endDateTime.diff(startDateTime, 'minute');
        if (durationMinutes < 30) {
            throw new ApiError('Thời lượng đặt sân tối thiểu là 30 phút', 400);
        }

        return { startDateTime, endDateTime };
    }

    static async createBookingByHotline(data: any) {
        const { customer_phone, customer_name, membership_type, ...bookingData } = data;

        let user = await models.User.findOne({
            where: { phone: customer_phone, role: 'customer' }
        });

        const isNewUser = !user;

        if (!user) {
            const nameToSave = customer_name || 'Khách vãng lai';
            user = await UserService.createGuestUser(customer_phone, nameToSave, membership_type);
        }

        const payloadToService = {
            ...bookingData,
            status: 'confirmed' as const,
            payment_method: 'cash' as const,
        };

        const result = await this.createBooking(user.id, payloadToService);

        return {
            booking: result,
            user,
            message: isNewUser
                ? 'Đã tạo tài khoản mới và đặt sân hộ khách thành công'
                : 'Đã đặt sân hộ khách thành công'
        };
    }

    static async generateVNPayUrl(bookingId: number, ipAddr: string) {
        const booking = await models.Booking.findByPk(bookingId);

        if (!booking) {
            throw new ApiError('Không tìm thấy đơn đặt sân', 404);
        }

        if (booking.payment_status === 'paid') {
            throw new ApiError('Đơn này đã được thanh toán rồi!', 400);
        }

        const paymentUrl = VNPayUtils.createPaymentUrl({
            amount: booking.total_cents,
            orderId: booking.id.toString() + '_' + Date.now().toString().slice(-6),
            orderInfo: `Thanh toan don dat san ${booking.id}`,
            ipAddr: ipAddr || '127.0.0.1'
        });

        return { paymentUrl };
    }

    static async cancelBooking(bookingId: number, userId: number | null) {
        const booking = await models.Booking.findOne({
            where: {
                id: bookingId,
                ...(userId ? { user_id: userId } : {})
            }
        });

        if (!booking) {
            throw new ApiError('Không tìm thấy đơn đặt sân', 404);
        }

        if (booking.status !== 'pending' && booking.status !== 'confirmed') {
            throw new ApiError('Chỉ có thể hủy đơn đặt sân ở trạng thái chờ xử lý hoặc đã xác nhận', 400);
        }

        await booking.update({
            status: 'cancelled',
            cancel_reason: 'Khách tự hủy trên App',
            cancelled_at: new Date()
        });

        const updatedBooking = await models.Booking.findOne({
            where: { id: bookingId },
            include: [
                { model: models.Facility, as: 'facility' },
                { model: models.Payment, as: 'payments' },
                {
                    model: models.BookingSlot,
                    as: 'slots',
                    include: [
                        { 
                            model: models.Court,
                            as: 'court'
                        }
                    ]
                }
            ]
        });

        return updatedBooking || booking;
    }
}