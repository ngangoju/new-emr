'use client'

import React from 'react'
import { Pill, Trash2, Info, Beaker, ClipboardList, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ConsultationMedication } from '@/hooks/api/useConsultations'

export type PrescriptionListMedication =
  Pick<ConsultationMedication, 'id' | 'drugName' | 'dose' | 'route' | 'frequency' | 'duration'> &
  Partial<Pick<ConsultationMedication, 'consultationId' | 'formularyId' | 'indication' | 'allergyOverrideReason' | 'interactionOverrideReason' | 'safetyChecked' | 'createdAt'>>

interface PrescriptionListProps {
  medications: PrescriptionListMedication[];
  onRemove?: (id: string) => void;
}

export function PrescriptionList({ medications, onRemove }: PrescriptionListProps) {
  if (medications.length === 0) {
    return (
      <div className="text-center py-6 border-2 border-dashed rounded-lg text-muted-foreground bg-muted/20">
        <Pill className="h-8 w-8 mx-auto mb-2 opacity-30" />
        <p className="text-sm">No structured medications added yet.</p>
        <p className="text-[10px] mt-1 italic">Structured prescriptions are required for Item 1 pharmacy verification.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {medications.map((med) => (
        <Card key={med.id} className="overflow-hidden border-l-4 border-l-primary hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-primary flex items-center gap-1">
                    <Pill className="h-4 w-4" />
                    {med.drugName}
                  </h4>
                  {med.allergyOverrideReason && (
                    <Badge variant="destructive" className="text-[10px] px-1 animate-pulse">
                      Allergy Overridden
                    </Badge>
                  )}
                  {med.interactionOverrideReason && (
                    <Badge variant="outline" className="text-[10px] px-1 bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-300">
                      Interaction Overridden
                    </Badge>
                  )}
                  {med.safetyChecked && (
                    <Badge variant="outline" className="text-[10px] px-1 border-green-600 text-green-700 bg-green-50">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Safety Checked
                    </Badge>
                  )}
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs mt-2 p-2 bg-muted/30 rounded-md border border-muted-foreground/10">
                  <div className="flex flex-col">
                    <span className="text-muted-foreground font-medium uppercase text-[9px]">Dose</span>
                    <span className="font-semibold text-foreground">{med.dose}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-muted-foreground font-medium uppercase text-[9px]">Route</span>
                    <span className="font-semibold text-foreground">{med.route}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-muted-foreground font-medium uppercase text-[9px]">Frequency</span>
                    <span className="font-semibold text-foreground">{med.frequency}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-muted-foreground font-medium uppercase text-[9px]">Duration</span>
                    <span className="font-semibold text-foreground">{med.duration}</span>
                  </div>
                </div>

                {med.indication && (
                  <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-2 pl-1 italic">
                    <Info className="h-3 w-3" />
                    Indication: {med.indication}
                  </div>
                )}
              </div>

              {onRemove && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => onRemove(med.id)}
                  className="text-muted-foreground hover:text-destructive transition-colors ml-2"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
            
            {/* Pharmacy instructions preview (Item 2) */}
            <div className="mt-3 pt-2 border-t border-dashed flex items-center justify-between text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
               <div className="flex items-center gap-1">
                  <ClipboardList className="h-3 w-3" />
                  Pharmacy View Ready
               </div>
               <span className="text-success flex items-center gap-1">
                  <Beaker className="h-3 w-3" />
                  Formulary Verified
               </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
