import { IUserRepository } from "../interfaces/user.repository.interface";
import { User, UserRole } from "../../types/database";
import { createAdminClient } from "../../lib/supabase/server";

export class SupabaseUserRepository implements IUserRepository {
  private getClient() {
    return createAdminClient();
  }

  async findById(id: string): Promise<User | null> {
    const { data, error } = await this.getClient()
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return data as User;
  }

  async findByEmail(email: string): Promise<User | null> {
    const { data, error } = await this.getClient()
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !data) return null;
    return data as User;
  }

  async create(user: Omit<User, "id" | "created_at" | "updated_at">): Promise<User> {
    const { data, error } = await this.getClient()
      .from('users')
      .insert([user])
      .select()
      .single();

    if (error || !data) throw new Error("Failed to create user");
    return data as User;
  }

  async updateRole(userId: string, role: UserRole): Promise<void> {
    const { error } = await this.getClient()
      .from('users')
      .update({ role, updated_at: new Date().toISOString() })
      .eq('id', userId);

    if (error) throw new Error("Failed to update user role");
  }
}
