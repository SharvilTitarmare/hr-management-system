import { getAccessToken } from "@/lib/token"

export interface EmployeeDTO {
  id: string
  employee_id: string
  first_name: string
  last_name: string
  email: string
  phone: string
  position: string
  department: string
  manager: string
  start_date: string
  status: "Active" | "Inactive" | "On Leave" | string
  basic_salary: number
  created_at: string
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

export function fetchEmployees(params?: { page?: number; limit?: number; department?: string }) {
  const query = new URLSearchParams()
  query.set("limit", String(params?.limit ?? 100))
  query.set("page", String(params?.page ?? 1))
  if (params?.department) query.set("department", params.department)
  return authedFetch(`/api/employees?${query.toString()}`) as Promise<{
    employees: EmployeeDTO[]
    pagination: { page: number; limit: number; total: number; totalPages: number }
  }>
}

export interface NewEmployeePayload {
  employee_id: string
  first_name: string
  last_name: string
  email: string
  phone: string
  position: string
  department: string
  manager: string
  start_date: string
  basic_salary: number
}

export function createEmployee(payload: NewEmployeePayload) {
  return authedFetch("/api/employees", {
    method: "POST",
    body: JSON.stringify(payload),
  }) as Promise<EmployeeDTO>
}

export function deleteEmployee(id: string) {
  return authedFetch(`/api/employees/${id}`, { method: "DELETE" })
}
