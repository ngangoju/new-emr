'use client'

import Link from 'next/link'
import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { ArrowLeft, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { contactAdministratorSchema, type ContactAdministratorInput } from '@/lib/validations/auth'
import { useContactAdministrator } from '@/hooks/api/useAuth'

export default function ContactAdministratorPage() {
  const contactMutation = useContactAdministrator()
  const [acknowledgement, setAcknowledgement] = useState('')

  const form = useForm<ContactAdministratorInput>({
    resolver: zodResolver(contactAdministratorSchema),
    defaultValues: {
      name: '',
      email: '',
      subject: '',
      message: '',
    },
  })

  const onSubmit = (values: ContactAdministratorInput) => {
    setAcknowledgement('')
    contactMutation.mutate(values, {
      onSuccess: (response) => {
        const reference = response?.reference ? ` Reference: ${response.reference}` : ''
        setAcknowledgement(`Your request has been received.${reference}`)
      },
    })
  }

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="w-full max-w-lg shadow-xl border-border/50">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl font-heading">Contact Administrator</CardTitle>
          <CardDescription>Submit your request and include enough detail for quick support.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Form {...form}>
            <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)} noValidate>
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full name</FormLabel>
                    <FormControl>
                      <Input placeholder="Your full name" autoComplete="name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email address</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="name@example.com" autoComplete="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject</FormLabel>
                    <FormControl>
                      <Input placeholder="Short summary" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Message</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Describe your request" rows={5} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={contactMutation.isPending}>
                <Send className="h-4 w-4 mr-2" />
                {contactMutation.isPending ? 'Submitting...' : 'Submit request'}
              </Button>
            </form>
          </Form>

          {acknowledgement ? (
            <p role="status" className="text-sm text-muted-foreground border rounded-md px-3 py-2 bg-muted/30">
              {acknowledgement}
            </p>
          ) : null}

          <Link
            href="/login"
            className="inline-flex items-center text-sm text-primary hover:text-primary/80 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to login
          </Link>
        </CardContent>
      </Card>
    </main>
  )
}
