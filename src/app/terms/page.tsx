import Link from 'next/link'
import { PageHeader } from '@/components/layout/PageHeader'

export const metadata = { title: 'Terms of Service | New EMR' }

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <PageHeader title="Terms of Service" description="Usage terms for New EMR" />
      <div className="mt-6 space-y-4 text-sm text-muted-foreground">
        <p>
          This is a placeholder terms-of-service page for the New EMR demonstration
          deployment. Replace this page with your organization&apos;s approved terms before
          production use.
        </p>
        <p>
          By using this system you agree to comply with applicable healthcare data
          protection regulations and your organization&apos;s access policies.
        </p>
        <p>
          <Link href="/login" className="text-primary underline">
            Back to sign in
          </Link>
        </p>
      </div>
    </main>
  )
}
