import { useMutation } from '@tanstack/react-query';
import { handleLogin, handleSignup } from '../api/test';
import { Card, CardContent } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { createFileRoute } from '@tanstack/react-router'
import { Link } from '@tanstack/react-router';
import { Checkbox } from '@/components/ui/checkbox';
import Spinner from '@/components/spinner';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

export const Route = createFileRoute('/auth')({
  component: RouteComponent,
})
function RouteComponent() {
  const loginMutation = useMutation(handleLogin);
  const signupMutation = useMutation(handleSignup);

  const handleLoginSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    await loginMutation.mutateAsync(formData);
  };

  const handleSignupSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    await signupMutation.mutateAsync(formData);
  };

  return (
    <Card className="my-auto">
      <Tabs defaultValue="login" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="login">Sign In</TabsTrigger>
          <TabsTrigger value="signup">Register</TabsTrigger>
        </TabsList>
        <CardContent className="flex flex-col border">
          <TabsContent value="login">
            <form onSubmit={handleLoginSubmit} className="flex-1 flex flex-col w-full justify-center gap-2 text-foreground mt-2">
              <label className="text-md" htmlFor="email">Email</label>
              <input type="email" name="email" required />
              <label className="text-md" htmlFor="password">Password</label>
              <input type="password" name="password" required />
              <button type="submit" disabled={loginMutation.isLoading}>
                {loginMutation.isLoading ? 'Logging in...' : 'Login'}
              </button>
              {loginMutation.isError && <div style={{ color: 'red' }}>{(loginMutation.error as Error).message}</div>}
            </form>
          </TabsContent>
          <TabsContent value="signup">
            <form onSubmit={handleSignupSubmit} className="flex-1 flex flex-col w-full justify-center gap-2 text-foreground mt-2">
              <label className="text-md" htmlFor="name">Name</label>
              <input type="text" name="name" required />
              <label className="text-md" htmlFor="email">Email</label>
              <input type="email" name="email" required />
              <label className="text-md" htmlFor="password">Password</label>
              <input type="password" name="password" required />
              <button type="submit" disabled={signupMutation.isLoading}>
                {signupMutation.isLoading ? 'Signing up...' : 'Signup'}
              </button>
              {signupMutation.isError && <div style={{ color: 'red' }}>{(signupMutation.error as Error).message}</div>}
            </form>
          </TabsContent>
        </CardContent>
      </Tabs>
    </Card>
  );
}

export default RouteComponent;