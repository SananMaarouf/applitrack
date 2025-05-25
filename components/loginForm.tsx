import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { signInAction } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";
import { GoogleAuth } from "./googleAuth";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";

// Login form schema
const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

export function LoginForm() {
  const { toast } = useToast();
  const router = useRouter();

  // Login form
  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Handle login submission
  async function onLoginSubmit(values: z.infer<typeof loginSchema>) {
    const formData = new FormData();
    formData.append("email", values.email);
    formData.append("password", values.password);

    try {
      const result = await signInAction(formData);

      if (result?.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Signed in successfully!",
        });
        router.push("/dashboard");
      }
    } catch (error) {
      if (error instanceof Error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      }
    }
  }

  return (
    <Form {...loginForm}>
      <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="
        flex flex-col justify-between
        min-w-64 h-3/4
         text-card-foreground
      ">
        <div className="space-y-4 animate-fade-down">
          <FormField
            control={loginForm.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input className="text-foreground" placeholder="you@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={loginForm.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel>Password</FormLabel>
                  <Link className="text-xs underline" href="/forgot-password">
                    Forgot Password?
                  </Link>
                </div>
                <FormControl>
                  <Input className="text-foreground" type="password" placeholder="super secret password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        
        <Button
          type="submit"
          variant={"add"}
          className="w-1/3 ml-auto animate-fade-in"
          disabled={loginForm.formState.isSubmitting}
        >
          {loginForm.formState.isSubmitting ? "Signing in..." : "Sign in"}
        </Button>
      </form>
      <div className="flex items-center my-4">
        <div className="flex-grow border-t border-muted-foreground" />
        <span className="mx-2 text-muted-foreground text-xs">- or -</span>
        <div className="flex-grow border-t border-muted-foreground" />
      </div>
      <GoogleAuth />
    </Form>
  );
}