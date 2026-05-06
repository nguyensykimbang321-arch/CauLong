import { Op } from 'sequelize';
import models from '../models/index.js';
import type { CreateBookingInput, UpdateBookingStatusInput } from '../validations/booking.validation.js';
import dayjs from 'dayjs';
import sequelize from '../config/database.js';
import ApiError from '../utils/ErrorClass.js';
import { BOOKING_STATUS_TRANSITIONS, PAYMENT_STATUS_TRANSITIONS } from '../constants/booking.constant.js';
import { PricingService } from './pricing.service.js';

export class BookingService {
    static async getAvailableCourts(startDateTime: Date, endDateTime: Date, courtType?: string) {
        
        const bookedSlots = await models.BookingSlot.findAll({
            where: {
                [Op.and]: [
                    { start_at: { [Op.lt]: endDateTime } },
                    { end_at: { [Op.gt]: startDateTime } }
                ]
            },
            attributes: ['court_id'],
            raw: true
        });

        const bookedCourtIds = bookedSlots.map(slot => slot.court_id);

        const whereCondition: any = {
            id: { [Op.notIn]: bookedCourtIds },
            is_active: true
        };
        
        if (courtType) {
            whereCondition.court_type = courtType;
        }

        
        const availableCourts = await models.Court.findAll({
            where: whereCondition,
            include: [{
                model: models.Facility,
                as: 'facility',
                attributes: ['id', 'name', 'address']
            }]
        });

        
        // 3. Tính giá cho từng sân khả dụng
        const results = await Promise.all(availableCourts.map(async (court) => {
            try {
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
                // Nếu không có giá cho khung giờ này, coi như sân không khả dụng
                return null;
            }
        }));

        const validResults = results.filter(court => court !== null);

        if (validResults.length === 0) {
            throw new ApiError('Không tìm thấy cấu hình giá cho khung giờ bạn chọn tại cơ sở này!', 400);
        }

        return validResults;
    }

    static async getDailyBookedSlots(facilityId: number, date: string, courtType: string) {
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
            return { courts: [], slotsByCourtId: {} };
        }

