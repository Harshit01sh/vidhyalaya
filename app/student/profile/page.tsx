"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { StudentNav } from "@/components/student-nav"
import { DashboardShell } from "@/components/dashboard-shell"
import { UserNav } from "@/components/user-nav"
import { useAuth } from "@/lib/auth-provider"
import { useRouter } from "next/navigation"
import { db } from "@/lib/firebase"
import { doc, getDoc } from "firebase/firestore"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface StudentDetails {
  name: string
  email: string
  role: string
  phone: string
  classSectionName: string
  fatherName: string
  photoURL: string
}

export default function StudentProfile() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [studentDetails, setStudentDetails] = useState<StudentDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!loading && (!user || user.role !== "student")) {
      router.push("/login")
    } else if (user) {
      fetchStudentDetails()
    }
  }, [user, loading, router])

  const fetchStudentDetails = async () => {
    if (!user?.uid) return

    try {
      const studentDoc = await getDoc(doc(db, "users", user.uid))

      if (studentDoc.exists()) {
        const data = studentDoc.data()

        setStudentDetails({
          name: data.name || "",
          email: data.email || "",
          role: data.role || "student",
          phone: data.phone || "Not provided",
          classSectionName: data.classSectionName || "Not assigned",
          fatherName: data.fatherName || "Not provided",
          photoURL: data.photoURL || "",
        })
      }

      setIsLoading(false)
    } catch (error) {
      console.error("Error fetching student details:", error)
      setIsLoading(false)
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  if (loading || isLoading || !studentDetails) {
    return (
      <DashboardShell sidebar={<StudentNav />} title="Profile">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Profile</h1>
          <UserNav />
        </div>
        <Card>
          <CardHeader>
            <CardTitle>
              <Skeleton className="h-8 w-48" />
            </CardTitle>
            <CardDescription>
              <Skeleton className="h-4 w-72" />
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center space-y-4">
              <Skeleton className="h-24 w-24 rounded-full" />
              <Skeleton className="h-6 w-32" />
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
          </CardContent>
        </Card>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell sidebar={<StudentNav />} title="Profile">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Profile</h1>
        <UserNav />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Student Profile</CardTitle>
          <CardDescription>View your profile information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center space-y-4">
            <Avatar className="h-24 w-24">
              <AvatarImage
                src={studentDetails.photoURL || user?.photoURL || ""}
                alt={studentDetails.name || user?.name || "Student"}
              />
              <AvatarFallback className="text-lg">
                {studentDetails.name ? getInitials(studentDetails.name) : user?.name ? getInitials(user.name) : "S"}
              </AvatarFallback>
            </Avatar>
            <h2 className="text-xl font-semibold">{studentDetails.name || user?.name}</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Role</p>
              <div className="rounded-md border px-4 py-3 font-mono text-sm">
                {(studentDetails.role ?? "student").charAt(0).toUpperCase() + (studentDetails.role ?? "student").slice(1)}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Class</p>
              <div className="rounded-md border px-4 py-3 font-mono text-sm">
                {studentDetails.classSectionName || "Not assigned"}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Email</p>
              <div className="rounded-md border px-4 py-3 font-mono text-sm">
                {studentDetails.email || user?.email || "Not provided"}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Phone</p>
              <div className="rounded-md border px-4 py-3 font-mono text-sm">
                {studentDetails.phone || "Not provided"}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Father's Name</p>
              <div className="rounded-md border px-4 py-3 font-mono text-sm">
                {studentDetails.fatherName || "Not provided"}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </DashboardShell>
  )
}