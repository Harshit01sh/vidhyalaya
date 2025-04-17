"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Home, ClipboardCheck, BookOpen, FileText, Calendar, Bell, Settings, Clock, BadgePercent, DollarSign, UserCircle } from "lucide-react"
import { cn } from "@/lib/utils"

export function StudentNav() {
  const pathname = usePathname()

  return (
    <nav className="grid items-start xl:ml-5 md:ml-5 gap-2">
      <Link href="/student/dashboard" className="ml-5">
        <Button variant={pathname === "/student/dashboard" ? "secondary" : "ghost"} className="w-full justify-start cursor-pointer">
          <Home className="mr-2 h-4 w-4" />
          Dashboard
        </Button>
      </Link>
      <Link href="/student/attendance" className="ml-5">
        <Button
          variant={pathname.includes("/student/attendance") ? "secondary" : "ghost"}
          className="w-full justify-start cursor-pointer"
        >
          <ClipboardCheck className="mr-2 h-4 w-4" />
          Attendance
        </Button>
      </Link>
      <Link href="/student/schedule" className="ml-5">
        <Button
          variant={pathname.includes("/student/schedule") ? "secondary" : "ghost"}
          className="w-full justify-start cursor-pointer"
        >
          <Clock className="mr-2 h-4 w-4" />
          Schedule
        </Button>
      </Link>
      <Link href="/student/homework" className="ml-5">
        <Button
          variant={pathname.includes("/student/homework") ? "secondary" : "ghost"}
          className="w-full justify-start cursor-pointer"
        >
          <BookOpen className="mr-2 h-4 w-4" />
          Homework
        </Button>
      </Link>
      <Link href="/student/exams" className="ml-5">
        <Button
          variant={pathname.includes("/principal/student") ? "secondary" : "ghost"}
          className="w-full justify-start cursor-pointer"
        >
          <FileText className="mr-2 h-4 w-4" />
          Exams
        </Button>
      </Link>
      <Link href="/student/marks" className="ml-5">
        <Button variant={pathname.includes("/student/marks") ? "secondary" : "ghost"} className="w-full justify-start cursor-pointer">
          <BadgePercent className="mr-2 h-4 w-4" />
          Marks
        </Button>
      </Link>
      <Link href="/student/timetable" className="ml-5">
        <Button
          variant={pathname.includes("/student/timetable") ? "secondary" : "ghost"}
          className="w-full justify-start cursor-pointer"
        >
          <Calendar className="mr-2 h-4 w-4" />
          Timetable
        </Button>
      </Link>
      <Link href="/student/fees" className="ml-5">
        <Button
          variant={pathname.includes("/student/fees") ? "secondary" : "ghost"}
          className="w-full justify-start cursor-pointer"
        >
          <DollarSign className="mr-2 h-4 w-4" />
          Fees
        </Button>
      </Link>
      <Link href="/student/announcements" className="ml-5">
        <Button
          variant={pathname.includes("/student/announcements") ? "secondary" : "ghost"}
          className="w-full justify-start cursor-pointer"
        >
          <Bell className="mr-2 h-4 w-4" />
          Announcements
        </Button>
      </Link>
      <Link
          href="/student/profile"
          className={cn(
            "flex items-center gap-3 rounded-lg px-8 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground cursor-pointer",
            pathname === "/student/profile" ? "bg-accent text-accent-foreground" : "transparent",
          )}
        >
          <UserCircle className="h-4 w-4" />
          <span>Profile</span>
        </Link>
    </nav>
  )
}

