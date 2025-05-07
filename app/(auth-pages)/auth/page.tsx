"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast"; 
import { LoginForm } from "@/components/loginForm";
import { SignupForm } from "@/components/signupForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";



export default function Auth() {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState("login");
  
  // Extract message from URL if present
  const messageType = searchParams.get("type");
  const message = searchParams.get("message");
  
  // Show toast if message exists
  if (message && messageType) {
    toast({
      title: messageType === "error" ? "Error" : "Success",
      description: message,
      variant: messageType === "error" ? "destructive" : "default",
    });
  }


  return (
    <Tabs 
      value={activeTab} 
      onValueChange={setActiveTab}
      className="flex flex-col bg-card p-4 rounded-lg text-card-foreground w-full max-w-md mx-auto transition-all duration-300"
    >
      <TabsList className="flex justify-around px-2 mb-4">
        <TabsTrigger className="w-[49%] my-2" value="login">Sign in</TabsTrigger>
        <TabsTrigger className="w-[49%] my-2" value="register">Register</TabsTrigger>
      </TabsList>
      
      <div className="relative transition-all duration-300 h-[400px]">
        <TabsContent className="absolute h-full w-full" value="login">
          <LoginForm />
        </TabsContent>
        
        <TabsContent className="absolute h-full w-full" value="register">
          <SignupForm />
        </TabsContent>
      </div>
    </Tabs>
  );
}