import { JourneyTicketClient, type JourneyTicketResponse } from '@/lib/journey-ticket';

type Props = {
  params: Promise<{ token: string }>;
};

export default async function JourneyTicketPage({ params }: Props) {
  const { token } = await params;
  const client = new JourneyTicketClient();

  let ticket: JourneyTicketResponse | null = null;
  let error: string | null = null;

  try {
    ticket = await client.getStatus(token);
  } catch (e) {
    error = e instanceof Error ? e.message : 'Unable to load ticket';
  }

  if (error || !ticket) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-md p-6 max-w-sm w-full text-center">
          <div className="text-red-500 text-4xl mb-3">!</div>
          <h1 className="text-lg font-semibold text-gray-900">Invalid Ticket</h1>
          <p className="text-sm text-gray-600 mt-2">{error || 'This ticket is invalid or has expired.'}</p>
        </div>
      </div>
    );
  }

  const stageOrder = [
    'ARRIVAL',
    'REGISTER',
    'TRIAGE',
    'ENCOUNTER',
    'TREATMENT',
    'DISCHARGE',
  ] as const;

  const currentIndex = stageOrder.indexOf(ticket.currentStage as (typeof stageOrder)[number]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <h1 className="text-base font-semibold text-gray-900">My Visit</h1>
          <span className="text-xs text-gray-500">
            {new Date(ticket.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>

      {/* Stage stepper */}
      <div className="bg-white border-b border-gray-200 px-4 py-5">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between">
            {stageOrder.map((stage, idx) => (
              <div key={stage} className="flex flex-col items-center flex-1">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                    idx <= currentIndex
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-500'
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
                {idx < stageOrder.length - 1 && (
                  <div
                    className={`absolute h-0.5 w-8 mt-[-14px] ${
                      idx < currentIndex ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                    style={{ left: `${((idx + 0.5) / stageOrder.length) * 100}%` }}
                  />
                )}
              </div>
            ))}
          </div>
          {/* Progress line */}
          <div className="relative mt-2">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-gray-200" />
            </div>
          </div>
        </div>
      </div>

      {/* Status cards */}
      <div className="max-w-lg mx-auto px-4 py-4 space-y-3">
        {/* Queue position */}
        {ticket.positionInQueue != null && ticket.positionInQueue > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Your Position</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">#{ticket.positionInQueue}</p>
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

        {/* Balance due */}
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

        {/* Current stage */}
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
  );
}

function stageDisplayName(stage: string): string {
  const names: Record<string, string> = {
    ARRIVAL: 'Arrival',
    REGISTER: 'Registration',
    TRIAGE: 'Triage',
    ENCOUNTER: 'Doctor',
    TREATMENT: 'Treatment',
    DISCHARGE: 'Discharge',
  };
  return names[stage] || stage;
}
