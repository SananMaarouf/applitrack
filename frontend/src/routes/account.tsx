import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { Input } from '@/components/ui/input'
import { useAuthStore } from '@/store/authStore'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export const Route = createFileRoute('/account')({
  beforeLoad: async ({ location }) => {
    const token = localStorage.getItem('authToken')
    if (!token) {
      throw redirect({
        to: '/auth',
        search: {
          redirect: location.href,
        },
      })
    }
  },
  component: RouteComponent,
})

function RouteComponent() {
  const navigate = useNavigate()
  const setIsAuthenticated = useAuthStore((state) => state.setIsAuthenticated)
  const userdata = JSON.parse(localStorage.getItem('authData') || '{}')
  const { toast } = useToast()

  const handleSignOut = () => {
    localStorage.removeItem('authToken')
    localStorage.removeItem('authData')
    setIsAuthenticated(false)
    navigate({ to: '/' })
  }

  const handleResetPassword = async () => {
    const apiUrl = import.meta.env.VITE_API_URL
    const response = await fetch(`${apiUrl}/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: userdata.email }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      toast({
        title: 'Error',
        description: errorData.error,
        duration: 3000,
        variant: 'destructive',
      })
      return
    }

    toast({
      title: 'Success',
      description: 'Password reset link has been sent to your email',
      duration: 4000,
      variant: 'default',
    })
  }

  const handleDeleteAccount = async () => {
    const apiUrl = import.meta.env.VITE_API_URL
    const response = await fetch(`${apiUrl}/delete-account`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('authToken')}`,
      },
      body: JSON.stringify({ id: userdata.id }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      toast({
        title: 'Error',
        description: errorData.error,
        duration: 3000,
        variant: 'destructive',
      })
      return
    }

    toast({
      title: 'Success',
      description: 'Your account has been deleted',
      duration: 4000,
      variant: 'default',
    })

    handleSignOut()
  }

  return (
    <section className="flex flex-col w-screen max-w-3xl my-auto mx-auto">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-4xl font-bold text-center">
            Account page
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="my-4 mx-2">
            <label className="text-2xl" htmlFor="email">
              Your email
            </label>
            <Input
              disabled
              type="email"
              value={userdata.email || 'loading...'}
              className="text-xl lg:text-2xl"
            />
          </div>
          <div className="flex flex-row space-x-4">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button className='w-1/2 border text-white bg-blue-500 hover:bg-blue-500 hover:border-white duration-500'>Change password?</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Please confirm</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action will send a password reset link to your email.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleResetPassword} className='hover:scale-95'>Confirm</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className='w-1/2 border hover:border-white duration-500'>Delete account</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete your
                    account and remove your data from our servers.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteAccount} className='bg-red-700 text-white border hover:border-white duration-300 hover:bg-red-700 hover:scale-95'>Delete me</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </section>
  )
}

export default RouteComponent
