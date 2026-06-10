'use client'

import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  ImageIcon,
  Info,
  ShieldCheck,
  CheckCircle2,
  Stethoscope,
  ClipboardCheck,
  Save,
} from 'lucide-react'
import { 
  useImagingResult, 
  useUpdateImagingResult, 
  useSignImagingResult,
  useDicomImages
} from '@/hooks/useImaging'
// Actually hook for ICD10 is in a different file, let me fix imports
import { useICD10 as useICD10Hook } from '@/hooks/useICD10'
import type { ImagingOrder } from '@/types/imaging'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

interface ReportingFormProps {
  order: ImagingOrder | null
  onOpenChange: (open: boolean) => void
}

export function ReportingForm({ order, onOpenChange }: ReportingFormProps) {
  const { data: result, isLoading: loadingResult } = useImagingResult(order?.id || '')
  const { data: images = [] } = useDicomImages(result?.id || '')
  const { icd10 = [] } = useICD10Hook()
  
  const updateResult = useUpdateImagingResult()
  const signResult = useSignImagingResult()
  
  const [findings, setFindings] = useState('')
  const [impression, setImpression] = useState('')
  const [recommendations, setRecommendations] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isSigning, setIsSigning] = useState(false)

  useEffect(() => {
    if (result) {
      setFindings(result.findings || '')
      setImpression(result.impression || '')
      setRecommendations(result.recommendations || '')
    }
  }, [result])

  const handleSave = async () => {
    if (!result) return
    setIsSaving(true)
    try {
      await updateResult.mutateAsync({
        resultId: result.id,
        payload: { findings, impression, recommendations }
      })
      toast.success('Report saved successfully.')
    } catch {
      toast.error('Failed to save report.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSignOff = async () => {
    if (!result) return
    if (!findings || !impression) {
        toast.error('Findings and Impression are required before sign-off.')
        return
    }

    setIsSigning(true)
    const toastId = toast.loading('Signing off report...')
    try {
      // First save current changes
      await updateResult.mutateAsync({
        resultId: result.id,
        payload: { findings, impression, recommendations }
      })
      
      // Then sign
      await signResult.mutateAsync(result.id)
      toast.success('Report signed and published.', { id: toastId })
      onOpenChange(false)
    } catch {
      toast.error('Failed to sign report.', { id: toastId })
    } finally {
      setIsSigning(false)
    }
  }

  if (!order) return null

  return (
    <Dialog open={!!order} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-0 border-b">
          <div className="flex items-center justify-between mb-2">
            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-100">
               Radiology Reporting
            </Badge>
            <div className="flex gap-2">
                {result?.radiologistSigned && (
                    <Badge className="bg-green-100 text-green-800 border-green-200">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Signed & Verified
                    </Badge>
                )}
                <Badge variant={order.priority === 'EMERGENCY' ? 'destructive' : 'secondary'}>
                {order.priority}
                </Badge>
            </div>
          </div>
          <DialogTitle className="text-2xl font-bold">
            {order.imagingType} - {order.patientFirstName} {order.patientLastName}
          </DialogTitle>
          <div className="flex gap-4 mt-2 mb-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Info className="h-3 w-3" /> Patient ID: {order.patientId.substring(0, 8)}</span>
            <span className="flex items-center gap-1"><Info className="h-3 w-3" /> Body Part: {order.bodyPart || 'N/A'}</span>
            <span className="flex items-center gap-1"><Info className="h-3 w-3" /> Ordered: {format(new Date(order.orderedAt), 'MMM d, HH:mm')}</span>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 h-full">
            {/* Left Column: DICOM Metadata & Images */}
            <div className="md:col-span-1 bg-muted/30 border-r p-4 space-y-4">
               <div className="space-y-2">
                 <Label className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground flex items-center gap-2">
                    <ImageIcon className="h-3 w-3" />
                    Study Acquisition
                 </Label>
                 <div className="space-y-2">
                   {images.length === 0 ? (
                     <div className="text-xs italic text-muted-foreground p-4 text-center border rounded-lg bg-background">
                        No DICOM data available for this report.
                     </div>
                   ) : (
                     images.map((img) => (
                       <Card key={img.id} className="shadow-none border-muted-foreground/10 bg-background/50">
                         <CardContent className="p-2 space-y-1">
                            <div className="text-[10px] font-mono truncate">{img.fileName}</div>
                            <div className="flex justify-between text-[8px] text-muted-foreground">
                                <span>{img.modality} | {img.bodyPart || 'Unspecified'}</span>
                                <span>{(img.fileSize / 1024 / 1024).toFixed(1)} MB</span>
                            </div>
                         </CardContent>
                       </Card>
                     ))
                   )}
                 </div>
               </div>

               <div className="space-y-2">
                 <Label className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground flex items-center gap-2">
                    <Stethoscope className="h-3 w-3" />
                    Clinical History
                 </Label>
                 <div className="text-xs bg-blue-50/50 p-3 rounded-lg border border-blue-100 italic">
                    {order.instructions || 'No special clinical instructions provided by the ordering physician.'}
                 </div>
               </div>
            </div>

            {/* Right Column: Findings Entry */}
            <div className="md:col-span-2 p-6 space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="findings" className="font-semibold text-sm">Findings</Label>
                  <Textarea 
                    id="findings" 
                    placeholder="Describe detailed radiological observations..." 
                    className="min-h-[150px] resize-none"
                    value={findings}
                    onChange={(e) => setFindings(e.target.value)}
                    disabled={result?.radiologistSigned || loadingResult}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="impression" className="font-semibold text-sm">Impression / Diagnosis</Label>
                  <Textarea 
                    id="impression" 
                    placeholder="Summarize key findings and diagnostic conclusion..." 
                    className="min-h-[100px] resize-none"
                    value={impression}
                    onChange={(e) => setImpression(e.target.value)}
                    disabled={result?.radiologistSigned || loadingResult}
                  />
                </div>

                <div className="space-y-2">
                    <Label className="font-semibold text-sm">ICD-10 Diagnostic Coding</Label>
                    <Select disabled={result?.radiologistSigned || loadingResult}>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select diagnosis code..." />
                        </SelectTrigger>
                        <SelectContent>
                            {icd10.map(item => (
                                <SelectItem key={item.code} value={item.code}>
                                    <span className="font-mono font-bold mr-2">{item.code}</span>
                                    {item.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="recommendations" className="font-semibold text-sm text-muted-foreground">Recommendations (Optional)</Label>
                  <Textarea 
                    id="recommendations" 
                    placeholder="Next steps, follow-up imaging, or clinical correlation..." 
                    className="min-h-[80px] resize-none"
                    value={recommendations}
                    onChange={(e) => setRecommendations(e.target.value)}
                    disabled={result?.radiologistSigned || loadingResult}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="p-6 bg-muted/10 border-t items-center sm:justify-between">
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
            <ClipboardCheck className="h-3 w-3" />
            V9 Diagnostic Workflow
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Discard Changes
            </Button>
            {!result?.radiologistSigned && (
                <>
                    <Button 
                        variant="secondary" 
                        onClick={handleSave} 
                        disabled={isSaving || isSigning || loadingResult}
                        className="gap-2"
                    >
                        <Save className="h-4 w-4" />
                        Save Draft
                    </Button>
                    <Button 
                        variant="default" 
                        onClick={handleSignOff} 
                        disabled={isSaving || isSigning || loadingResult}
                        className="bg-green-600 hover:bg-green-700 gap-2"
                    >
                        <ShieldCheck className="h-4 w-4" />
                        Sign & Publish Report
                    </Button>
                </>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
