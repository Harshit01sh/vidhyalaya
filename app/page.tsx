"use client"
import Link from "next/link"
import type React from "react"

import { useEffect, useState } from "react"
import { UserIcon, CalendarIcon, School2, Download, Bell, CreditCard, Users, UserCog, BookOpen, Calendar, ClipboardCheck } from "lucide-react"
import { useAuth } from "@/lib/auth-provider"
import { signOut } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { toast } from "sonner"
import Image from "next/image"
import { Button } from "@/components/ui/button"

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
      <section className="bg-black py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Streamline Your School’s Operations</h1>
            <p className="text-lg md:text-xl text-gray-300 mb-8">
              Efficiently manage students, staff, and resources in one place.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition duration-200"
            >
              Request a Demo
            </button>
          </div>
        </div>
        {isModalOpen && <DemoModal onClose={() => setIsModalOpen(false)} />}
      </section>

      {/* Features Section */}
      <section id="features" className="bg-black py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-white mb-12">Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-gray-800 p-6 rounded-lg shadow-lg transition duration-300 hover:-translate-y-1"
              >
                <feature.icon className="h-12 w-12 text-blue-500 mb-4 mx-auto" />
                <h3 className="text-xl font-semibold text-white text-center mb-2">{feature.title}</h3>
                <p className="text-gray-300 text-center">{feature.description}</p>
              </div>
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
      <section id="testimonials" className="bg-gray-800 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-white mb-12">What Our Users Say</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-gray-700 p-6 rounded-lg shadow-lg">
                <div className="flex items-center mb-4">
                  <img
                    src={testimonial.image || "/placeholder.svg"}
                    alt={testimonial.name}
                    className="w-16 h-16 rounded-full mr-4"
                  />
                  <div>
                    <h3 className="text-xl font-semibold text-white">{testimonial.name}</h3>
                    <p className="text-gray-300">{testimonial.role}</p>
                  </div>
                </div>
                <p className="text-gray-300 italic">"{testimonial.text}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="py-20 px-4 bg-slate-900 text-white">
  <h2 className="text-3xl font-bold text-center mb-12">What Our Users Say</h2>
  <div className="max-w-6xl mx-auto grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
    <Testimonial
      name="Priya Sharma"
      title="Principal, Greenfield School"
      quote="Vidhyalaya has transformed how we manage our school. It's intuitive and saves us hours of manual work!"
    />
    <Testimonial
      name="Raj Mehta"
      title="Admin, Little Angels High School"
      quote="We’ve streamlined our fee collection and attendance tracking completely. Highly recommended!"
    />
    <Testimonial
      name="Sneha Iyer"
      title="Teacher, Sunrise Academy"
      quote="As a teacher, it's so easy to mark attendance and update student progress with just a few clicks."
    />
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
      <footer className="bg-black py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-white">
          <div className="flex justify-between items-center">
            <Link href="/" className="text-2xl font-bold">
              Vidhyalaya
            </Link>
            <div className="space-x-6">
             
              <Link href="#pricing" className="hover:text-gray-300">
                Pricing
              </Link>
              <Link href="/about" className="hover:text-gray-300">
                About
              </Link>
              
            </div>
          </div>
          <div className="max-w-7xl bottom-0 text-center">
                      <p>© 2025 Vidhayalaya. All rights reserved.</p>
                  </div>
                
        </div>
      </footer>
    </div>
  )
}


const Testimonial = ({
  name,
  title,
  quote,
}: {
  name: string;
  title: string;
  quote: string;
}) => (
  <div className="bg-slate-800 p-6 rounded-xl shadow-md space-y-4">
    <p className="text-slate-300 italic">“{quote}”</p>
    <div className="pt-4 border-t border-slate-700">
      <h4 className="text-lg font-semibold">{name}</h4>
      <p className="text-sm text-slate-400">{title}</p>
    </div>
  </div>
);