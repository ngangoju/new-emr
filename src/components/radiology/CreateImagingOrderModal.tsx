'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
  Stethoscope, 
  AlertCircle,
  Image as ImageIcon,
  Activity
} from 'lucide-react'
import { useCreateImagingOrder } from '@/hooks/useImaging'
import toast from 'react-hot-toast'

interface CreateImagingOrderModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  patientId: string
  consultId?: string
  patientName?: string
}

const IMAGING_TYPES = [
  { value: 'X-Ray', label: 'X-Ray', icon: '🦴' },
  { value: 'Ultrasound', label: 'Ultrasound', icon: '🔊' },
  { value: 'CT', label: 'CT Scan', icon: '🔍' },
  { value: 'MRI', label: 'MRI', icon: '🧲' },
  { value: 'Mammography', label: 'Mammography', icon: '🎗️' },
  { value: 'Fluoroscopy', label: 'Fluoroscopy', icon: '📹' },
  { value: 'Dental X-Ray', label: 'Dental X-Ray', icon: '🦷' },
]

const COMMON_BODY_PARTS = [
  'Chest', 'Abdomen', 'Head', 'Brain', 'Spine', 'Pelvis',
  'Upper Extremity', 'Lower Extremity', 'Hand', 'Foot',
  'Knee', 'Shoulder', 'Hip', 'Ankle', 'Wrist', 'Elbow'
]

export function CreateImagingOrderModal({ 
  open, 
  onOpenChange, 
  patientId, 
  consultId,
  patientName 
}: CreateImagingOrderModalProps) {
  const createOrder = useCreateImagingOrder()
  
  const [imagingType, setImagingType] = useState('')
  const [bodyPart, setBodyPart] = useState('')
  const [priority, setPriority] = useState<'ROUTINE' | 'URGENT' | 'EMERGENCY'>('ROUTINE')
  const [instructions, setInstructions] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    // Validation
    if (!imagingType) {
      toast.error('Please select an imaging type')
      return
    }

    if (!instructions || instructions.trim().length < 20) {
      toast.error('Clinical indication must be at least 20 characters to provide adequate context for the radiologist')
      return
    }

    setIsSubmitting(true)
    try {
      await createOrder.mutateAsync({
        patientId,
        consultId,
        imagingType,
        bodyPart: bodyPart || undefined,
        priority,
        instructions: instructions.trim()
      })
      
      toast.success(`${imagingType} order created successfully`)
      
      // Reset form
      setImagingType('')
      setBodyPart('')
      setPriority('ROUTINE')
      setInstructions('')
      onOpenChange(false)
    } catch (error) {
      toast.error('Failed to create imaging order')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    setImagingType('')
    setBodyPart('')
    setPriority('ROUTINE')
    setInstructions('')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <div className="flex items-center justify-between mb-2">
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              <ImageIcon className="h-3 w-3 mr-1" />
              New Imaging Order
            </Badge>
            {patientName && (
              <span className="text-sm text-muted-foreground">
                Patient: <span className="font-medium">{patientName}</span>
              </span>
            )}
          </div>
          <DialogTitle className="text-xl font-bold">Order Imaging Study</DialogTitle>
          <DialogDescription>
            Specify the imaging modality, anatomical region, and clinical indication for the radiologist.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* Imaging Type Selection */}
          <div className="space-y-2">
            <Label htmlFor="imaging-type" className="font-semibold text-sm flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Imaging Modality <span className="text-red-500">*</span>
            </Label>
            <Select value={imagingType} onValueChange={setImagingType}>
              <SelectTrigger id="imaging-type">
                <SelectValue placeholder="Select imaging type..." />
              </SelectTrigger>
              <SelectContent>
                {IMAGING_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <span className="flex items-center gap-2">
                      <span>{type.icon}</span>
                      <span>{type.label}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Body Part */}
          <div className="space-y-2">
            <Label htmlFor="body-part" className="font-semibold text-sm">
              Anatomical Region
            </Label>
            <div className="flex gap-2">
              <Select value={bodyPart} onValueChange={setBodyPart}>
                <SelectTrigger id="body-part" className="flex-1">
                  <SelectValue placeholder="Select or type body part..." />
                </SelectTrigger>
                <SelectContent>
                  {COMMON_BODY_PARTS.map((part) => (
                    <SelectItem key={part} value={part}>
                      {part}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input 
                placeholder="Or type custom..." 
                value={bodyPart}
                onChange={(e) => setBodyPart(e.target.value)}
                className="flex-1"
              />
            </div>
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <Label htmlFor="priority" className="font-semibold text-sm flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Priority <span className="text-red-500">*</span>
            </Label>
            <Select value={priority} onValueChange={(val) => setPriority(val as any)}>
              <SelectTrigger id="priority">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ROUTINE">
                  <span className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">ROUTINE</Badge>
                    <span className="text-xs text-muted-foreground">Standard scheduling</span>
                  </span>
                </SelectItem>
                <SelectItem value="URGENT">
                  <span className="flex items-center gap-2">
                    <Badge variant="default" className="bg-orange-500 text-xs">URGENT</Badge>
                    <span className="text-xs text-muted-foreground">Same-day preferred</span>
                  </span>
                </SelectItem>
                <SelectItem value="EMERGENCY">
                  <span className="flex items-center gap-2">
                    <Badge variant="destructive" className="text-xs">EMERGENCY</Badge>
                    <span className="text-xs text-muted-foreground">Immediate acquisition</span>
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Clinical Indication */}
          <div className="space-y-2">
            <Label htmlFor="instructions" className="font-semibold text-sm flex items-center gap-2">
              <Stethoscope className="h-4 w-4" />
              Clinical Indication <span className="text-red-500">*</span>
            </Label>
            <Textarea 
              id="instructions"
              placeholder="Provide detailed clinical context for the radiologist (minimum 20 characters)&#10;&#10;Example: 45-year-old male with acute onset right lower quadrant pain, fever, and leukocytosis. Rule out appendicitis."
              className="min-h-[120px] resize-none"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
            />
            <div className="flex items-center justify-between text-xs">
              <span className={instructions.length < 20 ? 'text-red-500' : 'text-muted-foreground'}>
                {instructions.length} / 20 characters minimum
              </span>
              {instructions.length >= 20 && (
                <span className="text-green-600 font-medium">✓ Adequate clinical context</span>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting || !imagingType || instructions.length < 20}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isSubmitting ? 'Creating Order...' : 'Create Imaging Order'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
