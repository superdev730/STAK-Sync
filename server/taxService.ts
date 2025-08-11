import Decimal from "decimal.js";

// Tax rates for Oakland, Alameda County, California (as of 2024)
// This should be updated regularly to reflect current tax rates
export interface TaxRate {
  state: number;
  county: number;
  city: number;
  district: number;
  total: number;
}

export interface TaxableItem {
  description: string;
  amount: Decimal.Value;
  quantity?: number;
  isTaxable?: boolean;
  taxCategory?: 'subscription' | 'event_ticket' | 'service' | 'physical_goods';
}

export interface TaxCalculationResult {
  subtotal: Decimal;
  taxAmount: Decimal;
  totalAmount: Decimal;
  taxRate: Decimal;
  breakdown: {
    state: Decimal;
    county: Decimal;
    city: Decimal;
    district: Decimal;
  };
  taxableItems: TaxableItem[];
  nonTaxableItems: TaxableItem[];
}

// Oakland, Alameda County, California tax rates (2024)
const OAKLAND_TAX_RATES: TaxRate = {
  state: 0.0725,      // California state sales tax
  county: 0.0150,     // Alameda County sales tax
  city: 0.0100,       // Oakland city sales tax  
  district: 0.0025,   // Special district tax
  total: 0.1000       // Combined 10.00% sales tax rate for Oakland
};

// Tax exemptions and rules for different item types
const TAX_RULES = {
  // SaaS/Software subscriptions are generally taxable in California
  subscription: { taxable: true, rate: OAKLAND_TAX_RATES.total },
  
  // Event tickets are generally taxable in California
  event_ticket: { taxable: true, rate: OAKLAND_TAX_RATES.total },
  
  // Professional services may be exempt, but digital services are often taxable
  service: { taxable: true, rate: OAKLAND_TAX_RATES.total },
  
  // Physical goods are always taxable
  physical_goods: { taxable: true, rate: OAKLAND_TAX_RATES.total }
};

export class TaxService {
  /**
   * Calculate sales tax for Oakland, Alameda County, California
   */
  static calculateSalesTax(items: TaxableItem[]): TaxCalculationResult {
    const taxableItems: TaxableItem[] = [];
    const nonTaxableItems: TaxableItem[] = [];
    let subtotal = new Decimal(0);

    // Categorize items and calculate subtotal
    for (const item of items) {
      const quantity = item.quantity || 1;
      const itemAmount = new Decimal(item.amount).mul(quantity);
      
      if (this.isItemTaxable(item)) {
        taxableItems.push(item);
        subtotal = subtotal.add(itemAmount);
      } else {
        nonTaxableItems.push(item);
      }
    }

    // Calculate tax breakdown
    const taxRate = new Decimal(OAKLAND_TAX_RATES.total);
    const taxAmount = subtotal.mul(taxRate);
    
    const stateTax = subtotal.mul(OAKLAND_TAX_RATES.state);
    const countyTax = subtotal.mul(OAKLAND_TAX_RATES.county);
    const cityTax = subtotal.mul(OAKLAND_TAX_RATES.city);
    const districtTax = subtotal.mul(OAKLAND_TAX_RATES.district);

    // Calculate total including non-taxable items
    const nonTaxableTotal = nonTaxableItems.reduce((sum, item) => {
      const quantity = item.quantity || 1;
      return sum.add(new Decimal(item.amount).mul(quantity));
    }, new Decimal(0));

    const totalAmount = subtotal.add(taxAmount).add(nonTaxableTotal);

    return {
      subtotal,
      taxAmount,
      totalAmount,
      taxRate,
      breakdown: {
        state: stateTax,
        county: countyTax,
        city: cityTax,
        district: districtTax
      },
      taxableItems,
      nonTaxableItems
    };
  }

  /**
   * Determine if an item is taxable based on California and Oakland tax laws
   */
  private static isItemTaxable(item: TaxableItem): boolean {
    // Check if explicitly marked as non-taxable
    if (item.isTaxable === false) {
      return false;
    }

    // Check tax rules by category
    const category = item.taxCategory || 'service';
    const rule = TAX_RULES[category];
    
    return rule ? rule.taxable : true; // Default to taxable if unsure
  }

  /**
   * Get current tax rate for Oakland
   */
  static getTaxRate(): TaxRate {
    return { ...OAKLAND_TAX_RATES };
  }

  /**
   * Format tax amount for display
   */
  static formatTaxAmount(amount: Decimal.Value): string {
    return new Decimal(amount).toFixed(2);
  }

  /**
   * Calculate tax for subscription billing
   */
  static calculateSubscriptionTax(subscriptionAmount: Decimal.Value): TaxCalculationResult {
    const items: TaxableItem[] = [{
      description: "STAK Sync Monthly Subscription",
      amount: subscriptionAmount,
      quantity: 1,
      taxCategory: 'subscription'
    }];

    return this.calculateSalesTax(items);
  }

  /**
   * Calculate tax for event registration
   */
  static calculateEventTax(ticketPrice: Decimal.Value, quantity: number = 1, additionalItems: TaxableItem[] = []): TaxCalculationResult {
    const items: TaxableItem[] = [
      {
        description: "Event Ticket",
        amount: ticketPrice,
        quantity,
        taxCategory: 'event_ticket'
      },
      ...additionalItems
    ];

    return this.calculateSalesTax(items);
  }

  /**
   * Calculate tax for token usage overage charges
   */
  static calculateTokenUsageTax(overageAmount: Decimal.Value): TaxCalculationResult {
    const items: TaxableItem[] = [{
      description: "AI Token Usage Overage",
      amount: overageAmount,
      quantity: 1,
      taxCategory: 'service'
    }];

    return this.calculateSalesTax(items);
  }

  /**
   * Validate tax calculation and ensure compliance
   */
  static validateTaxCalculation(result: TaxCalculationResult): boolean {
    // Verify that tax breakdown adds up to total tax
    const calculatedTotal = result.breakdown.state
      .add(result.breakdown.county)
      .add(result.breakdown.city)
      .add(result.breakdown.district);

    const difference = result.taxAmount.sub(calculatedTotal).abs();
    
    // Allow for small rounding differences (less than 1 cent)
    return difference.lessThan(0.01);
  }
}

/**
 * Tax compliance utilities for reporting and auditing
 */
export class TaxComplianceService {
  /**
   * Generate tax report for a given period
   */
  static async generateTaxReport(startDate: Date, endDate: Date) {
    // This would integrate with the invoice system to generate tax reports
    // For now, this is a placeholder for future implementation
    return {
      period: { startDate, endDate },
      totalTaxableAmount: new Decimal(0),
      totalTaxCollected: new Decimal(0),
      jurisdiction: {
        state: "California",
        county: "Alameda County", 
        city: "Oakland"
      },
      taxRates: OAKLAND_TAX_RATES
    };
  }

  /**
   * Verify current tax rates are up to date
   * In production, this could check against a tax service API
   */
  static verifyTaxRates(): { isValid: boolean; lastUpdated: Date; source: string } {
    return {
      isValid: true,
      lastUpdated: new Date("2024-01-01"), // Should be updated when rates change
      source: "California Department of Tax and Fee Administration"
    };
  }
}