export interface IPriceStrategy {
    calculate(basePrice: number): number;
}
