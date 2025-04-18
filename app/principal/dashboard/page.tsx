"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PrincipalNav } from "@/components/principal-nav"
import { DashboardShell } from "@/components/dashboard-shell"
import { UserNav } from "@/components/user-nav"
import { db } from "@/lib/firebase"
import { collection, getDocs, orderBy, query, where } from "firebase/firestore"
import { Users, GraduationCap, Calendar, Bell, PanelsTopLeft, ShieldUser } from "lucide-react"
import { useAuth } from "@/lib/auth-provider"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { BarChart, Bar, Rectangle, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format } from "date-fns"

interface AttendanceSession {
  id: string
  date: Date
  classSectionId: string
  classSectionName: string
  teacherId: string
  teacherName?: string
  presentCount: number
  absentCount: number
}

interface AttendanceStats {
  classSectionId: string
  classSectionName: string
  totalSessions: number
  averageAttendance: number
  lastUpdated: Date | null
}

export default function PrincipalDashboard() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [attendanceSessions, setAttendanceSessions] = useState<AttendanceSession[]>([])
  const [attendanceStats, setAttendanceStats] = useState<AttendanceStats[]>([])
  const [monthlyFeeData, setMonthlyFeeData] = useState<{ month: string; amount: number }[]>([])
  const [todayAttendanceData, setTodayAttendanceData] = useState<
    { name: string; present: number; absent: number }[]
  >([])
  const [stats, setStats] = useState({
    teachers: 0,
    students: 0,
    admins: 0,
    announcements: 0,
  })

  useEffect(() => {
    if (!loading && (!user || user.role !== "principal")) {
      router.push("/login")
    }
  }, [user, loading, router])

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const teacherQuery = query(collection(db, "users"), where("role", "==", "teacher"))
        const studentQuery = query(collection(db, "users"), where("role", "==", "student"))
        const adminQuery = query(collection(db, "users"), where("role", "==", "admin"))
        const announcementQuery = query(collection(db, "announcements"))

        const [teacherSnapshot, studentSnapshot, adminSnapshot, announcementSnapshot] = await Promise.all([
          getDocs(teacherQuery),
          getDocs(studentQuery),
          getDocs(adminQuery),
          getDocs(announcementQuery),
        ])

        setStats({
          teachers: teacherSnapshot.size,
          students: studentSnapshot.size,
          admins: adminSnapshot.size,
          announcements: announcementSnapshot.size,
        })
      } catch (error) {
        console.error("Error fetching stats:", error)
      }
    }

    if (user && user.role === "principal") {
      fetchStats()
    }
  }, [user])

  useEffect(() => {
    const fetchAttendanceSessions = async () => {
      try {
        setIsLoading(true)
        const sessionsQuery = query(collection(db, "attendanceSessions"))
        const snapshot = await getDocs(sessionsQuery)

        const sessions: AttendanceSession[] = []
        snapshot.forEach((doc) => {
          const data = doc.data()
          sessions.push({
            id: doc.id,
            date: data.date.toDate(),
            classSectionId: data.classSectionId,
            classSectionName: data.classSectionName,
            teacherId: data.teacherId,
            teacherName: data.teacherName,
            presentCount: data.presentCount,
            absentCount: data.absentCount,
          })
        })

        // Sort by date (newest first)
        sessions.sort((a, b) => b.date.getTime() - a.date.getTime())
        setAttendanceSessions(sessions)

        // Calculate attendance stats by class
        const stats: Record<string, AttendanceStats> = {}
        sessions.forEach((session) => {
          if (!stats[session.classSectionId]) {
            stats[session.classSectionId] = {
              classSectionId: session.classSectionId,
              classSectionName: session.classSectionName,
              totalSessions: 0,
              averageAttendance: 0,
              lastUpdated: null,
            }
          }

          const classStats = stats[session.classSectionId]
          classStats.totalSessions += 1

          const total = session.presentCount + session.absentCount
          const percentage = total > 0 ? (session.presentCount / total) * 100 : 0

          classStats.averageAttendance =
            (classStats.averageAttendance * (classStats.totalSessions - 1) + percentage) / classStats.totalSessions

          if (!classStats.lastUpdated || session.date > classStats.lastUpdated) {
            classStats.lastUpdated = session.date
          }
        })

        setAttendanceStats(Object.values(stats))

        // Prepare data for today's attendance chart by classSectionName
        const today = new Date()
        const todaySessions = sessions.filter(
          (session) =>
            session.date.getDate() === today.getDate() &&
            session.date.getMonth() === today.getMonth() &&
            session.date.getFullYear() === today.getFullYear()
        )

        // Group by classSectionName
        const classAttendanceMap: Record<
          string,
          { name: string; present: number; absent: number }
        > = {}

        todaySessions.forEach((session) => {
          if (!classAttendanceMap[session.classSectionId]) {
            classAttendanceMap[session.classSectionId] = {
              name: session.classSectionName,
              present: 0,
              absent: 0,
            }
          }
          classAttendanceMap[session.classSectionId].present += session.presentCount
          classAttendanceMap[session.classSectionId].absent += session.absentCount
        })

        // Convert to array and sort by classSectionName for consistent display
        const chartData = Object.values(classAttendanceMap).sort((a, b) =>
          a.name.localeCompare(b.name)
        )

        setTodayAttendanceData(chartData)

        setIsLoading(false)
      } catch (error) {
        console.error("Error fetching attendance sessions:", error)
        setIsLoading(false)
      }
    }

    const fetchFeeData = async () => {
      try {
        // Fetch all fee payments
        const paymentsQuery = query(collection(db, "feePayments"), orderBy("paymentDate", "desc"))
        const paymentsSnapshot = await getDocs(paymentsQuery)

        const paymentsData = paymentsSnapshot.docs.map((doc) => doc.data())

        // Prepare monthly data
        const monthlyPayments: Record<string, number> = {}

        paymentsData.forEach((payment) => {
          const date = payment.paymentDate.toDate()
          const month = format(date, "MMM yyyy")

          if (!monthlyPayments[month]) {
            monthlyPayments[month] = 0
          }

          monthlyPayments[month] += payment.amount
        })

        const monthlyChartData = Object.entries(monthlyPayments)
          .map(([month, amount]) => ({
            month,
            amount,
          }))
          .sort((a, b) => {
            // Sort by date
            const dateA = new Date(a.month)
            const dateB = new Date(b.month)
            return dateA.getTime() - dateB.getTime()
          })
          .slice(-6) // Get last 6 months

        setMonthlyFeeData(monthlyChartData)
      } catch (error) {
        console.error("Error fetching fee data:", error)
      }
    }

    if (user && user.role === "principal") {
      fetchAttendanceSessions()
      fetchFeeData()
    }
  }, [user])

  if (loading || !user || user.role !== "principal") {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  return (
    <DashboardShell sidebar={<PrincipalNav />} title="Principal Dashboard">
      

      <Tabs defaultValue="overview" className="space-y-4 p-3">
        <TabsList className="cursor-pointer">
          <TabsTrigger value="overview" className="cursor-pointer">Overview</TabsTrigger>
          <TabsTrigger value="fees" className="cursor-pointer">Finance</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="bg-orange-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Teachers</CardTitle>
                <GraduationCap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.teachers}</div>
                <p className="text-xs text-muted-foreground">Faculty members</p>
              </CardContent>
            </Card>
            <Card className="bg-blue-50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.students}</div>
                <p className="text-xs text-muted-foreground">Enrolled students</p>
              </CardContent>
            </Card>
            <Card className="bg-purple-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Admins</CardTitle>
                <ShieldUser className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.admins}</div>
                <p className="text-xs text-muted-foreground">Admins members</p>
              </CardContent>
            </Card>
            <Card className="bg-green-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Announcements</CardTitle>
                <Bell className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.announcements}</div>
                <p className="text-xs text-muted-foreground">Active announcements</p>
              </CardContent>
            </Card>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4 bg-blue-50">
              <CardHeader>
                <CardTitle>Today's Attendance</CardTitle>
                <CardDescription>Attendance by class for today</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <p className="text-sm text-muted-foreground">Loading attendance data...</p>
                ) : todayAttendanceData.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No attendance data for today.</p>
                ) : (
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="90%" className="mt-6">
                      <BarChart width={500} height={300} data={todayAttendanceData} barSize={20}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ddd" />
                        <XAxis
                          dataKey="name"
                          axisLine={false}
                          tick={{ fill: "#d1d5db" }}
                          tickLine={false}
                          interval={0}
                          height={60}
                          tickFormatter={(value) => value}
                          angle={-45}
                          textAnchor="end"
                        />
                        <YAxis axisLine={false} />
                        <Tooltip />
                        <Legend />
                        <Bar
                          dataKey="present"
                          fill="#8884d8"
                          activeBar={<Rectangle fill="pink" stroke="blue" />}
                        />
                        <Bar
                          dataKey="absent"
                          fill="#82ca9d"
                          activeBar={<Rectangle fill="gold" stroke="purple" />}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
            <Card className="col-span-3 bg-orange-200">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Manage your school</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 gap-10"> 
                <Link href="/principal/teachers/new">
                  <Button className="w-full cursor-pointer">Add New Teacher</Button>
                </Link>
                <Link href="/principal/student/new">
                  <Button variant="outline" className="w-full cursor-pointer">
                    Add New Student
                  </Button>
                </Link>
                <Link href="/principal/announcements">
                  <Button variant="outline" className="w-full cursor-pointer">
                    Create Announcement
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="fees">
          <Card>
            <CardHeader>
              <CardTitle>Fee Collection Overview</CardTitle>
              <CardDescription>Monthly fee collection data</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center items-center h-[400px]">
                  <p>Loading fee data...</p>
                </div>
              ) : (
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyFeeData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`₹${value}`, "Collection Amount"]} />
                      <Legend />
                      <Bar dataKey="amount" name="Fee Collection" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
              <div className="mt-6">
                <Link href="/principal/fees">
                  <Button>View Fee Records</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardShell>
  )
}