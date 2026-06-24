import models from '../models/index.js';
import ApiError from '../utils/ErrorClass.js';

const COURT_TYPE_NAMES = ['badminton', 'tennis', 'football', 'table_tennis'] as const;

export class CourtTypeService {
    static async getById(id: number) {
        const courtType = await models.CourtType.findByPk(id);
        if (!courtType) {
            throw new ApiError('Loại sân không tồn tại', 404);
        }
        return courtType;
    }

    static async getByName(name: string) {
        const courtType = await models.CourtType.findOne({ where: { name } });
        if (!courtType) {
            throw new ApiError('Loại sân không tồn tại', 404);
        }
        return courtType;
    }

    static async getNameById(id: number) {
        const courtType = await this.getById(id);
        return courtType.name;
    }

    static async resolveToId(input: number | string) {
        if (typeof input === 'number') {
            await this.getById(input);
            return input;
        }

        if ((COURT_TYPE_NAMES as readonly string[]).includes(input)) {
            const courtType = await this.getByName(input);
            return courtType.id;
        }

        const parsed = Number(input);
        if (!Number.isNaN(parsed) && parsed > 0) {
            await this.getById(parsed);
            return parsed;
        }

        throw new ApiError('Loại sân không hợp lệ', 400);
    }
}
