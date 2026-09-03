import {
  AddressInput,
  IAddressRepository,
} from "../interfaces/address.repository.interface";
import { Address } from "../../types/database";
import { SupabaseRepository } from "./base.repository";

/**
 * Customer address book.
 *
 * Every query here runs on the RLS-enforced user client. Addresses are personal
 * data — name, street, phone — so the "Users can ... their own addresses"
 * policies are the last line that stops a mistyped filter returning somebody
 * else's home address. `userId` is still passed and filtered on explicitly: the
 * application should be correct on its own, with RLS as the safety net rather
 * than the only check.
 */
export class SupabaseAddressRepository
  extends SupabaseRepository
  implements IAddressRepository
{
  async findByUserId(userId: string): Promise<Address[]> {
    const client = await this.userClient();
    const { data, error } = await client
      .from("addresses")
      .select("*")
      .eq("user_id", userId)
      .order("is_default", { ascending: false })
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("[addresses] list failed:", error.message);
      return [];
    }
    return (data || []) as Address[];
  }

  async findById(userId: string, addressId: string): Promise<Address | null> {
    const client = await this.userClient();
    const { data, error } = await client
      .from("addresses")
      .select("*")
      .eq("id", addressId)
      .eq("user_id", userId)
      .single();

    if (error || !data) return null;
    return data as Address;
  }

  async create(userId: string, input: AddressInput): Promise<Address> {
    const client = await this.userClient();

    // A customer's first address becomes their default automatically, so
    // checkout has something to preselect without an extra step.
    const existing = await this.findByUserId(userId);
    const isFirst = existing.length === 0;

    if (input.is_default || isFirst) {
      await this.clearDefaultForType(userId, input.type);
    }

    const { data, error } = await client
      .from("addresses")
      .insert([{ ...input, user_id: userId, is_default: input.is_default || isFirst }])
      .select()
      .single();

    if (error || !data) {
      throw new Error(`Failed to save address${error ? `: ${error.message}` : ""}`);
    }
    return data as Address;
  }

  async update(
    userId: string,
    addressId: string,
    input: Partial<AddressInput>
  ): Promise<Address | null> {
    const client = await this.userClient();

    if (input.is_default) {
      const current = await this.findById(userId, addressId);
      if (!current) return null;
      await this.clearDefaultForType(userId, input.type || current.type);
    }

    const { data, error } = await client
      .from("addresses")
      .update({ ...input, updated_at: new Date().toISOString() })
      .eq("id", addressId)
      .eq("user_id", userId)
      .select()
      .single();

    if (error || !data) return null;
    return data as Address;
  }

  async delete(userId: string, addressId: string): Promise<boolean> {
    const client = await this.userClient();
    const { error } = await client
      .from("addresses")
      .delete()
      .eq("id", addressId)
      .eq("user_id", userId);

    return !error;
  }

  async setDefault(userId: string, addressId: string): Promise<boolean> {
    const target = await this.findById(userId, addressId);
    if (!target) return false;

    await this.clearDefaultForType(userId, target.type);

    const client = await this.userClient();
    const { error } = await client
      .from("addresses")
      .update({ is_default: true, updated_at: new Date().toISOString() })
      .eq("id", addressId)
      .eq("user_id", userId);

    return !error;
  }

  private async clearDefaultForType(userId: string, type: string): Promise<void> {
    const client = await this.userClient();
    await client
      .from("addresses")
      .update({ is_default: false })
      .eq("user_id", userId)
      .eq("type", type)
      .eq("is_default", true);
  }
}
