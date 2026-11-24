import type { ReactNode } from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const getToken = vi.hoisted(() => vi.fn())
const apiMocks = vi.hoisted(() => ({
  createApplication: vi.fn(),
  updateApplication: vi.fn(),
  uploadAttachment: vi.fn(),
}))
const toastMocks = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
}))

vi.mock('@clerk/clerk-react', () => ({
  useAuth: () => ({ getToken }),
}))

vi.mock('@/api/applications', () => apiMocks)

vi.mock('sonner', () => ({ toast: toastMocks }))

vi.mock('@/components/ui/dialog', () => ({
  DialogTitle: ({ children }: { children?: ReactNode }) => <h2>{children}</h2>,
  DialogDescription: ({ children }: { children?: ReactNode }) => <p>{children}</p>,
}))

import { JobApplicationForm } from '@/components/jobApplicationForm'
import { useJobsStore } from '@/store/jobsStore'

const createdApplication = {
  id: 42,
  created_at: '2026-11-20T10:00:00.000Z',
  user_id: 'test_user',
  applied_at: '2026-11-20T10:00:00.000Z',
  position: 'Engineer',
  company: 'Acme',
  status: 1,
}

async function fillRequiredFields(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/position/i), 'Engineer')
  await user.type(screen.getByLabelText(/company/i), 'Acme')
}

beforeEach(() => {
  vi.resetAllMocks()
  getToken.mockResolvedValue('token')
  useJobsStore.setState(useJobsStore.getInitialState(), true)
})

const existingApplication = {
  id: 7,
  created_at: '2026-01-01T08:00:00.000Z',
  user_id: 'test_user',
  applied_at: '2026-01-15T12:00:00.000Z',
  expires_at: '2026-02-20T12:00:00.000Z',
  position: 'Frontend Engineer',
  company: 'Acme',
  status: 3,
  link: 'https://acme.example.com/jobs/1',
  attachment_key: 'attachments/test_user/7/cv.pdf',
}

function inputValue(label: RegExp): string {
  return (screen.getByLabelText(label) as HTMLInputElement).value
}

