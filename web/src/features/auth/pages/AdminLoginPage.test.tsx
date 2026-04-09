import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { AdminLoginPage } from './AdminLoginPage'

const { signInAsAdminMock } = vi.hoisted(() => ({
  signInAsAdminMock: vi.fn(),
}))

vi.mock('../api/adminLogin', () => ({
  signInAsAdmin: signInAsAdminMock,
}))

describe('AdminLoginPage', () => {
  beforeEach(() => {
    signInAsAdminMock.mockReset()
  })

  test('submits the admin credentials and navigates to the dashboard', async () => {
    signInAsAdminMock.mockResolvedValue({
      email: 'admin@example.com',
    })

    render(
      <MemoryRouter initialEntries={['/admin/login']}>
        <Routes>
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/admin" element={<div>Admin Dashboard Route</div>} />
        </Routes>
      </MemoryRouter>,
    )

    fireEvent.change(screen.getByLabelText('Admin Email'), {
      target: { value: 'admin@example.com' },
    })
    fireEvent.change(screen.getByLabelText('Admin Password'), {
      target: { value: 'secret123' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }))

    await waitFor(() => {
      expect(signInAsAdminMock).toHaveBeenCalledWith({
        email: 'admin@example.com',
        password: 'secret123',
      })
    })

    expect(await screen.findByText('Admin Dashboard Route')).toBeInTheDocument()
  })

  test('renders an error message when sign-in fails', async () => {
    signInAsAdminMock.mockRejectedValue(
      new Error('This account is not authorized for the admin portal.'),
    )

    render(
      <MemoryRouter initialEntries={['/admin/login']}>
        <Routes>
          <Route path="/admin/login" element={<AdminLoginPage />} />
        </Routes>
      </MemoryRouter>,
    )

    fireEvent.change(screen.getByLabelText('Admin Email'), {
      target: { value: 'staff@example.com' },
    })
    fireEvent.change(screen.getByLabelText('Admin Password'), {
      target: { value: 'secret123' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }))

    expect(
      await screen.findByText('This account is not authorized for the admin portal.'),
    ).toBeInTheDocument()
  })
})
