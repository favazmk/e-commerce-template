import { describe, it, expect, beforeEach } from "vitest";
import { ShippingService } from "../src/services/shipping.service";
import { TaxService } from "../src/services/tax.service";
import { RepositoryFactory } from "../src/repositories/repository.factory";
import { MockSettingsRepository, resetMockData, mockData } from "./__mocks__/repositories";

describe("Commerce Core: Tax & Shipping Services", () => {
  beforeEach(() => {
    RepositoryFactory.setOverride("SettingsRepository", new MockSettingsRepository());
    resetMockData();
  });

  it("should calculate exclusive sales tax correctly", async () => {
    mockData.settings.tax = {
      enabled: true,
      percentage: 10,
      is_inclusive: false,
      tax_name: "Sales Tax",
    };

    const tax = await TaxService.calculateTax(200);

    expect(tax.taxEnabled).toBe(true);
    expect(tax.taxRate).toBe(10);
    expect(tax.taxAmount).toBe(20); // 10% of 200 = 20
    expect(tax.isInclusive).toBe(false);
  });

  it("should calculate embedded inclusive VAT correctly", async () => {
    mockData.settings.tax = {
      enabled: true,
      percentage: 20, // 20% VAT
      is_inclusive: true,
      tax_name: "VAT",
    };

    // Subtotal: 120 (Price is 100 + 20 VAT) -> Tax amount should be 20
    const tax = await TaxService.calculateTax(120);

    expect(tax.taxEnabled).toBe(true);
    expect(tax.taxAmount).toBe(20);
    expect(tax.isInclusive).toBe(true);
  });

  it("should apply free shipping threshold when cart exceeds qualifying amount", async () => {
    mockData.settings.shipping = {
      flat_rate: 15,
      free_shipping_threshold: 200,
      zones: [
        {
          id: "zone-us",
          name: "Standard Ground Shipping",
          rate: 15,
          free_threshold: 200,
        }
      ]
    } as any;
    
    // Threshold is $200
    const qualifying = await ShippingService.calculateShipping(250, "zone-us");
    expect(qualifying.isFree).toBe(true);
    expect(qualifying.shippingAmount).toBe(0);

    const nonQualifying = await ShippingService.calculateShipping(100, "zone-us");
    expect(nonQualifying.isFree).toBe(false);
    expect(nonQualifying.shippingAmount).toBe(15);
  });
});
