import type {
  User,
  UserApi,
  UserCreate,
  UserCreateApi,
  UserUpdate,
  UserUpdateApi,
  UserListResponse,
  UserListApiResponse,
} from '@core/models/user.model';

/**
 * User Mapper
 * Converts between frontend (camelCase) and backend (snake_case) models
 */

/**
 * Converts backend UserApi to frontend User model
 *
 * Note: Dates are converted from ISO string to Date objects.
 * Backend sends dates in ISO format with timezone 'Z' (UTC).
 */
export function mapUserApiToUser(api: UserApi): User {
  return {
    id: api.id,
    email: api.email,
    fullName: api.full_name,
    role: api.role,
    isActive: api.is_active,
    createdAt: new Date(api.created_at),
    updatedAt: new Date(api.updated_at)
  };
}

/**
 * Converts frontend User to backend UserApi model
 *
 * Note: Dates are converted from Date objects to ISO string format.
 */
export function mapUserToUserApi(user: User): UserApi {
  return {
    id: user.id,
    email: user.email,
    full_name: user.fullName,
    role: user.role,
    is_active: user.isActive,
    created_at: user.createdAt.toISOString(),
    updated_at: user.updatedAt.toISOString()
  };
}

/**
 * Converts frontend UserCreate to backend UserCreateApi model
 */
export function mapUserCreateToApi(userCreate: UserCreate): UserCreateApi {
  const api: UserCreateApi = {
    email: userCreate.email,
    full_name: userCreate.fullName,
    password: userCreate.password,
    role: userCreate.role,
  };

  if (userCreate.isActive !== undefined) {
    api.is_active = userCreate.isActive;
  }

  return api;
}

/**
 * Converts frontend UserUpdate to backend UserUpdateApi model
 */
export function mapUserUpdateToApi(userUpdate: UserUpdate): UserUpdateApi {
  const api: UserUpdateApi = {};

  if (userUpdate.email !== undefined) {
    api.email = userUpdate.email;
  }
  if (userUpdate.fullName !== undefined) {
    api.full_name = userUpdate.fullName;
  }
  if (userUpdate.password !== undefined) {
    api.password = userUpdate.password;
  }
  if (userUpdate.role !== undefined) {
    api.role = userUpdate.role;
  }
  if (userUpdate.isActive !== undefined) {
    api.is_active = userUpdate.isActive;
  }

  return api;
}

/**
 * Converts backend UserListApiResponse to frontend UserListResponse
 */
export function mapUserListFromApi(
  apiResponse: UserListApiResponse
): UserListResponse {
  return {
    users: apiResponse.users.map(mapUserApiToUser),
    total: apiResponse.total,
    page: apiResponse.page,
    pageSize: apiResponse.page_size,
  };
}