describe('JobApplicationForm editing', () => {
  it('prefills the row and preserves untouched date timestamps and optional fields', async () => {
    const user = userEvent.setup()
    const updated = { ...existingApplication, position: 'Staff Engineer' }
    apiMocks.updateApplication.mockResolvedValue(updated)
    useJobsStore.setState({
      jobApplications: [existingApplication],
      activeJobsOwnerId: 'test_user',
    })

    render(
      <JobApplicationForm user_id="test_user" application={existingApplication} />,
    )

    expect(screen.getByRole('heading', { name: 'Edit application' })).toBeInTheDocument()
    expect(inputValue(/^position/i)).toBe('Frontend Engineer')
    expect(inputValue(/^company/i)).toBe('Acme')
    expect(inputValue(/^date applied/i)).toBe('2026-01-15')
    expect(inputValue(/^date expires/i)).toBe('2026-02-20')
    expect(inputValue(/^link/i)).toBe('https://acme.example.com/jobs/1')
    expect(screen.getByRole('button', { name: /save changes/i })).toBeEnabled()

    const position = screen.getByLabelText(/^position/i)
    await user.clear(position)
    await user.type(position, 'Staff Engineer')
    await user.click(screen.getByRole('button', { name: /save changes/i }))

    await waitFor(() => expect(apiMocks.updateApplication).toHaveBeenCalledTimes(1))
    expect(apiMocks.updateApplication).toHaveBeenCalledWith('token', 7, {
      position: 'Staff Engineer',
    })
    expect(useJobsStore.getState().jobApplications).toHaveLength(1)
    expect(useJobsStore.getState().jobApplications[0]).toMatchObject({
      id: 7,
      position: 'Staff Engineer',
      status: 3,
      applied_at: '2026-01-15T12:00:00.000Z',
      expires_at: '2026-02-20T12:00:00.000Z',
    })
    expect(useJobsStore.getState().analyticsRevisions.test_user).toBe(1)
  })

  it('sends changed dates and clears optional values explicitly', async () => {
    const user = userEvent.setup()
    const updated = {
      ...existingApplication,
      position: 'Backend Engineer',
      applied_at: '2026-03-04T00:00:00.000Z',
      expires_at: null,
      link: null,
    }
    apiMocks.updateApplication.mockResolvedValue(updated)
    useJobsStore.setState({
      jobApplications: [existingApplication],
      activeJobsOwnerId: 'test_user',
    })

    render(
      <JobApplicationForm user_id="test_user" application={existingApplication} />,
    )

    const position = screen.getByLabelText(/^position/i)
    await user.clear(position)
    await user.type(position, 'Backend Engineer')

    const applied = screen.getByLabelText(/^date applied/i)
    await user.clear(applied)
    await user.type(applied, '2026-03-04')

    const expires = screen.getByLabelText(/^date expires/i)
    await user.clear(expires)

    const link = screen.getByLabelText(/^link/i)
    await user.clear(link)

    await user.click(screen.getByRole('button', { name: /save changes/i }))

    await waitFor(() => expect(apiMocks.updateApplication).toHaveBeenCalledTimes(1))
    expect(apiMocks.updateApplication).toHaveBeenCalledWith('token', 7, {
      position: 'Backend Engineer',
      applied_at: new Date(2026, 2, 4).toISOString(),
      expires_at: null,
      link: null,
    })
    expect(useJobsStore.getState().jobApplications[0]).toMatchObject({
      id: 7,
      position: 'Backend Engineer',
      expires_at: null,
      link: null,
    })
  })

  it('shows one pending state and does not submit twice while saving', async () => {
    const user = userEvent.setup()
    let resolveUpdate: (value: typeof existingApplication) => void = () => {}
    apiMocks.updateApplication.mockReturnValue(
      new Promise((resolve) => {
        resolveUpdate = resolve
      }),
    )
    useJobsStore.setState({
      jobApplications: [existingApplication],
      activeJobsOwnerId: 'test_user',
    })

    render(
      <JobApplicationForm user_id="test_user" application={existingApplication} />,
    )

    const position = screen.getByLabelText(/^position/i)
    await user.clear(position)
    await user.type(position, 'Pending change')
    await user.click(screen.getByRole('button', { name: /save changes/i }))

    const pending = screen.getByRole('button', { name: /saving/i })
    expect(pending).toBeDisabled()
    await user.click(pending)
    expect(apiMocks.updateApplication).toHaveBeenCalledTimes(1)

    resolveUpdate(existingApplication)
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /save changes/i })).toBeEnabled(),
    )
  })

  it('skips the PATCH when nothing changed', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    useJobsStore.setState({
      jobApplications: [existingApplication],
      activeJobsOwnerId: 'test_user',
    })

    render(
      <JobApplicationForm
        user_id="test_user"
        application={existingApplication}
        onClose={onClose}
      />,
    )

    await user.click(screen.getByRole('button', { name: /save changes/i }))

    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1))
    expect(apiMocks.updateApplication).not.toHaveBeenCalled()
    expect(useJobsStore.getState().jobApplications[0]).toEqual(existingApplication)
  })

  it('retains an invalid typed date and blocks submit until it is valid', async () => {
    const user = userEvent.setup()
    apiMocks.updateApplication.mockResolvedValue(existingApplication)
    useJobsStore.setState({
      jobApplications: [existingApplication],
      activeJobsOwnerId: 'test_user',
    })

    render(
      <JobApplicationForm user_id="test_user" application={existingApplication} />,
    )

    const applied = screen.getByLabelText(/^date applied/i)
    await user.clear(applied)
    await user.type(applied, '2026-02-30')
    expect(applied).toHaveValue('2026-02-30')

    await user.click(screen.getByRole('button', { name: /save changes/i }))

    expect(
      await screen.findByText(/Date applied is required|Enter a valid date/i),
    ).toBeInTheDocument()
    expect(apiMocks.updateApplication).not.toHaveBeenCalled()
    expect(applied).toHaveValue('2026-02-30')

    await user.clear(applied)
    await user.type(applied, '2026-03-01')
    await user.click(screen.getByRole('button', { name: /save changes/i }))

    await waitFor(() => expect(apiMocks.updateApplication).toHaveBeenCalledTimes(1))
    expect(apiMocks.updateApplication).toHaveBeenCalledWith('token', 7, {
      applied_at: new Date(2026, 2, 1).toISOString(),
    })
  })

  it('keeps the row and reports an error when the update fails', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    apiMocks.updateApplication.mockRejectedValue(new Error('Update failed'))
    useJobsStore.setState({
      jobApplications: [existingApplication],
      activeJobsOwnerId: 'test_user',
    })

    render(
      <JobApplicationForm
        user_id="test_user"
        application={existingApplication}
        onClose={onClose}
      />,
    )

    const position = screen.getByLabelText(/^position/i)
    await user.clear(position)
    await user.type(position, 'Changed')
    await user.click(screen.getByRole('button', { name: /save changes/i }))

    await waitFor(() => expect(toastMocks.error).toHaveBeenCalledTimes(1))
    expect(onClose).not.toHaveBeenCalled()
    expect(useJobsStore.getState().jobApplications[0]).toEqual(existingApplication)
  })
})

