/**
 * Module: query client
 * Responsibility: Configure the shared TanStack Query client
 * Inputs/Outputs: Exports a singleton query client
 * Dependencies: Depends on @tanstack/react-query
 * Notes: Keep retries conservative until backend error contracts are stable
 */

import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
})
