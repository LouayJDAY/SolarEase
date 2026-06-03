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

export interface InstallerOption {
  id: number;
  uuid: string;
  username: string;
  email: string;
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
  message?: string;
  email?: string;
  otpCode?: string;
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

export interface RegisterRequest {
  username?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  userRole?: "CLIENT" | "INSTALLER";
}

export interface VerifyOtpRequest {
  email: string;
  otpCode: string;
  invitationToken?: string;
}

export interface ResendOtpRequest {
  email: string;
}

export interface CreateInstallerRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  password: string;
}

export interface UpdateInstallerRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  password?: string;
  isActive?: boolean;
}

const authService = {
  login: (data: LoginRequest) =>
    api.post<AuthResponse>("/auth/login", data).then((r) => r.data),

  register: (data: RegisterRequest) =>
    api.post<AuthResponse>("/auth/register", data).then((r) => r.data),

  verifyOtp: (data: VerifyOtpRequest) =>
    api.post<AuthResponse>("/auth/verify-otp", data).then((r) => r.data),

  resendOtp: (data: ResendOtpRequest) =>
    api.post<AuthResponse>("/auth/resend-otp", data).then((r) => r.data),

  getProfile: () =>
    api.get<AuthResponse>("/auth/me").then((r) => r.data),

  getInstallers: () =>
    api.get<InstallerOption[]>("/auth/installers").then((r) => r.data),

  createInstaller: (data: CreateInstallerRequest) =>
    api.post<InstallerOption>("/auth/installers", data).then((r) => r.data),

  updateInstaller: (installerUuid: string, data: UpdateInstallerRequest) =>
    api.put<InstallerOption>(`/auth/installers/${installerUuid}`, data).then((r) => r.data),

  deleteInstaller: (installerUuid: string) =>
    api.delete<void>(`/auth/installers/${installerUuid}`).then((r) => r.data),

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
