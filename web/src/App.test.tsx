import { render, screen } from '@testing-library/react'
import App from './App'

describe('App shell', () => {
  test('renders the prototype landing screen entry points', () => {
    render(<App />)

    expect(
      screen.getByRole('heading', { name: 'Nexus Class' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Student Access' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Administrator Portal' }),
    ).toBeInTheDocument()
  })
})
