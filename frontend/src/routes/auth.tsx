import { Card } from '@/components/ui/card';
import LoginForm from '@/components/loginForm';
import SignupForm from '@/components/signupForm';
import { createFileRoute, redirect } from '@tanstack/react-router';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute('/auth')({
  beforeLoad: async () => {
    const token = localStorage.getItem('authToken');
    if (token) {
      throw redirect({
        to: '/dashboard',
      });
    }
  },
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <section className="flex items-center justify-center mx-2 md:mx-auto w-full transition-all duration-500">
      <Card className='w-11/12 sm:w-10/12 md:w-1/2 lg:w-1/3 flex flex-col p-6 transition-all duration-500'>
        <Tabs defaultValue="login" className='w-full'>
          <TabsList className='w-full'>
            <TabsTrigger className='w-full' value="login">Log in</TabsTrigger>
            <TabsTrigger className='w-full' value="signup">Register</TabsTrigger>
          </TabsList>
          <TabsContent value="login">
            <LoginForm />
          </TabsContent>
          <TabsContent value="signup">
            <SignupForm />
          </TabsContent>
        </Tabs>
      </Card>
    </section>
  );
}

export default RouteComponent;