import React from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import ForgotPasswordPage from '@/app/forgot-password/page'
import ResetPasswordPage from '@/app/reset-password/page'
import ContactAdministratorPage from '@/app/contact-administrator/page'
import LoginPage from '@/app/login/page'

const forgotMutate = vi.fn()
const resetMutate = vi.fn()
const contactMutate = vi.fn()
const loginMutate = vi.fn()

vi.mock('framer-motion', () => ({
  motion: new Proxy(
    {},
    {
      get: () => 'div',
    },
  ),
}))

vi.mock('@/hooks/api/useAuth', () => ({
  useForgotPassword: () => ({ mutate: forgotMutate, isPending: false }),
  useResetPassword: () => ({ mutate: resetMutate, isPending: false }),
  useContactAdministrator: () => ({ mutate: contactMutate, isPending: false }),
  useLogin: () => ({ mutate: loginMutate, isPending: false }),
}))

vi.mock('@/lib/utils/auth', () => ({
  getSessionUser: vi.fn(() => null),
  setSessionUser: vi.fn(),
}))

describe('Auth recovery public pages', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders forgot password page and shows validation state', async () => {
    const user = userEvent.setup()
    render(<ForgotPasswordPage />)

    expect(screen.getByText('Forgot password')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Send reset instructions' }))

    expect(screen.getByText('A valid email address is required')).toBeInTheDocument()
    expect(forgotMutate).not.toHaveBeenCalled()
  })

  it('shows masked forgot password acknowledgement after submit', async () => {
    forgotMutate.mockImplementationOnce((_payload, options) => {
      options?.onSuccess?.({})
    })

    const user = userEvent.setup()
    render(<ForgotPasswordPage />)

    await user.type(screen.getByLabelText('Email address'), 'person@example.com')
    await user.click(screen.getByRole('button', { name: 'Send reset instructions' }))

    expect(screen.getByRole('status')).toHaveTextContent(
      'If an account exists for this email, password reset instructions have been sent.',
    )
  })

  it('renders reset password page and shows validation state', async () => {
    const user = userEvent.setup()
    render(<ResetPasswordPage />)

    expect(screen.getByText('Provide your reset token and a new password.')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Reset password' }))

    expect(screen.getByText('Reset token is required')).toBeInTheDocument()
    expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument()
    expect(resetMutate).not.toHaveBeenCalled()
  })

  it('renders contact administrator page and displays acknowledgement with reference', async () => {
    contactMutate.mockImplementationOnce((_payload, options) => {
      options?.onSuccess?.({ reference: 'CAR-12345' })
    })

    const user = userEvent.setup()
    render(<ContactAdministratorPage />)

    expect(screen.getByText('Contact Administrator')).toBeInTheDocument()

    await user.type(screen.getByLabelText('Full name'), 'John Doe')
    await user.type(screen.getByLabelText('Email address'), 'john@example.com')
    await user.type(screen.getByLabelText('Subject'), 'Support request')
    await user.type(screen.getByLabelText('Message'), 'I need help with login access today.')

    await user.click(screen.getByRole('button', { name: 'Submit request' }))

    expect(screen.getByRole('status')).toHaveTextContent('Your request has been received. Reference: CAR-12345')
  })

  it('uses login links for forgot password and contact administrator targets', () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <LoginPage />
      </QueryClientProvider>,
    )

    expect(screen.getByRole('link', { name: 'Forgot password?' })).toHaveAttribute('href', '/forgot-password')
    expect(screen.getByRole('link', { name: 'Contact Administrator' })).toHaveAttribute(
      'href',
      '/contact-administrator',
    )
  })
})
