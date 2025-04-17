"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"  // Using the correct toast import
import { ArrowRight, GraduationCap } from "lucide-react"
import Link from "next/link"
import { signInWithEmailAndPassword } from "firebase/auth"
import { auth, db } from "@/lib/firebase"
import { doc, getDoc } from "firebase/firestore"
import { useAuth } from "@/lib/auth-provider"
import { signOut } from "firebase/auth"
import Image from "next/image"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { setUser } = useAuth()

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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      // Get user role from Firestore
      const userDoc = await getDoc(doc(db, "users", user.uid))

      if (userDoc.exists()) {
        const userData = userDoc.data()
        setUser({
          uid: user.uid,
          email: user.email,
          role: userData.role,
          ...userData,
        })

        // Redirect based on role
        switch (userData.role) {
          case "admin":
            router.push("/admin/dashboard")
            break
          case "principal":
            router.push("/principal/dashboard")
            break
          case "teacher":
            router.push("/teacher/dashboard")
            break
          case "student":
            router.push("/student/dashboard")
            break
            case "super-admin":
              router.push("/super-admin/dashboard")
              break
          default:
            router.push("/")
        }

        // Use success toast with the right syntax
        toast.success(`Welcome back, ${userData.name || user.email}!`)
      } else {
        // Use error toast with the correct syntax
        toast.error("User profile not found")
      }
    } catch (error: any) {
      toast.error(error.message || "Please check your credentials and try again")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-2">
            <Image src="/logo.png" width={50} height={50} alt="logo" />
          </div>
          <CardTitle className="text-3xl">Vidhyalaya</CardTitle>
          <CardDescription>Enter your credentials to access your account</CardDescription>
        </CardHeader>
        <div className="text-center text-sm text-muted-foreground mt-10">
            {user ? (
                  <>
                  <div className="flex flex-col gap-5 items-center">
                    <Link
                      href={`/${user.role}/dashboard`}
                      className="text-gray-300 text-xl flex items-center justify-center gap-3 hover:text-white w-52 bg-black px-3 py-2 rounded-md cursor-pointer"
                    >
                      Dashboard <ArrowRight width={20} height={20} />
                    </Link>
                    <button onClick={handleSignOut} className="text-gray-300 text-md hover:text-white bg-black px-3 py-2 rounded-md cursor-pointer">
                      Sign Out
                    </button>
                    </div>
                  </>
                ) : (
                  <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link href="/forgot-password" className="text-sm text-primary hover:underline">
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4 mt-5">
            <Button type="submit" className="w-full cursor-pointer" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Sign in"}
            </Button>
            <Link href="/login" className="text-gray-300 hover:text-white px-3 py-2 rounded-md">
               Back to home   
            </Link>
            
          </CardFooter>
        </form>
                )}
            </div>
      </Card>
    </div>
  )
}


