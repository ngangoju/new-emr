/* eslint-disable @next/next/no-img-element */
'use use strict'
'use client'

import { useEffect, useMemo, useState } from 'react'
import { JourneyTicketClient, type JourneyTicketResponse } from '@/lib/journey-ticket'
import { socket } from '@/lib/socket'
import QRCode from 'qrcode'
import {
  Activity,
  CheckCircle2,
  Clock,
  CreditCard,
  QrCode as QrIcon,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  AlertCircle
} from 'lucide-react'

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

const stageDetails: Record<string, { name: string; desc: string }> = {
  ARRIVAL: { name: 'Arrival', desc: 'Checked in at facility reception' },
  REGISTER: { name: 'Registration', desc: 'Patient record & intake created' },
  TRIAGE: { name: 'Triage', desc: 'Vital signs & MEWS assessment' },
  ENCOUNTER: { name: 'Doctor Consultation', desc: 'Clinical evaluation with physician' },
  TREATMENT: { name: 'Treatment & Pharmacy', desc: 'Medication dispense & orders' },
  DISCHARGE: { name: 'Discharge', desc: 'Visit complete, after-visit summary ready' },
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
  const currentStage = deriveStageFromStatus(payload.status) || ticket.currentStage
  const positionInQueue =
    typeof payload.queueNumber === 'number' && payload.queueNumber > 0 ? payload.queueNumber : ticket.positionInQueue
  const estimatedWaitMinutes =
    typeof payload.queueNumber === 'number' && payload.queueNumber > 0
      ? Math.max(1, Math.ceil(payload.queueNumber / 12) * 5)
      : ticket.estimatedWaitMinutes

  return {
    ...ticket,
    currentStage,
    stageDisplayName: stageDetails[currentStage]?.name || currentStage,
    positionInQueue,
    estimatedWaitMinutes,
    pending: false,
  }
}

