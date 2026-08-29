import { User, UserRole } from "../../types/database";

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(user: Omit<User, "id" | "created_at" | "updated_at">): Promise<User>;
  updateRole(userId: string, role: UserRole): Promise<void>;
}
