import { render, screen } from '@testing-library/react'
import App from './App'

describe('App shell', () => {
  test('renders the direct assignment catalog entry points', () => {
    render(<App />)

    expect(
      screen.getByRole('heading', { name: 'Available Assignments' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /Microeconomics - Midterm Assessment/ }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Administrator Portal' }),
    ).toBeInTheDocument()
  })
})
