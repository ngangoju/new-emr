'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import Link from "next/link"
import { LogIn, User, Lock, Stethoscope, Heart, Activity } from "lucide-react"
import { useLogin } from '@/hooks/api/useAuth'
import toast from 'react-hot-toast'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { loginSchema, type LoginInput } from '@/lib/validations/auth'
import { getAccessToken, getSessionUser, setSessionUser } from '@/lib/utils/auth'

export default function LoginPage() {
  const router = useRouter()
  
  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
      role: 'DOCTOR',
    },
  })

  const loginMutation = useLogin()

  useEffect(() => {
    if (getAccessToken() && getSessionUser()) {
      router.replace('/dashboard')
    }
  }, [router])

  const onSubmit = (data: LoginInput) => {
    loginMutation.mutate(
      { username: data.username, password: data.password },
      {
        onSuccess: (user) => {
          toast.success(`Welcome back, ${user.username || user.email}!`)
          setSessionUser(user)
          router.replace('/dashboard')
        },
        onError: (error: any) => {
          toast.error(error?.response?.data?.message || 'Login failed. Please check your credentials.')
        }
      }
    )
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      {/* Left Hero Section */}
      <motion.div 
        className="relative hidden lg:flex items-center justify-center bg-gradient-to-br from-primary/10 via-primary/5 to-background p-12 overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            className="absolute top-20 left-20 w-72 h-72 bg-primary/5 rounded-full blur-3xl"
            animate={{
              x: [0, 30, 0],
              y: [0, -30, 0],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <motion.div
            className="absolute bottom-20 right-20 w-96 h-96 bg-accent/5 rounded-full blur-3xl"
            animate={{
              x: [0, -40, 0],
              y: [0, 40, 0],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </div>

        {/* Main Content */}
        <div className="text-center z-10 max-w-lg">
          <motion.div
            className="mb-8 mx-auto"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent rounded-3xl blur-xl opacity-50 animate-pulse" />
              <div className="relative w-32 h-32 bg-gradient-to-br from-primary via-primary/90 to-accent rounded-3xl flex items-center justify-center shadow-2xl">
                <Stethoscope className="h-16 w-16 text-primary-foreground" />
              </div>
            </div>
          </motion.div>

          <motion.h1 
            className="font-heading text-6xl font-bold text-foreground mb-6 leading-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            Modern EMR
          </motion.h1>

          <motion.p 
            className="text-xl text-muted-foreground max-w-md mx-auto leading-relaxed mb-8"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            Revolutionizing Healthcare Management with intuitive, beautiful, and performant technology
          </motion.p>

          {/* Feature Pills */}
          <motion.div 
            className="flex flex-wrap justify-center gap-3"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            <div className="flex items-center space-x-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
              <Heart className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-foreground">Patient-Centric</span>
            </div>
            <div className="flex items-center space-x-2 px-4 py-2 rounded-full bg-success/10 border border-success/20">
              <Activity className="h-4 w-4 text-success" />
              <span className="text-sm font-medium text-foreground">Real-time Updates</span>
            </div>
            <div className="flex items-center space-x-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20">
              <Stethoscope className="h-4 w-4 text-accent" />
              <span className="text-sm font-medium text-foreground">Comprehensive Care</span>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Right Form Section */}
      <div className="flex items-center justify-center p-8 lg:p-12">
        <motion.div
          className="w-full max-w-md"
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="shadow-2xl border-border/50 backdrop-blur">
            <CardHeader className="space-y-1 pb-6">
              <CardTitle className="text-3xl font-heading font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Welcome Back
              </CardTitle>
              <CardDescription className="text-base">
                Enter your credentials to access your dashboard
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-5">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium flex items-center">
                          <User className="h-4 w-4 mr-2 text-primary" />
                          Username
                        </FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="ngango" 
                            className="h-11"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium flex items-center">
                          <Lock className="h-4 w-4 mr-2 text-primary" />
                          Password
                        </FormLabel>
                        <FormControl>
                          <Input 
                            type="password" 
                            placeholder="••••••••" 
                            className="h-11"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">Select Your Role</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-11">
                              <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="USER">User</SelectItem>
                            <SelectItem value="DOCTOR">
                              <div className="flex items-center">
                                <Stethoscope className="h-4 w-4 mr-2" />
                                Doctor
                              </div>
                            </SelectItem>
                            <SelectItem value="NURSE">Nurse</SelectItem>
                            <SelectItem value="RECEPTIONIST">Receptionist</SelectItem>
                            <SelectItem value="PHARMACIST">Pharmacist</SelectItem>
                            <SelectItem value="LAB_TECH">Lab Technician</SelectItem>
                            <SelectItem value="BILLING_OFFICER">Billing Officer</SelectItem>
                            <SelectItem value="CASHIER">Cashier</SelectItem>
                            <SelectItem value="AUDITOR">Auditor</SelectItem>
                            <SelectItem value="ADMIN">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex items-center justify-between pt-2">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary focus:ring-offset-0 transition"
                      />
                      <span className="text-sm text-muted-foreground select-none">Remember me</span>
                    </label>
                    <Link 
                      href="/forgot-password" 
                      className="text-sm text-primary hover:text-primary/80 font-medium transition-colors"
                    >
                      Forgot password?
                    </Link>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full h-11 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                    disabled={loginMutation.isPending}
                  >
                    {loginMutation.isPending ? (
                      <div className="flex items-center space-x-2">
                        <div className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                        <span>Signing in...</span>
                      </div>
                    ) : (
                      <>
                        <LogIn className="h-4 w-4 mr-2" />
                        Sign In
                      </>
                    )}
                  </Button>
                </form>
              </Form>

              <div className="text-center text-sm text-muted-foreground pt-4">
                Need an account?{' '}
                <Link href="/register" className="text-primary hover:text-primary/80 font-medium transition-colors">
                  Contact Administrator
                </Link>
              </div>
            </CardContent>
          </Card>

          <p className="text-center text-xs text-muted-foreground mt-6">
            By signing in, you agree to our{' '}
            <Link href="/terms" className="underline hover:text-foreground transition-colors">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="underline hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
