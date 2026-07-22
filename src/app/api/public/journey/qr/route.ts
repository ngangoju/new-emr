import { NextRequest, NextResponse } from 'next/server'
import QRCode from 'qrcode'
import { JourneyTicketClient } from '@/lib/journey-ticket'

/**
 * GET /api/public/journey/qr?token=...
 * Renders the Journey Ticket QR as a PNG. Generated locally — the ticket
 * token must never be sent to a third-party QR service.
 */
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token')
  if (!token) return new NextResponse('Missing token', { status: 400 })

  const client = new JourneyTicketClient()
  try {
    await client.getStatus(token)
    const ticketUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/j/${token}`
    const buffer = await QRCode.toBuffer(ticketUrl, { width: 256, margin: 1 })
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'no-store',
      },
    })
  } catch {
    return new NextResponse('Invalid ticket', { status: 404 })
  }
}
