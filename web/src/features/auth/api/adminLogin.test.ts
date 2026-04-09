import { beforeEach, describe, expect, test, vi } from 'vitest'
import {
  getAdminSession,
  signInAsAdmin,
  signOutAdmin,
} from './adminLogin'

const authMock = {
  signInWithPassword: vi.fn(),
  getSession: vi.fn(),
  signOut: vi.fn(),
}

vi.mock('../../../lib/supabase', () => ({
  getSupabaseBrowserClient: () => ({
    auth: authMock,
  }),
}))

describe('adminLogin', () => {
  beforeEach(() => {
    authMock.signInWithPassword.mockReset()
    authMock.getSession.mockReset()
    authMock.signOut.mockReset()
  })

  test('signs in an admin user with email and password', async () => {
    authMock.signInWithPassword.mockResolvedValue({
      data: {
        user: {
          email: 'admin@example.com',
          app_metadata: {
            role: 'admin',
          },
        },
      },
      error: null,
    })

    const result = await signInAsAdmin({
      email: 'admin@example.com',
      password: 'secret123',
    })

    expect(authMock.signInWithPassword).toHaveBeenCalledWith({
      email: 'admin@example.com',
      password: 'secret123',
    })
    expect(result.email).toBe('admin@example.com')
  })

  test('rejects a signed-in user without the admin role', async () => {
    authMock.signInWithPassword.mockResolvedValue({
      data: {
        user: {
          email: 'staff@example.com',
          app_metadata: {
            role: 'staff',
          },
        },
      },
      error: null,
    })
    authMock.signOut.mockResolvedValue({ error: null })

    await expect(
      signInAsAdmin({
        email: 'staff@example.com',
        password: 'secret123',
      }),
    ).rejects.toThrow('This account is not authorized for the admin portal.')

    expect(authMock.signOut).toHaveBeenCalled()
  })

  test('returns null when there is no active admin session', async () => {
    authMock.getSession.mockResolvedValue({
      data: {
        session: null,
      },
      error: null,
    })

    await expect(getAdminSession()).resolves.toBeNull()
  })

  test('signs the current admin user out', async () => {
    authMock.signOut.mockResolvedValue({ error: null })

    await signOutAdmin()

    expect(authMock.signOut).toHaveBeenCalledTimes(1)
  })
})
