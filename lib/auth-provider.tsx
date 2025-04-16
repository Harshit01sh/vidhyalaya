"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "./firebase";
import { doc, getDoc } from "firebase/firestore";
import { useRouter, usePathname } from "next/navigation";

type UserType = {
  uid: string;
  email: string | null;
  role: "super-admin" | "principal" | "teacher" | "student" | "admin" | null;
  name?: string;
  classSectionId?: string; // Explicitly added for StudentFees
  [key: string]: any; // Keep for other dynamic properties
} | null;

type AuthContextType = {
  user: UserType;
  loading: boolean;
  setUser: (user: UserType) => void; // Added setUser to the interface
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  setUser: () => {}, // Default empty function for initialization
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserType>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              role: userData.role,
              name: userData.name,
              classSectionId: userData.classSectionId,
              ...userData,
            });
          } else {
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              role: null,
              classSectionId: undefined,
            });
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            role: null,
            classSectionId: undefined,
          });
        }
      } else {
        setUser(null);

        // Redirect to login if trying to access protected routes
        const protectedRoutes = ["/super-admin", "/principal", "/teacher", "/student", "/admin"];
        if (protectedRoutes.some((route) => pathname.startsWith(route))) {
          router.push("/login");
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [pathname, router]);

  return (
    <AuthContext.Provider value={{ user, loading, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};