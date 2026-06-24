import models from '../models/index.js';

export const courtTypeInclude = {
    model: models.CourtType,
    as: 'type_info',
    attributes: ['id', 'name', 'surface', 'is_indoor', 'description', 'image'],
};
