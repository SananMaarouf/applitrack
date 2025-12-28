"use client"

import { z } from "zod";
import { useState } from "react";
import { Button } from "./ui/button";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "./ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { changePasswordAction } from "@/app/actions";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"

const formSchema = z.object({
  password: z.string().min(6, {
    message: "Password must be at least 6 characters long"
  }),
  confirmPassword: z.string().min(6, {
    message: "Confirm password must match password"
  })
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export function UpdatePasswordForm() {
  const { toast } = useToast();

  const [isViewPassword, setIsViewPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(data: z.infer<typeof formSchema>) {
    try {
      setIsLoading(true);
      const formData = new FormData();
      formData.append("password", data.password);
      formData.append("confirmPassword", data.confirmPassword);

      const response = await changePasswordAction(formData);
      
      if (response.success) {
        toast({
          title: "Success ✅",
          description: response.message,
        });
        form.reset();
      } else {
        toast({
          title: "Error",
          description: response.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
      console.error("Password update error:", error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="bg-card h-full text-foreground p-4 rounded-md">
      <h2 className="text-lg font-semibold text-center mb-4">Update Password</h2>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="">New Password*</FormLabel>
                <FormControl>
                  <div className="relative text-secondary">
                    <Input
                      type={isViewPassword ? "text" : "password"}
                      {...field}
                      className="pr-10 "
                      placeholder="Enter new password"
                    />
                    {isViewPassword ? (
                      <Eye
                        className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
                        onClick={() => setIsViewPassword(!isViewPassword)}
                      />
                    ) : (
                      <EyeOff
                        className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
                        onClick={() => setIsViewPassword(!isViewPassword)}
                      />
                    )}
                  </div>
                </FormControl>
                <FormMessage className="text-red-700" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="">Confirm Password*</FormLabel>
                <FormControl>
                  <div className="relative text-secondary">
                    <Input
                      type={isViewPassword ? "text" : "password"}
                      {...field}
                      className="pr-10"
                      placeholder="Confirm your password"
                    />
                    {isViewPassword ? (
                      <Eye
                        className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
                        onClick={() => setIsViewPassword(!isViewPassword)}
                      />
                    ) : (
                      <EyeOff
                        className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
                        onClick={() => setIsViewPassword(!isViewPassword)}
                      />
                    )}
                  </div>
                </FormControl>
                <FormMessage className="text-red-700" />
              </FormItem>
            )}
          />

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              variant="default"
              className="mt-2 w-1/3 md:w-36"
              disabled={isLoading}
            >
              {isLoading ? "Updating..." : "Update"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}