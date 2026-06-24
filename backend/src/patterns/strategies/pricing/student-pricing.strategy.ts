import type { IPriceStrategy } from "./pricing.strategy.js";

export class StudentPricingStrategy implements IPriceStrategy {
    constructor(private readonly discountPercent: number) {}

    calculate(basePrice: number): number {
        return basePrice - (basePrice * this.discountPercent) / 100;
    }
}
