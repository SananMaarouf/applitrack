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
  useAuth: () => ({ getToken, userId: 'test_user' }),
}))

vi.mock('@/api/applications', () => apiMocks)
vi.mock('sonner', () => ({ toast: toastMocks }))

import { EditApplicationAction } from '@/components/edit-application-action'
import { useJobsStore } from '@/store/jobsStore'

const application = {
  id: 11,
  created_at: '2026-01-01T08:00:00.000Z',
  user_id: 'test_user',
  applied_at: '2026-01-15T12:00:00.000Z',
  expires_at: '2026-02-20T12:00:00.000Z',
  position: 'Frontend Engineer',
  company: 'Acme',
  status: 2,
  link: 'https://acme.example.com/jobs/11',
  attachment_key: 'attachments/test_user/11/cv.pdf',
}

beforeEach(() => {
  vi.resetAllMocks()
  getToken.mockResolvedValue('token')
  useJobsStore.setState(useJobsStore.getInitialState(), true)
  useJobsStore.setState({
    jobApplications: [application],
    activeJobsOwnerId: 'test_user',
  })
})

describe('EditApplicationAction', () => {
  it('opens an accessible prefilled dialog from the row action', async () => {
    const user = userEvent.setup()

    render(<EditApplicationAction application={application} />)

    const trigger = screen.getByRole('button', {
      name: 'Edit application for Frontend Engineer',
    })
    expect(trigger).toBeInTheDocument()

    await user.click(trigger)

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Edit application' })).toBeInTheDocument()
    expect(screen.getByLabelText(/^position/i)).toHaveValue('Frontend Engineer')
    expect(screen.getByLabelText(/^company/i)).toHaveValue('Acme')
    expect(screen.getByRole('button', { name: /save changes/i })).toBeEnabled()
  })

  it('saves the edit, replaces only the target row, and closes the dialog', async () => {
    const user = userEvent.setup()
    const other = { ...application, id: 12, position: 'Other role', company: 'Globex' }
    const updated = { ...application, position: 'Staff Engineer' }
    apiMocks.updateApplication.mockResolvedValue(updated)
    useJobsStore.setState({
      jobApplications: [other, application],
      activeJobsOwnerId: 'test_user',
    })

    render(<EditApplicationAction application={application} />)

    await user.click(
      screen.getByRole('button', {
        name: 'Edit application for Frontend Engineer',
      }),
    )
    const position = screen.getByLabelText(/^position/i)
    await user.clear(position)
    await user.type(position, 'Staff Engineer')
    await user.click(screen.getByRole('button', { name: /save changes/i }))

    await waitFor(() => expect(apiMocks.updateApplication).toHaveBeenCalledTimes(1))
    expect(apiMocks.updateApplication).toHaveBeenCalledWith('token', 11, {
      position: 'Staff Engineer',
    })
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())

    const rows = useJobsStore.getState().jobApplications
    expect(rows).toHaveLength(2)
    expect(rows.find((row) => row.id === 11)).toMatchObject({
      position: 'Staff Engineer',
      status: 2,
      attachment_key: 'attachments/test_user/11/cv.pdf',
    })
    expect(rows.find((row) => row.id === 12)).toEqual(other)
  })

  it('keeps the dialog open and the row unchanged when saving fails', async () => {
    const user = userEvent.setup()
    apiMocks.updateApplication.mockRejectedValue(new Error('Server down'))

    render(<EditApplicationAction application={application} />)

    await user.click(
      screen.getByRole('button', {
        name: 'Edit application for Frontend Engineer',
      }),
    )
    const position = screen.getByLabelText(/^position/i)
    await user.clear(position)
    await user.type(position, 'Changed')
    await user.click(screen.getByRole('button', { name: /save changes/i }))

    await waitFor(() => expect(toastMocks.error).toHaveBeenCalledTimes(1))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(
      useJobsStore.getState().jobApplications.find((row) => row.id === application.id),
    ).toEqual(application)
  })
})
