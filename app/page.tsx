"use client"
import Link from "next/link"
import type React from "react"

import { useEffect, useState } from "react"
import { UserIcon, CalendarIcon, School2, Download, Bell, CreditCard, Users, UserCog, BookOpen, Calendar, ClipboardCheck, GraduationCap, Award, BarChart3, CheckCircle, ArrowRight } from "lucide-react"
import { useAuth } from "@/lib/auth-provider"
import { signOut } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { toast } from "sonner"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function Home() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const { user } = useAuth()

  const handleSignOut = async () => {
    try {
      await signOut(auth)
      toast.success("Signed out successfully")
    } catch (error: any) {
      toast.error("Error signing out", {
        description: error.message,
      })
    }
  }

  const features = [
    {
      title: "Student Management",
      description: "Easily manage student records and profiles.",
      icon: UserIcon,
    },
    {
      title: "Attendance Tracking",
      description: "Track attendance with real-time updates.",
      icon: CalendarIcon,
    },
    {
      title: "Grade Reporting",
      description: "Generate and share grade reports effortlessly.",
      icon: School2,
    },
  ]

  const testimonials = [
    {
      name: "John Doe",
      role: "Teacher, ABC School",
      image: "/photo.jpg",
      text: "Vidhayalaya has helped us streamline our operations. The interface is user-friendly and the tools are powerful.",
    },
    {
      name: "Jane Smith",
      role: "Principal, XYZ Academy",
      image: "/photo.jpg",
      text: "The system has improved our attendance tracking and grade reporting significantly. Highly recommend it!",
    },
    {
      name: "Mark Lee",
      role: "Administrator, School of Excellence",
      image: "/photo.jpg",
      text: "A fantastic platform for managing student data and staff information. It has saved us so much time.",
    },
  ]

  const DemoModal = ({ onClose }: { onClose: () => void }) => {
    const [formData, setFormData] = useState({ name: "", email: "", school: "" })

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault()
      console.log("Form submitted:", formData)
      alert("Demo request submitted!")
      onClose()
    }

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-gray-800 p-6 rounded-lg w-full max-w-md">
          <h2 className="text-2xl font-bold mb-4">Request a Demo</h2>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <input
                type="text"
                placeholder="Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="w-full p-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="mb-4">
              <input
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="w-full p-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="mb-6">
              <input
                type="text"
                placeholder="School Name"
                value={formData.school}
                onChange={(e) => setFormData({ ...formData, school: e.target.value })}
                required
                className="w-full p-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex justify-between">
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition duration-200"
              >
                Submit
              </button>
              <button type="button" onClick={onClose} className="text-gray-300 hover:text-white">
                Close
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  }


  const Loader = () => (
    <div className="flex items-center justify-center h-screen bg-white">
      <iframe src="https://lottie.host/embed/0a1907b1-dbe0-4902-abf5-0f5fac769614/FUNhNP02QN.lottie" className="h-[300px] w-[300px]"></iframe>
    </div>
  );

  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setTimeout(() => setLoading(false), 2000); // Show loader for 2 seconds
  }, []);

  return (
    loading ? <Loader /> :<div>
      {/* Navigation Bar */}
      <nav className="bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <Image src="/logo.png" width={35} height={35} alt="logo" />
              <Link href="/" className="text-white text-2xl font-bold">
                Vidhyalaya
              </Link>
            </div>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                <Link href="/" className="text-gray-300 hover:text-white px-3 py-2 rounded-md">
                  Home
                </Link>
                <Link href="#features" className="text-gray-300 hover:text-white px-3 py-2 rounded-md">
                  Features
                </Link>
                <Link href="#pricing" className="text-gray-300 hover:text-white px-3 py-2 rounded-md">
                  Pricing
                </Link>
                <Link href="/about" className="text-gray-300 hover:text-white px-3 py-2 rounded-md">
                  About
                </Link>
                {user ? (
                  <>
                    <Link
                      href={`/${user.role}/dashboard`}
                      className="text-gray-300 hover:text-white px-3 py-2 rounded-md"
                    >
                      Dashboard
                    </Link>
                    <button onClick={handleSignOut} className="text-gray-300 hover:text-white px-3 py-2 rounded-md">
                      Sign Out
                    </button>
                  </>
                ) : (
                  <Link href="/login" className="text-gray-300 hover:text-white px-3 py-2 rounded-md">
                    Login
                  </Link>
                )}
              </div>
            </div>
            <div className="md:hidden">
              <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-white focus:outline-none">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
        {isMobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              <Link href="/" className="block text-gray-300 hover:text-white px-3 py-2 rounded-md">
                Home
              </Link>
              <Link href="#features" className="block text-gray-300 hover:text-white px-3 py-2 rounded-md">
                Features
              </Link>
              <Link href="#pricing" className="block text-gray-300 hover:text-white px-3 py-2 rounded-md">
                Pricing
              </Link>
              <Link href="/about" className="block text-gray-300 hover:text-white px-3 py-2 rounded-md">
                About
              </Link>
              {user ? (
                <>
                  <Link
                    href={`/${user.role}/dashboard`}
                    className="block text-gray-300 hover:text-white px-3 py-2 rounded-md"
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="block text-gray-300 hover:text-white px-3 py-2 rounded-md w-full text-left"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <Link href="/login" className="block text-gray-300 hover:text-white px-3 py-2 rounded-md">
                  Login
                </Link>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="bg-gray-950 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-[#dc7673] mb-4">Streamline Your School’s Operations</h1>
            <p className="text-lg md:text-xl text-gray-300 mb-8">
              Efficiently manage students, staff, and resources in one place.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-purple-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition duration-200"
            >
              Request a Demo
            </button>
          </div>
        </div>
        {isModalOpen && <DemoModal onClose={() => setIsModalOpen(false)} />}
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-950">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <div className="inline-flex items-center rounded-full border bg-[#dc7673] border-gray-800 px-3 py-1 text-sm">
                <span className="text-[#dc7673] mr-1">✨</span> Powerful Features
              </div>
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-white">
                Everything You Need to <span className="text-[#dc7673]">Manage Your School</span>
              </h2>
              <p className="mx-auto max-w-[700px] text-gray-400 md:text-xl">
                Our comprehensive platform offers all the tools you need to streamline operations and enhance learning
                experiences.
              </p>
            </div>
          </div>
          <div className="mx-auto grid gap-6 py-12 md:grid-cols-2 lg:grid-cols-3 justify-center items-center">
            {[
              {
                icon: <BookOpen className="h-10 w-10 text-[#dc7673]" />,
                title: "Curriculum Management",
                description: "Create, organize, and distribute curriculum materials with ease.",
              },
              {
                icon: <BarChart3 className="h-10 w-10 text-[#dc7673]" />,
                title: "Performance Analytics",
                description: "Track student progress and identify areas for improvement with detailed analytics.",
              },
              {
                icon: <Calendar className="h-10 w-10 text-[#dc7673]" />,
                title: "Scheduling & Timetables",
                description: "Create conflict-free schedules for classes, teachers, and facilities.",
              },
              {
                icon: <Users className="h-10 w-10 text-[#dc7673]" />,
                title: "Parent-Teacher Communication",
                description: "Foster collaboration between parents and teachers with integrated messaging.",
              },
              {
                icon: <Award className="h-10 w-10 text-[#dc7673]" />,
                title: "Attendance & Grading",
                description: "Simplify attendance tracking and grade management with automated tools.",
              },
              {
                icon: <GraduationCap className="h-10 w-10 text-[#dc7673]" />,
                title: "Student Information System",
                description: "Maintain comprehensive student records in a secure, centralized database.",
              },
            ].map((feature, index) => (
              <Card
                key={index}
                className="bg-gray-900 border-gray-800 shadow-lg hover:shadow-xl transition-all hover:border-[#dc7673]/50"
              >
                <CardHeader>
                  <div className="p-2 rounded-lg w-fit bg-gray-800">{feature.icon}</div>
                  <CardTitle className="text-xl text-white mt-4">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-400">{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
      
      <section id="fees" className="py-24 px-4 sm:px-6 lg:px-8 relative bg-amber-600">
        <div className="absolute z-0" />
        <div className="relative z-10 max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-playfair font-bold mb-8 text-white">Simplified Fee Management</h2>
              <div className="space-y-8">
                <div className="flex items-start gap-5">
                  <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <CreditCard className="w-7 h-7 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-xl mb-3 text-white">Online Payments </h3>
                    <p className="text-slate-300 leading-relaxed">Accept fees online with multiple payment options including credit cards, bank transfers, and digital wallets. comming soon</p>
                  </div>
                </div>
                <div className="flex items-start gap-5">
                  <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <Bell className="w-7 h-7 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-xl mb-3 text-white">Payment Reminders</h3>
                    <p className="text-slate-300 leading-relaxed">Automated reminders for pending payments sent directly to parents through email or SMS notifications.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-xl border border-slate-700/30 p-8 rounded-2xl shadow-lg">
              <h3 className="text-xl font-semibold mb-8 text-white">Fee Management Dashboard</h3>
              <div className="aspect-video bg-slate-800/70 rounded-lg border border-slate-700/50 flex items-center justify-center overflow-hidden relative">
                <div className="absolute inset-0 bg-primary/5"></div>
                <div className="text-white text-sm">Dashboard Preview</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 bg-black">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <div className="inline-flex items-center rounded-full border bg-white border-gray-800 px-3 py-1 text-sm">
                <span className="text-[#dc7673] mr-1">❤️</span> Testimonials
              </div>
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-white">
                Loved by <span className="text-[#dc7673]">Educators</span> Worldwide
              </h2>
              <p className="mx-auto max-w-[700px] text-gray-400 md:text-xl">
                See what school administrators, teachers, and parents are saying about our platform.
              </p>
            </div>
          </div>
          <div className="mx-auto grid gap-6 py-12 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                quote:
                  "EduMatrix has transformed how we manage our school. The administrative burden has been reduced by at least 40%.",
                name: "Sarah Johnson",
                role: "Principal, Lincoln High School",
              },
              {
                quote:
                  "As a teacher, I can focus more on teaching and less on paperwork. The grading and attendance features are game-changers.",
                name: "Michael Chen",
                role: "Science Teacher, Westfield Academy",
              },
              {
                quote:
                  "The parent portal keeps me connected with my children's education. I love getting real-time updates on their progress.",
                name: "Priya Patel",
                role: "Parent of two students",
              },
            ].map((testimonial, index) => (
              <Card key={index} className="bg-gray-900 border-gray-800 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex flex-col gap-4">
                    <div className="flex text-[#dc7673]">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <svg
                          key={star}
                          xmlns="http://www.w3.org/2000/svg"
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                      ))}
                    </div>
                    <p className="text-gray-300 italic">"{testimonial.quote}"</p>
                    <div className="mt-4">
                      <p className="font-semibold text-white">{testimonial.name}</p>
                      <p className="text-sm text-gray-400">{testimonial.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="py-20 bg-gradient-to-b from-black to-gray-950">
        <div className="container px-4 md:px-6">
          <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
            <div className="flex flex-col justify-center space-y-4">
              <div className="space-y-2">
                <div className="inline-flex items-center rounded-full border border-gray-800 px-3 py-1 text-sm">
                  <span className="text-[#dc7673] mr-1">🚀</span> Get Started Today
                </div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-white">
                  Ready to <span className="text-[#dc7673]">Transform</span> Your School?
                </h2>
                <p className="max-w-[600px] text-gray-400 md:text-xl">
                  Join thousands of schools that have already revolutionized their management systems with EduMatrix.
                </p>
              </div>
              <ul className="space-y-2">
                {[
                  "30-day free trial with full access",
                  "Dedicated onboarding support",
                  "Data migration assistance",
                  "Regular updates and new features",
                  "99.9% uptime guarantee",
                ].map((item, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-[#dc7673]" />
                    <span className="text-gray-300">{item}</span>
                  </li>
                ))}
              </ul>
              <div className="flex flex-col gap-2 min-[400px]:flex-row pt-4">
                <Button className="bg-[#dc7673] hover:bg-[#dc7673]/90 text-white">Start Free Trial</Button>
                <Button
                  variant="outline"
                  className="border-gray-700 text-gray-300 hover:bg-gray-900 hover:text-[#dc7673]"
                >
                  View Pricing Plans
                </Button>
              </div>
            </div>
            <div className="mx-auto lg:mx-0 relative">
              <div className="absolute inset-0 bg-gradient-to-r from-[#dc7673]/20 to-purple-500/20 rounded-xl blur-3xl opacity-30"></div>
              <Card className="bg-gray-900 border-gray-800 shadow-xl relative overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="absolute top-0 right-0 bg-[#dc7673] text-white px-4 py-1 text-sm font-medium">
                    Most Popular
                  </div>
                  <CardTitle className="text-2xl text-white">Pro Plan</CardTitle>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-white">$299</span>
                    <span className="text-gray-400">/month</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-400">Perfect for schools with up to 1,000 students</p>
                  <ul className="space-y-2">
                    {[
                      "Unlimited users",
                      "All core features",
                      "Advanced analytics",
                      "API access",
                      "Priority support",
                      "Custom branding",
                    ].map((feature, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-[#dc7673]" />
                        <span className="text-gray-300">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button className="w-full bg-[#dc7673] hover:bg-[#dc7673]/90 text-white mt-4">
                    Get Started <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-gray-800">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5 z-0" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-primary/10 rounded-full blur-[100px] opacity-70" />
        <div className="relative z-10 max-w-7xl mx-auto text-center">
          <div className="w-20 h-20 bg-gray-500 rounded-full flex items-center justify-center mx-auto mb-8">
            <Download className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-3xl md:text-4xl font-playfair font-bold mb-6 text-white">Get the Mobile App</h2>
          <p className="text-slate-300 mb-10 max-w-2xl mx-auto">
            Access SchoolSmart on the go. Download our mobile app to manage your school from anywhere, anytime.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
          <a href="/vidhyalaya-app.apk" download>
            <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-white text-lg px-8 py-6 h-auto">
              Download for iOS
            </Button>
            </a>
            <a href="/vidhyalaya-app.apk" download>
            <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-white text-lg px-8 py-6 h-auto">
              Download for Android
            </Button>
            </a>
          </div>
        </div>
      </section>
      {/* Footer Section */}
      <footer id="contact" className="border-t border-gray-800 bg-black py-12">
        <div className="container px-4 md:px-6">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
              <Image src="/logo.png" width={35} height={35} alt="logo" />
                <span className="text-xl font-bold text-white">Vidhyalaya</span>
              </div>
              <p className="text-gray-400">Revolutionizing school management with innovative technology solutions.</p>
              <div className="flex gap-4">
                {["twitter", "facebook", "instagram", "linkedin"].map((social) => (
                  <Link key={social} href={`#${social}`} className="text-gray-400 hover:text-[#dc7673]">
                    <span className="sr-only">{social}</span>
                    <div className="h-8 w-8 rounded-full bg-gray-900 flex items-center justify-center">
                      <Image
                        src={`/placeholder.svg?height=24&width=24&text=${social[0].toUpperCase()}`}
                        alt={social}
                        width={24}
                        height={24}
                      />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Product</h3>
              <ul className="space-y-2">
                {["Features", "Pricing", "Testimonials", "Case Studies", "Updates"].map((item) => (
                  <li key={item}>
                    <Link href="#" className="text-gray-400 hover:text-[#dc7673]">
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Company</h3>
              <ul className="space-y-2">
                {["About Us", "Careers", "Blog", "Press", "Partners"].map((item) => (
                  <li key={item}>
                    <Link href="/about" className="text-gray-400 hover:text-[#dc7673]">
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Contact</h3>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-[#dc7673]">Email:</span>
                  <Link href="mailto:info@edumatrix.com" className="text-gray-400 hover:text-[#dc7673]">
                    info@vidhyalaya.com
                  </Link>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#dc7673]">Phone:</span>
                  <Link href="tel:+1234567890" className="text-gray-400 hover:text-[#dc7673]">
                    +91 8829900355
                  </Link>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#dc7673]">Address:</span>
                  <span className="text-gray-400">
                    129 Bal Nagar -H , Goner Road
                    <br />
                    Jaipur, RJ 302031
                  </span>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-12 border-t border-gray-800 pt-8 text-center text-gray-400">
            <p>© {new Date().getFullYear()} Vidhyalaya. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}


