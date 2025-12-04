'use client'

import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { DollarSign, FileText, CreditCard } from 'lucide-react'
import type { Invoice } from '@/types/billing'
import { format } from 'date-fns'

interface InvoicesTableProps {
  invoices: Invoice[]
  onProcessPayment?: (invoice: Invoice) => void
}

export function InvoicesTable({ invoices, onProcessPayment }: InvoicesTableProps) {
  return (
    <div className="rounded-md border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Invoice #</TableHead>
            <TableHead>Patient</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Patient Due</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.map((invoice) => (
            <TableRow key={invoice.id}>
              <TableCell className="font-medium">#{invoice.id}</TableCell>
              <TableCell>
                <div className="flex items-center space-x-3">
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center font-medium text-xs text-muted-foreground">
                    {invoice.patient.fullName.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium">{invoice.patient.fullName}</p>
                    <p className="text-sm text-muted-foreground">
                      {invoice.patient.nationalId}
                    </p>
                  </div>
                </div>
              </TableCell>
              <TableCell className="font-medium">
                RWF {invoice.total.toLocaleString()}
              </TableCell>
              <TableCell>
                <span className="font-semibold text-primary">
                  RWF {invoice.patientDue.toLocaleString()}
                </span>
              </TableCell>
              <TableCell>
                <Badge variant={invoice.status === 'paid' ? 'default' : 'secondary'}>
                  {invoice.status.toUpperCase()}
                </Badge>
              </TableCell>
              <TableCell className="text-sm">
                {format(invoice.createdAt, 'MMM dd, yyyy')}
              </TableCell>
              <TableCell className="space-x-2">
                <Button variant="outline" size="sm" title="View Details">
                  <FileText className="h-4 w-4" />
                </Button>
                {invoice.status !== 'paid' && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => onProcessPayment?.(invoice)}
                    title="Process Payment"
                  >
                    <CreditCard className="h-4 w-4" />
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {invoices.length === 0 && (
        <div className="p-8 text-center text-muted-foreground">
          No invoices matching filters.
        </div>
      )}
    </div>
  )
}