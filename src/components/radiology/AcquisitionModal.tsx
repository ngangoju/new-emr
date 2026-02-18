'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { 
  Upload, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  ShieldCheck,
  Info,
  Image as ImageIcon
} from 'lucide-react'
import { 
  useImagingResult, 
  useCreateImagingResult, 
  useUploadDicomImage, 
  useDicomImages,
  useUpdateImagingOrderStatus
} from '@/hooks/useImaging'
import type { ImagingOrder } from '@/types/imaging'
import toast from 'react-hot-toast'

interface AcquisitionModalProps {
  order: ImagingOrder | null
  onOpenChange: (open: boolean) => void
}

export function AcquisitionModal({ order, onOpenChange }: AcquisitionModalProps) {
  const { data: result } = useImagingResult(order?.id || '')
  const { data: images = [] } = useDicomImages(result?.id || '')
  
  const createResult = useCreateImagingResult()
  const uploadImage = useUploadDicomImage()
  const updateStatus = useUpdateImagingOrderStatus()
  
  const [isUploading, setIsUploading] = useState(false)
  const [isFinishing, setIsFinishing] = useState(false)
  
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !order) return

    // Verify it's a DICOM file or at least has the extension
    if (!file.name.toLowerCase().endsWith('.dcm') && !file.name.toLowerCase().endsWith('.dicom')) {
        toast.error('Invalid file type. Please upload a .dcm or .dicom file.')
        return
    }

    setIsUploading(true)
    const toastId = toast.loading(`Uploading DICOM: ${file.name}...`)

    try {
      let currentResult = result

      // 1. Create result if it doesn't exist
      if (!currentResult) {
        currentResult = await createResult.mutateAsync({
          imagingOrderId: order.id,
          techNotes: `Study acquisition started for ${order.imagingType}`,
          reportedBy: '00000000-0000-0000-0000-000000000000', // Backend will replace with current user
          radiologistSigned: false
        })
      }

      // 2. Upload file
      await uploadImage.mutateAsync({
        resultId: currentResult.id,
        file: file,
        metadata: {
          fileName: file.name,
          fileSize: file.size,
          modality: order.imagingType.substring(0, 2).toUpperCase(), // Naive mapping e.g. CT -> CT
          bodyPart: order.bodyPart
        }
      })

      toast.success('DICOM image uploaded and order updated.', { id: toastId })
    } catch (error) {
      console.error('Upload failed:', error)
      toast.error('Upload failed. Check console for details.', { id: toastId })
    } finally {
      setIsUploading(false)
    }
  }

  if (!order) return null

  return (
    <Dialog open={!!order} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-center justify-between mb-2">
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-100 italic">
               Acquisition Flow
            </Badge>
            <Badge variant={order.priority === 'EMERGENCY' ? 'destructive' : 'secondary'}>
              {order.priority}
            </Badge>
          </div>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            {order.imagingType} Acquisition
          </DialogTitle>
          <DialogDescription className="flex items-center gap-2 mt-1">
            <Info className="h-4 w-4 text-primary" />
            Patient: {order.patientFirstName} {order.patientLastName} ({order.patientId.substring(0, 8)})
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 space-y-6 overflow-hidden flex flex-col">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
                <Label className="text-xs text-muted-foreground uppercase font-semibold">Body Part</Label>
                <div className="text-sm font-medium">{order.bodyPart || 'General'}</div>
            </div>
            <div className="space-y-1">
                <Label className="text-xs text-muted-foreground uppercase font-semibold">Order ID</Label>
                <div className="text-sm font-mono truncate">{order.id}</div>
            </div>
          </div>

          <div className="space-y-4">
            <Label className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                DICOM Series Upload
            </Label>
            
            <div className="border-2 border-dashed border-primary/20 rounded-xl p-8 transition-colors hover:border-primary/40 bg-muted/30">
                <div className="flex flex-col items-center justify-center text-center space-y-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                        <Upload className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <p className="text-sm font-medium">Click to select study files</p>
                        <p className="text-xs text-muted-foreground mt-1">Supports .dcm, .dicom (Direct stream to MinIO)</p>
                    </div>
                    <Input 
                        type="file" 
                        id="dicom-upload" 
                        className="hidden" 
                        onChange={handleFileUpload}
                        disabled={isUploading}
                        accept=".dcm,.dicom"
                    />
                    <Button 
                        asChild 
                        variant="secondary" 
                        size="sm"
                        disabled={isUploading}
                    >
                        <label htmlFor="dicom-upload" className="cursor-pointer">
                            {isUploading ? 'Streaming to MinIO...' : 'Select DICOM File'}
                        </label>
                    </Button>
                </div>
            </div>
          </div>

          <div className="flex-1 min-h-0 flex flex-col space-y-3">
             <Label className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Uploaded Instances ({images.length})
            </Label>
            <div className="flex-1 bg-muted/20 rounded-lg border p-2 overflow-y-auto max-h-[200px]">
                {images.length === 0 ? (
                    <div className="flex items-center justify-center h-24 text-xs text-muted-foreground italic">
                        No instances uploaded yet for this series.
                    </div>
                ) : (
                    <div className="space-y-2">
                        {images.map((img) => (
                            <div key={img.id} className="flex items-center justify-between p-2 bg-card border rounded-md shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-blue-50 rounded flex items-center justify-center">
                                        <ImageIcon className="h-4 w-4 text-blue-600" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-xs font-medium truncate max-w-[200px]">{img.fileName}</span>
                                        <span className="text-[10px] text-muted-foreground">{(img.fileSize / 1024 / 1024).toFixed(2)} MB</span>
                                    </div>
                                </div>
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                            </div>
                        ))}
                    </div>
                )}
            </div>
          </div>
        </div>

        <DialogFooter className="p-6 bg-muted/10 border-t items-center sm:justify-between">
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
            <ShieldCheck className="h-3 w-3" />
            V9 Security Scope
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            <Button 
                variant="default" 
                className="bg-green-600 hover:bg-green-700"
                disabled={isFinishing || images.length === 0}
                onClick={async () => {
                    if (!order) return
                    setIsFinishing(true)
                    try {
                        await updateStatus.mutateAsync({ orderId: order.id, status: 'COMPLETED' })
                        toast.success('Acquisition phase marked as completed.')
                        onOpenChange(false)
                    } catch (error) {
                        toast.error('Failed to complete acquisition.')
                    } finally {
                        setIsFinishing(false)
                    }
                }}
            >
              {isFinishing ? 'Completing...' : 'Finish Acquisition'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
