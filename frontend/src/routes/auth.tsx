import { createFileRoute } from '@tanstack/react-router';
import { Card } from '@/components/ui/card';
/* import { handleSignup } from '@/api/auth';
 */import { FormData } from '@/types';
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import  LoginForm  from '@/components/loginForm';
import SignupForm from '@/components/signupForm';

export const Route = createFileRoute('/auth')({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <section className="flex-grow flex items-center justify-center">
      <Card className='w-11/12 md:w-1/3 mx-auto flex flex-col p-4'>
        <Tabs defaultValue="signin" className='w-full'>
          <TabsList className='w-full'>
            <TabsTrigger className='w-full' value="login">Logn in</TabsTrigger>
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