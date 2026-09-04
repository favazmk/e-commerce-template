import { RepositoryFactory } from "@/repositories/repository.factory";

export interface ShippingMethod {
  id: string;
  name: string;
  rate: number;
  free_threshold?: number;
  estimated_days?: string;
}

export interface ShippingCalculation {
  selectedMethod: ShippingMethod;
  shippingAmount: number;
  isFree: boolean;
  availableMethods: ShippingMethod[];
}

export class ShippingService {
  /**
   * Get all active shipping zones / methods configured in store settings
   */
  static async getShippingMethods(): Promise<ShippingMethod[]> {
    const repo = RepositoryFactory.getSettingsRepository();
    const settings = await repo.getByKey("shipping");
    const shippingConfig = settings?.value || {};
    // Region-neutral fallback for a store that has not configured shipping
    // yet. Real rates are set in Admin -> Settings; naming a country here would
    // ship one market's assumptions to every client (AGENTS.md 9, 25).
    return shippingConfig.zones || [
      {
        id: "zone-standard",
        name: "Standard Delivery",
        rate: 0,
        free_threshold: undefined,
        estimated_days: "3-5 Business Days",
      },
    ];
  }

  /**
   * Calculate shipping rate for a cart subtotal and selected method ID
   */
  static async calculateShipping(
    subtotal: number,
    selectedMethodId?: string,
    countryCode?: string
  ): Promise<ShippingCalculation> {
    const methods = await this.getShippingMethods();
    let method = methods.find((m) => m.id === selectedMethodId);

    // Fallback to first available method if none selected or invalid
    if (!method && methods.length > 0) {
      method = methods[0];
    }

    if (!method) {
      const fallback: ShippingMethod = {
        id: "zone-default",
        name: "Standard Delivery",
        rate: 0,
      };
      return {
        selectedMethod: fallback,
        shippingAmount: 0,
        isFree: true,
        availableMethods: [fallback],
      };
    }

    // Check free shipping threshold
    const isFree = Boolean(method.free_threshold && subtotal >= method.free_threshold);
    const shippingAmount = isFree ? 0 : Number(method.rate);

    return {
      selectedMethod: method,
      shippingAmount,
      isFree,
      availableMethods: methods,
    };
  }
}
