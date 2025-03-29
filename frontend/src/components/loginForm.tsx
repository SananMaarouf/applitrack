import { useForm } from "react-hook-form";
import { LoginFormData } from '@/types';
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
import { useNavigate, Link } from '@tanstack/react-router';
import { useAuthStore } from '@/store/authStore';
import { useState } from "react";
import { Loader2 } from "lucide-react"; // Import Loader2 icon from lucide-react

const LoginForm = () => {
  const { toast } = useToast();
  const form = useForm<LoginFormData>();
  const navigate = useNavigate();
  const setIsAuthenticated = useAuthStore((state) => state.setIsAuthenticated);
  const setUserAuthData = useAuthStore((state) => state.setUserAuthData);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (data: LoginFormData) => {
    try {
      setIsLoading(true); // Set loading to true when starting the request
      
      /* get api url  */
      const apiUrl = import.meta.env.VITE_API_URL;
      /* post the formdata */
      const response = await fetch(`${apiUrl}/login`, {
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

      // Update the authentication state and user auth data
      setIsAuthenticated(true);
      setUserAuthData(id, email);

      toast({
        title: 'Success',
        description: 'Redirecting to dashboard...',
        duration: 800,
        variant: "default"
      });

      // Delay the following actions by 1 second
      setTimeout(() => {
        // Redirect to the dashboard page
        navigate({ to: '/dashboard' });
      }, 1000);

    } catch (error: any) {
      toast({
        title: 'Error!',
        description: 'Error description: ' + error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false); // Set loading to false when request completes (success or error)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleLogin)} className="space-y-8">
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
        <div className="flex flex-col-reverse justify-between items-center gap-4">
          <Link to="/forgot-password" className="
            text-sm text-foreground underline hover:decoration-1">
            Forgot your password?
          </Link>
          <Button 
            className='hover:scale-110 w-full transition-all duration-300' 
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Logging in...
              </>
            ) : (
              "Log in"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default LoginForm;