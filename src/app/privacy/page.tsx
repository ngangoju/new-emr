import Link from 'next/link'
import { PageHeader } from '@/components/layout/PageHeader'

export const metadata = { title: 'Privacy Policy | New EMR' }

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <PageHeader title="Privacy Policy" description="How we handle your data" />
      <div className="mt-6 space-y-4 text-sm text-muted-foreground">
        <p>
          This is a placeholder privacy policy for the New EMR demonstration deployment.
          Replace this page with your organization&apos;s approved policy before processing
          real patient data.
        </p>
        <p>
          Patient health information (PHI) is encrypted at rest and in transit. Access is
          audited via role-based permissions and view-level audit logging.
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
