"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PrincipalNav } from "@/components/principal-nav"
import { DashboardShell } from "@/components/dashboard-shell"
import { UserNav } from "@/components/user-nav"
import { db } from "@/lib/firebase"
import { collection, getDocs, query, where, orderBy, type Timestamp, doc, getDoc } from "firebase/firestore"
import { useAuth } from "@/lib/auth-provider"
import { useRouter } from "next/navigation"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { FilterX, Search, Eye } from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"

interface Student {
  id: string
  name: string
  email: string
  classSectionId: string
  classSectionName: string
  srNo?: string
  rollNo?: string
}

interface FeePayment {
  id: string
  studentId: string
  studentName: string
  classSectionId: string
  classSectionName: string
  amount: number
  installmentNumber: number
  paymentDate: Timestamp
  createdAt: Timestamp
}

interface FeeStructure {
  id: string
  classSectionId: string
  classSectionName: string
  totalAmount: number
  installments: {
    number: number
    amount: number
    dueDate: string
  }[]
  academicYear: string
}

interface StudentWithPayments extends Student {
  payments: {
    [key: number]: FeePayment | null
  }
  feeStructure: FeeStructure | null
}

export default function PrincipalFees() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [students, setStudents] = useState<StudentWithPayments[]>([])
  const [allStudents, setAllStudents] = useState<StudentWithPayments[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [payments, setPayments] = useState<FeePayment[]>([])
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [academicYear, setAcademicYear] = useState(new Date().getFullYear().toString())

  useEffect(() => {
    if (!loading && (!user || user.role !== "principal")) {
      router.push("/login")
    }
  }, [user, loading, router])

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)

        // Fetch all fee structures
        const feeStructuresQuery = query(collection(db, "feeStructures"))
        const feeStructuresSnapshot = await getDocs(feeStructuresQuery)
        const feeStructuresData: FeeStructure[] = feeStructuresSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as FeeStructure[]
        setFeeStructures(feeStructuresData)

        // Fetch all students
        const studentsQuery = query(collection(db, "users"), where("role", "==", "student"))
        const studentsSnapshot = await getDocs(studentsQuery)

        const studentsData: Student[] = []

        for (const studentDoc of studentsSnapshot.docs) {
          const studentData = studentDoc.data()

          // Fetch class section name
          let classSectionName = "Unknown"
          if (studentData.classSectionId) {
            const classSectionDoc = await getDoc(doc(db, "classSections", studentData.classSectionId))
            if (classSectionDoc.exists()) {
              classSectionName = classSectionDoc.data().name
            }
          }

          studentsData.push({
            id: studentDoc.id,
            name: studentData.name || "Unknown",
            email: studentData.email || "",
            classSectionId: studentData.classSectionId || "",
            classSectionName,
            srNo: studentData.srNo || "",
            rollNo: studentData.rollNo || "",
          })
        }

        // Fetch all fee payments
        const paymentsQuery = query(collection(db, "feePayments"), orderBy("paymentDate", "desc"))
        const paymentsSnapshot = await getDocs(paymentsQuery)

        const paymentsData: FeePayment[] = paymentsSnapshot.docs.map(
          (doc) =>
            ({
              id: doc.id,
              ...doc.data(),
            }) as FeePayment,
        )

        setPayments(paymentsData)

        // Group payments by student and installment number
        const studentsWithPayments: StudentWithPayments[] = studentsData.map((student) => {
          const studentPayments = paymentsData.filter((payment) => payment.studentId === student.id)

          // Find fee structure for this student
          const feeStructure =
            feeStructuresData.find(
              (fs) => fs.classSectionId === student.classSectionId && fs.academicYear === academicYear,
            ) || null

          // Create a map of installment number to payment
          const paymentsByInstallment: { [key: number]: FeePayment | null } = {}

          // Initialize with all possible installments from fee structure
          if (feeStructure) {
            feeStructure.installments.forEach((inst) => {
              paymentsByInstallment[inst.number] = null
            })
          } else {
            // Fallback to 4 installments if no fee structure
            for (let i = 1; i <= 4; i++) {
              paymentsByInstallment[i] = null
            }
          }

          // Fill in actual payments
          studentPayments.forEach((payment) => {
            paymentsByInstallment[payment.installmentNumber] = payment
          })

          return {
            ...student,
            payments: paymentsByInstallment,
            feeStructure,
          }
        })

        // Sort by name
        const sortedStudents = studentsWithPayments.sort((a, b) => a.name.localeCompare(b.name))

        setStudents(sortedStudents)
        setAllStudents(sortedStudents)
        setIsLoading(false)
      } catch (error) {
        console.error("Error fetching data:", error)
        setIsLoading(false)
      }
    }

    if (user && user.role === "principal") {
      fetchData()
    }
  }, [user, academicYear])

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setStudents(allStudents)
      return
    }

    const filteredStudents = allStudents.filter(
      (student) =>
        student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.classSectionName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (student.srNo && student.srNo.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (student.rollNo && student.rollNo.toLowerCase().includes(searchQuery.toLowerCase())),
    )

    setStudents(filteredStudents)
  }, [searchQuery, allStudents])

  if (loading || !user || user.role !== "principal") {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  return (
    <DashboardShell sidebar={<PrincipalNav />} title="Fee Management">
      

      <div className="p-3 md:p-2 xl:p-0">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>Student Fee Records</CardTitle>
              <CardDescription>View all students fee installment records</CardDescription>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative w-full sm:w-[250px]">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search students..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              {searchQuery && (
                <Button variant="ghost" size="icon" onClick={() => setSearchQuery("")}>
                  <FilterX className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-24">
              <p>Loading fee records...</p>
            </div>
          ) : students.length === 0 ? (
            <div className="text-center py-6">
              <p>No student records found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sr No</TableHead>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Total Fee</TableHead>
                    <TableHead>Paid</TableHead>
                    <TableHead>Balance</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student, index) => {
                    // Calculate total fee and paid amount
                    const totalFee = student.feeStructure ? student.feeStructure.totalAmount : 0
                    const totalPaid = Object.values(student.payments)
                      .filter(Boolean)
                      .reduce((sum, payment) => sum + payment!.amount, 0)
                    const balance = totalFee - totalPaid

                    return (
                      <TableRow key={student.id}>
                        <TableCell>{student.srNo || index + 1}</TableCell>
                        <TableCell className="font-medium">{student.name}</TableCell>
                        <TableCell>{student.classSectionName}</TableCell>
                        <TableCell>₹{totalFee.toLocaleString()}</TableCell>
                        <TableCell>₹{totalPaid.toLocaleString()}</TableCell>
                        <TableCell>₹{balance.toLocaleString()}</TableCell>
                        <TableCell className="text-right">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm" className="cursor-pointer">
                                <Eye className="h-3.5 w-3.5 mr-1" />
                                View
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-h-screen overflow-y-scroll">
                              <DialogHeader>
                                <DialogTitle>Fee Details - {student.name}</DialogTitle>
                                <DialogDescription>
                                  {student.classSectionName} | {student.srNo ? `SR#: ${student.srNo}` : ""}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-2 py-2">
                                {student.feeStructure ? (
                                  <div className="grid gap-1">
                                    {student.feeStructure.installments.map((installment) => {
                                      const payment = student.payments[installment.number]
                                      return (
                                        <div key={installment.number} className="border rounded-md p-4">
                                          <h3 className="font-medium mb-2">Installment {installment.number}</h3>
                                          <div className="grid grid-cols-2 gap-2 text-sm">
                                            <div>
                                              <div className="text-muted-foreground">Amount</div>
                                              <div>₹{installment.amount.toLocaleString()}</div>
                                            </div>
                                            <div>
                                              <div className="text-muted-foreground">Due Date</div>
                                              <div>{format(new Date(installment.dueDate), "PPP")}</div>
                                            </div>
                                            <div>
                                              <div className="text-muted-foreground">Status</div>
                                              <div>{payment ? "Paid" : "Not Paid"}</div>
                                            </div>
                                            {payment && (
                                              <div>
                                                <div className="text-muted-foreground">Payment Date</div>
                                                <div>{format(payment.paymentDate.toDate(), "PPP")}</div>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      )
                                    })}
                                  </div>
                                ) : (
                                  <div className="text-center py-4">
                                    <p>No fee structure defined for this class section.</p>
                                  </div>
                                )}
                              </div>
                              <DialogFooter>
                                <DialogClose asChild>
                                  <Button variant="outline">Close</Button>
                                </DialogClose>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </DashboardShell>
  )
}
