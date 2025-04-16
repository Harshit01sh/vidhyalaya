"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Home, Users, GraduationCap, Calendar, FileText, Bell, Settings, BookOpen, UserRoundPen, Clock, BadgePercent, DollarSign } from "lucide-react"

export function AdminNav() {
  const pathname = usePathname()

  return (
    <nav className="grid items-start xl:ml-5 md:ml-5 gap-2">
      <Link href="/admin/dashboard">
        <Button variant={pathname === "/admin/dashboard" ? "secondary" : "ghost"} className="w-full justify-start cursor-pointer">
          <Home className="mr-2 h-4 w-4" />
          Dashboard
        </Button>
      </Link>
      <Link href="/admin/teachers">
        <Button
          variant={pathname.includes("/admin/teachers") ? "secondary" : "ghost"}
          className="w-full justify-start cursor-pointer"
        >
          <GraduationCap className="mr-2 h-4 w-4" />
          Teachers
        </Button>
      </Link>
      <Link href="/admin/students">
        <Button
          variant={pathname.includes("/admin/students") ? "secondary" : "ghost"}
          className="w-full justify-start cursor-pointer"
        >
          <Users className="mr-2 h-4 w-4" />
          Students
        </Button>
      </Link>
      <Link href="/admin/schedule">
        <Button
          variant={pathname.includes("/admin/schedule") ? "secondary" : "ghost"}
          className="w-full justify-start cursor-pointer"
        >
          <Clock className="mr-2 h-4 w-4" />
          Schedule
        </Button>
      </Link>
      <Link href="/admin/exams">
        <Button
          variant={pathname.includes("/admin/exams") ? "secondary" : "ghost"}
          className="w-full justify-start cursor-pointer"
        >
          <FileText className="mr-2 h-4 w-4" />
          Exams
        </Button>
      </Link>
      <Link href="/admin/fees">
        <Button
          variant={pathname.includes("/admin/fees") ? "secondary" : "ghost"}
          className="w-full justify-start cursor-pointer"
        >
          <DollarSign className="mr-2 h-4 w-4" />
          Fees
        </Button>
      </Link>
      <Link href="/admin/announcements">
        <Button
          variant={pathname.includes("/admin/announcements") ? "secondary" : "ghost"}
          className="w-full justify-start cursor-pointer"
        >
          <Bell className="mr-2 h-4 w-4" />
          Announcements
        </Button>
      </Link>
      <Link href="/admin/settings">
        <Button
          variant={pathname.includes("/admin/settings") ? "secondary" : "ghost"}
          className="w-full justify-start cursor-pointer"
        >
          <Settings className="mr-2 h-4 w-4" />
          Settings
        </Button>
      </Link>
    </nav>
  )
}

