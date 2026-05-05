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

        const bookingTimeOnly = dayjs(startDateTime).format('HH:mm:ss');
        const priceConfigs = await models.PriceConfig.findAll({
            where: {
                start_time: { [Op.lte]: bookingTimeOnly },
                end_time: { [Op.gt]: bookingTimeOnly }
            },
            raw: true
        });
        
        const results = availableCourts.map(court => {
            const priceInfo = priceConfigs.find(
                p => p.facility_id === court.facility_id && p.court_type === court.court_type
            );

            const courtJson = court.toJSON();
            
            return {
                ...courtJson,
                price_per_hour: priceInfo ? priceInfo.price_per_hour : null,
                applied_price_id: priceInfo ? priceInfo.id : null
            };

        });

        const validResults = results.filter(court => court.price_per_hour !== null);

        if (validResults.length === 0) {
            throw new ApiError('Cơ sở không hoạt động trong khung giờ này hoặc chưa được cấu hình giá!', 400);
        }

        return validResults;
        }
    static async getDailyBookedSlots(facilityId: number, date: string | Date, courtType: string) {
        const startOfDay = dayjs(date).startOf('day').toDate();
        const endOfDay = dayjs(date).endOf('day').toDate();

        const bookedSlots = await models.BookingSlot.findAll({
            where: {
                [Op.and]: [
                    { start_at: { [Op.gte]: startOfDay } },
                    { start_at: { [Op.lte]: endOfDay } }
                ]
            },
            include: [
                {
                    model: models.Booking,
                    as: 'booking',
                    where: {
                        status: { [Op.ne]: 'cancelled' } 
                    },
                    attributes: []
                },
                {
                    model: models.Court,
                    as: 'court',    
                    where: {
                        facility_id: facilityId,
                        court_type: courtType,
                        is_active: true
                    },
                    attributes: ['name']
                }
            ],
            attributes: ['court_id', 'start_at', 'end_at']
        });

        return bookedSlots.map(slot => {
            const slotJson = slot.toJSON() as any;
            return {
                court_id: slotJson.court_id,
                court_name: slotJson.court?.name,
                start_time: dayjs(slotJson.start_at).format('HH:mm'), 
                end_time: dayjs(slotJson.end_at).format('HH:mm')
            };
        });
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
}