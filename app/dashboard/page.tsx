import { ProtectedRoute } from "@/components/auth/protected-route"
import { HRDashboard } from "@/components/dashboard/hr-dashboard"

export default function DashboardPage() {
  return (
    <ProtectedRoute requiredRoles={["Admin", "Employee"]}>
      <HRDashboard />
    </ProtectedRoute>
  )
}
