/**
 * User Model
 * Represents a user in the system (Employee or HR)
 * Based on OpenAPI specification
 */

export type UserRole = 'employee' | 'hr';

/**
 * Frontend User Model (camelCase)
 */
export interface User {
  id: number;
  email: string;
  fullName: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Backend User Model (snake_case) - API Response
 */
export interface UserApi {
  id: number;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

/**
 * Frontend Create User Model (camelCase)
 */
export interface UserCreate {
  email: string;
  fullName: string;
  password: string;
  role: UserRole;
  isActive?: boolean;
}

/**
 * Backend Create User Model (snake_case) - API Request
 */
export interface UserCreateApi {
  email: string;
  full_name: string;
  password: string;
  role: UserRole;
  is_active?: boolean;
}

/**
 * Frontend Update User Model (camelCase)
 */
export interface UserUpdate {
  email?: string;
  fullName?: string;
  password?: string;
  role?: UserRole;
  isActive?: boolean;
}

/**
 * Backend Update User Model (snake_case) - API Request
 */
export interface UserUpdateApi {
  email?: string;
  full_name?: string;
  password?: string;
  role?: UserRole;
  is_active?: boolean;
}
