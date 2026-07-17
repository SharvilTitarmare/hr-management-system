export type UserRole = "Admin" | "Employee"

export interface User {
    id: string
    email: string
    name?: string
    role: UserRole
    employeeId: string | null
    createdAt: Date
    updatedAt: Date
  }

  export interface AuthResponse {
    user: User
    accessToken: string
    refreshToken: string
  }

  export interface LoginRequest {
    email: string
    password: string
  }

  export interface RegisterRequest {
    email: string
    password: string
    name?: string
  }