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
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"
import { Timestamp, FieldValue } from "firebase/firestore"

interface FeePayment {
  id: string
  studentId: string
  studentName: string
  classSectionId: string
  classSectionName: string
  amount: number
  installmentNumber: number
  paymentMethod: string
  transactionId?: string
  remarks?: string
  paymentDate: Timestamp
  createdAt: Timestamp | FieldValue
  isPartialPayment?: boolean
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
  const { user } = useAuth()
  const [feePayments, setFeePayments] = useState<FeePayment[]>([])
  const [feeStructure, setFeeStructure] = useState<FeeStructure | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalPaid, setTotalPaid] = useState(0)
  const [totalDue, setTotalDue] = useState(0)
  const [customInstallments, setCustomInstallments] = useState<FeePayment[]>([])
  const [partialPayments, setPartialPayments] = useState<{ [key: number]: { paid: number; remaining: number } }>({})

  useEffect(() => {
    const fetchFeeData = async () => {
      if (!user) return

      try {
        setLoading(true)

        // Fetch the user's class section ID from Firestore
        let classSectionId = null
        const userDoc = await getDoc(doc(db, "users", user.uid))
        if (userDoc.exists()) {
          classSectionId = userDoc.data().classSectionId
        }

        // Fetch fee structure for student's class
        let studentFeeStructure = null
        if (classSectionId) {
          const feeStructuresQuery = query(
            collection(db, "feeStructures"),
            where("classSectionId", "==", classSectionId),
          )
          const feeStructuresSnapshot = await getDocs(feeStructuresQuery)

          if (!feeStructuresSnapshot.empty) {
            const feeStructureData = feeStructuresSnapshot.docs
              .map((doc) => ({ id: doc.id, ...doc.data() }) as FeeStructure)
              .sort((a, b) => b.academicYear.localeCompare(a.academicYear))[0]
            studentFeeStructure = feeStructureData
            setFeeStructure(feeStructureData)
          }
        }

        // Fetch actual fee payments from the database
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
            paymentMethod: data.paymentMethod || "Cash",
            transactionId: data.transactionId,
            remarks: data.remarks,
            paymentDate: data.paymentDate,
            createdAt: data.createdAt,
            isPartialPayment: data.isPartialPayment,
          })
        })

        payments.sort((a, b) => a.installmentNumber - b.installmentNumber)
        setFeePayments(payments)

        const paid = payments.reduce((sum, payment) => sum + payment.amount, 0)
        setTotalPaid(paid)

        const partialPaymentsData: { [key: number]: { paid: number; remaining: number } } = {}
        if (studentFeeStructure) {
          const paymentsByInstallment: { [key: number]: FeePayment[] } = {}
          payments.forEach((payment) => {
            if (!paymentsByInstallment[payment.installmentNumber]) {
              paymentsByInstallment[payment.installmentNumber] = []
            }
            paymentsByInstallment[payment.installmentNumber].push(payment)
          })

          studentFeeStructure.installments.forEach((installment) => {
            const installmentPayments = paymentsByInstallment[installment.number] || []
            const paidAmount = installmentPayments.reduce((sum, payment) => sum + payment.amount, 0)
            const remainingAmount = Math.max(0, installment.amount - paidAmount)
            partialPaymentsData[installment.number] = { paid: paidAmount, remaining: remainingAmount }
          })
          setPartialPayments(partialPaymentsData)
        }

        if (studentFeeStructure) {
          setTotalDue(studentFeeStructure.totalAmount - paid)
          if (studentFeeStructure.installments) {
            const maxRegularInstallment = Math.max(...studentFeeStructure.installments.map((i) => i.number))
            const customPayments = payments.filter((p) => p.installmentNumber > maxRegularInstallment)
            setCustomInstallments(customPayments)
          }
        } else {
          const TOTAL_FEE = 40000
          setTotalDue(TOTAL_FEE - paid)
          setCustomInstallments(payments)
        }
      } catch (error) {
        console.error("Error fetching fee data:", error)
        setError("Failed to load fee payment data. Please try again later.")
        toast.error("Failed to load fee payment data. Please try again later.", { description: "Error" })
      } finally {
        setLoading(false)
      }
    }

    fetchFeeData()
  }, [user])

  const getInstallmentPayments = (installmentNumber: number) => {
    return feePayments.filter((payment) => payment.installmentNumber === installmentNumber)
  }

  const isInstallmentPaid = (installmentNumber: number) => {
    const payments = getInstallmentPayments(installmentNumber)
    if (!payments.length) return false
    if (feeStructure) {
      const installment = feeStructure.installments.find((i) => i.number === installmentNumber)
      if (installment) {
        const paidAmount = payments.reduce((sum, payment) => sum + payment.amount, 0)
        return paidAmount >= installment.amount
      }
    }
    return true
  }

  const isInstallmentPartiallyPaid = (installmentNumber: number) => {
    const payments = getInstallmentPayments(installmentNumber)
    if (!payments.length) return false
    if (feeStructure) {
      const installment = feeStructure.installments.find((i) => i.number === installmentNumber)
      if (installment) {
        const paidAmount = payments.reduce((sum, payment) => sum + payment.amount, 0)
        return paidAmount > 0 && paidAmount < installment.amount
      }
    }
    return false
  }

  const getNextDueInstallment = () => {
    if (!feeStructure) return 1
    for (const installment of feeStructure.installments) {
      if (!isInstallmentPaid(installment.number)) {
        return installment.number
      }
    }
    return null
  }

  const getInstallmentDueDate = (installmentNumber: number) => {
    if (!feeStructure) return null
    const installment = feeStructure.installments.find((i) => i.number === installmentNumber)
    return installment ? new Date(installment.dueDate) : null
  }

  const getInstallmentAmount = (installmentNumber: number) => {
    if (!feeStructure) return 10000
    const installment = feeStructure.installments.find((i) => i.number === installmentNumber)
    return installment ? installment.amount : 10000
  }

  const getInstallmentPaidAmount = (installmentNumber: number) => {
    const payments = getInstallmentPayments(installmentNumber)
    return payments.reduce((sum, payment) => sum + payment.amount, 0)
  }

  const calculateProgressPercentage = () => {
    if (!feeStructure || feeStructure.totalAmount === 0) return 0
    return Math.min(100, Math.round((totalPaid / feeStructure.totalAmount) * 100))
  }

  const formatDate = (date: Date | Timestamp | null | undefined) => {
    if (!date) return "Not set"
    try {
      const dateObj = date instanceof Timestamp ? date.toDate() : date
      return format(dateObj, "PPP")
    } catch (error) {
      console.error("Date formatting error:", error)
      return "Invalid date"
    }
  }

  if (loading) {
    return (
      <DashboardShell sidebar={<StudentNav />} title="Fees">
        <div className="flex flex-col min-h-screen">
          <div className="flex-1 space-y-4 p-4 sm:p-6 md:p-8">
            <div className="flex items-center justify-between space-y-2">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Fees</h2>
            </div>
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
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
            <div className="grid gap-4 grid-cols-1">
              <Card>
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
    <DashboardShell sidebar={<StudentNav />} title="Fees">
      <div className="flex flex-col min-h-screen">
        <div className="flex-1 space-y-4 p-4 sm:p-6 md:p-8">
          <div className="flex items-center justify-between space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">My Fees</h2>
            
          </div>

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

          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold">₹{totalPaid.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Total amount paid across all installments</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Balance Due</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold">₹{totalDue.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Remaining amount to be paid</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Next Payment</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold">
                  {getNextDueInstallment() === null ? "All Paid" : `Installment ${getNextDueInstallment()}`}
                </div>
                <p className="text-xs text-muted-foreground">
                  {getNextDueInstallment() && getInstallmentDueDate(getNextDueInstallment()!)
                    ? `Due on ${formatDate(getInstallmentDueDate(getNextDueInstallment()!))}`
                    : getNextDueInstallment()
                    ? "Due date not set"
                    : "No pending payments"}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">Payment Progress</CardTitle>
              <CardDescription>{calculateProgressPercentage()}% of total fees paid</CardDescription>
            </CardHeader>
            <CardContent>
              <Progress value={calculateProgressPercentage()} className="h-2" />
            </CardContent>
          </Card>

          <div className="grid gap-4 grid-cols-1">
            <Card className="overflow-x-auto">
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">Fee Installments</CardTitle>
                <CardDescription>View your fee payment history and upcoming installments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[100px] text-xs sm:text-sm">Installment</TableHead>
                        <TableHead className="min-w-[120px] text-xs sm:text-sm">Expected Amount</TableHead>
                        <TableHead className="min-w-[120px] text-xs sm:text-sm">Paid Amount</TableHead>
                        <TableHead className="min-w-[100px] text-xs sm:text-sm">Due Date</TableHead>
                        <TableHead className="min-w-[120px] text-xs sm:text-sm">Payment Date</TableHead>
                        <TableHead className="min-w-[100px] text-xs sm:text-sm">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {feeStructure
                        ? feeStructure.installments.map((installment) => {
                            const payments = getInstallmentPayments(installment.number)
                            const isPaid = isInstallmentPaid(installment.number)
                            const isPartiallyPaid = isInstallmentPartiallyPaid(installment.number)
                            const paidAmount = payments.reduce((sum, payment) => sum + payment.amount, 0)
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
                                <TableCell className="font-medium text-xs sm:text-sm">
                                  Installment {installment.number}
                                </TableCell>
                                <TableCell className="text-xs sm:text-sm">
                                  ₹{installment.amount.toLocaleString()}
                                </TableCell>
                                <TableCell className="text-xs sm:text-sm">
                                  ₹{paidAmount.toLocaleString()}
                                </TableCell>
                                <TableCell className="text-xs sm:text-sm">
                                  {dueDate ? formatDate(dueDate) : "Not set"}
                                </TableCell>
                                <TableCell className="text-xs sm:text-sm">
                                  {payments.length > 0
                                    ? payments.map((p, idx) => (
                                        <div key={idx} className="text-xs sm:text-sm">
                                          {formatDate(p.paymentDate)}: ₹{p.amount.toLocaleString()}
                                        </div>
                                      ))
                                    : "-"}
                                </TableCell>
                                <TableCell>
                                  {isPaid ? (
                                    <Badge className="bg-green-500 hover:bg-green-600 flex items-center gap-1 text-xs sm:text-sm">
                                      <CheckCircle className="h-3 w-3" /> Paid
                                    </Badge>
                                  ) : isPartiallyPaid ? (
                                    <Badge
                                      variant="outline"
                                      className="bg-amber-100 text-amber-800 flex items-center gap-1 text-xs sm:text-sm"
                                    >
                                      <AlertCircle className="h-3 w-3" /> Partially Paid
                                    </Badge>
                                  ) : (
                                    <Badge variant="destructive" className="flex items-center gap-1 text-xs sm:text-sm">
                                      <XCircle className="h-3 w-3" /> Pending
                                    </Badge>
                                  )}
                                </TableCell>
                              </TableRow>
                            )
                          })
                        : [1, 2, 3, 4].map((installmentNumber) => {
                            const payments = getInstallmentPayments(installmentNumber)
                            const paidAmount = payments.reduce((sum, payment) => sum + payment.amount, 0)
                            const isPaid = paidAmount > 0

                            return (
                              <TableRow key={installmentNumber}>
                                <TableCell className="font-medium text-xs sm:text-sm">
                                  Installment {installmentNumber}
                                </TableCell>
                                <TableCell className="text-xs sm:text-sm">
                                  ₹{getInstallmentAmount(installmentNumber).toLocaleString()}
                                </TableCell>
                                <TableCell className="text-xs sm:text-sm">
                                  ₹{paidAmount.toLocaleString()}
                                </TableCell>
                                <TableCell className="text-xs sm:text-sm">Not set</TableCell>
                                <TableCell className="text-xs sm:text-sm">
                                  {payments.length > 0
                                    ? payments.map((p, idx) => (
                                        <div key={idx} className="text-xs sm:text-sm">
                                          {formatDate(p.paymentDate)}: ₹{p.amount.toLocaleString()}
                                        </div>
                                      ))
                                    : "-"}
                                </TableCell>
                                <TableCell>
                                  {isPaid ? (
                                    <Badge className="bg-green-500 hover:bg-green-600 flex items-center gap-1 text-xs sm:text-sm">
                                      <CheckCircle className="h-3 w-3" /> Paid
                                    </Badge>
                                  ) : (
                                    <Badge variant="destructive" className="flex items-center gap-1 text-xs sm:text-sm">
                                      <XCircle className="h-3 w-3" /> Pending
                                    </Badge>
                                  )}
                                </TableCell>
                              </TableRow>
                            )
                          })}

                      {customInstallments.length > 0 && (
                        <>
                          <TableRow>
                            <TableCell colSpan={6} className="bg-muted/50">
                              <div className="text-xs sm:text-sm font-medium py-1">Additional Installments</div>
                            </TableCell>
                          </TableRow>
                          {customInstallments.map((payment) => (
                            <TableRow key={`custom-${payment.id}`}>
                              <TableCell className="font-medium text-xs sm:text-sm">
                                Additional Installment {payment.installmentNumber}
                              </TableCell>
                              <TableCell className="text-xs sm:text-sm">-</TableCell>
                              <TableCell className="text-xs sm:text-sm">
                                ₹{payment.amount.toLocaleString()}
                              </TableCell>
                              <TableCell className="text-xs sm:text-sm">-</TableCell>
                              <TableCell className="text-xs sm:text-sm">{formatDate(payment.paymentDate)}</TableCell>
                              <TableCell>
                                <Badge className="bg-green-500 hover:bg-green-600 flex items-center gap-1 text-xs sm:text-sm">
                                  <CheckCircle className="h-3 w-3" /> Paid
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {feePayments.length > 0 && (
              <Card className="overflow-x-auto">
                <CardHeader>
                  <CardTitle className="text-base sm:text-lg">Payment History</CardTitle>
                  <CardDescription>Detailed record of all your fee payments</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="min-w-[100px] text-xs sm:text-sm">Date</TableHead>
                          <TableHead className="min-w-[120px] text-xs sm:text-sm">Installment</TableHead>
                          <TableHead className="min-w-[100px] text-xs sm:text-sm">Amount</TableHead>
                          <TableHead className="min-w-[100px] text-xs sm:text-sm">Method</TableHead>
                          <TableHead className="min-w-[120px] text-xs sm:text-sm">Transaction ID</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {feePayments.map((payment) => (
                          <TableRow key={payment.id}>
                            <TableCell className="text-xs sm:text-sm">{formatDate(payment.paymentDate)}</TableCell>
                            <TableCell className="text-xs sm:text-sm">
                              Installment {payment.installmentNumber}
                              {feeStructure && payment.installmentNumber > feeStructure.installments.length && (
                                <Badge variant="outline" className="ml-2 text-xs sm:text-sm">
                                  Additional
                                </Badge>
                              )}
                              {payment.isPartialPayment && (
                                <Badge
                                  variant="outline"
                                  className="ml-2 bg-amber-100 text-amber-800 text-xs sm:text-sm"
                                >
                                  Partial
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-xs sm:text-sm">
                              ₹{payment.amount.toLocaleString()}
                            </TableCell>
                            <TableCell className="capitalize text-xs sm:text-sm">{payment.paymentMethod}</TableCell>
                            <TableCell className="text-xs sm:text-sm">{payment.transactionId || "-"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardShell>
  )
}