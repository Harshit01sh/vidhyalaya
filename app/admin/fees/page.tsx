"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AdminNav } from "@/components/admin-nav"
import { DashboardShell } from "@/components/dashboard-shell"
import { UserNav } from "@/components/user-nav"
import { db } from "@/lib/firebase"
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
  addDoc,
  serverTimestamp,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore"
import { useAuth } from "@/lib/auth-provider"
import { useRouter } from "next/navigation"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { format, isSameDay } from "date-fns"
import { FilterX, Search, Plus, DollarSign, Trash2, Edit } from "lucide-react"
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
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { toast } from "sonner"
import { Separator } from "@/components/ui/separator"

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

interface ClassSection {
  id: string
  name: string
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
  createdAt: Timestamp
}

export default function AdminFees() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [students, setStudents] = useState<Student[]>([])
  const [allStudents, setAllStudents] = useState<Student[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [payments, setPayments] = useState<FeePayment[]>([])
  const [todayPayments, setTodayPayments] = useState<FeePayment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [todayTotal, setTodayTotal] = useState(0)
  const [monthlyData, setMonthlyData] = useState<{ month: string; amount: number }[]>([])
  const [classSections, setClassSections] = useState<ClassSection[]>([])
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([])
  const [editingFeeStructure, setEditingFeeStructure] = useState<FeeStructure | null>(null)

  // Form state
  const [selectedStudent, setSelectedStudent] = useState("")
  const [installmentNumber, setInstallmentNumber] = useState<string>("1")
  const [amount, setAmount] = useState("")
  const [paymentDate, setPaymentDate] = useState(format(new Date(), "yyyy-MM-dd"))
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [feeStructureDialogOpen, setFeeStructureDialogOpen] = useState(false)
  const [selectedClassSection, setSelectedClassSection] = useState("")
  const [totalFeeAmount, setTotalFeeAmount] = useState("")
  const [academicYear, setAcademicYear] = useState(new Date().getFullYear().toString())
  const [installments, setInstallments] = useState([
    { number: 1, amount: "", dueDate: format(new Date(), "yyyy-MM-dd") },
    { number: 2, amount: "", dueDate: format(new Date(), "yyyy-MM-dd") },
    { number: 3, amount: "", dueDate: format(new Date(), "yyyy-MM-dd") },
    { number: 4, amount: "", dueDate: format(new Date(), "yyyy-MM-dd") },
  ])

  useEffect(() => {
    if (!loading && (!user || user.role !== "admin")) {
      router.push("/login")
    }
  }, [user, loading, router])

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)

        // Fetch all class sections
        const classSectionsQuery = query(collection(db, "classSections"), orderBy("name"))
        const classSectionsSnapshot = await getDocs(classSectionsQuery)
        const classSectionsData: ClassSection[] = classSectionsSnapshot.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().name,
        }))
        setClassSections(classSectionsData)

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

        // Sort by name
        const sortedStudents = studentsData.sort((a, b) => a.name.localeCompare(b.name))
        setStudents(sortedStudents)
        setAllStudents(sortedStudents)

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

        // Get today's payments
        const today = new Date()
        const todayPaymentsData = paymentsData.filter((payment) => {
          const paymentDate = payment.paymentDate.toDate()
          return isSameDay(paymentDate, today)
        })

        setTodayPayments(todayPaymentsData)

        // Calculate today's total
        const todayTotalAmount = todayPaymentsData.reduce((total, payment) => total + payment.amount, 0)
        setTodayTotal(todayTotalAmount)

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

        setMonthlyData(monthlyChartData)
        setIsLoading(false)
      } catch (error) {
        console.error("Error fetching data:", error)
        setIsLoading(false)
      }
    }

    if (user && user.role === "admin") {
      fetchData()
    }
  }, [user])

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

  const handleAddPayment = async () => {
    if (!selectedStudent || !installmentNumber || !amount || !paymentDate) {
      toast.error("Missing information: Please fill in all required fields")
      return
    }

    try {
      setIsSubmitting(true)

      // Get student details
      const student = allStudents.find((s) => s.id === selectedStudent)
      if (!student) {
        throw new Error("Student not found")
      }

      // Create payment record
      const paymentData = {
        studentId: student.id,
        studentName: student.name,
        classSectionId: student.classSectionId,
        classSectionName: student.classSectionName,
        amount: Number.parseFloat(amount),
        installmentNumber: Number.parseInt(installmentNumber),
        paymentDate: Timestamp.fromDate(new Date(paymentDate)),
        createdAt: serverTimestamp(),
      }

      const docRef = await addDoc(collection(db, "feePayments"), paymentData)

      // Add id to the payment data
      const newPayment = {
        id: docRef.id,
        ...paymentData,
      } as FeePayment

      // Update state
      setPayments([newPayment, ...payments])

      // If payment is from today, update today's payments
      const today = new Date()
      const paymentDateObj = new Date(paymentDate)
      if (isSameDay(paymentDateObj, today)) {
        setTodayPayments([newPayment, ...todayPayments])
        setTodayTotal(todayTotal + newPayment.amount)
      }

      // Reset form
      setSelectedStudent("")
      setInstallmentNumber("1")
      setAmount("")
      setPaymentDate(format(new Date(), "yyyy-MM-dd"))
      setDialogOpen(false)

      toast.success(`Payment recorded: Successfully recorded payment for ${student.name}`)
    } catch (error) {
      console.error("Error adding payment:", error)
      toast.error("Error: Failed to record payment. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAddInstallment = () => {
    const nextNumber = installments.length + 1
    setInstallments([
      ...installments,
      {
        number: nextNumber,
        amount: "",
        dueDate: format(new Date(), "yyyy-MM-dd"),
      },
    ])
  }

  const handleRemoveInstallment = (index: number) => {
    if (installments.length <= 1) {
      toast.error("Cannot remove: At least one installment is required")
      return
    }

    const newInstallments = [...installments]
    newInstallments.splice(index, 1)

    // Renumber installments
    const renumberedInstallments = newInstallments.map((inst, idx) => ({
      ...inst,
      number: idx + 1,
    }))

    setInstallments(renumberedInstallments)
  }

  const handleInstallmentChange = (index: number, field: string, value: string) => {
    const newInstallments = [...installments]
    newInstallments[index] = {
      ...newInstallments[index],
      [field]: field === "amount" ? value : value,
    }
    setInstallments(newInstallments)
  }

  const validateFeeStructure = () => {
    if (!selectedClassSection) {
      toast.error("Missing class section: Please select a class section")
      return false
    }

    if (!totalFeeAmount || isNaN(Number(totalFeeAmount)) || Number(totalFeeAmount) <= 0) {
      toast.error("Invalid total amount: Please enter a valid total fee amount")
      return false
    }

    // Check if all installments have valid amounts and due dates
    let totalInstallmentAmount = 0
    for (const installment of installments) {
      if (!installment.amount || isNaN(Number(installment.amount)) || Number(installment.amount) <= 0) {
        toast.error(`Invalid installment amount: Please enter a valid amount for installment ${installment.number}`)
        return false
      }

      if (!installment.dueDate) {
        toast.error(`Missing due date: Please select a due date for installment ${installment.number}`)
        return false
      }

      totalInstallmentAmount += Number(installment.amount)
    }

    // Check if total of installments matches total fee amount
    if (totalInstallmentAmount !== Number(totalFeeAmount)) {
      toast.error(
        `Amount mismatch: The sum of installment amounts (₹${totalInstallmentAmount}) does not match the total fee amount (₹${totalFeeAmount})`
      )
      return false
    }

    return true
  }

  const handleSaveFeeStructure = async () => {
    if (!validateFeeStructure()) {
      return
    }

    try {
      setIsSubmitting(true)

      // Get class section name
      const classSection = classSections.find((cs) => cs.id === selectedClassSection)
      if (!classSection) {
        throw new Error("Class section not found")
      }

      // Prepare installments with proper types
      const formattedInstallments = installments.map((inst) => ({
        number: inst.number,
        amount: Number(inst.amount),
        dueDate: inst.dueDate,
      }))

      // Create fee structure record
      const feeStructureData = {
        classSectionId: selectedClassSection,
        classSectionName: classSection.name,
        totalAmount: Number(totalFeeAmount),
        installments: formattedInstallments,
        academicYear,
        createdAt: serverTimestamp(),
      }

      let docRef
      if (editingFeeStructure) {
        // Update existing fee structure
        await updateDoc(doc(db, "feeStructures", editingFeeStructure.id), feeStructureData)
        docRef = { id: editingFeeStructure.id }
      } else {
        // Create new fee structure
        docRef = await addDoc(collection(db, "feeStructures"), feeStructureData)
      }

      // Add id to the fee structure data
      const newFeeStructure = {
        id: docRef.id,
        ...feeStructureData,
      } as FeeStructure

      // Update state
      if (editingFeeStructure) {
        setFeeStructures(feeStructures.map((fs) => (fs.id === editingFeeStructure.id ? newFeeStructure : fs)))
      } else {
        setFeeStructures([...feeStructures, newFeeStructure])
      }

      // Reset form
      resetFeeStructureForm()
      setFeeStructureDialogOpen(false)

      toast.success(
        editingFeeStructure
          ? `Fee structure updated: Successfully updated fee structure for ${classSection.name}`
          : `Fee structure created: Successfully created fee structure for ${classSection.name}`
      )
    } catch (error) {
      console.error("Error saving fee structure:", error)
      toast.error("Error: Failed to save fee structure. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteFeeStructure = async (id: string) => {
    try {
      await deleteDoc(doc(db, "feeStructures", id))
      setFeeStructures(feeStructures.filter((fs) => fs.id !== id))
      toast.success("Fee structure deleted: The fee structure has been deleted successfully")
    } catch (error) {
      console.error("Error deleting fee structure:", error)
      toast.error("Error: Failed to delete fee structure. Please try again.")
    }
  }

  const handleEditFeeStructure = (feeStructure: FeeStructure) => {
    setEditingFeeStructure(feeStructure)
    setSelectedClassSection(feeStructure.classSectionId)
    setTotalFeeAmount(feeStructure.totalAmount.toString())
    setAcademicYear(feeStructure.academicYear)
    setInstallments(
      feeStructure.installments.map((inst) => ({
        number: inst.number,
        amount: inst.amount.toString(),
        dueDate: inst.dueDate,
      }))
    )
    setFeeStructureDialogOpen(true)
  }

  const resetFeeStructureForm = () => {
    setEditingFeeStructure(null)
    setSelectedClassSection("")
    setTotalFeeAmount("")
    setAcademicYear(new Date().getFullYear().toString())
    setInstallments([
      { number: 1, amount: "", dueDate: format(new Date(), "yyyy-MM-dd") },
      { number: 2, amount: "", dueDate: format(new Date(), "yyyy-MM-dd") },
      { number: 3, amount: "", dueDate: format(new Date(), "yyyy-MM-dd") },
      { number: 4, amount: "", dueDate: format(new Date(), "yyyy-MM-dd") },
    ])
  }

  const getFeeStructureForStudent = (student: Student) => {
    return feeStructures.find((fs) => fs.classSectionId === student.classSectionId && fs.academicYear === academicYear)
  }

  const getStudentInstallmentDetails = (student: Student, installmentNumber: number) => {
    const feeStructure = getFeeStructureForStudent(student)
    if (!feeStructure) return null

    const installment = feeStructure.installments.find((inst) => inst.number === installmentNumber)
    if (!installment) return null

    // Find if payment exists for this installment
    const payment = payments.find((p) => p.studentId === student.id && p.installmentNumber === installmentNumber)

    return {
      amount: installment.amount,
      dueDate: installment.dueDate,
      payment,
    }
  }

  if (loading || !user || user.role !== "admin") {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  return (
    <DashboardShell sidebar={<AdminNav />} title="Fee Management">
      

      <Tabs defaultValue="dashboard" className="space-y-4">
        <TabsList className="ml-3 md:ml-2 xl:ml-0">
          <TabsTrigger value="dashboard" className="cursor-pointer">Dashboard</TabsTrigger>
          <TabsTrigger value="students" className="cursor-pointer">Students</TabsTrigger>
          <TabsTrigger value="fee-structure" className="cursor-pointer">Fee Structure</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4 p-3 md:p-2 xl:p-0">
          <Card>
            <CardHeader>
              <CardTitle>Today's Fee Collection</CardTitle>
              <CardDescription>Total amount collected today: ₹{todayTotal.toLocaleString()}</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center items-center h-24">
                  <p>Loading today's payments...</p>
                </div>
              ) : todayPayments.length === 0 ? (
                <div className="text-center py-6">
                  <p>No payments recorded today</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student Name</TableHead>
                        <TableHead>Class</TableHead>
                        <TableHead>Installment</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Time</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {todayPayments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell className="font-medium">{payment.studentName}</TableCell>
                          <TableCell>{payment.classSectionName}</TableCell>
                          <TableCell>Installment {payment.installmentNumber}</TableCell>
                          <TableCell>₹{payment.amount.toLocaleString()}</TableCell>
                          <TableCell>{format(payment.paymentDate.toDate(), "h:mm a")}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Monthly Fee Collection</CardTitle>
              <CardDescription>Fee collection trends over the past months</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`₹${value}`, "Collection Amount"]} />
                    <Legend />
                    <Bar dataKey="amount" name="Fee Collection" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="students" className="p-3 md:p-2 xl:p-0">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <CardTitle>Student Fee Management</CardTitle>
                  <CardDescription>Add and view fee payments for students</CardDescription>
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
                  <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Payment
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Fee Payment</DialogTitle>
                        <DialogDescription>Record a new fee payment for a student</DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label htmlFor="student">Student</Label>
                          <Select
                            value={selectedStudent}
                            onValueChange={(value) => {
                              setSelectedStudent(value)

                              // Find student and their fee structure
                              const student = allStudents.find((s) => s.id === value)
                              if (student) {
                                const feeStructure = getFeeStructureForStudent(student)
                                if (feeStructure) {
                                  // Find unpaid installments
                                  const studentPayments = payments.filter((p) => p.studentId === student.id)
                                  const paidInstallmentNumbers = studentPayments.map((p) => p.installmentNumber)

                                  const unpaidInstallments = feeStructure.installments
                                    .filter((inst) => !paidInstallmentNumbers.includes(inst.number))
                                    .sort((a, b) => a.number - b.number)

                                  if (unpaidInstallments.length > 0) {
                                    // Set the first unpaid installment
                                    setInstallmentNumber(unpaidInstallments[0].number.toString())
                                    setAmount(unpaidInstallments[0].amount.toString())
                                  }
                                }
                              }
                            }}
                          >
                            <SelectTrigger id="student">
                              <SelectValue placeholder="Select student" />
                            </SelectTrigger>
                            <SelectContent>
                              {allStudents.map((student) => (
                                <SelectItem key={student.id} value={student.id}>
                                  {student.name} - {student.classSectionName}
                                  {student.srNo ? ` (SR#: ${student.srNo})` : ""}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {selectedStudent && (
                          <>
                            <div className="grid gap-2">
                              <Label htmlFor="installment">Installment</Label>
                              <Select
                                value={installmentNumber}
                                onValueChange={(value) => {
                                  setInstallmentNumber(value)

                                  // Update amount based on fee structure
                                  const student = allStudents.find((s) => s.id === selectedStudent)
                                  if (student) {
                                    const feeStructure = getFeeStructureForStudent(student)
                                    if (feeStructure) {
                                      const installment = feeStructure.installments.find(
                                        (inst) => inst.number === Number.parseInt(value)
                                      )
                                      if (installment) {
                                        setAmount(installment.amount.toString())
                                      }
                                    }
                                  }
                                }}
                              >
                                <SelectTrigger id="installment">
                                  <SelectValue placeholder="Select installment" />
                                </SelectTrigger>
                                <SelectContent>
                                  {(() => {
                                    const student = allStudents.find((s) => s.id === selectedStudent)
                                    if (!student) return null

                                    const feeStructure = getFeeStructureForStudent(student)
                                    if (!feeStructure) {
                                      return [1, 2, 3, 4].map((num) => (
                                        <SelectItem key={num} value={num.toString()}>
                                          Installment {num}
                                        </SelectItem>
                                      ))
                                    }

                                    return feeStructure.installments.map((inst) => (
                                      <SelectItem key={inst.number} value={inst.number.toString()}>
                                        Installment {inst.number} (₹{inst.amount.toLocaleString()})
                                      </SelectItem>
                                    ))
                                  })()}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor="amount">Amount (₹)</Label>
                              <Input
                                id="amount"
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="Enter amount"
                              />
                            </div>
                          </>
                        )}
                        <div className="grid gap-2">
                          <Label htmlFor="paymentDate">Payment Date</Label>
                          <Input
                            id="paymentDate"
                            type="date"
                            value={paymentDate}
                            onChange={(e) => setPaymentDate(e.target.value)}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <DialogClose asChild>
                          <Button variant="outline">Cancel</Button>
                        </DialogClose>
                        <Button
                          type="submit"
                          onClick={handleAddPayment}
                          disabled={isSubmitting || !selectedStudent || !installmentNumber || !amount}
                        >
                          {isSubmitting ? "Saving..." : "Save Payment"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center items-center h-24">
                  <p>Loading student data...</p>
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
                        <TableHead>SR No</TableHead>
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
                        // Get student payments
                        const studentPayments = payments.filter((p) => p.studentId === student.id)
                        const totalPaid = studentPayments.reduce((sum, p) => sum + p.amount, 0)

                        // Get fee structure
                        const feeStructure = getFeeStructureForStudent(student)
                        const totalFee = feeStructure ? feeStructure.totalAmount : 0
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
                                  <Button variant="outline" size="sm">
                                    <DollarSign className="h-3.5 w-3.5 mr-1" />
                                    View Payments
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-sm md:max-w-md xl:max-w-3xl overflow-x-scroll">
                                  <DialogHeader>
                                    <DialogTitle>Fee Payments - {student.name}</DialogTitle>
                                    <DialogDescription>
                                      {student.classSectionName} | {student.srNo ? `SR#: ${student.srNo}` : ""}
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="py-4">
                                    {feeStructure ? (
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
                                          {feeStructure.installments.map((installment) => {
                                            const payment = studentPayments.find(
                                              (p) => p.installmentNumber === installment.number
                                            )
                                            return (
                                              <TableRow key={installment.number}>
                                                <TableCell>Installment {installment.number}</TableCell>
                                                <TableCell>₹{installment.amount.toLocaleString()}</TableCell>
                                                <TableCell>
                                                  {format(new Date(installment.dueDate), "dd MMM yyyy")}
                                                </TableCell>
                                                <TableCell>
                                                  {payment ? format(payment.paymentDate.toDate(), "dd MMM yyyy") : "-"}
                                                </TableCell>
                                                <TableCell>
                                                  {payment ? (
                                                    <span className="text-green-600 font-medium">Paid</span>
                                                  ) : (
                                                    <span className="text-red-600 font-medium">Pending</span>
                                                  )}
                                                </TableCell>
                                              </TableRow>
                                            )
                                          })}
                                        </TableBody>
                                      </Table>
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
                                    <Button
                                      onClick={() => {
                                        setSelectedStudent(student.id)
                                        setDialogOpen(true)
                                      }}
                                    >
                                      Add Payment
                                    </Button>
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
        </TabsContent>

        <TabsContent value="fee-structure" className="p-3 md:p-2 xl:p-0">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <CardTitle>Fee Structure Management</CardTitle>
                  <CardDescription>Create and manage fee structures for different class sections</CardDescription>
                </div>
                <Dialog
                  open={feeStructureDialogOpen}
                  onOpenChange={(open) => {
                    setFeeStructureDialogOpen(open)
                    if (!open) resetFeeStructureForm()
                  }}
                >
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Fee Structure
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-sm md:max-w-xl xl:max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>{editingFeeStructure ? "Edit Fee Structure" : "Create Fee Structure"}</DialogTitle>
                      <DialogDescription>Define fee structure for a class section</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="classSection">Class Section</Label>
                          <Select
                            value={selectedClassSection}
                            onValueChange={setSelectedClassSection}
                            disabled={!!editingFeeStructure}
                          >
                            <SelectTrigger id="classSection">
                              <SelectValue placeholder="Select class section" />
                            </SelectTrigger>
                            <SelectContent>
                              {classSections.map((cs) => (
                                <SelectItem key={cs.id} value={cs.id}>
                                  {cs.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="academicYear">Academic Year</Label>
                          <Input
                            id="academicYear"
                            value={academicYear}
                            onChange={(e) => setAcademicYear(e.target.value)}
                            placeholder="e.g., 2023-2024"
                          />
                        </div>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="totalAmount">Total Fee Amount (₹)</Label>
                        <Input
                          id="totalAmount"
                          type="number"
                          value={totalFeeAmount}
                          onChange={(e) => {
                            setTotalFeeAmount(e.target.value)
                            // Distribute amount equally among installments
                            if (e.target.value && !isNaN(Number(e.target.value))) {
                              const total = Number(e.target.value)
                              const perInstallment = Math.floor(total / installments.length)
                              const remainder = total % installments.length

                              const newInstallments = installments.map((inst, idx) => ({
                                ...inst,
                                amount: idx === 0 ? (perInstallment + remainder).toString() : perInstallment.toString(),
                              }))

                              setInstallments(newInstallments)
                            }
                          }}
                          placeholder="Enter total fee amount"
                        />
                      </div>

                      <Separator className="my-2" />

                      <div>
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-lg font-medium">Installments</h3>
                          <Button type="button" variant="outline" size="sm" onClick={handleAddInstallment}>
                            <Plus className="h-3.5 w-3.5 mr-1" />
                            Add Installment
                          </Button>
                        </div>

                        <div className="space-y-4">
                          {installments.map((installment, index) => (
                            <div key={index} className="grid grid-cols-12 gap-2 items-center">
                              <div className="col-span-1">
                                <span className="font-medium">{installment.number}.</span>
                              </div>
                              <div className="col-span-4">
                                <Input
                                  type="number"
                                  value={installment.amount}
                                  onChange={(e) => handleInstallmentChange(index, "amount", e.target.value)}
                                  placeholder="Amount"
                                />
                              </div>
                              <div className="col-span-6">
                                <Input
                                  type="date"
                                  value={installment.dueDate}
                                  onChange={(e) => handleInstallmentChange(index, "dueDate", e.target.value)}
                                />
                              </div>
                              <div className="col-span-1">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleRemoveInstallment(index)}
                                >
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => {
                          resetFeeStructureForm()
                          setFeeStructureDialogOpen(false)
                        }}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" onClick={handleSaveFeeStructure} disabled={isSubmitting}>
                        {isSubmitting ? "Saving..." : "Save Fee Structure"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center items-center h-24">
                  <p>Loading fee structures...</p>
                </div>
              ) : feeStructures.length === 0 ? (
                <div className="text-center py-6">
                  <p>No fee structures defined yet. Create your first fee structure to get started.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Class Section</TableHead>
                        <TableHead>Academic Year</TableHead>
                        <TableHead>Total Amount</TableHead>
                        <TableHead>Installments</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {feeStructures.map((feeStructure) => (
                        <TableRow key={feeStructure.id}>
                          <TableCell className="font-medium">{feeStructure.classSectionName}</TableCell>
                          <TableCell>{feeStructure.academicYear}</TableCell>
                          <TableCell>₹{feeStructure.totalAmount.toLocaleString()}</TableCell>
                          <TableCell>{feeStructure.installments.length}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="outline" size="sm" onClick={() => handleEditFeeStructure(feeStructure)}>
                                <Edit className="h-3.5 w-3.5 mr-1" />
                                Edit
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-500 hover:text-red-600"
                                onClick={() => handleDeleteFeeStructure(feeStructure.id)}
                              >
                                <Trash2 className="h-3.5 w-3.5 mr-1" />
                                Delete
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardShell>
  )
}