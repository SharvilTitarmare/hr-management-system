"use client"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Info } from "lucide-react"

export function DemoBanner() {
  return (
    <Alert className="mb-4">
      <Info className="h-4 w-4" />
      <AlertDescription>
        <strong>Note:</strong> Dashboard, Employees, Leave, and Reports run on a real database. Recruitment,
        Training, Performance, and Disciplinary still use sample data.
      </AlertDescription>
    </Alert>
  )
}
