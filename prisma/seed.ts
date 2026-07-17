import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

interface SeedEmployee {
  employee_id: string
  first_name: string
  last_name: string
  email: string
  phone: string
  position: string
  department: string
  manager: string
  start_date: string
  status: "Active" | "On_Leave" | "Inactive"
  basic_salary: number
}

const EMPLOYEES: SeedEmployee[] = [
  {
    employee_id: "EMP001",
    first_name: "Jane",
    last_name: "Smith",
    email: "jane.smith@hrms.com",
    phone: "9998887771",
    position: "Software Engineer",
    department: "IT",
    manager: "Admin User",
    start_date: "2023-01-15",
    status: "Active",
    basic_salary: 720000,
  },
  {
    employee_id: "EMP002",
    first_name: "Rohan",
    last_name: "Mehta",
    email: "rohan.mehta@hrms.com",
    phone: "9998887772",
    position: "Backend Engineer",
    department: "IT",
    manager: "Jane Smith",
    start_date: "2024-03-10",
    status: "Active",
    basic_salary: 650000,
  },
  {
    employee_id: "EMP003",
    first_name: "Ananya",
    last_name: "Rao",
    email: "ananya.rao@hrms.com",
    phone: "9998887773",
    position: "HR Executive",
    department: "Human Resources",
    manager: "Admin User",
    start_date: "2022-07-01",
    status: "Active",
    basic_salary: 550000,
  },
  {
    employee_id: "EMP004",
    first_name: "Karan",
    last_name: "Verma",
    email: "karan.verma@hrms.com",
    phone: "9998887774",
    position: "Financial Analyst",
    department: "Finance",
    manager: "Admin User",
    start_date: "2021-11-20",
    status: "Active",
    basic_salary: 680000,
  },
  {
    employee_id: "EMP005",
    first_name: "Priya",
    last_name: "Nair",
    email: "priya.nair@hrms.com",
    phone: "9998887775",
    position: "Marketing Specialist",
    department: "Marketing",
    manager: "Admin User",
    start_date: "2023-09-05",
    status: "Active",
    basic_salary: 500000,
  },
  {
    employee_id: "EMP006",
    first_name: "Arjun",
    last_name: "Iyer",
    email: "arjun.iyer@hrms.com",
    phone: "9998887776",
    position: "Operations Coordinator",
    department: "Operations",
    manager: "Admin User",
    start_date: "2020-05-18",
    status: "Active",
    basic_salary: 480000,
  },
  {
    employee_id: "EMP007",
    first_name: "Sneha",
    last_name: "Kulkarni",
    email: "sneha.kulkarni@hrms.com",
    phone: "9998887777",
    position: "Sales Executive",
    department: "Sales",
    manager: "Admin User",
    start_date: "2024-01-08",
    status: "Active",
    basic_salary: 520000,
  },
  {
    employee_id: "EMP008",
    first_name: "Vikram",
    last_name: "Desai",
    email: "vikram.desai@hrms.com",
    phone: "9998887778",
    position: "QA Engineer",
    department: "IT",
    manager: "Jane Smith",
    start_date: "2022-02-14",
    status: "Inactive",
    basic_salary: 600000,
  },
]

async function main() {
  const password = await bcrypt.hash("password123", 10)

  // --- Admin login (not tied to an Employee record) ---
  const admin = await prisma.user.upsert({
    where: { email: "admin@hrms.com" },
    update: {},
    create: {
      email: "admin@hrms.com",
      password,
      name: "Admin User",
      role: "Admin",
    },
  })

  // --- Employee records across departments ---
  const created: Record<string, { id: string }> = {}
  for (const emp of EMPLOYEES) {
    const record = await prisma.employee.upsert({
      where: { employee_id: emp.employee_id },
      update: {},
      create: {
        employee_id: emp.employee_id,
        first_name: emp.first_name,
        last_name: emp.last_name,
        email: emp.email,
        phone: emp.phone,
        position: emp.position,
        department: emp.department,
        manager: emp.manager,
        start_date: new Date(emp.start_date),
        status: emp.status,
        basic_salary: emp.basic_salary,
      },
    })
    created[emp.employee_id] = record
  }

  // --- Employee login, linked to Jane Smith's record ---
  const employeeUser = await prisma.user.upsert({
    where: { email: "jane.smith@hrms.com" },
    update: {},
    create: {
      email: "jane.smith@hrms.com",
      password,
      name: "Jane Smith",
      role: "Employee",
      employeeId: created["EMP001"].id,
    },
  })

  // --- A realistic spread of leave requests: pending, approved, rejected,
  //     and one currently in progress so "Currently On Leave" isn't empty ---
  const now = new Date()
  const daysFromNow = (n: number) => new Date(now.getTime() + n * 24 * 60 * 60 * 1000)

  const leaveRequests = [
    {
      employee_id: created["EMP001"].id,
      leave_type: "Annual Leave",
      start_date: daysFromNow(14),
      end_date: daysFromNow(18),
      days: 5,
      reason: "Family trip",
      reliever: "Rohan Mehta",
      status: "Pending" as const,
    },
    {
      employee_id: created["EMP002"].id,
      leave_type: "Sick Leave",
      start_date: daysFromNow(-1),
      end_date: daysFromNow(1),
      days: 3,
      reason: "Flu recovery",
      reliever: "Jane Smith",
      status: "Approved" as const, // currently on leave
    },
    {
      employee_id: created["EMP003"].id,
      leave_type: "Annual Leave",
      start_date: daysFromNow(-20),
      end_date: daysFromNow(-15),
      days: 5,
      reason: "Wedding function",
      reliever: "Karan Verma",
      status: "Approved" as const,
    },
    {
      employee_id: created["EMP004"].id,
      leave_type: "Unpaid Leave",
      start_date: daysFromNow(5),
      end_date: daysFromNow(6),
      days: 2,
      reason: "Personal matters",
      reliever: "Priya Nair",
      status: "Rejected" as const,
    },
    {
      employee_id: created["EMP005"].id,
      leave_type: "Sick Leave",
      start_date: daysFromNow(2),
      end_date: daysFromNow(3),
      days: 2,
      reason: "Medical appointment",
      reliever: "Arjun Iyer",
      status: "Pending" as const,
    },
    {
      employee_id: created["EMP007"].id,
      leave_type: "Compassionate Leave",
      start_date: daysFromNow(-40),
      end_date: daysFromNow(-38),
      days: 3,
      reason: "Family emergency",
      reliever: "Sneha's team lead",
      status: "Approved" as const,
    },
  ]

  for (const lr of leaveRequests) {
    await prisma.leaveRequest.create({ data: lr })
  }

  console.log("Seeded:")
  console.log(`  ${EMPLOYEES.length} employees across ${new Set(EMPLOYEES.map((e) => e.department)).size} departments`)
  console.log(`  ${leaveRequests.length} leave requests (pending/approved/rejected)`)
  console.log("  Admin login:    admin@hrms.com / password123")
  console.log("  Employee login: jane.smith@hrms.com / password123")
  console.log({ admin: admin.email, employeeUser: employeeUser.email })
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
