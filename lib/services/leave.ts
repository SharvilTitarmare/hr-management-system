import { getAccessToken } from "@/lib/token"

export interface LeaveRequestDTO {
  id: string
  employee_id: string
  leave_type: string
  start_date: string
  end_date: string
  days: number
  reason: string
  status: "Pending" | "Approved" | "Rejected"
  reliever: string
  created_at: string
  employee: {
    id: string
    first_name: string
    last_name: string
    department: string
  }
}

async function authedFetch(url: string, options: RequestInit = {}) {
  const token = getAccessToken()
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  })
  const data = await res.json()
  if (!res.ok) {
    throw new Error(data.error || "Something went wrong")
  }
  return data
}

export function fetchLeaveRequests(params?: { status?: string; employee_id?: string }) {
  const query = new URLSearchParams()
  if (params?.status) query.set("status", params.status)
  if (params?.employee_id) query.set("employee_id", params.employee_id)
  const qs = query.toString()
  return authedFetch(`/api/leave${qs ? `?${qs}` : ""}`) as Promise<{ leaveRequests: LeaveRequestDTO[] }>
}

export function applyForLeave(payload: {
  leave_type: string
  start_date: string
  end_date: string
  reason: string
  reliever: string
  employee_id?: string
}) {
  return authedFetch("/api/leave", {
    method: "POST",
    body: JSON.stringify(payload),
  }) as Promise<LeaveRequestDTO>
}

export function updateLeaveStatus(id: string, status: "Approved" | "Rejected") {
  return authedFetch(`/api/leave/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  }) as Promise<LeaveRequestDTO>
}

export function cancelLeaveRequest(id: string) {
  return authedFetch(`/api/leave/${id}`, { method: "DELETE" })
}
