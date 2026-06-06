import { redirect } from 'next/navigation'

// Cashiers land on the billing workspace; the bare /dashboard/cashier route redirects there.
export default function CashierIndexPage() {
    redirect('/dashboard/billing')
}
