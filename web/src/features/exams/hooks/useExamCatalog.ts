/**
 * Module: exam catalog query hook
 * Responsibility: Load the public exam catalog with a safe local fallback
 * Inputs/Outputs: Returns query state plus catalog items for the shell page
 * Dependencies: Depends on TanStack Query and the browser exam API factory
 * Notes: The fallback keeps the prototype usable before runtime env values are configured
 */

import { useQuery } from '@tanstack/react-query'
import type { ExamCatalogItem } from '../types'
import { createBrowserExamApi } from '../../../lib/exam-api'

const prototypeCatalog: ExamCatalogItem[] = [
  {
    id: 'prototype-microeconomics-midterm',
    title: 'Microeconomics - Midterm Assessment',
    createdAt: '2026-04-09T18:00:00Z',
    isActive: true,
  },
  {
    id: 'prototype-macroeconomics-exercise-04',
    title: 'Macroeconomics - Exercise Set 04',
    createdAt: '2026-04-08T18:00:00Z',
    isActive: false,
  },
]

export function useExamCatalog() {
  return useQuery({
    queryKey: ['exam-catalog'],
    queryFn: async () => {
      const api = createBrowserExamApi()

      if (!api) {
        return prototypeCatalog
      }

      const result = await api.listExamCatalog()

      return result.map((item) => ({
        id: item.id,
        title: item.title,
        createdAt: item.created_at,
        isActive: item.is_active,
      }))
    },
    initialData: prototypeCatalog,
  })
}
