'use client'

import { useEffect, useMemo, useState } from 'react'
import { JourneyTicketClient, type JourneyTicketResponse } from '@/lib/journey-ticket'
import { socket } from '@/lib/socket'

type JourneyPayload = {
  status?: string
  queueNumber?: number
  checkedInAt?: string
  calledAt?: string
  completedAt?: string
}

type TicketStatus = JourneyTicketResponse & {
  pending?: boolean
}

const stageOrder = [
  'ARRIVAL',
  'REGISTER',
  'TRIAGE',
  'ENCOUNTER',
  'TREATMENT',
  'DISCHARGE',
] as const

function stageDisplayName(stage: string): string {
  const names: Record<string, string> = {
    ARRIVAL: 'Arrival',
    REGISTER: 'Registration',
    TRIAGE: 'Triage',
    ENCOUNTER: 'Doctor',
    TREATMENT: 'Treatment',
    DISCHARGE: 'Discharge',
  }
  return names[stage] || stage
}

function deriveStageFromStatus(status?: string): (typeof stageOrder)[number] {
  if (!status) return 'ARRIVAL'
  const upper = status.toUpperCase()
  if (['COMPLETED', 'DISCHARGE'].includes(upper)) return 'DISCHARGE'
  if (['IN_PROGRESS', 'ENCOUNTER', 'TREATMENT'].includes(upper)) return 'ENCOUNTER'
  if (['CALLED', 'TRIAGE'].includes(upper)) return 'TRIAGE'
  return 'REGISTER'
}

function applyLiveUpdate(ticket: TicketStatus, payload: JourneyPayload): TicketStatus {
  const mapped = deriveStageFromStatus(payload.status)
  const currentStage = mapped || ticket.currentStage
  const currentIndex = stageOrder.indexOf(currentStage)

  const positionInQueue =
    typeof payload.queueNumber === 'number' && payload.queueNumber > 0 ? payload.queueNumber : ticket.positionInQueue

  const estimatedWaitMinutes =
    typeof payload.queueNumber === 'number' && payload.queueNumber > 0
      ? Math.max(1, Math.ceil(payload.queueNumber / 12) * 5)
      : ticket.estimatedWaitMinutes

  return {
    ...ticket,
    currentStage,
    stageDisplayName: stageDisplayName(currentStage),
    positionInQueue,
    estimatedWaitMinutes,
    pending: true,
  }
}

