import { z } from "zod";
import { RepositoryFactory } from "@/repositories/repository.factory";
import { createClient } from "@/lib/supabase/server";
import type { Address, User } from "@/types/database";
import type { AddressInput } from "@/repositories/interfaces/address.repository.interface";

/**
 * Customer self-service: profile, address book and account closure.
 *
 * Every method takes an explicit `userId` that the caller has already resolved
 * from the session. No method accepts an id from a request body — that is the
 * difference between "edit my address" and "edit anyone's address".
 */

/** Shared field rules. Length caps stop a form becoming a storage abuse vector. */
export const addressSchema = z.object({
  type: z.enum(["shipping", "billing"]).default("shipping"),
  first_name: z.string().trim().min(1, "First name is required").max(80),
  last_name: z.string().trim().min(1, "Last name is required").max(80),
  company: z.string().trim().max(120).optional().nullable(),
  address_1: z.string().trim().min(1, "Address is required").max(200),
  address_2: z.string().trim().max(200).optional().nullable(),
  city: z.string().trim().min(1, "City is required").max(100),
  state: z.string().trim().min(1, "State or emirate is required").max(100),
  postal_code: z.string().trim().max(20).default(""),
  country: z.string().trim().min(2, "Country is required").max(60),
  phone: z
    .string()
    .trim()
    .min(6, "A contact number is required")
    .max(30)
    // Permissive on format by design: phone numbering differs by country and a
    // strict pattern locks out legitimate customers. Digits, spaces and the
    // usual separators only, so the value cannot smuggle markup into an email.
    .regex(/^[0-9+()\-\s.]+$/, "Enter a valid phone number"),
  is_default: z.boolean().default(false),
});

export const profileSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  phone: z
    .string()
    .trim()
    .max(30)
    .regex(/^[0-9+()\-\s.]*$/, "Enter a valid phone number")
    .optional()
    .or(z.literal("")),
});

export class AccountService {
  static async getAddresses(userId: string): Promise<Address[]> {
    return RepositoryFactory.getAddressRepository().findByUserId(userId);
  }

  static async createAddress(userId: string, input: unknown): Promise<Address> {
    const parsed = addressSchema.parse(input);
    return RepositoryFactory.getAddressRepository().create(userId, parsed as AddressInput);
  }

  static async updateAddress(
    userId: string,
    addressId: string,
    input: unknown
  ): Promise<Address | null> {
    const parsed = addressSchema.partial().parse(input);
    return RepositoryFactory.getAddressRepository().update(userId, addressId, parsed);
  }

  static async deleteAddress(userId: string, addressId: string): Promise<boolean> {
    return RepositoryFactory.getAddressRepository().delete(userId, addressId);
  }

  static async setDefaultAddress(userId: string, addressId: string): Promise<boolean> {
    return RepositoryFactory.getAddressRepository().setDefault(userId, addressId);
  }

  /**
   * Update the customer's own profile.
   *
   * Only `name` and `phone` are writable. `role` is not in the schema, is not
   * in the column grant the migration leaves in place, and is pinned by a
   * database trigger — three independent layers, because a role change is a
   * full compromise rather than a cosmetic bug.
   */
  static async updateProfile(userId: string, input: unknown): Promise<User | null> {
    const parsed = profileSchema.parse(input);
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("users")
      .update({
        name: parsed.name,
        phone: parsed.phone || null,
      })
      .eq("id", userId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update profile: ${error.message}`);
    }

    return (data as User) || null;
  }
}
