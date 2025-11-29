'use client'

import { useEffect, Suspense } from "react"
import { motion } from "framer-motion"
import { Spinner } from "@/components/ui/spinner"
import { useRouter } from "next/navigation"

import { Header } from "@/components/layout/Header"
import { Sidebar } from "@/components/layout/Sidebar"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()

  useEffect(() => {
    // Check for authentication token
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      router.refresh()
    }
  }, [router])

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0">
        <Header />
        <Suspense fallback={<div className="flex h-screen items-center justify-center p-8">
          <Spinner />
        </div>}>
          <motion.main
            className="flex-1 p-6 lg:p-8 overflow-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.main>
        </Suspense>
      </div>
    </div>
  )
}