export default function JourneyTicketPage({ params }: { params: Promise<{ token: string }> }) {
  const [token, setToken] = useState<string | null>(null)
  const [ticket, setTicket] = useState<TicketStatus | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [liveNote, setLiveNote] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    params.then((resolved) => {
      if (!cancelled) setToken(resolved.token)
    })
    return () => {
      cancelled = true
      socket.disconnect()
    }
  }, [params])

  useEffect(() => {
    if (!token) return
    let cancelled = false

    const client = new JourneyTicketClient()

    ;(async () => {
      try {
        const status = await client.getStatus(token)
        if (!cancelled) {
          setTicket({ ...status, pending: false })
          setError(null)
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Unable to load ticket')
          setTicket(null)
        }
      }
    })()

    return () => {
      cancelled = true
      socket.disconnect()
    }
  }, [token])

  useEffect(() => {
    if (!token || !ticket) return

    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8888'
    const wsUrl = apiBase.replace(/^http/, 'ws').replace(/\/$/, '') + `/ws/queue?journeyTicket=${encodeURIComponent(token)}`

    setLiveNote('Connecting live updates…')

    const handler = () => {
      socket.connect()
    }

    const onConnect = () => {
      setLiveNote('Live')
      socket.emit('subscribe', 'journey:update')
    }

    const onDisconnect = () => {
      setLiveNote('Reconnecting…')
    }

    const onMessage = (_parsed: unknown) => {
      const parsed = _parsed as { type?: string; queueEntryId?: string; payload?: JourneyPayload } | undefined
      if (!parsed || parsed.type !== 'journey:update' || !parsed.queueEntryId || !parsed.payload) return

      setTicket((prev) => {
        if (!prev) return prev
        return applyLiveUpdate(prev, parsed.payload!)
      })
      setLiveNote('Updated')
      setTimeout(() => setLiveNote('Live'), 2000)
    }

    const onError = () => {
      setLiveNote('Update unavailable')
    }

    socket.on('connect', onConnect)
    socket.on('disconnect', onDisconnect)
    socket.on('message', onMessage)
    socket.on('error', onError)

    handler()

    return () => {
      socket.off('connect', onConnect)
      socket.off('disconnect', onDisconnect)
      socket.off('message', onMessage)
      socket.off('error', onError)
      socket.disconnect()
    }
  }, [token, ticket?.visitId])

  const currentIndex = useMemo(() => {
    if (!ticket) return -1
    return stageOrder.indexOf(ticket.currentStage as (typeof stageOrder)[number])
  }, [ticket?.currentStage])

  if (error || !ticket) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-md p-6 max-w-sm w-full text-center">
          <div className="text-red-500 text-4xl mb-3">!</div>
          <h1 className="text-lg font-semibold text-gray-900">Invalid Ticket</h1>
          <p className="text-sm text-gray-600 mt-2">{error || 'This ticket is invalid or has expired.'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <h1 className="text-base font-semibold text-gray-900">My Visit</h1>
          <span className="text-xs text-gray-500">
            {liveNote || 'Polling'}
          </span>
        </div>
      </div>

      {/* Stage stepper */}
      <div className="bg-white border-b border-gray-200 px-4 py-5">
        <div className="max-w-lg mx-auto">
          <div className="relative flex items-center justify-between">
            {stageOrder.map((stage, idx) => (
              <div key={stage} className="flex flex-col items-center flex-1">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                    idx <= currentIndex ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {idx + 1}
                </div>
                <span
                  className={`text-[10px] mt-1 text-center leading-tight ${
                    idx === currentIndex ? 'text-blue-600 font-medium' : 'text-gray-500'
                  }`}
                >
                  {stageDisplayName(stage)}
                </span>
              </div>
            ))}
            <div className="absolute left-0 right-0 top-4 h-0.5 bg-gray-200 -z-10" aria-hidden="true" />
            <div
              className="absolute left-0 top-4 h-0.5 bg-blue-600 -z-10 transition-all"
              style={{ width: `${currentIndex >= 0 ? (currentIndex / (stageOrder.length - 1)) * 100 : 0}%` }}
              aria-hidden="true"
            />
          </div>
        </div>
      </div>

      {/* Status cards */}
      <div className="max-w-lg mx-auto px-4 py-4 space-y-3">
        {ticket.positionInQueue != null && ticket.positionInQueue > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Your Position</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  #{ticket.pending ? '…' : ticket.positionInQueue}
                </p>
              </div>
              {ticket.estimatedWaitMinutes != null && ticket.estimatedWaitMinutes > 0 && (
                <div className="text-right">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Est. Wait</p>
                  <p className="text-lg font-semibold text-gray-900 mt-1">~{ticket.estimatedWaitMinutes} min</p>
                </div>
              )}
            </div>
          </div>
        )}

        {!ticket.isPaid && (
          <div className="bg-amber-50 rounded-lg border border-amber-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-amber-700 uppercase tracking-wide">Balance Due</p>
                <p className="text-xl font-bold text-amber-900 mt-1">RWF {ticket.balanceDueFormatted}</p>
              </div>
              {ticket.balanceDueFormatted !== '0.00' && parseFloat(ticket.balanceDueFormatted) > 0 && (
                <a
                  href={`tel:*123*${encodeURIComponent(ticket.balanceDueFormatted)}%23`}
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                >
                  Pay with MoMo
                </a>
              )}
            </div>
            <p className="text-xs text-amber-600 mt-2">
              Dial the MoMo shortcode above or tap to pay from your phone.
            </p>
          </div>
        )}

        {ticket.isPaid && (
          <div className="bg-green-50 rounded-lg border border-green-200 p-4">
            <p className="text-sm text-green-800 font-medium">Payment Complete</p>
            <p className="text-xs text-green-600 mt-1">You may proceed to the next stage.</p>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Current Stage</p>
          <p className="text-base font-medium text-gray-900 mt-1">{ticket.stageDisplayName}</p>
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-lg mx-auto px-4 py-6 text-center">
        <p className="text-xs text-gray-400">
          Show this screen at each station. Ticket expires at {new Date(ticket.expiresAt).toLocaleTimeString()}.
        </p>
      </div>
    </div>
  )
}
