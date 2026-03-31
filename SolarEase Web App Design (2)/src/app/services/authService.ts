import api from "./api";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthUser {
  id: number;
  uuid: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: string;
  isEmailVerified: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: AuthUser;
}

export interface UpdateProfileRequest {
  firstName: string;
  lastName: string;
  phone: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const authService = {
  login: (data: LoginRequest) =>
    api.post<AuthResponse>("/auth/login", data).then((r) => r.data),

  getProfile: () =>
    api.get<AuthResponse>("/auth/me").then((r) => r.data),

  updateProfile: (data: UpdateProfileRequest) =>
    api.put<AuthResponse>("/auth/me", data).then((r) => r.data),

  changePassword: (data: ChangePasswordRequest) =>
    api.put<{ message: string }>("/auth/me/password", data).then((r) => r.data),

  refreshToken: (refreshToken: string) =>
    api.post<AuthResponse>("/auth/refresh", { refreshToken }).then((r) => r.data),

  logout: () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
  },
};

export default authService;
