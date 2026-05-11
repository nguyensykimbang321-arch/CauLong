import { Op } from "sequelize";
import Facility from "../models/facility.model.js";
import models from "../models/index.js";
import ApiError from "../utils/ErrorClass.js";
import type { CreateFacilityInput, updateFacilityInput } from "../validations/facility.validation.js";

export class FacilityService {
    static async getAllFacilities() {
        return await models.Facility.findAll({
            where: { is_active: true },
            order: [['created_at', 'DESC']]
        })
    }

    static async getAllFacilitiesForAdmin() {
        return await models.Facility.findAll({
            order: [['created_at', 'DESC']]
        })
    }

    static async getFacilityById(id: number) {
        const facility = await models.Facility.findOne({
            where: { id: id,  is_active: true}
        })
        if(!facility){
            throw new ApiError("Không tìm thấy cơ sở này", 404);
        }

        return facility;
    }

    static async getFacilityByIdForAdmin(id: number) {
        const facility = await models.Facility.findOne({
            where: { id: id}
        })
        if(!facility){
            throw new ApiError("Không tìm thấy cơ sở này", 404);
        }

        return facility;
    }


    static async getFacilityWithCourts(id: number) {
        const facility = await this.getFacilityById(id);
        
        const courts = await (models.Court as any).findAll({
            where: { facility_id: id, is_active: true } 
        });

        return {
            ...facility.toJSON(),
            courts
        };
    }

    static async createFacility(data: CreateFacilityInput) {
        const existingFacility = await models.Facility.findOne({ where: { name: data.name } });
        if (existingFacility) {
            if (!existingFacility.is_active) {
                await existingFacility.update({ ...data, is_active: true });
                return existingFacility;
            }
            throw new ApiError('Tên cơ sở này đã tồn tại trong hệ thống', 400);
        }

        return await models.Facility.create(data);
    }

    static async updateFacility(id: number, data: updateFacilityInput) {
        const facility =  await this.getFacilityByIdForAdmin(id);
        
        if (data.name && data.name !== facility.name) {
            const duplicateName = await models.Facility.findOne({
                where: {
                    name: data.name,
                    id: { [Op.ne]: id } 
                }
            });

            if (duplicateName) {
                throw new ApiError('Tên này đã bị trùng với một cơ sở khác', 400);
            }
        }
        await facility.update(data as any);
        return facility;
    }

    static async deleteFacility(id: number) {
        const facility = await this.getFacilityById(id);    

        await facility.destroy(); 
        
        return { message: 'Đã xóa (mềm) cơ sở thành công' };
    }

    static async restoreFacility(id: number) {
        const facility = await models.Facility.findOne({
            where: { id: id },
            paranoid: false 
        });

        if (!facility) {
            throw new ApiError('Không tìm thấy cơ sở trong thùng rác', 404);
        }

        await facility.restore();
        
        return { message: 'Đã khôi phục cơ sở thành công' };
    }

    static async getDeletedFacilities() {
        return await models.Facility.findAll({
            where: { deleted_at: { [Op.not]: null as any  } },
            paranoid: false, // Bắt buộc phải có để nhìn xuyên thùng rác
            order: [['deleted_at', 'DESC']]
        });
    }
}