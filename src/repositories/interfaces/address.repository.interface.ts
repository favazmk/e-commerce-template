import { Address } from "../../types/database";

/** Fields a customer supplies. Ownership is never taken from the payload. */
export type AddressInput = Omit<
  Address,
  "id" | "user_id" | "created_at" | "updated_at"
>;

export interface IAddressRepository {
  /** Every address belonging to the signed-in customer, default first. */
  findByUserId(userId: string): Promise<Address[]>;
  findById(userId: string, addressId: string): Promise<Address | null>;
  create(userId: string, input: AddressInput): Promise<Address>;
  update(userId: string, addressId: string, input: Partial<AddressInput>): Promise<Address | null>;
  delete(userId: string, addressId: string): Promise<boolean>;
  /** Make one address the default of its type, clearing the previous one. */
  setDefault(userId: string, addressId: string): Promise<boolean>;
}
