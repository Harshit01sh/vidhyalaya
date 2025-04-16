"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { PrincipalNav } from "@/components/principal-nav"
import { DashboardShell } from "@/components/dashboard-shell"
import { UserNav } from "@/components/user-nav"
import { db } from "@/lib/firebase"
import { collection, getDocs, query, where } from "firebase/firestore"
import { useAuth } from "@/lib/auth-provider"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Eye, Search } from "lucide-react"

interface Admin {
  id: string
  name: string
  email: string
  phone: string
  photoURL?: string
}

export default function AdminsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [admins, setAdmins] = useState<Admin[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!loading && (!user || user.role !== "principal")) {
      router.push("/login")
    }
  }, [user, loading, router])

  useEffect(() => {
    const fetchAdmins = async () => {
      try {
        setIsLoading(true)
        const adminQuery = query(collection(db, "users"), where("role", "==", "admin"))
        const snapshot = await getDocs(adminQuery)

        const adminsList: Admin[] = []
        snapshot.forEach((doc) => {
          const data = doc.data()
          adminsList.push({
            id: doc.id,
            name: data.name || "Unknown",
            email: data.email || "",
            phone: data.phone || "",
            photoURL: data.photoURL,
          })
        })

        setAdmins(adminsList)
        setIsLoading(false)
      } catch (error) {
        console.error("Error fetching admins:", error)
        setIsLoading(false)
      }
    }

    if (user && user.role === "principal") {
      fetchAdmins()
    }
  }, [user])

  const filteredAdmins = admins.filter(
    (admin) =>
      admin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      admin.email.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  if (loading || !user || user.role !== "principal") {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  return (
    <DashboardShell sidebar={<PrincipalNav />} title="Principals">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold ml-3 md:ml-2 xl:ml-0">Admin</h1>
        <UserNav />
      </div>

      <div className="flex items-center justify-between mb-4 p-3 gap-3">
        <div className="relative w-80 xl:w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search admins..."
            className="w-full pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Link href="/principal/admins/new">
          <Button className="cursor-pointer">Add Admin</Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-8">Loading admins...</div>
      ) : filteredAdmins.length === 0 ? (
        <div className="p-3">
        <Card className="flex flex-col items-center justify-center p-8 text-center">
          <p className="mb-2 text-muted-foreground">No admins found</p>
          <p className="text-sm text-muted-foreground mb-4">
            {searchQuery ? "Try a different search term" : "Add a principal to get started"}
          </p>
          <Link href="/principal/admins/new">
            <Button className="cursor-pointer">Add Admin</Button>
          </Link>
        </Card>
        </div>
      ) : (
        <div className="grid gap-4 p-3 md:grid-cols-2 lg:grid-cols-2">
          {filteredAdmins.map((admin) => (
            <Card key={admin.id} className="p-4 bg-orange-200">
              <div className="flex items-center gap-1 sm:gap-0 xl:gap-4">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={admin.photoURL} alt={admin.name} />
                  <AvatarFallback>
                    {admin.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium leading-none">{admin.name}</p>
                  <p className="text-sm text-muted-foreground">{admin.email}</p>
                  {admin.phone && <p className="text-sm text-muted-foreground">{admin.phone}</p>}
                </div>
                <Link href={`/principal/admins/${admin.id}`}>
                  <Button variant="ghost" size="sm" className="cursor-pointer">
                    <Eye className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
          </div>
      )}
    </DashboardShell>
  )
}

