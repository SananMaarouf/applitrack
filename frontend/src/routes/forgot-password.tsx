import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormItem, FormLabel, FormMessage, FormControl } from "@/components/ui/form";
import { useNavigate, createFileRoute } from '@tanstack/react-router';
import { forgotPasswordFormData } from '@/types';
import { Card } from '@/components/ui/card';

export const Route = createFileRoute('/forgot-password')({
  component: RouteComponent,
})

function RouteComponent() {
  const { toast } = useToast();
  const form = useForm<forgotPasswordFormData>();
  const navigate = useNavigate();

  const handleSubmit = async (data: forgotPasswordFormData) => {
    // if form submission is empty then return
    if (!data.email) {
      toast({
        title: 'Error',
        description: 'Email is required',
        duration: 3000,
        variant: "destructive"
      });
      return;
    }

    const apiUrl = import.meta.env.VITE_API_URL;
    const response = await fetch(`${apiUrl}/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    toast({
      title: 'Success',
      description: 'If an account with that email exists, a password reset link has been sent',
      duration: 4000,
      variant: "default"
    });

    navigate({ to: '/auth' });
  }

  return (
    <section className="flex items-center justify-center mx-auto">
      <Card className='w-full md:w-96 flex flex-col p-6'>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <FormItem className="text-secondary">
              <FormLabel htmlFor="email">Email</FormLabel>
              <FormControl>
                <Input placeholder="someone@somewhere.com" {...form.register('email')} id="email" type="email" />
              </FormControl>
            </FormItem>
            <FormItem className="mt-4">
              <Button className="bg-background hover:bg-card-foreground text-primary hover:text-secondary w-full transition-all duration-300" type="submit">Submit</Button>
            </FormItem>
          </form>
        </Form>
      </Card>
    </section>
  )
}

export default RouteComponent;