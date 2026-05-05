import bcrypt from 'bcryptjs';
import models from '../models/index.js';

export class UserService {
    static async getUserByPhone(phone: string) {
        return await models.User.findOne({
            where: { phone, role: 'customer' }
        });
    }

    static async createGuestUser(phone: string) {

        const randomPassword = Math.random().toString(36).slice(-8);
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(randomPassword, salt);

        const dummyEmail = `guest_${phone}@thethaovip.local`; 

        return await models.User.create({
            email: dummyEmail,
            phone: phone,
            password_hash: hashedPassword,
            role: 'customer'
        });
    }
}