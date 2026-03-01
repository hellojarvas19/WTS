export class FormatNumbers {
  constructor() {}

  /**
   * Format token amount with appropriate scaling
   * Guards against NaN, undefined, null, and infinity
   */
  static formatTokenAmount(amount: number | undefined | null): string {
    // Guard against invalid inputs
    if (amount === undefined || amount === null || !isFinite(amount) || isNaN(amount)) {
      return '0.00'
    }

    // Guard against negative values
    const absAmount = Math.abs(amount)
    
    let scaledAmount: number

    if (absAmount >= 1e9) {
      scaledAmount = absAmount / 1e6
    } else if (absAmount >= 1e8) {
      scaledAmount = absAmount / 1e5
    } else if (absAmount >= 1e6) {
      scaledAmount = absAmount / 1e3
    } else {
      scaledAmount = absAmount
    }
    
    // Final NaN check after scaling (defensive)
    if (isNaN(scaledAmount)) {
      return '0.00'
    }
    
    // Format the scaled amount with maximum two fraction digits
    return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 2 }).format(scaledAmount)
  }

  /**
   * Format price with K/M/B suffixes
   * Guards against NaN, undefined, null, and infinity
   */
  static formatPrice(value: number | undefined | null): string {
    // Guard against invalid inputs
    if (value === undefined || value === null || !isFinite(value) || isNaN(value)) {
      return '0.00'
    }

    const absValue = Math.abs(value)
    
    if (absValue >= 1_000_000_000) {
      return `${(absValue / 1_000_000_000).toFixed(2)}B`
    } else if (absValue >= 1_000_000) {
      return `${(absValue / 1_000_000).toFixed(2)}M`
    } else if (absValue >= 1_000) {
      return `${(absValue / 1_000).toFixed(2)}K`
    } else {
      return absValue.toFixed(2)
    }
  }

  /**
   * Format token price with scientific notation fallback for very small numbers
   * Guards against NaN, undefined, null, and infinity
   */
  static formatTokenPrice(price: number | undefined | null): string {
    // Guard against invalid inputs
    if (price === undefined || price === null || !isFinite(price) || isNaN(price)) {
      return '0.00000000'
    }

    return price.toFixed(8).replace(/^(0\.)(0+)(\d+)/, (_, p1, p2, p3) => {
      return `0.{${p2.length}}${p3}`
    })
  }
}
