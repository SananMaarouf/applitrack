import * as z from "zod";
import Link from "next/link";
import { Checkbox } from "./ui/checkbox";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { signUpAction } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
// Remove FormMessage since we won't be using it

// Registration form schema with password confirmation
const registerSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  confirmPassword: z.string().min(6, { message: "Please confirm your password" }),
  termsAccepted: z.boolean().refine(val => val === true, {
    message: "You must accept the terms and conditions"
  })
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export function SignupForm() {
  const { toast } = useToast();
  const router = useRouter();

  // Register form
  const registerForm = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      termsAccepted: false
    },
  });

  // Handle registration submission with validation toast messages
  async function onRegisterSubmit(values: z.infer<typeof registerSchema>) {
    try {
      const formData = new FormData();
      formData.append("email", values.email);
      formData.append("password", values.password);
      formData.append("confirmPassword", values.confirmPassword);
      formData.append("termsAccepted", values.termsAccepted.toString());

      const result = await signUpAction(formData);
      if (result?.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Registration successful! Please check your email to verify your account.",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
  }

    // Show validation errors in toast instead of in form
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    // Get form data and validate before submission
    const isValid = await registerForm.trigger();
    
    if (!isValid) {
      // Get the first error message after validation
      const errors = registerForm.formState.errors;
      const errorFields = Object.entries(errors);
      
      if (errorFields.length > 0) {
        const [field, error] = errorFields[0];
        const message = error.message?.toString() || `${field} is invalid`;
        
        toast({
          title: "Validation Error",
          description: message,
          variant: "destructive",
        });
      }
      return; // Stop form submission if invalid
    }
    
    // If validation passes, proceed with submission
    registerForm.handleSubmit(onRegisterSubmit)(e);
  }

  return (
    <Form {...registerForm}>
      <form onSubmit={handleSubmit} className="
        flex flex-col justify-between
        min-w-64 h-[400px]
        animate-fade-down text-card-foreground
        ">
        <div className="space-y-4">
          <FormField
            control={registerForm.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input className="text-foreground" placeholder="you@example.com" {...field} />
                </FormControl>
                {/* Remove FormMessage */}
              </FormItem>
            )}
          />
          <FormField
            control={registerForm.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input className="text-foreground" type="password" placeholder="Secret password" {...field} />
                </FormControl>
                {/* Remove FormMessage */}
              </FormItem>
            )}
          />
          <FormField
            control={registerForm.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm password</FormLabel>
                <FormControl>
                  <Input className="text-foreground" type="password" placeholder="Secret password again" {...field} />
                </FormControl>
                {/* Remove FormMessage */}
              </FormItem>
            )}
          />
          
          <FormField
            control={registerForm.control}
            name="termsAccepted"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md py-2">
                <FormControl>
                  <Checkbox
                    className="h-6 w-6" 
                    checked={field.value} 
                    onCheckedChange={field.onChange} 
                    id="terms"
                  />
                </FormControl  >
                <div className="space-y-1 leading-none">
                  <FormLabel htmlFor="terms" className="">
                    I agree to the{" "}
                    <Link 
                      href="/terms-of-service" 
                      className="text-primary underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Terms & Conditions
                    </Link>
                  </FormLabel>
                  {/* Remove FormMessage */}
                </div>
              </FormItem>
            )}
          />
        </div>
        
        <Button
          type="submit"
          variant={"add"}
          className="w-1/3 ml-auto"
          disabled={registerForm.formState.isSubmitting}
        >
          {registerForm.formState.isSubmitting ? "Registering..." : "Register"}
        </Button>
      </form>
    </Form>
  );
}