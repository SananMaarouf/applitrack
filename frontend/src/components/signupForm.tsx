import { useForm } from "react-hook-form";
import { SignupFormData } from '@/types';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Link, useNavigate } from '@tanstack/react-router';
import { useAuthStore } from '@/store/authStore';
import { Checkbox } from "./ui/checkbox";

const SignupForm = () => {
  const { toast } = useToast();
  const form = useForm<SignupFormData>();
  const navigate = useNavigate();
  const setIsAuthenticated = useAuthStore((state) => state.setIsAuthenticated);
  const setUserAuthData = useAuthStore((state) => state.setUserAuthData);

  const handleSignup = async (data: SignupFormData) => {
    try {
      /* get api url  */
      const apiUrl = import.meta.env.VITE_API_URL;
      /* post the formdata */
      const response = await fetch(`${apiUrl}/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error);
      }

      const result = await response.json();

      // Save the JWT token in local storage
      localStorage.setItem('authToken', result.authData.token);
      // Save the user data in local storage
      const { id, email } = result.authData.record;
      localStorage.setItem('authData', JSON.stringify({ id, email }));

      toast({
        title: 'Success',
        description: 'Redirecting to dashboard...',
        duration: 1000,
        variant: "default"
      });

      // Delay the following actions by 1 second
      setTimeout(() => {
        // Update the authentication state
        setIsAuthenticated(true);
        setUserAuthData(id, email);

        // Redirect to the dashboard page
        navigate({ to: '/dashboard' });
      }, 1000);

    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: "destructive"
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSignup)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="passwordConfirm"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="confirm password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="terms"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <div className="flex items-center"  {...field}>
                  <Checkbox />
                  <span className="ml-2">I agree to the 
                    <Link to="/tos" className="underline ml-1">
                      terms and conditions
                    </Link></span>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className='flex justify-end'>
          <Button className='hover:scale-110 w-full duration-300 transition-all' type="submit">Register</Button>
        </div>
      </form>
    </Form>
  );
};

export default SignupForm;