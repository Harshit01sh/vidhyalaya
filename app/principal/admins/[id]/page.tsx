"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PrincipalNav } from "@/components/principal-nav"
import { DashboardShell } from "@/components/dashboard-shell"
import { UserNav } from "@/components/user-nav"
import { db } from "@/lib/firebase"
import { doc, getDoc } from "firebase/firestore"
import { useAuth } from "@/lib/auth-provider"
import { useRouter, useParams } from "next/navigation"
import { ArrowLeft, Edit, Mail, Phone, MapPin, School, User } from "lucide-react"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface Admin {
  id: string
  name: string
  email: string
  phone: string
  photoURL?: string
}

export default function StudentDetailsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const studentId = params.id as string

  const [student, setStudent] = useState<Admin | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!loading && (!user || user.role !== "principal")) {
      router.push("/login")
    }
  }, [user, loading, router])

  useEffect(() => {
    const fetchStudent = async () => {
      if (!studentId) return

      try {
        setIsLoading(true)
        const docRef = doc(db, "users", studentId)
        const docSnap = await getDoc(docRef)

        if (docSnap.exists()) {
          const data = docSnap.data()
          setStudent({
            id: docSnap.id,
            name: data.name || "Unknown",
            email: data.email || "",
            phone: data.phone || "",
            photoURL: data.photoURL,
          })
        } else {
          router.push("/principal/admins")
        }

        setIsLoading(false)
      } catch (error) {
        console.error("Error fetching admin:", error)
        setIsLoading(false)
      }
    }

    if (user && user.role === "principal") {
      fetchStudent()
    }
  }, [studentId, user, router])

  if (loading || !user || user.role !== "principal") {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  return (
    <DashboardShell sidebar={<PrincipalNav />} title="Student Details">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Link href="/principal/admins">
            <Button variant="ghost" size="icon" className="cursor-pointer">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Admin Details</h1>
        </div>
        <UserNav />
      </div>

      {isLoading ? (
        <div className="flex justify-center p-8">Loading admin details...</div>
      ) : !student ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-8">
            <h2 className="text-lg font-medium mb-2">Admin Not Found</h2>
            <p className="text-muted-foreground mb-4">
              The admin you're looking for doesn't exist or has been deleted.
            </p>
            <Link href="/principal/admins">
              <Button>Back to ADmins</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 p-3 md:grid-cols-3">
          <Card className="md:col-span-1">
            <CardContent className="pt-6 flex flex-col items-center">
              <Avatar className="h-32 w-32 mb-4">
                <AvatarImage src={student.photoURL} alt={student.name} />
                <AvatarFallback className="text-2xl">
                  {student.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <h2 className="text-xl font-bold text-center">{student.name}</h2>
              

              <Link href={`/principal/admins/edit/${student.id}`} className="w-full">
                <Button className="w-full cursor-pointer" variant="outline">
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Profile
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Admin Information</CardTitle>
              <CardDescription>Detailed information about the student</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="flex items-center">
                    {student.name}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="flex items-center">
                    <Mail className="mr-2 h-4 w-4 text-muted-foreground" />
                    {student.email}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="flex items-center">
                    <Phone className="mr-2 h-4 w-4 text-muted-foreground" />
                    {student.phone}
                  </p>
                </div>
              </div>

            </CardContent>
          </Card>
        </div>
      )}
    </DashboardShell>
  )
}

