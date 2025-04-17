"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PrincipalNav } from "@/components/principal-nav"
import { DashboardShell } from "@/components/dashboard-shell"
import { UserNav } from "@/components/user-nav"
import { useAuth } from "@/lib/auth-provider"
import { useRouter } from "next/navigation"
import { db } from "@/lib/firebase"
import { doc, getDoc } from "firebase/firestore"
import { Skeleton } from "@/components/ui/skeleton"

interface PrincipalDetails {
  name: string
  email: string
  role: string
  phone: string
}

export default function PrincipalProfile() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [principalDetails, setPrincipalDetails] = useState<PrincipalDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!loading && (!user || user.role !== "principal")) {
      router.push("/login")
    } else if (user) {
      fetchPrincipalDetails()
    }
  }, [user, loading, router])

  const fetchPrincipalDetails = async () => {
    if (!user?.uid) return

    try {
      const principalDoc = await getDoc(doc(db, "users", user.uid))

      if (principalDoc.exists()) {
        const data = principalDoc.data()
        setPrincipalDetails({
          name: data.name || "",
          email: data.email || "",
          role: data.role || "principal",
          phone: data.phone || "Not provided",
        })
      }

      setIsLoading(false)
    } catch (error) {
      console.error("Error fetching principal details:", error)
      setIsLoading(false)
    }
  }

  if (loading || isLoading || !principalDetails) {
    return (
      <DashboardShell sidebar={<PrincipalNav />} title="Profile">
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
            <div className="space-y-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
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
    <DashboardShell sidebar={<PrincipalNav />} title="Profile">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold ml-3 md:ml-2 xl:ml-0">Profile</h1>
        <UserNav />
      </div>

      <div className="p-3">
      <Card>
        <CardHeader>
          <CardTitle>Principal Profile</CardTitle>
          <CardDescription>View your profile information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Name</p>
              <div className="rounded-md border px-4 py-3 font-mono text-sm">
                {principalDetails.name || user?.name || "Not provided"}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Role</p>
              <div className="rounded-md border px-4 py-3 font-mono text-sm">
                {(principalDetails.role ?? "principal").charAt(0).toUpperCase() + (principalDetails.role ?? "principal").slice(1)}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Email</p>
              <div className="rounded-md border px-4 py-3 font-mono text-sm">
                {principalDetails.email || user?.email || "Not provided"}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Phone</p>
              <div className="rounded-md border px-4 py-3 font-mono text-sm">
                {principalDetails.phone || "Not provided"}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      </div>
    </DashboardShell>
  )
}