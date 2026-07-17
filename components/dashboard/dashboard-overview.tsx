"use client";

import { useState } from "react";
import useSWR from "swr";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Users,
  UserPlus,
  FileText,
  GraduationCap,
  Calendar,
  Award,
  Loader2
} from "lucide-react";
import { AddEmployeeDialog } from "@/components/employees/add-employee-dialog";
import { LeaveApplicationDialog } from "@/components/leave/leave-application-dialog";
import { CreateAppraisalDialog } from "@/components/performance/create-appraisal-dialog";
import { ScheduleTrainingDialog } from "@/components/training/schedule-training-dialog";
import { LiveBadge } from "@/components/ui/live-badge";
import type { DashboardStats } from "@/lib/services/dashboard";
import { useAuth } from "@/lib/auth-store";

interface DashboardStatsResponse {
  success: boolean
  data: DashboardStats
}

const ACTIVITY_DOT: Record<string, string> = {
  employee: "bg-[oklch(0.65_0.2_285)]", // violet
  leave: "bg-lime",
  job_posting: "bg-magenta",
};

export function DashboardOverview() {
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [showLeaveRequest, setShowLeaveRequest] = useState(false);
  const [showPerformanceReview, setShowPerformanceReview] = useState(false);
  const [showScheduleTraining, setShowScheduleTraining] = useState(false);

  const { user } = useAuth();
  const { data, error, isLoading } = useSWR<DashboardStatsResponse>("/api/dashboard/stats");
  const stats = data?.data ?? null;

  const canManageEmployees = user?.role === "Admin";
  const canApproveLeave = user?.role === "Admin";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold tracking-tight">HR Dashboard</h2>
          <p className="text-muted-foreground">
            Welcome back, {user?.name || user?.email}! Here&apos;s your HR system overview
          </p>
        </div>
        <LiveBadge />
      </div>

      {error && (
        <p className="text-sm text-destructive border border-destructive/30 rounded-lg px-4 py-3">
          {error.message}
        </p>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Employees
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-display font-bold">
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : (stats?.totalEmployees ?? 0)}
            </div>
            <p className="text-xs text-muted-foreground">Active employees</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Open Positions
            </CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-display font-bold">
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : (stats?.openPositions ?? 0)}
            </div>
            <p className="text-xs text-muted-foreground">Active job postings</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Approvals
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-display font-bold">
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : (stats?.pendingApprovals ?? 0)}
            </div>
            <p className="text-xs text-muted-foreground">Leave requests awaiting review</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Training Sessions
            </CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-display font-bold">
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : (stats?.trainingSessions ?? 0)}
            </div>
            <p className="text-xs text-muted-foreground">Scheduled</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common HR tasks and operations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {canManageEmployees && (
              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={() => setShowAddEmployee(true)}
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Add New Employee
              </Button>
            )}
            <Button
              className="w-full justify-start"
              variant="outline"
              onClick={() => setShowLeaveRequest(true)}
            >
              <Calendar className="mr-2 h-4 w-4" />
              Apply for Leave
            </Button>
            {canApproveLeave && (
              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={() => setShowPerformanceReview(true)}
              >
                <Award className="mr-2 h-4 w-4" />
                Start Performance Review
              </Button>
            )}
            <Button
              className="w-full justify-start"
              variant="outline"
              onClick={() => setShowScheduleTraining(true)}
            >
              <GraduationCap className="mr-2 h-4 w-4" />
              Schedule Training
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest updates across employees, leave, and hiring</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-6 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Loading...
              </div>
            ) : !stats || stats.recentActivities.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent activity yet.</p>
            ) : (
              stats.recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-center space-x-4">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${ACTIVITY_DOT[activity.type] || "bg-muted-foreground"}`} />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{activity.message}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(activity.timestamp).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog Components */}
      {canManageEmployees && (
        <AddEmployeeDialog
          open={showAddEmployee}
          onOpenChange={setShowAddEmployee}
        />
      )}
      <LeaveApplicationDialog
        open={showLeaveRequest}
        onOpenChange={setShowLeaveRequest}
      />
      {canApproveLeave && (
        <CreateAppraisalDialog
          open={showPerformanceReview}
          onOpenChange={setShowPerformanceReview}
        />
      )}
      <ScheduleTrainingDialog
        open={showScheduleTraining}
        onOpenChange={setShowScheduleTraining}
      />
    </div>
  );
}