export default function JourneyTicketPage({ params }: { params: Promise<{ token: string }> }) {
  const [token, setToken] = useState<string | null>(null)
  const [ticket, setTicket] = useState<TicketStatus | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [liveNote, setLiveNote] = useState<string>('Initializing...')
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [showQrModal, setShowQrModal] = useState<boolean>(false)

  // MoMo payment modal state
  const [showPayModal, setShowPayModal] = useState<boolean>(false)
  const [phone, setPhone] = useState<string>('')
  const [paying, setPaying] = useState<boolean>(false)
  const [payMessage, setPayMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

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

  // Initial fetch
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

    // Generate QR Code URL
    if (typeof window !== 'undefined') {
      const fullUrl = window.location.href
      QRCode.toDataURL(fullUrl, { margin: 1, width: 220 })
        .then((url) => setQrDataUrl(url))
        .catch(() => {})
    }

    return () => {
      cancelled = true
    }
  }, [token])

  // WebSocket Live Updates
  useEffect(() => {
    if (!token || !ticket) return

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLiveNote('Connecting...')

    const onConnect = () => {
      setLiveNote('Live')
      socket.emit('subscribe', 'journey:update')
    }

    const onDisconnect = () => {
      setLiveNote('Reconnecting...')
    }

    const onMessage = (_parsed: unknown) => {
      const parsed = _parsed as { type?: string; queueEntryId?: string; payload?: JourneyPayload } | undefined
      if (!parsed || parsed.type !== 'journey:update' || !parsed.payload) return

      setTicket((prev) => {
        if (!prev) return prev
        return applyLiveUpdate(prev, parsed.payload!)
      })
      setLiveNote('Updated just now')
      setTimeout(() => setLiveNote('Live'), 3000)
    }

    socket.on('connect', onConnect)
    socket.on('disconnect', onDisconnect)
    socket.on('message', onMessage)
    socket.connect()

    return () => {
      socket.off('connect', onConnect)
      socket.off('disconnect', onDisconnect)
      socket.off('message', onMessage)
    }
  }, [token, ticket?.visitId, ticket])

  const currentIndex = useMemo(() => {
    if (!ticket) return 0
    const idx = stageOrder.indexOf(ticket.currentStage as (typeof stageOrder)[number])
    return idx >= 0 ? idx : 0
  }, [ticket])

  const handleMoMoPay = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token || !phone) return

    setPaying(true)
    setPayMessage(null)

    try {
      const client = new JourneyTicketClient()
      await client.initiatePayment(token, phone)
      setPayMessage({
        type: 'success',
        text: 'Payment request sent! Please check your phone prompt to approve payment.',
      })
      setTimeout(() => {
        setShowPayModal(false)
        setPaying(false)
        setPayMessage(null)
      }, 4000)
    } catch (err) {
      setPayMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Payment initiation failed',
      })
      setPaying(false)
    }
  }

  if (error || !ticket) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 text-white">
        <div className="bg-slate-800/80 backdrop-blur border border-slate-700 rounded-2xl p-6 max-w-sm w-full text-center shadow-xl">
          <div className="w-14 h-14 bg-red-500/20 text-red-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-bold text-slate-100">Ticket Expired or Invalid</h1>
          <p className="text-sm text-slate-400 mt-2">{error || 'Please request a new check-in QR code from reception.'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-12 antialiased selection:bg-blue-600">
      {/* Top Banner */}
      <header className="sticky top-0 z-30 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-4 py-3.5">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/30">
              E
            </div>
            <div>
              <span className="text-sm font-semibold tracking-wide text-white block">Patient Journey</span>
              <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                {liveNote}
              </span>
            </div>
          </div>

          <button
            onClick={() => setShowQrModal(true)}
            className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 transition"
            title="Show Ticket QR Code"
          >
            <QrIcon className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 pt-6 space-y-5">
        {/* Main Status Hero Card */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-700 to-slate-900 p-6 shadow-2xl shadow-blue-950/50 border border-blue-500/20">
          <div className="relative z-10">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 backdrop-blur text-blue-200 border border-white/10 mb-3">
              <Activity className="w-3.5 h-3.5 animate-pulse" /> Live Status
            </span>

            <h2 className="text-2xl font-black text-white tracking-tight">{stageDetails[ticket.currentStage]?.name || ticket.currentStage}</h2>
            <p className="text-xs text-blue-100/80 mt-1 font-medium leading-relaxed">
              {stageDetails[ticket.currentStage]?.desc}
            </p>

            {ticket.positionInQueue != null && ticket.positionInQueue > 0 && (
              <div className="grid grid-cols-2 gap-3 mt-5 pt-4 border-t border-white/10">
                <div className="bg-black/20 backdrop-blur rounded-2xl p-3.5 border border-white/5">
                  <span className="text-[10px] uppercase tracking-wider text-blue-200/70 font-semibold block">Queue Position</span>
                  <div className="text-2xl font-black text-white mt-0.5 flex items-baseline gap-1">
                    #{ticket.positionInQueue}
                  </div>
                </div>

                <div className="bg-black/20 backdrop-blur rounded-2xl p-3.5 border border-white/5">
                  <span className="text-[10px] uppercase tracking-wider text-blue-200/70 font-semibold block">Est. Wait Time</span>
                  <div className="text-2xl font-black text-emerald-400 mt-0.5 flex items-center gap-1">
                    <Clock className="w-4 h-4 text-emerald-400 inline" />
                    ~{ticket.estimatedWaitMinutes ?? 10}<span className="text-xs font-normal text-slate-300">m</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Live Stage Tracker */}
        <div className="bg-slate-900/60 backdrop-blur border border-slate-800/80 rounded-3xl p-5 shadow-xl">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 px-1">Visit Pipeline</h3>

          <div className="space-y-3">
            {stageOrder.map((stage, idx) => {
              const isCompleted = idx < currentIndex
              const isCurrent = idx === currentIndex
              const detail = stageDetails[stage]

              return (
                <div
                  key={stage}
                  className={`flex items-center gap-3.5 p-3 rounded-2xl border transition-all ${
                    isCurrent
                      ? 'bg-blue-600/10 border-blue-500/40 text-white shadow-lg shadow-blue-950/40'
                      : isCompleted
                      ? 'bg-slate-900/40 border-slate-800/50 text-slate-400'
                      : 'bg-slate-900/20 border-slate-900 text-slate-600'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                      isCurrent
                        ? 'bg-blue-600 text-white ring-4 ring-blue-500/20 shadow-md shadow-blue-600/50'
                        : isCompleted
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : idx + 1}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-semibold tracking-wide ${isCurrent ? 'text-blue-300' : isCompleted ? 'text-slate-300' : 'text-slate-500'}`}>
                        {detail.name}
                      </span>
                      {isCurrent && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 uppercase tracking-wider">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">{detail.desc}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Payment & MoMo Clearance Section */}
        <div className="bg-slate-900/60 backdrop-blur border border-slate-800/80 rounded-3xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Payment Clearance</span>
            {ticket.isPaid ? (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                <ShieldCheck className="w-3.5 h-3.5" /> PAID
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
                <CreditCard className="w-3.5 h-3.5" /> PENDING
              </span>
            )}
          </div>

          <div className="flex items-baseline justify-between mt-2">
            <div>
              <span className="text-xs text-slate-500 block">Total Outstanding</span>
              <span className="text-2xl font-black text-slate-100">
                RWF {ticket.balanceDueFormatted || '0.00'}
              </span>
            </div>

            {!ticket.isPaid && parseFloat(ticket.balanceDueFormatted || '0') > 0 && (
              <button
                onClick={() => setShowPayModal(true)}
                className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-500/20 flex items-center gap-1.5 transition active:scale-95"
              >
                <Smartphone className="w-4 h-4" /> Tap to Pay MoMo
              </button>
            )}
          </div>

          {!ticket.isPaid && parseFloat(ticket.balanceDueFormatted || '0') > 0 && (
            <p className="text-[11px] text-slate-500 mt-3 border-t border-slate-800 pt-3">
              Settling payments instantly unlocks your triage clearance without waiting in line at the cashier desk.
            </p>
          )}
        </div>
      </main>

      {/* QR Code Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-xs w-full text-center space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white">Your Visit Pass</h3>
            <p className="text-xs text-slate-400">Scan at clinic stations for instant identification</p>
            {qrDataUrl && (
              <img src={qrDataUrl} alt="Journey Ticket QR" className="mx-auto rounded-2xl border-4 border-white shadow-lg" />
            )}
            <button
              onClick={() => setShowQrModal(false)}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* MoMo Payment Modal */}
      {showPayModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-amber-400" /> Pay via MTN Mobile Money
              </h3>
              <button onClick={() => setShowPayModal(false)} className="text-slate-400 hover:text-white text-xs font-bold">
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Enter your MTN MoMo phone number below to receive a direct USSD payment request on your phone.
            </p>

            <form onSubmit={handleMoMoPay} className="space-y-4">
              <div>
                <label className="text-xs text-slate-300 font-semibold block mb-1.5">MTN Phone Number</label>
                <input
                  type="tel"
                  placeholder="078XXXXXXX or 079XXXXXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>

              <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-800 flex justify-between items-center text-xs">
                <span className="text-slate-400">Amount Due</span>
                <span className="font-bold text-amber-400">RWF {ticket.balanceDueFormatted}</span>
              </div>

              {payMessage && (
                <div
                  className={`p-3 rounded-xl text-xs font-medium ${
                    payMessage.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                  }`}
                >
                  {payMessage.text}
                </div>
              )}

              <button
                type="submit"
                disabled={paying}
                className="w-full py-3 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold text-sm rounded-xl transition shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
              >
                {paying ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Sending prompt...
                  </>
                ) : (
                  'Confirm & Send Request'
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
