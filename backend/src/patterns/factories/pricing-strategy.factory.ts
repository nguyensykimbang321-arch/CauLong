import { HolidayPricingStrategy } from "../strategies/pricing/holiday-pricing.strategy.js";
import { VipPricingStrategy } from "../strategies/pricing/vip-pricing.strategy.js";
import { WeekendPricingStrategy } from "../strategies/pricing/weekend-pricing.strategy.js";
import { StudentPricingStrategy } from "../strategies/pricing/student-pricing.strategy.js";
import { StandardPricingStrategy } from "../strategies/pricing/standard-pricing.strategy.js";
import type { IPriceStrategy } from "../strategies/pricing/pricing.strategy.js";

export class PricingStrategyFactory {
    static createStrategy(
        isHoliday: boolean,
        isWeekend: boolean,
        membershipType: string,
        holidaySurchargePercent: number,
        weekendSurchargePercent: number,
        studentDiscountPercent: number,
        vipDiscountPercent: number
    ): IPriceStrategy {
        if (isHoliday) {
            return new HolidayPricingStrategy(holidaySurchargePercent);
        }
        if (membershipType === 'vip') {
            return new VipPricingStrategy(vipDiscountPercent);
        }
        if (isWeekend) {
            return new WeekendPricingStrategy(weekendSurchargePercent);
        }
        if (membershipType === 'student') {
            return new StudentPricingStrategy(studentDiscountPercent);
        }
        return new StandardPricingStrategy();
    }
}
