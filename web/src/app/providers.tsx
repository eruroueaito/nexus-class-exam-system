/**
 * Module: app providers
 * Responsibility: Wrap the application with shared runtime providers
 * Inputs/Outputs: Accepts React children and returns the provider tree
 * Dependencies: Depends on TanStack Query client setup
 * Notes: Keep this file focused on top-level providers only
 */

import type { PropsWithChildren } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '../lib/query-client'

export function AppProviders({ children }: PropsWithChildren) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}
