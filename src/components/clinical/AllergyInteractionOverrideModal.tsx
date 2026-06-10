'use client'

import React, { useState } from 'react'
import { ShieldAlert } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface AllergyInteractionOverrideModalProps {
  isOpen: boolean;
  onClose: () => void;
  error: string;
  onConfirm: (reason: string) => void;
  isLoading?: boolean;
}

export function AllergyInteractionOverrideModal({ isOpen, onClose, error, onConfirm, isLoading }: AllergyInteractionOverrideModalProps) {
  const [reason, setReason] = useState("")
  
  const isAllergy = error.toLowerCase().includes("allergy")

  const handleConfirm = () => {
    if (!reason.trim()) return;
    onConfirm(reason);
    setReason("");
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] border-l-8 border-l-destructive">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive text-xl font-bold">
            <ShieldAlert className="h-6 w-6" />
            Clinical Safety Warning (Item 1/2)
          </DialogTitle>
          <DialogDescription className="pt-2 text-foreground font-medium">
            The following safety conflict was detected during prescription:
          </DialogDescription>
        </DialogHeader>

        <div className="bg-destructive/5 p-4 rounded-lg border-2 border-destructive/20 my-4">
          <p className="text-sm font-bold flex items-center gap-2 mb-2 uppercase text-destructive tracking-widest">
            {isAllergy ? "🚨 Patient Allergy Alert" : "🛑 Drug-Drug Interaction Alert"}
          </p>
          <p className="text-sm italic text-foreground leading-relaxed">
            &quot;{error}&quot;
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reason" className="font-bold text-sm">
              Clinical Override Rationale (Required)
            </Label>
            <Textarea
              id="reason"
              placeholder="Provide a specific clinical justification for overriding this safety warning (e.g. Benefit outweighs risk, alternate drugs tried...)"
              className="resize-none min-h-[100px] border-2 focus:border-primary"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
            <p className="text-[10px] text-muted-foreground italic">
              Important: This rationale will be permanently logged in the patient&apos;s audit trail for clinical safety review.
            </p>
          </div>
        </div>

        <DialogFooter className="flex gap-2 sm:justify-between mt-6">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel Prescription
          </Button>
          <Button 
            className="bg-destructive hover:bg-destructive/90 font-bold"
            disabled={!reason.trim() || isLoading}
            onClick={handleConfirm}
          >
            {isLoading ? "Saving Override..." : `Override & Save ${isAllergy ? "Allergy" : "Interaction"}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
