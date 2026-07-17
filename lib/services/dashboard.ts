import { getAccessToken } from "@/lib/token"

export interface DashboardActivity {
  id: string
  type: "leave" | "employee" | "job_posting"
  message: string
  timestamp: string
  department?: string
}

export interface DashboardStats {
  totalEmployees: number
  activeEmployees: number
  openPositions: number
  pendingApprovals: number
  trainingSessions: number
  recentActivities: DashboardActivity[]
  additionalStats: {
    allEmployees: number
    allLeaveRequests: number
    inactiveEmployees: number
    approvedLeaveRequests: number
    rejectedLeaveRequests: number
  }
}

export const dashboardService = {
  async getDashboardStats(): Promise<{ success: boolean; data?: DashboardStats; error?: string }> {
    try {
      const token = getAccessToken()
      const res = await fetch("/api/dashboard/stats", {
        headers: { ...(token && { Authorization: `Bearer ${token}` }) },
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        return { success: false, error: json.error || "Failed to fetch dashboard statistics" }
      }
      return { success: true, data: json.data }
    } catch (error) {
      console.error("Error fetching dashboard stats:", error)
      return { success: false, error: "Failed to fetch dashboard statistics" }
    }
  },
}
