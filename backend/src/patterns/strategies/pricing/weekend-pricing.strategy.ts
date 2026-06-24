import type { IPriceStrategy } from "./pricing.strategy.js";

export class WeekendPricingStrategy implements IPriceStrategy {
    constructor(private readonly surchargePercent: number) {}

    calculate(basePrice: number): number {
        return basePrice + (basePrice * this.surchargePercent) / 100;
    }
}
