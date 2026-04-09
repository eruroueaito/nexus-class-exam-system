/**
 * Module: application router
 * Responsibility: Declare the top-level route map for the static frontend
 * Inputs/Outputs: Exports a configured hash router instance
 * Dependencies: Depends on React Router and feature page modules
 * Notes: GitHub Pages is the deployment target, so hash routing is preferred
 */

import { createHashRouter } from 'react-router-dom'
import { AdminDashboardPage } from '../features/admin/pages/AdminDashboardPage'
import { ExamEditorPage } from '../features/admin/pages/ExamEditorPage'
import { AdminLoginPage } from '../features/auth/pages/AdminLoginPage'
import { NexusShellPage } from '../features/shell/pages/NexusShellPage'

export const appRouter = createHashRouter([
  {
    path: '/',
    element: <NexusShellPage />,
  },
  {
    path: '/admin/login',
    element: <AdminLoginPage />,
  },
  {
    path: '/admin',
    element: <AdminDashboardPage />,
  },
  {
    path: '/admin/exams/:examId',
    element: <ExamEditorPage />,
  },
])
