import { Op } from "sequelize";
import models from "../models/index.js";
import ApiError from "../utils/ErrorClass.js";
import type { CreateCourtInput, UpdateCourtInput } from "../validations/court.validation.js";

export class CourtService {
    static async getAllCourts() {
        return await models.Court.findAll({
            where: { is_active: true },
            order: [['created_at', 'DESC']],
            include:[
                {
                    model: models.Facility,
                    as: "facility",
                    attributes:['id', 'name', 'address']
                }
            ]
        });
    }

    static async getCourtById(id: number) {
        const court = await models.Court.findOne({
            where: {id: id, is_active: true },
            include: [{model: models.Facility, as: "facility", attributes: ['id', 'name', 'address']}]
        });
        if(!court) {
            throw new ApiError("Không tìm thấy sân này", 404);
        }

        return court;
    }

    static async createCourt(data: CreateCourtInput) {
        const facility = await models.Facility.findOne({
            where: { id: data.facility_id, is_active: true}
        });
        if(!facility) throw new ApiError("Cơ sở này không tồn tại hoặc đã ngừng hoạt động", 404);

        const existingCourt = await models.Court.findOne({
            where: {
                name: data.name,
                facility_id: data.facility_id
            }
        });
        if(existingCourt){
            if(!existingCourt.is_active){
                await existingCourt.update({ ...data, is_active: true});
                return existingCourt;
            }
            throw new ApiError(`Tên sân '${data.name}' đã tồn tại trong cơ sở này`, 400);
        }

        return await models.Court.create(data);
    }

    static async updateCourt(id: number, data: UpdateCourtInput) {
        const court = await this.getCourtById(id);

        if(data.facility_id && data.facility_id !== court.facility_id) {
            const newFacility = await models.Facility.findOne({
                where: {id: data.facility_id, is_active: true}
            })
            if(!newFacility) throw new ApiError("Cơ sở mới không tồn tại", 404);
        }

        if(data.name){
            const checkFacilityId = data.facility_id || court.facility_id;
            const duplicateName = await models.Court.findOne({
                where:{
                    name: data.name,
                    facility_id: checkFacilityId,
                    id: { [Op.ne]: id}
                }
            });
            if (duplicateName) throw new ApiError("Tên sân đã bị trùng trong cơ sở này", 400);
        }

        await court.update(data as any);
        return court;
    }

    static async deleteCourt(id: number) {
        const court = await this.getCourtById(id);

        await court.update({is_active: false} as any);
        return { message: 'Đã xóa sân thành công' };
    }
}