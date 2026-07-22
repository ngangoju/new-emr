import { NextResponse } from 'next/server'
import { JourneyTicketClient } from '@/lib/journey-ticket'

export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const client = new JourneyTicketClient()

  try {
    await client.getStatus(token)
    const ticketUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/j/${token}`
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(ticketUrl)}`

    const res = await fetch(qrUrl)
    if (!res.ok) return new NextResponse('QR generation failed', { status: 502 })

    const buffer = Buffer.from(await res.arrayBuffer())
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'no-store',
      },
    })
  } catch {
    return new NextResponse('Invalid ticket', { status: 404 })
  }
}
