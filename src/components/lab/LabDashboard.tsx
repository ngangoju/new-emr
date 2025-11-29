
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Clock, CheckCircle2, FileCheck, TestTube, Download } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { useLabOrders } from '@/hooks/useLabOrders'
import type { LabOrder } from '@/types/lab'

export function LabDashboard() {
  const { pending, completed, stats } = useLabOrders()

  const handleEnterResults = (order: LabOrder) => {
    alert(`Open Results Dialog for ${order.patientName} - ${order.testType}\n\nMock: Form with fields based on testType (NFS numbers, Generic text/file, Imaging dropzone).\nSubmit calls useUploadResult to update status.`)
  }

  const handlePDFExport = () => {
    alert('PDF exported (mock download)')
  }

  return (
    <>
      <PageHeader
        title="Lab Dashboard"
        description="Pending orders table, results entry, imaging upload, completed table with PDF export."
      />
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Today</CardTitle>
            <Clock className="h-5 w-5 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingToday}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
            <CheckCircle2 className="h