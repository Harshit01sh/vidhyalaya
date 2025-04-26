"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  addDoc,
  serverTimestamp,
  Timestamp,
  updateDoc,
  FieldValue,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/lib/auth-provider"
import { DashboardShell } from "@/components/dashboard-shell"
import { AdminNav } from "@/components/admin-nav"
import { UserNav } from "@/components/user-nav"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { format } from "date-fns"
import { ArrowLeft, Search, Plus, CheckCircle, XCircle, Loader2, AlertCircle } from "lucide-react"

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

export default function CollectFeesPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const studentIdParam = searchParams.get("student")

  const [loading, setLoading] = useState(true)
  const [students, setStudents] = useState<Student[]>([])
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [feeStructure, setFeeStructure] = useState<FeeStructure | null>(null)
  const [payments, setPayments] = useState<FeePayment[]>([])
  const [totalPaid, setTotalPaid] = useState(0)
  const [totalFee, setTotalFee] = useState(0)
  const [remainingAmount, setRemainingAmount] = useState(0)
  const [partialPayments, setPartialPayments] = useState<{ [key: number]: { paid: number; remaining: number } }>({})

  // Form state for new payment
  const [installmentNumber, setInstallmentNumber] = useState<string>("1")
  const [amount, setAmount] = useState("")
  const [paymentDate, setPaymentDate] = useState(format(new Date(), "yyyy-MM-dd"))
  const [paymentMethod, setPaymentMethod] = useState("cash")
  const [transactionId, setTransactionId] = useState("")
  const [remarks, setRemarks] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [nextInstallmentNumber, setNextInstallmentNumber] = useState(1)
  const [isPartialPayment, setIsPartialPayment] = useState(false)

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "admin")) {
      router.push("/login")
    }
  }, [user, authLoading, router])

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true)
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

        // Sort by name
        const sortedStudents = studentsData.sort((a, b) => a.name.localeCompare(b.name))
        setStudents(sortedStudents)

        // If student ID is provided in URL params, select that student
        if (studentIdParam) {
          const student = sortedStudents.find((s) => s.id === studentIdParam)
          if (student) {
            setSelectedStudent(student)
          }
        }

        setLoading(false)
      } catch (error) {
        console.error("Error fetching students:", error)
        toast.error("Failed to fetch students. Please try again.", {
          description: "Error",
        })
        setLoading(false)
      }
    }

    if (user && user.role === "admin") {
      fetchStudents()
    }
  }, [user, studentIdParam])

  useEffect(() => {
    const fetchStudentFeeDetails = async () => {
      if (!selectedStudent) {
        setFeeStructure(null)
        setPayments([])
        setTotalPaid(0)
        setTotalFee(0)
        setRemainingAmount(0)
        setNextInstallmentNumber(1)
        setPartialPayments({})
        return
      }

      try {
        setLoading(true)

        // Fetch fee structure for the student's class
        const feeStructuresQuery = query(
          collection(db, "feeStructures"),
          where("classSectionId", "==", selectedStudent.classSectionId),
        )
        const feeStructuresSnapshot = await getDocs(feeStructuresQuery)

        let studentFeeStructure = null
        if (!feeStructuresSnapshot.empty) {
          // Use the most recent fee structure
          const feeStructureData = feeStructuresSnapshot.docs
            .map((doc) => ({ id: doc.id, ...doc.data() }) as FeeStructure)
            .sort((a, b) => b.academicYear.localeCompare(a.academicYear))[0]

          studentFeeStructure = feeStructureData
          setFeeStructure(feeStructureData)
          setTotalFee(feeStructureData.totalAmount)
        }

        // Fetch fee payments for the student
        const paymentsQuery = query(collection(db, "feePayments"), where("studentId", "==", selectedStudent.id))
        const paymentsSnapshot = await getDocs(paymentsQuery)

        const paymentsData: FeePayment[] = paymentsSnapshot.docs.map(
          (doc) =>
            ({
              id: doc.id,
              ...doc.data(),
            }) as FeePayment,
        )

        // Sort payments by installment number and date
        paymentsData.sort((a, b) => {
          if (a.installmentNumber === b.installmentNumber) {
            return a.paymentDate.toMillis() - b.paymentDate.toMillis()
          }
          return a.installmentNumber - b.installmentNumber
        })

        setPayments(paymentsData)

        // Calculate total paid
        const paid = paymentsData.reduce((sum, payment) => sum + payment.amount, 0)
        setTotalPaid(paid)

        // Calculate remaining amount
        const remaining = studentFeeStructure ? studentFeeStructure.totalAmount - paid : 0
        setRemainingAmount(remaining)

        // Calculate partial payments for each installment
        const partialPaymentsData: { [key: number]: { paid: number; remaining: number } } = {}

        if (studentFeeStructure) {
          // Group payments by installment number
          const paymentsByInstallment: { [key: number]: FeePayment[] } = {}

          paymentsData.forEach((payment) => {
            if (!paymentsByInstallment[payment.installmentNumber]) {
              paymentsByInstallment[payment.installmentNumber] = []
            }
            paymentsByInstallment[payment.installmentNumber].push(payment)
          })

          // Calculate partial payments
          studentFeeStructure.installments.forEach((installment) => {
            const installmentPayments = paymentsByInstallment[installment.number] || []
            const paidAmount = installmentPayments.reduce((sum, payment) => sum + payment.amount, 0)
            const remainingAmount = Math.max(0, installment.amount - paidAmount)

            partialPaymentsData[installment.number] = {
              paid: paidAmount,
              remaining: remainingAmount,
            }
          })

          setPartialPayments(partialPaymentsData)
        }

        // Determine next installment number
        const maxInstallmentNumber =
          paymentsData.length > 0 ? Math.max(...paymentsData.map((p) => p.installmentNumber)) : 0
        setNextInstallmentNumber(maxInstallmentNumber + 1)

        // Set default values for the form
        if (studentFeeStructure) {
          // Find the next unpaid or partially paid installment
          let nextUnpaidInstallment = null

          for (const inst of studentFeeStructure.installments) {
            const partialPayment = partialPaymentsData[inst.number]
            if (partialPayment && partialPayment.remaining > 0) {
              nextUnpaidInstallment = inst
              break
            } else if (!partialPayment) {
              nextUnpaidInstallment = inst
              break
            }
          }

          if (nextUnpaidInstallment) {
            setInstallmentNumber(nextUnpaidInstallment.number.toString())

            // If it's a partial payment, set the remaining amount
            const partialPayment = partialPaymentsData[nextUnpaidInstallment.number]
            if (partialPayment && partialPayment.remaining > 0) {
              setAmount(partialPayment.remaining.toString())
              setIsPartialPayment(true)
            } else {
              setAmount(nextUnpaidInstallment.amount.toString())
              setIsPartialPayment(false)
            }
          } else {
            // All installments paid, set up for a custom installment
            setInstallmentNumber(nextInstallmentNumber.toString())
            setAmount(remaining > 0 ? remaining.toString() : "")
            setIsPartialPayment(false)
          }
        }

        setLoading(false)
      } catch (error) {
        console.error("Error fetching student fee details:", error)
        toast.error("Failed to fetch fee details. Please try again.", {
          description: "Error",
        })
        setLoading(false)
      }
    }

    fetchStudentFeeDetails()
  }, [selectedStudent])

  const handleStudentSelect = (studentId: string) => {
    const student = students.find((s) => s.id === studentId)
    if (student) {
      setSelectedStudent(student)
    }
  }

  const handleAddPayment = async () => {
    if (!selectedStudent || !installmentNumber || !amount || !paymentDate || !paymentMethod) {
      toast.error("Please fill in all required fields", {
        description: "Missing information",
      })
      return
    }

    try {
      setIsSubmitting(true)

      // Get student details
      const student = selectedStudent
      if (!student) {
        throw new Error("Student not found")
      }

      const installmentNum = Number.parseInt(installmentNumber)
      const paymentAmount = Number.parseFloat(amount)

      // Check if this is a partial payment
      let isPartial = false
      let remainingForNextInstallment = 0

      if (feeStructure) {
        const installment = feeStructure.installments.find((i) => i.number === installmentNum)
        if (installment) {
          const partialPayment = partialPayments[installmentNum]
          const expectedAmount = partialPayment ? partialPayment.remaining : installment.amount

          if (paymentAmount < expectedAmount) {
            isPartial = true
            remainingForNextInstallment = expectedAmount - paymentAmount
          }
        }
      }

      // Create payment record
      const paymentData = {
        studentId: student.id,
        studentName: student.name,
        classSectionId: student.classSectionId,
        classSectionName: student.classSectionName,
        amount: paymentAmount,
        installmentNumber: installmentNum,
        paymentMethod,
        transactionId: transactionId || null,
        remarks: remarks || null,
        paymentDate: Timestamp.fromDate(new Date(paymentDate)),
        createdAt: serverTimestamp(),
        isPartialPayment: isPartial,
      }

      const docRef = await addDoc(collection(db, "feePayments"), paymentData)

      // Add id to the payment data
      const newPayment = {
        id: docRef.id,
        ...paymentData,
      } as FeePayment

      // Update state
      setPayments([...payments, newPayment])
      setTotalPaid(totalPaid + paymentAmount)
      setRemainingAmount(Math.max(0, remainingAmount - paymentAmount))

      // Update partial payments state
      if (isPartial) {
        const updatedPartialPayments = { ...partialPayments }

        // Update current installment
        if (updatedPartialPayments[installmentNum]) {
          updatedPartialPayments[installmentNum] = {
            paid: updatedPartialPayments[installmentNum].paid + paymentAmount,
            remaining: remainingForNextInstallment,
          }
        } else {
          const installment = feeStructure?.installments.find((i) => i.number === installmentNum)
          if (installment) {
            updatedPartialPayments[installmentNum] = {
              paid: paymentAmount,
              remaining: installment.amount - paymentAmount,
            }
          }
        }

        setPartialPayments(updatedPartialPayments)

        // Add a note about the partial payment
        const partialPaymentNote = `This is a partial payment for installment ${installmentNum}. Remaining amount: ₹${remainingForNextInstallment} will be added to the next installment.`

        // Update the payment record with the note
        await updateDoc(doc(db, "feePayments", docRef.id), {
          remarks: remarks ? `${remarks}\n${partialPaymentNote}` : partialPaymentNote,
        })

        toast.success(
          `Recorded partial payment of ₹${paymentAmount.toLocaleString()} for installment ${installmentNum}. Remaining ₹${remainingForNextInstallment.toLocaleString()} will be added to the next installment.`,
          {
            description: "Partial payment recorded",
          },
        )
      } else {
        toast.success(`Successfully recorded payment of ₹${paymentAmount.toLocaleString()} for ${student.name}`, {
          description: "Payment recorded",
        })
      }

      // Update next installment number
      setNextInstallmentNumber(Math.max(nextInstallmentNumber, installmentNum + 1))

      // Reset form for next payment
      // If there was a partial payment, set up for the next installment
      if (isPartial && feeStructure) {
        const nextInstNum = installmentNum + 1
        const nextInstallment = feeStructure.installments.find((i) => i.number === nextInstNum)

        if (nextInstallment) {
          setInstallmentNumber(nextInstNum.toString())
          setAmount((nextInstallment.amount + remainingForNextInstallment).toString())
          setRemarks(`Includes ₹${remainingForNextInstallment} remaining from installment ${installmentNum}`)
        } else {
          // No next installment in structure, create a custom one
          setInstallmentNumber(nextInstNum.toString())
          setAmount(remainingForNextInstallment.toString())
          setRemarks(`Remaining amount from installment ${installmentNum}`)
        }
      } else {
        // Regular payment, reset form
        setInstallmentNumber(nextInstallmentNumber.toString())
        setAmount("")
        setRemarks("")
      }

      setTransactionId("")
      setIsPartialPayment(false)
    } catch (error) {
      console.error("Error adding payment:", error)
      toast.error("Failed to record payment. Please try again.", {
        description: "Error",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInstallmentChange = (value: string) => {
    setInstallmentNumber(value)
    const installmentNum = Number.parseInt(value)

    if (feeStructure) {
      const installment = feeStructure.installments.find((i) => i.number === installmentNum)
      if (installment) {
        // Check if there are partial payments for this installment
        const partialPayment = partialPayments[installmentNum]
        if (partialPayment && partialPayment.remaining > 0) {
          setAmount(partialPayment.remaining.toString())
          setIsPartialPayment(true)
          setRemarks(`Remaining payment for installment ${installmentNum}`)
        } else if (!partialPayment) {
          setAmount(installment.amount.toString())
          setIsPartialPayment(false)
          setRemarks("")
        } else {
          // Installment is fully paid
          setAmount("0")
          setIsPartialPayment(false)
          setRemarks("This installment is already fully paid")
        }
      } else {
        // Custom installment
        setAmount("")
        setIsPartialPayment(false)
        setRemarks("")
      }
    }
  }

  const filteredStudents = searchQuery
    ? students.filter(
        (student) =>
          student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          student.classSectionName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (student.srNo && student.srNo.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (student.rollNo && student.rollNo.toLowerCase().includes(searchQuery.toLowerCase())),
      )
    : students

  if (authLoading || !user || user.role !== "admin") {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  return (
    <DashboardShell sidebar={<AdminNav />} title="Collect Fees">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2 ml-3 md:ml-2 xl:ml-0">
          <Button variant="outline" size="icon" className="cursor-pointer" onClick={() => router.push("/admin/fees")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Collect Fees</h1>
        </div>
      
      </div>

    <div className="p-3 md:p-2 xl:p-0">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Select Student</CardTitle>
            <CardDescription>Search and select a student to collect fees</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search students..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="border rounded-md h-[400px] overflow-y-auto">
              {loading ? (
                <div className="flex justify-center items-center h-full">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : filteredStudents.length === 0 ? (
                <div className="flex justify-center items-center h-full text-muted-foreground">No students found</div>
              ) : (
                <div className="divide-y">
                  {filteredStudents.map((student) => (
                    <div
                      key={student.id}
                      className={`p-3 cursor-pointer hover:bg-muted transition-colors ${
                        selectedStudent?.id === student.id ? "bg-muted" : ""
                      }`}
                      onClick={() => handleStudentSelect(student.id)}
                    >
                      <div className="font-medium">{student.name}</div>
                      <div className="text-sm text-muted-foreground flex justify-between">
                        <span>{student.classSectionName}</span>
                        {student.srNo && <span>SR#: {student.srNo}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="md:col-span-2 space-y-6">
          {selectedStudent ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>{selectedStudent.name}</CardTitle>
                  <CardDescription>
                    {selectedStudent.classSectionName} | {selectedStudent.srNo ? `SR#: ${selectedStudent.srNo}` : ""}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <div className="text-sm text-muted-foreground">Total Fee</div>
                      <div className="text-2xl font-bold">₹{totalFee.toLocaleString()}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-sm text-muted-foreground">Paid Amount</div>
                      <div className="text-2xl font-bold text-green-600">₹{totalPaid.toLocaleString()}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-sm text-muted-foreground">Remaining</div>
                      <div className="text-2xl font-bold text-amber-600">₹{remainingAmount.toLocaleString()}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Tabs defaultValue="collect">
                <TabsList className="grid grid-cols-2">
                  <TabsTrigger value="collect">Collect Payment</TabsTrigger>
                  <TabsTrigger value="history">Payment History</TabsTrigger>
                </TabsList>

                <TabsContent value="collect" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Add New Payment</CardTitle>
                      <CardDescription>Record a new fee payment for {selectedStudent.name}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="installment">Installment Number</Label>
                          <Select value={installmentNumber} onValueChange={handleInstallmentChange}>
                            <SelectTrigger id="installment" className="w-[100%]">
                              <SelectValue placeholder="Select installment" />
                            </SelectTrigger>
                            <SelectContent>
                              {feeStructure
                                ? // Show installments from fee structure
                                  feeStructure.installments.map((inst) => {
                                    const partialPayment = partialPayments[inst.number]
                                    const isPaid = partialPayment && partialPayment.remaining === 0
                                    const isPartiallyPaid = partialPayment && partialPayment.remaining > 0

                                    return (
                                      <SelectItem key={inst.number} value={inst.number.toString()} disabled={isPaid}>
                                        Installment {inst.number}
                                        {isPaid
                                          ? " (Paid)"
                                          : isPartiallyPaid
                                            ? ` - ₹${partialPayment.remaining.toLocaleString()} remaining`
                                            : ` - ₹${inst.amount.toLocaleString()}`}
                                      </SelectItem>
                                    )
                                  })
                                : // Default installments if no fee structure
                                  [1, 2, 3, 4].map((num) => (
                                    <SelectItem key={num} value={num.toString()}>
                                      Installment {num}
                                    </SelectItem>
                                  ))}

                              {/* Custom installment options */}
                              {[...Array(3)].map((_, i) => {
                                const num = nextInstallmentNumber + i
                                return (
                                  <SelectItem key={`custom-${num}`} value={num.toString()}>
                                    Custom Installment {num}
                                  </SelectItem>
                                )
                              })}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="amount">Amount (₹)</Label>
                          <Input
                            id="amount"
                            type="number"
                            value={amount}
                            onChange={(e) => {
                              setAmount(e.target.value)

                              // Check if this would be a partial payment
                              if (feeStructure) {
                                const installmentNum = Number.parseInt(installmentNumber)
                                const installment = feeStructure.installments.find((i) => i.number === installmentNum)

                                if (installment) {
                                  const partialPayment = partialPayments[installmentNum]
                                  const expectedAmount = partialPayment ? partialPayment.remaining : installment.amount
                                  const inputAmount = Number.parseFloat(e.target.value) || 0

                                  setIsPartialPayment(inputAmount < expectedAmount && inputAmount > 0)
                                }
                              }
                            }}
                            placeholder="Enter amount"
                          />
                          {isPartialPayment && (
                            <p className="text-amber-600 text-sm flex items-center mt-1">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              This is a partial payment. Remaining amount will be added to the next installment.
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="paymentDate">Payment Date</Label>
                          <Input
                            id="paymentDate"
                            type="date"
                            value={paymentDate}
                            onChange={(e) => setPaymentDate(e.target.value)}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="paymentMethod">Payment Method</Label>
                          <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                            <SelectTrigger id="paymentMethod">
                              <SelectValue placeholder="Select payment method" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="cash">Cash</SelectItem>
                              <SelectItem value="upi">UPI</SelectItem>
                              <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                              <SelectItem value="cheque">Cheque</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="transactionId">Transaction ID (Optional)</Label>
                        <Input
                          id="transactionId"
                          value={transactionId}
                          onChange={(e) => setTransactionId(e.target.value)}
                          placeholder="Enter transaction ID"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="remarks">Remarks (Optional)</Label>
                        <Input
                          id="remarks"
                          value={remarks}
                          onChange={(e) => setRemarks(e.target.value)}
                          placeholder="Add any additional notes"
                        />
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button
                        onClick={handleAddPayment}
                        disabled={isSubmitting || !installmentNumber || !amount || !paymentDate || !paymentMethod}
                        className="w-full"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <Plus className="mr-2 h-4 w-4" />
                            Record Payment
                          </>
                        )}
                      </Button>
                    </CardFooter>
                  </Card>
                </TabsContent>

                <TabsContent value="history">
                  <Card>
                    <CardHeader>
                      <CardTitle>Payment History</CardTitle>
                      <CardDescription>All fee payments for {selectedStudent.name}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {payments.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">No payment records found</div>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Date</TableHead>
                              <TableHead>Installment</TableHead>
                              <TableHead>Amount</TableHead>
                              <TableHead>Method</TableHead>
                              <TableHead>Transaction ID</TableHead>
                              <TableHead>Remarks</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {payments.map((payment) => (
                              <TableRow key={payment.id}>
                                <TableCell>{format(payment.paymentDate.toDate(), "dd MMM yyyy")}</TableCell>
                                <TableCell>
                                  {payment.installmentNumber}
                                  {payment.isPartialPayment && (
                                    <Badge variant="outline" className="ml-2 bg-amber-100 text-amber-800">
                                      Partial
                                    </Badge>
                                  )}
                                  {feeStructure && payment.installmentNumber > feeStructure.installments.length && (
                                    <Badge variant="outline" className="ml-2">
                                      Custom
                                    </Badge>
                                  )}
                                </TableCell>
                                <TableCell className="font-medium">₹{payment.amount.toLocaleString()}</TableCell>
                                <TableCell className="capitalize">{payment.paymentMethod}</TableCell>
                                <TableCell>{payment.transactionId || "-"}</TableCell>
                                <TableCell>{payment.remarks || "-"}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

             
            </>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="text-center space-y-2">
                  <h3 className="text-lg font-medium">No Student Selected</h3>
                  <p className="text-muted-foreground">
                    Please select a student from the list to view and collect fees
                  </p>
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