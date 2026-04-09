/**
 * Module: admin layout
 * Responsibility: Provide the shared shell for authenticated admin routes
 * Inputs/Outputs: Accepts children and the current admin email, then renders the admin frame
 * Dependencies: Depends on the shared admin styles
 * Notes: Keep this layout focused on frame concerns so future analytics and editor pages can reuse it
 */

import type { PropsWithChildren } from 'react'
import '../styles.css'
import '../../shell/styles.css'

interface AdminLayoutProps extends PropsWithChildren {
  adminEmail: string
  onSignOut: () => void
}

export function AdminLayout({
  adminEmail,
  children,
  onSignOut,
}: AdminLayoutProps) {
  return (
    <div className="admin-route-shell nexus-shell">
      <div className="background-blobs" aria-hidden="true">
        <div className="blob blob-primary" />
        <div className="blob blob-secondary" />
      </div>

      <main className="app-container">
        <section className="admin-layout">
          <header className="admin-layout__header">
            <div>
              <span className="admin-layout__eyebrow">Restricted Workspace</span>
              <h1 className="admin-layout__title">Admin Console</h1>
              <p className="admin-layout__copy">
                Manage the protected exam workspace from this authenticated shell.
              </p>
              <span className="admin-layout__email">{adminEmail}</span>
            </div>
            <button className="btn btn-secondary btn-small" type="button" onClick={onSignOut}>
              Sign Out
            </button>
          </header>

          {children}
        </section>
      </main>
    </div>
  )
}
