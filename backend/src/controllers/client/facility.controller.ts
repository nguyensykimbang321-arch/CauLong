import type { Request, Response, NextFunction } from "express";
import { FacilityService } from "../../services/facility.service.js";
import AppResponse from "../../utils/AppResponse.js";
import models from "../../models/index.js";
import { Op } from "sequelize";
import moment from "moment-timezone";

export class ClientFacilityController {
    static async getAll(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await FacilityService.getAllFacilities();
            return AppResponse.success(res, result, "Lấy danh sách cơ sở thành công", 200);
        } catch (error) {
            next(error);
        }
    }

    static async getById(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const facility = await FacilityService.getFacilityById(Number(id));
            
            // Lấy thêm danh sách sân của cơ sở này
            const courts = await models.Court.findAll({
                where: { facility_id: Number(id), status: 'active' }
            });


            const result = {
                ...facility.toJSON(),
                courts
            };

            return AppResponse.success(res, result, "Lấy chi tiết cơ sở thành công", 200);
        } catch (error) {
            next(error);
        }
    }

    static async getAvailability(req: Request, res: Response, next: NextFunction) {
        try {
            const facilityId = Number(req.params.id);
            const { date, courtTypeId } = req.query;

            // Kiểm tra Facility 
            const facility = await FacilityService.getFacilityById(facilityId);
            
            // Lấy danh sách sân
            const courts = await models.Court.findAll({
                where: { 
                   facility_id: facilityId, 
                   status: 'active',
                   ...(courtTypeId ? { court_type_id: Number(courtTypeId) } : {})
                }
            });

            const courtIds = courts.map((c: any) => c.id);
            
            // Lấy PriceRules
            const priceRules = await models.PriceRule.findAll({
                where: { court_id: courtIds, active: true }
            });

            // Lấy Lịch đặt trùng trong ngày
            
            const startOfDay = moment.tz(date as string, 'YYYY-MM-DD', 'Asia/Ho_Chi_Minh').startOf('day').toDate();
            const endOfDay = moment.tz(date as string, 'YYYY-MM-DD', 'Asia/Ho_Chi_Minh').endOf('day').toDate();

            const bookedSlots = await models.BookingSlot.findAll({
                where: {
                    court_id: courtIds,
                    start_at: { [Op.lte]: endOfDay },
                    end_at: { [Op.gte]: startOfDay }
                },
                include: [{
                   model: models.Booking,
                   as: 'booking',
                   where: { status: { [Op.ne]: 'cancelled' } }
                }]
            });

            const slotsByCourtId: any = {};
            for (const court of courts) {
                const rules = priceRules.filter((r: any) => r.court_id === court.id);
                const slots = [];
                for (let h = 6; h < 22; h++) {
                    const startStr = `${String(h).padStart(2, '0')}:00`;
                    const endStr = `${String(h+1).padStart(2, '0')}:00`;

                    // Tìm giá
                    let price_cents = 100000;
                    for (const rule of rules) {
                        if (h >= rule.start_hour && h < rule.end_hour) {
                            price_cents = rule.price_cents;
                            break;
                        }
                    }

                    // Thời gian thật của slot
                    const slotStart = moment.tz(`${date} ${startStr}`, 'YYYY-MM-DD HH:mm', 'Asia/Ho_Chi_Minh').toDate();
                    const slotEnd = moment.tz(`${date} ${endStr}`, 'YYYY-MM-DD HH:mm', 'Asia/Ho_Chi_Minh').toDate();

                    // Check availability
                    let available = true;
                    for (const booked of bookedSlots) {
                        if (booked.court_id === court.id) {
                            if (new Date(booked.start_at) < slotEnd && new Date(booked.end_at) > slotStart) {
                                available = false;
                                break;
                            }
                        }
                    }

                    // Nếu giờ hiện tại đã qua thì cũng ko cho đặt hôm nay
                    if (slotStart <= new Date()) {
                        available = false;
                    }

                    slots.push({
                        start: startStr,
                        end: endStr,
                        price_cents: price_cents,
                        available: available
                    });
                }
                slotsByCourtId[court.id] = slots;
            }

            const result = {
                courts,
                slotsByCourtId
            };

            return AppResponse.success(res, result, "Lấy lịch trống thành công", 200);
        } catch (error) {
            next(error);
        }
    }
}
