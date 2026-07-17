import { getAccessToken } from "@/lib/token"

export interface DepartmentLeaveReport {
  department: string
  totalRequests: number
  pending: number
  approved: number
  rejected: number
  totalDaysApproved: number
}

export interface DepartmentHeadcountReport {
  department: string
  headcount: number
  avgTenureYears: number | null
  avgSalary: number | null
}

export interface OnLeaveNowReport {
  employee_id: string
  first_name: string
  last_name: string
  department: string
  leave_type: string
  start_date: string
  end_date: string
  days: number
}

export interface ReportsResponse {
  leaveByDepartment: DepartmentLeaveReport[]
  headcountByDepartment: DepartmentHeadcountReport[]
  onLeaveNow: OnLeaveNowReport[]
}

export async function fetchReports(): Promise<ReportsResponse> {
  const token = getAccessToken()
  const res = await fetch("/api/reports", {
    headers: { ...(token && { Authorization: `Bearer ${token}` }) },
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || "Failed to load reports")
  return data
}
