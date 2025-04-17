import { useToast } from '@/hooks/use-toast'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormItem,
  FormLabel,
  FormMessage,
  FormControl,
} from '@/components/ui/form'
import { resetPasswordFormData } from '@/types'
import { Card } from '@/components/ui/card'
import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { useNavigate, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/reset-password/$token')({
  component: RouteComponent,
})

function RouteComponent() {
  const { token } = Route.useParams()
  const { toast } = useToast()
  const form = useForm<resetPasswordFormData>()
  const navigate = useNavigate()
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [passwordConfirmVisible, setPasswordConfirmVisible] = useState(false)

  const handleSubmit = async (data: resetPasswordFormData) => {
    // if form submission is empty then fail
    if (!data.password || !data.passwordConfirm) {
      toast({
        title: 'Error',
        description: 'Both password fields are required',
        duration: 2000,
        variant: 'destructive',
      })
      return
    }

    if (data.password !== data.passwordConfirm) {
      toast({
        title: 'Error',
        description: 'Passwords do not match',
        duration: 2000,
        variant: 'destructive',
      })
      return
    }

    const apiUrl = import.meta.env.VITE_API_URL
    const response = await fetch(`${apiUrl}/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...data,
        token,
      }),
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
      description: 'Password has been reset successfully',
      duration: 4000,
      variant: 'default',
    })

    navigate({ to: '/auth' })
  }

  return (
    <section className="flex items-center justify-center mx-auto">
      <Card className="w-full md:w-96 border flex flex-col p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} autoComplete="off">
            <FormItem className='text-secondary'>
              <FormLabel htmlFor="password">New Password</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    {...form.register('password')}
                    autoComplete="new-password"
                    spellCheck="false"
                    id="password"
                    type={passwordVisible ? 'text' : 'password'}
                  />
                  <Button
                    type="button"
                    className="absolute right-0 top-0 bg-card rounded-none hover:bg-card border border-white rounded-r-md p-2"
                    onClick={() => setPasswordVisible(!passwordVisible)}
                  >
                    {passwordVisible ? (
                      <EyeOff className="text-white" size={16} />
                    ) : (
                      <Eye className="text-white" size={16} />
                    )}
                  </Button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
            <FormItem className='text-secondary'>
              <FormLabel htmlFor="passwordConfirm">
                Confirm New Password
              </FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    {...form.register('passwordConfirm')}
                    autoComplete="new-password"
                    spellCheck="false"
                    id="passwordConfirm"
                    type={passwordConfirmVisible ? 'text' : 'password'}
                  />
                  <Button
                    type="button"
                    className="absolute right-0 top-0 bg-card rounded-none hover:bg-card border border-white rounded-r-md p-2"
                    onClick={() =>
                      setPasswordConfirmVisible(!passwordConfirmVisible)
                    }
                  >
                    {passwordConfirmVisible ? (
                      <EyeOff className="text-white" size={16} />
                    ) : (
                      <Eye className="text-white" size={16} />
                    )}
                  </Button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
            <FormItem className="mt-4">
              <Button
                type="submit"
                className="bg-background hover:bg-card-foreground text-primary hover:text-secondary w-full transition-all duration-300"
              >
                Reset Password
              </Button>
            </FormItem>
          </form>
        </Form>
      </Card>
    </section>
  )
}

export default RouteComponent
