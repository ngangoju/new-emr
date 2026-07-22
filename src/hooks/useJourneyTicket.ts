'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

interface IssueTicketResponse {
  ticketToken: string
  queueEntryId: string
  expiresAt: string
}

export function useIssueJourneyTicket() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (queueEntryId: string) => {
      const { data } = await api.post<IssueTicketResponse>(
        '/api/public/journey/tickets',
        { queueEntryId, issuedBy: null }
      )
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['queue'] })
    },
  })
}
