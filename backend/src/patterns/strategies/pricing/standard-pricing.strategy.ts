import type { IPriceStrategy } from "./pricing.strategy.js";

export class StandardPricingStrategy implements IPriceStrategy {
    calculate(basePrice: number): number {
        return basePrice;
    }
}
