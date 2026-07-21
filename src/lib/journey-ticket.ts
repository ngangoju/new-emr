export interface JourneyTicketResponse {
  visitId: string;
  currentStage: string;
  stageDisplayName: string;
  positionInQueue: number | null;
  estimatedWaitMinutes: number | null;
  balanceDueFormatted: string;
  isPaid: boolean;
  expiresAt: string;
  receiptUrl: string;
}

export class JourneyTicketClient {
  private baseUrl: string;

  constructor(baseUrl = '/backend/api/public/journey') {
    this.baseUrl = baseUrl;
  }

  async getStatus(token: string): Promise<JourneyTicketResponse> {
    const res = await fetch(`${this.baseUrl}/tickets/${encodeURIComponent(token)}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });

    if (!res.ok) {
      if (res.status === 404) {
        throw new Error('Ticket not found or expired');
      }
      const text = await res.text().catch(() => 'Unknown error');
      throw new Error(text || `Ticket lookup failed (${res.status})`);
    }

    return res.json();
  }
}
