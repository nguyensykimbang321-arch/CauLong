import type { IPriceStrategy } from "./pricing.strategy.js";

export class PricingContext {
    constructor(private readonly strategy: IPriceStrategy) {}

    calculate(basePrice: number): number {
        return this.strategy.calculate(basePrice);
    }
}