describe('JobApplicationForm first-save handoff', () => {
  it('calls the success hook only after a confirmed save', async () => {
    const user = userEvent.setup()
    const onSuccess = vi.fn()
    const onClose = vi.fn()
    apiMocks.createApplication.mockResolvedValue(createdApplication)

    render(
      <JobApplicationForm
        user_id="user_clerk_123"
        onSuccess={onSuccess}
        onClose={onClose}
      />,
    )

    await fillRequiredFields(user)
    await user.click(screen.getByRole('button', { name: /save application/i }))

    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1))
    const saved = onSuccess.mock.calls[0][0]
    expect(saved).toMatchObject({ id: 42, company: 'Acme' })
    expect(onClose).toHaveBeenCalledTimes(1)

    const state = useJobsStore.getState()
    expect(state.jobApplications).toHaveLength(1)
    expect(state.createRevisions.user_clerk_123).toBe(1)
    expect(state.lastCreatedApplication).toMatchObject({
      userId: 'user_clerk_123',
      revision: 1,
      application: { id: 42 },
    })
  })

  it('does not notify success or toast success when the save fails', async () => {
    const user = userEvent.setup()
    const onSuccess = vi.fn()
    const onClose = vi.fn()
    apiMocks.createApplication.mockRejectedValue(new Error('API unavailable'))

    render(
      <JobApplicationForm
        user_id="user_clerk_123"
        onSuccess={onSuccess}
        onClose={onClose}
      />,
    )

    await fillRequiredFields(user)
    await user.click(screen.getByRole('button', { name: /save application/i }))

    await waitFor(() => expect(toastMocks.error).toHaveBeenCalledTimes(1))
    expect(onSuccess).not.toHaveBeenCalled()
    expect(onClose).not.toHaveBeenCalled()
    expect(useJobsStore.getState().jobApplications).toHaveLength(0)
    expect(useJobsStore.getState().lastCreatedApplication).toBeNull()
  })

  it('does not call the success hook for validation errors', async () => {
    const user = userEvent.setup()
    const onSuccess = vi.fn()
    apiMocks.createApplication.mockResolvedValue(createdApplication)

    render(<JobApplicationForm user_id="user_clerk_123" onSuccess={onSuccess} />)

    await user.click(screen.getByRole('button', { name: /save application/i }))

    expect(await screen.findByText('Position is required')).toBeInTheDocument()
    expect(await screen.findByText('Company name is required')).toBeInTheDocument()
    expect(apiMocks.createApplication).not.toHaveBeenCalled()
    expect(onSuccess).not.toHaveBeenCalled()
  })
})
