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
    <div className="flex flex-col h-[calc(100vh-8.5rem)]">
      <div className="flex-grow flex items-center justify-center" style={{ minHeight: 'calc(100vh - var(--nav-height) - var(--footer-height))' }}>
        <Card className="flex w-11/12 md:w-1/3 mx-auto">
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Register</TabsTrigger>
            </TabsList>
            <CardContent className="flex flex-col border">
              <TabsContent value="login">
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    await handleLogin(formData);
                  }}
                  className="flex-1 flex flex-col w-full justify-center gap-2 text-foreground mt-2"
                >
                  <label className="text-md" htmlFor="email">
                    Email
                  </label>
                  <input
                    className="rounded-md px-4 py-2 bg-inherit border mb-6"
                    name="email"
                    placeholder="you@example.com"
                    required
                  />
                  <label className="text-md" htmlFor="password">
                    Password
                  </label>
                  <input
                    className="rounded-md px-4 py-2 bg-inherit border mb-6"
                    type="password"
                    name="password"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    className="bg-green-800 rounded-md px-4 py-2 text-foreground mb-2 hover:bg-green-900"
                    type="submit"
                  >
                    Sign In
                  </button>
                </form>
                <div className="flex flex-row w-full">
                  <Link href="/forgot-password" className="text-md underline ml-auto">
                    Forgot your password?
                  </Link>
                </div>
              </TabsContent>
              <TabsContent value="signup">
                <form
                  className="flex-1 flex flex-col w-full justify-center gap-2 text-foreground mt-2"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    await handleSignup(formData);
                  }}
                >
                  <label className="text-md" htmlFor="email">
                    Email
                  </label>
                  <input
                    className="rounded-md px-4 py-2 bg-inherit border mb-6"
                    name="email"
                    placeholder="you@example.com"
                    required
                  />
                  <label className="text-md" htmlFor="password">
                    Password
                  </label>
                  <input
                    className="rounded-md px-4 py-2 bg-inherit border mb-6"
                    type="password"
                    name="password"
                    placeholder="••••••••"
                    required
                  />
                  <label className="text-md" htmlFor="confirmPassword">
                    Confirm Password
                  </label>
                  <input
                    className="rounded-md px-4 py-2 bg-inherit border mb-6"
                    type="password"
                    name="confirmPassword"
                    placeholder="••••••••"
                    required
                  />
                  <div className="items-top flex space-x-2">
                    <Checkbox id="terms" name="terms" required />
                    <div className="grid gap-1.5 leading-none">
                      <label
                        htmlFor="terms"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Accept terms and conditions
                      </label>
                      <p className="text-sm text-white">
                        You agree to our <Link href="/TOS" className="underline">Terms of Service</Link> and <Link href="/privacy" className="underline">Privacy Policy</Link>.
                      </p>
                    </div>
                  </div>
                  <button
                    className="bg-green-800 rounded-md px-4 py-2 text-foreground mb-2 hover:bg-green-900"
                    type="submit"
                  >
                    Sign Up
                  </button>
                </form>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}

export default RouteComponent;