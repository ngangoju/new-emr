'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { 
  User, 
  Activity, 
  Stethoscope, 
  Pill, 
  FileCheck,
  Clock,
  AlertCircle,
  CheckCircle2
} from 'lucide-react'

export type EncounterStage = 'TRIAGE' | 'CONSULTATION' | 'TREATMENT' | 'SIGN_OFF' | 'DRAFT'
export type WorkflowMode = 'MULTI_ACTOR' | 'SINGLE_ACTOR'

interface WorkflowStep {
  id: number
  name: string
  status: 'pending' | 'in_progress' | 'completed'
  icon: React.ElementType
}

interface WorkflowIndicatorProps {
  stage: EncounterStage
  workflowMode: WorkflowMode
  currentOwnerName?: string
  currentOwnerRole?: string
  steps?: WorkflowStep[]
  patientName?: string
  lastUpdated?: string
}

const stageConfig: Record<EncounterStage, { label: string; color: string; icon: React.ElementType }> = {
  TRIAGE: { label: 'Triage', color: 'bg-yellow-500', icon: Activity },
  CONSULTATION: { label: 'Consultation', color: 'bg-blue-500', icon: Stethoscope },
  TREATMENT: { label: 'Treatment', color: 'bg-purple-500', icon: Pill },
  SIGN_OFF: { label: 'Review & Sign', color: 'bg-green-500', icon: FileCheck },
  DRAFT: { label: 'Draft', color: 'bg-gray-500', icon: Clock },
}

const workflowStepNames = [
  { id: 1, name: 'Patient Selection', icon: User },
  { id: 2, name: 'Chief Complaint', icon: FileCheck },
  { id: 3, name: 'Vitals & Exam', icon: Activity },
  { id: 4, name: 'Diagnosis', icon: Stethoscope },
  { id: 5, name: 'Treatment Plan', icon: Pill },
  { id: 6, name: 'Review & Submit', icon: FileCheck },
]

export function WorkflowIndicator({
  stage = 'TRIAGE',
  workflowMode = 'MULTI_ACTOR',
  currentOwnerName,
  currentOwnerRole,
  steps,
  patientName,
  lastUpdated,
}: WorkflowIndicatorProps) {
  const config = stageConfig[stage] || stageConfig.DRAFT
  const StageIcon = config.icon

  // Determine which steps are completed based on stage
  const getStepStatus = (stepId: number): 'pending' | 'in_progress' | 'completed' => {
    if (steps && steps.length > 0) {
      const step = steps.find(s => s.id === stepId)
      return step?.status || 'pending'
    }

    // Auto-determine based on stage
    if (stage === 'DRAFT') return 'pending'
    if (stage === 'TRIAGE') return stepId <= 3 ? 'completed' : stepId === 4 ? 'in_progress' : 'pending'
    if (stage === 'CONSULTATION') return stepId <= 4 ? 'completed' : stepId === 5 ? 'in_progress' : 'pending'
    if (stage === 'TREATMENT') return stepId <= 5 ? 'completed' : stepId === 6 ? 'in_progress' : 'pending'
    if (stage === 'SIGN_OFF') return 'completed'
    return 'pending'
  }

  return (
    <Card className="w-full">
      <CardContent className="pt-4">
        <div className="flex flex-col space-y-4">
          {/* Header Row - Stage & Owner */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-full ${config.color} bg-opacity-10`}>
                <StageIcon className={`h-5 w-5 ${config.color.replace('bg-', 'text-')}`} />
              </div>
              <div>
                <p className="font-semibold text-lg">{config.label}</p>
                {patientName && (
                  <p className="text-sm text-muted-foreground">{patientName}</p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {workflowMode === 'SINGLE_ACTOR' && (
                <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                  Single Actor Mode
                </Badge>
              )}
              <Badge className={config.color}>
                {config.label}
              </Badge>
            </div>
          </div>

          {/* Owner Information */}
          {currentOwnerName && workflowMode === 'MULTI_ACTOR' && (
            <div className="flex items-center space-x-2 text-sm">
              <Avatar className="h-6 w-6">
                <AvatarFallback className="text-xs">
                  {currentOwnerName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-muted-foreground">Owner:</span>
              <span className="font-medium">
                {currentOwnerName}
                {currentOwnerRole && (
                  <span className="text-muted-foreground font-normal"> ({currentOwnerRole})</span>
                )}
              </span>
            </div>
          )}

          {/* Steps Progress */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Workflow Progress</p>
            <div className="flex justify-between items-center">
              {workflowStepNames.map((step) => {
                const status = getStepStatus(step.id)
                const StepIcon = step.icon
                
                return (
                  <div key={step.id} className="flex flex-col items-center">
                    <div
                      className={`
                        flex h-8 w-8 rounded-full items-center justify-center border-2 transition-all
                        ${status === 'completed' ? 'bg-green-500 border-green-500 text-white' : ''}
                        ${status === 'in_progress' ? 'bg-blue-500 border-blue-500 text-white animate-pulse' : ''}
                        ${status === 'pending' ? 'border-gray-300 text-gray-400' : ''}
                      `}
                    >
                      {status === 'completed' ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <StepIcon className="h-4 w-4" />
                      )}
                    </div>
                    <span className={`text-[10px] mt-1 hidden md:block ${status !== 'pending' ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {step.name.split(' ')[0]}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Last Updated */}
          {lastUpdated && (
            <div className="flex items-center text-xs text-muted-foreground">
              <Clock className="h-3 w-3 mr-1" />
              Last updated: {lastUpdated}
            </div>
          )}

          {/* Alert for pending handoffs */}
          {stage === 'TRIAGE' && workflowMode === 'MULTI_ACTOR' && (
            <div className="flex items-center space-x-2 text-sm bg-yellow-50 p-2 rounded-md border border-yellow-200">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <span className="text-yellow-800">Ready for Doctor - Submit to continue</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default WorkflowIndicator
