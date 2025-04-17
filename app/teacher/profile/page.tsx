"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TeacherNav } from "@/components/teacher-nav"
import { DashboardShell } from "@/components/dashboard-shell"
import { UserNav } from "@/components/user-nav"
import { useAuth } from "@/lib/auth-provider"
import { useRouter } from "next/navigation"
import { db } from "@/lib/firebase"
import { doc, getDoc } from "firebase/firestore"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

interface TeacherDetails {
  name: string
  email: string
  role: string
  phone: string
  subject: string
  isClassTeacher: boolean
  classSectionName: string
  photoURL: string
}

export default function TeacherProfile() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [teacherDetails, setTeacherDetails] = useState<TeacherDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!loading && (!user || user.role !== "teacher")) {
      router.push("/login")
    } else if (user) {
      fetchTeacherDetails()
    }
  }, [user, loading, router])

  const fetchTeacherDetails = async () => {
    if (!user?.uid) return

    try {
      const teacherDoc = await getDoc(doc(db, "users", user.uid))

      if (teacherDoc.exists()) {
        const data = teacherDoc.data()

        // Check if teacher is a class teacher
        let isClassTeacher = false
        let classSectionName = ""

        if (data.classSectionId) {
          isClassTeacher = true

          // Get class section name
          const classSectionDoc = await getDoc(doc(db, "classSections", data.classSectionId))
          if (classSectionDoc.exists()) {
            classSectionName = classSectionDoc.data().name || ""
          }
        }

        setTeacherDetails({
          name: data.name || "",
          email: data.email || "",
          role: data.role || "teacher",
          phone: data.phone || "Not provided",
          subject: data.subject || "Not assigned",
          isClassTeacher,
          classSectionName,
          photoURL: data.photoURL || "",
        })
      }

      setIsLoading(false)
    } catch (error) {
      console.error("Error fetching teacher details:", error)
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

  if (loading || isLoading || !teacherDetails) {
    return (
      <DashboardShell sidebar={<TeacherNav />} title="Profile">
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
    <DashboardShell sidebar={<TeacherNav />} title="Profile">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Profile</h1>
        <UserNav />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Teacher Profile</CardTitle>
          <CardDescription>View your profile information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center space-y-4">
            <Avatar className="h-24 w-24">
              <AvatarImage
                src={teacherDetails.photoURL || user?.photoURL || ""}
                alt={teacherDetails.name || user?.name || "Teacher"}
              />
              <AvatarFallback className="text-lg">
                {teacherDetails.name ? getInitials(teacherDetails.name) : user?.name ? getInitials(user.name) : "T"}
              </AvatarFallback>
            </Avatar>
            <div className="text-center">
              <h2 className="text-xl font-semibold">{teacherDetails.name || user?.name}</h2>
              {teacherDetails.isClassTeacher && (
                <Badge className="mt-2">Class Teacher - {teacherDetails.classSectionName}</Badge>
              )}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Role</p>
              <div className="rounded-md border px-4 py-3 font-mono text-sm">
                {(teacherDetails.role ?? "teacher").charAt(0).toUpperCase() + (teacherDetails.role ?? "teacher").slice(1)}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Email</p>
              <div className="rounded-md border px-4 py-3 font-mono text-sm">
                {teacherDetails.email || user?.email || "Not provided"}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Phone</p>
              <div className="rounded-md border px-4 py-3 font-mono text-sm">
                {teacherDetails.phone || "Not provided"}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Subject</p>
              <div className="rounded-md border px-4 py-3 font-mono text-sm">
                {teacherDetails.subject || "Not assigned"}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </DashboardShell>
  )
}