        // 2. Lấy tất cả các slot đã đặt trong ngày đó cho các sân này
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
            attributes: ['court_id', 'start_at', 'end_at'],
            raw: true
        });

        // 3. Lấy cấu hình giá để tính giá cho từng slot
        const priceConfigs = await models.PriceConfig.findAll({
            where: {
                facility_id: facilityId,
                court_type: courtType
            },
            raw: true
        });

        // 4. Tạo Grid giờ (06:00 - 22:00, bước nhảy 1 tiếng)
        const START_HOUR = 6;
        const END_HOUR = 22;
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

                // Tính giá cho khung giờ này
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

        return {
            courts,
            slotsByCourtId
        };
    }

    static async createBooking(userId:number, data: CreateBookingInput) {
        const startDateTime = dayjs(`${data.date} ${data.start_time}`, 'YYYY-MM-DD HH:mm').toDate();
        const endDateTime = dayjs(`${data.date} ${data.end_time}`, 'YYYY-MM-DD HH:mm').toDate();

        const court = await models.Court.findOne({
            where: { id: data.court_id, is_active: true }
        });

        if (!court) {
            throw new ApiError('Sân không tồn tại hoặc đang bảo trì!', 404);
        }
        
        if (court.facility_id !== data.facility_id) {
            throw new ApiError('Sân này không thuộc cơ sở bạn đã chọn!', 400);
        }

        const calculatedPrice = await PricingService.calculateTotalPrice(
            data.facility_id, 
            court.court_type,
            startDateTime, 
            endDateTime
        );

        const t = await sequelize.transaction();
        try {
            const conflictingSlot = await models.BookingSlot.findOne({
                where: {
                    court_id: data.court_id,
                    [Op.and]: [
                        {start_at: { [Op.lt]: endDateTime }},
                        {end_at: { [Op.gt]: startDateTime }}
                    ]
                },
                transaction: t,
                lock: t.LOCK.UPDATE
            });
            if(conflictingSlot) {
                throw new ApiError('Rất tiếc, sân này vừa có người đặt mất rồi. Vui lòng chọn sân khác!', 400);
            }

            const MIN_DURATION_MINUTES = 60;
            const previousBooking = await models.BookingSlot.findOne({
                where: {
                    court_id: data.court_id,
                    end_at: { [Op.lte]: startDateTime }
                },
                order: [['end_at', 'DESC']],
                transaction: t
            });

            if(previousBooking) {
                const gapBefore = dayjs(startDateTime).diff(dayjs(previousBooking.end_at), 'minute');
                
                if(gapBefore > 0 && gapBefore < MIN_DURATION_MINUTES ) {
                    throw new ApiError (
                        `Không thể đặt! Sẽ tạo ra khoảng trống ${gapBefore} phút (từ ${dayjs(previousBooking.end_at).format('HH:mm')} đến ${dayjs(startDateTime).format('HH:mm')}) không đủ để người khác thuê.`,
                        400
                    );
                }
            }

            const nextBooking = await models.BookingSlot.findOne({
                where: {
                    court_id: data.court_id,
                    start_at: { [Op.gte]: endDateTime }
                },
                order: [['start_at', 'ASC']],
                transaction: t
            });

            if(nextBooking) {
                const gapAfter = dayjs(nextBooking.start_at).diff(dayjs(endDateTime), 'minute');
                
                if(gapAfter > 0 && gapAfter < MIN_DURATION_MINUTES) {
                    throw new ApiError(
                        `Không thể đặt! Sẽ tạo ra khoảng trống ${gapAfter} phút (từ ${dayjs(endDateTime).format('HH:mm')} đến ${dayjs(nextBooking.start_at).format('HH:mm')}) không đủ để người khác thuê.`,
                        400
                    );
                }
            }

            const newBooking = await models.Booking.create({
                user_id: userId,
                facility_id: data.facility_id,
                total_cents: calculatedPrice,
                status: 'pending',
            }, { transaction: t });

            await models.BookingSlot.create({
                booking_id: newBooking.id,
                court_id: data.court_id,
                start_at: startDateTime,
                end_at: endDateTime,
                price_cents: calculatedPrice
            }, { transaction: t })

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

        if(facilityId) {
            whereCondition.facility_id = facilityId;
        }

        return await models.Booking.findAll({
            where: whereCondition,
            include: [
                {
                    model: models.User,
                    as: 'user',
                    attributes: ['id', 'email', 'phone']
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
                }
            ]
        });
    }

    static async updateBookingStatus(id: number, data: UpdateBookingStatusInput) {
        const booking = await models.Booking.findByPk(id);
        if(!booking) throw new ApiError('Không tìm thấy lịch đặt này', 404);

        if(data.status && data.status != booking.status) {
            const validNextStates = BOOKING_STATUS_TRANSITIONS[booking.status] || [];

            if (!validNextStates.includes(data.status)) {
                throw new ApiError(`Không thể chuyển trạng thái từ '${booking.status}' sang '${data.status}'`, 400);
            }
        }

        if (data.payment_status && data.payment_status !== booking.payment_status) {
            const validNextPaymentStates = PAYMENT_STATUS_TRANSITIONS[booking.payment_status] || [];

            if (!validNextPaymentStates.includes(data.payment_status)) {
                throw new ApiError(`Không thể chuyển trạng thái thanh toán từ '${booking.payment_status}' sang '${data.payment_status}'`, 400);
            }
        }

        await booking.update(data as any);

        return booking;
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

        return { startDateTime, endDateTime };
    }

    static async createBookingByHotline(data: any) {
        const { customer_phone, ...bookingData } = data;

        // 1. Tìm hoặc tạo user qua SĐT
        let user = await models.User.findOne({
            where: { phone: customer_phone, role: 'customer' }
        });

        const isNewUser = !user;
        if (!user) {
            const randomPassword = Math.random().toString(36).slice(-8);
            const salt = await (import('bcryptjs').then(m => m.default.genSalt(10)));
            const hashedPassword = await (import('bcryptjs').then(m => m.default.hash(randomPassword, salt)));
            const dummyEmail = `guest_${customer_phone}@thethaovip.local`;

            user = await models.User.create({
                email: dummyEmail,
                phone: customer_phone,
                password_hash: hashedPassword,
                role: 'customer'
            });
        }

        const result = await this.createBooking(user.id, bookingData);

        return {
            booking: result,
            user,
            message: isNewUser 
                ? 'Đã tạo tài khoản mới và đặt sân hộ khách thành công' 
                : 'Đã đặt sân hộ khách thành công'
        };
    }
}