import { RepositoryFactory } from "@/repositories/repository.factory";

export interface TaxCalculation {
  taxEnabled: boolean;
  taxRate: number; // e.g. 8.5 for 8.5%
  taxAmount: number;
  isInclusive: boolean;
  taxName: string;
}

export class TaxService {
  /**
   * Calculate taxes based on store settings and line items
   */
  static async calculateTax(subtotalAfterDiscount: number, shippingAmount: number = 0): Promise<TaxCalculation> {
    const repo = RepositoryFactory.getSettingsRepository();
    const settings = await repo.getByKey("tax");
    
    const taxConfig = settings?.value || {
      enabled: false,
      percentage: 0,
      is_inclusive: false,
      // Whether shipping is part of the taxable base. Jurisdiction-specific,
      // so it is configuration rather than a baked-in assumption.
      tax_shipping: false,
      tax_name: "Tax",
    };

    if (!taxConfig.enabled || taxConfig.percentage <= 0 || subtotalAfterDiscount <= 0) {
      return {
        taxEnabled: false,
        taxRate: 0,
        taxAmount: 0,
        isInclusive: false,
        taxName: taxConfig.tax_name || "Tax",
      };
    }

    const rate = Number(taxConfig.percentage);
    // `shippingAmount` was previously accepted and then ignored, so stores that
    // must tax delivery under-collected. It is now honoured when configured.
    const taxableAmount = taxConfig.tax_shipping
      ? subtotalAfterDiscount + Number(shippingAmount || 0)
      : subtotalAfterDiscount;

    if (taxConfig.is_inclusive) {
      // Inclusive Tax: Price already contains tax: Tax = Total - (Total / (1 + Rate/100))
      const calculatedTax = taxableAmount - taxableAmount / (1 + rate / 100);
      return {
        taxEnabled: true,
        taxRate: rate,
        taxAmount: Math.round(calculatedTax * 100) / 100,
        isInclusive: true,
        taxName: taxConfig.tax_name || "Sales Tax",
      };
    } else {
      // Exclusive Tax: Tax is added on top
      const calculatedTax = (taxableAmount * rate) / 100;
      return {
        taxEnabled: true,
        taxRate: rate,
        taxAmount: Math.round(calculatedTax * 100) / 100,
        isInclusive: false,
        taxName: taxConfig.tax_name || "Sales Tax",
      };
    }
  }
}
