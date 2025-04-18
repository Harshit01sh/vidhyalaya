"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-provider"
import { db } from "@/lib/firebase"
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore"
import { format } from "date-fns"
import { DashboardShell } from "@/components/dashboard-shell"
import { StudentNav } from "@/components/student-nav"
import { UserNav } from "@/components/user-nav"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { DollarSign, Calendar, CheckCircle, XCircle, AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"

interface FeePayment {
  id: string
  studentId: string
  studentName: string
  classSectionId: string
  classSectionName: string
  amount: number
  installmentNumber: number
  paymentDate: Date
  createdAt: Date
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

export default function StudentFees() {
  const { user, loading: authLoading } = useAuth()
  const [feePayments, setFeePayments] = useState<FeePayment[]>([])
  const [feeStructure, setFeeStructure] = useState<FeeStructure | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalPaid, setTotalPaid] = useState(0)
  const [totalDue, setTotalDue] = useState(0)
  const [debugInfo, setDebugInfo] = useState<any>(null)

  // Hardcoded fallback values
  const TOTAL_FEE = 40000
  const INSTALLMENT_AMOUNT = 10000
  const INSTALLMENT_DUE_DATES = [
    new Date(2025, 5, 15), // June 15, 2025
    new Date(2025, 8, 15), // September 15, 2025
    new Date(2025, 11, 15), // December 15, 2025
    new Date(2026, 2, 15), // March 15, 2026
  ]

  useEffect(() => {
    const fetchFeeData = async () => {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)

        // Debug information
        const debug: any = {
          userId: user.uid,
          classSectionId: user.classSectionId || "No class section ID",
        }

        // Use classSectionId from user
        const classSectionId = user.classSectionId

        // Fetch fee structure for student's class
        let studentFeeStructure = null
        if (classSectionId) {
          const feeStructuresQuery = query(
            collection(db, "feeStructures"),
            where("classSectionId", "==", classSectionId)
          )

          const feeStructuresSnapshot = await getDocs(feeStructuresQuery)
          debug.feeStructuresFound = feeStructuresSnapshot.size

          if (!feeStructuresSnapshot.empty) {
            // Use the most recent fee structure
            const feeStructureData = feeStructuresSnapshot.docs
              .map((doc) => ({ id: doc.id, ...doc.data() }) as FeeStructure)
              .sort((a, b) => b.academicYear.localeCompare(a.academicYear))[0]

            studentFeeStructure = feeStructureData
            setFeeStructure(feeStructureData)
            debug.feeStructureFound = {
              id: feeStructureData.id,
              classSectionId: feeStructureData.classSectionId,
              classSectionName: feeStructureData.classSectionName,
              academicYear: feeStructureData.academicYear,
              totalAmount: feeStructureData.totalAmount,
              installmentsCount: feeStructureData.installments.length,
            }
          } else {
            // Log all fee structures for debugging
            const allFeeStructuresQuery = query(collection(db, "feeStructures"))
            const allFeeStructuresSnapshot = await getDocs(allFeeStructuresQuery)

            debug.allFeeStructures = allFeeStructuresSnapshot.docs.map((doc) => ({
              id: doc.id,
              classSectionId: doc.data().classSectionId,
              classSectionName: doc.data().classSectionName,
              academicYear: doc.data().academicYear,
            }))
          }
        }

        // Fetch actual fee payments
        const paymentsQuery = query(collection(db, "feePayments"), where("studentId", "==", user.uid))
        const querySnapshot = await getDocs(paymentsQuery)
        const payments: FeePayment[] = []

        querySnapshot.forEach((doc) => {
          const data = doc.data()
          payments.push({
            id: doc.id,
            studentId: data.studentId,
            studentName: data.studentName,
            classSectionId: data.classSectionId,
            classSectionName: data.classSectionName,
            amount: data.amount,
            installmentNumber: data.installmentNumber,
            paymentDate: data.paymentDate.toDate(),
            createdAt: data.createdAt.toDate(),
          })
        })

        debug.paymentsFound = payments.length

        // Sort payments by installmentNumber
        payments.sort((a, b) => a.installmentNumber - b.installmentNumber)
        setFeePayments(payments)

        // Calculate total paid
        const paid = payments.reduce((sum, payment) => sum + payment.amount, 0)
        setTotalPaid(paid)
        debug.totalPaid = paid

        // Calculate total due
        if (studentFeeStructure) {
          setTotalDue(studentFeeStructure.totalAmount - paid)
          debug.totalDue = studentFeeStructure.totalAmount - paid
        } else {
          setTotalDue(TOTAL_FEE - paid)
          debug.totalDue = TOTAL_FEE - paid
          debug.usingDefaultFee = true
        }

        setDebugInfo(debug)
      } catch (error) {
        console.error("Error fetching fee data:", error)
        setError("Failed to load fee payment data. Please try again later.")
        setDebugInfo({ error: String(error) })
      } finally {
        setLoading(false)
      }
    }

    if (!authLoading) {
      fetchFeeData()
    }
  }, [user, authLoading])

  // Helper function to get payment for a specific installment
  const getInstallmentPayment = (installmentNumber: number) => {
    return feePayments.find((payment) => payment.installmentNumber === installmentNumber)
  }

  // Check if an installment is paid
  const isInstallmentPaid = (installmentNumber: number) => {
    return !!getInstallmentPayment(installmentNumber)
  }

  // Get the next due installment
  const getNextDueInstallment = () => {
    if (!feeStructure) {
      for (let i = 1; i <= 4; i++) {
        if (!isInstallmentPaid(i)) {
          return i
        }
      }
      return null // All paid
    }

    for (const installment of feeStructure.installments) {
      if (!isInstallmentPaid(installment.number)) {
        return installment.number
      }
    }
    return null // All paid
  }

  // Get due date for an installment
  const getInstallmentDueDate = (installmentNumber: number) => {
    if (!feeStructure) {
      return INSTALLMENT_DUE_DATES[installmentNumber - 1]
    }

    const installment = feeStructure.installments.find((i) => i.number === installmentNumber)
    try {
      return installment ? new Date(installment.dueDate) : INSTALLMENT_DUE_DATES[installmentNumber - 1]
    } catch (e) {
      console.error("Invalid date format:", installment?.dueDate)
      return INSTALLMENT_DUE_DATES[installmentNumber - 1]
    }
  }

  // Get amount for an installment
  const getInstallmentAmount = (installmentNumber: number) => {
    if (!feeStructure) {
      return INSTALLMENT_AMOUNT
    }

    const installment = feeStructure.installments.find((i) => i.number === installmentNumber)
    return installment ? installment.amount : INSTALLMENT_AMOUNT
  }

  // Format date safely
  const formatDate = (date: Date | null | undefined) => {
    if (!date) return "Not set"
    try {
      return format(date, "PPP")
    } catch (error) {
      console.error("Date formatting error:", error)
      return "Invalid date"
    }
  }

  if (loading || authLoading) {
    return (
      <DashboardShell sidebar={<StudentNav />} title="My Fees">
        <div className="flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold ml-3 md:ml-2 xl:ml-0">My Fees</h1>
            
          </div>
          <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      <Skeleton className="h-4 w-24" />
                    </CardTitle>
                    <Skeleton className="h-4 w-4 rounded-full" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-8 w-28 mb-1" />
                    <Skeleton className="h-3 w-40" />
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="grid gap-4 md:grid-cols-1">
              <Card className="col-span-1">
                <CardHeader>
                  <CardTitle>
                    <Skeleton className="h-6 w-40" />
                  </CardTitle>
                  <CardDescription>
                    <Skeleton className="h-4 w-64" />
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-64 w-full" />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell sidebar={<StudentNav />} title="My Fees">
      <div className="flex flex-col">
        
        <div className="flex-1 space-y-4 p-8 pt-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!feeStructure && !error && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Fee Structure Not Found</AlertTitle>
              <AlertDescription>
                No fee structure has been defined for your class. Please contact the administration.
              </AlertDescription>
            </Alert>
          )}

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹{totalPaid.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Total amount paid across all installments</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Balance Due</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹{totalDue.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Remaining amount to be paid</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Next Payment</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {getNextDueInstallment() === 1
                    ? "1st Installment"
                    : getNextDueInstallment() === 2
                    ? "2nd Installment"
                    : getNextDueInstallment() === 3
                    ? "3rd Installment"
                    : getNextDueInstallment() === 4
                    ? "4th Installment"
                    : "All Paid"}
                </div>
                <p className="text-xs text-muted-foreground">
                  {getNextDueInstallment()
                    ? `Due on ${formatDate(getInstallmentDueDate(getNextDueInstallment()!))}`
                    : "No pending payments"}
                </p>
              </CardContent>
            </Card>
          </div>
          <div className="grid gap-4 md:grid-cols-1">
            <Card className="col-span-1 overflow-x-scroll">
              <CardHeader>
                <CardTitle>Fee Installments</CardTitle>
                <CardDescription>View your fee payment history and upcoming installments</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Installment</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Payment Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {feeStructure
                      ? feeStructure.installments.map((installment) => {
                          const payment = getInstallmentPayment(installment.number)
                          const isPaid = !!payment
                          let dueDate: Date | null = null

                          try {
                            dueDate = new Date(installment.dueDate)
                            if (isNaN(dueDate.getTime())) {
                              dueDate = null
                            }
                          } catch (e) {
                            console.error("Invalid date format:", installment.dueDate)
                          }

                          return (
                            <TableRow key={installment.number}>
                              <TableCell className="font-medium">
                                {installment.number === 1
                                  ? "1st"
                                  : installment.number === 2
                                  ? "2nd"
                                  : installment.number === 3
                                  ? "3rd"
                                  : "4th"}{" "}
                                Installment
                              </TableCell>
                              <TableCell>₹{installment.amount.toLocaleString()}</TableCell>
                              <TableCell>{dueDate ? formatDate(dueDate) : "Not set"}</TableCell>
                              <TableCell>{isPaid ? formatDate(payment.paymentDate) : "-"}</TableCell>
                              <TableCell>
                                {isPaid ? (
                                  <Badge className="bg-green-500 hover:bg-green-600 flex items-center gap-1">
                                    <CheckCircle className="h-3 w-3" /> Paid
                                  </Badge>
                                ) : (
                                  <Badge variant="destructive" className="flex items-center gap-1">
                                    <XCircle className="h-3 w-3" /> Pending
                                  </Badge>
                                )}
                              </TableCell>
                            </TableRow>
                          )
                        })
                      : [1, 2, 3, 4].map((installmentNumber) => {
                          const payment = getInstallmentPayment(installmentNumber)
                          const isPaid = !!payment

                          return (
                            <TableRow key={installmentNumber}>
                              <TableCell className="font-medium">
                                {installmentNumber === 1
                                  ? "1st"
                                  : installmentNumber === 2
                                  ? "2nd"
                                  : installmentNumber === 3
                                  ? "3rd"
                                  : "4th"}{" "}
                                Installment
                              </TableCell>
                              <TableCell>₹{getInstallmentAmount(installmentNumber).toLocaleString()}</TableCell>
                              <TableCell>{formatDate(INSTALLMENT_DUE_DATES[installmentNumber - 1])}</TableCell>
                              <TableCell>{isPaid ? formatDate(payment.paymentDate) : "-"}</TableCell>
                              <TableCell>
                                {isPaid ? (
                                  <Badge className="bg-green-500 hover:bg-green-600 flex items-center gap-1">
                                    <CheckCircle className="h-3 w-3" /> Paid
                                  </Badge>
                                ) : (
                                  <Badge variant="destructive" className="flex items-center gap-1">
                                    <XCircle className="h-3 w-3" /> Pending
                                  </Badge>
                                )}
                              </TableCell>
                            </TableRow>
                          )
                        })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {feePayments.length > 0 && (
              <Card className="col-span-1 overflow-x-scroll">
                <CardHeader>
                  <CardTitle>Payment History</CardTitle>
                  <CardDescription>Detailed record of all your fee payments</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Installment</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Receipt ID</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {feePayments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell>{formatDate(payment.paymentDate)}</TableCell>
                          <TableCell>
                            {payment.installmentNumber === 1
                              ? "1st"
                              : payment.installmentNumber === 2
                              ? "2nd"
                              : payment.installmentNumber === 3
                              ? "3rd"
                              : "4th"}{" "}
                            Installment
                          </TableCell>
                          <TableCell>₹{payment.amount.toLocaleString()}</TableCell>
                          <TableCell className="font-mono text-xs">{payment.id.substring(0, 8)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardShell>
  )
}