import { NextRequest } from "next/server"
import jwt from "jsonwebtoken"
import { prisma } from "@/lib/api"

export interface AuthUser {
  id: string
  email: string
  role: "Admin" | "Employee"
  employeeId: string | null
}

/**
 * Verifies the Bearer token on a request and returns the logged-in user.
 * Returns null if there's no token, the token is invalid/expired, or the
 * user no longer exists — callers should treat that as "not authenticated".
 */
export async function getAuthUser(request: NextRequest): Promise<AuthUser | null> {
  const authHeader = request.headers.get("authorization")
  const token = authHeader?.replace("Bearer ", "")

  if (!token) return null

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, role: true, employeeId: true },
    })

    if (!user) return null

    return user as AuthUser
  } catch {
    return null
  }
}
