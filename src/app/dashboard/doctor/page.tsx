import { redirect } from 'next/navigation'

// The doctor section has no standalone index; send users to their primary landing page.
export default function DoctorIndexPage() {
    redirect('/dashboard/doctor/patients')
}
