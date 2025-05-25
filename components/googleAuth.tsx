"use client";

import { signInWithGoogle } from "@/app/actions";
import { Button } from "@/components/ui/button";
export function GoogleAuth() {
  return (
    
    <form action={signInWithGoogle}>
            <Button
          type="submit"
          variant={"add"}
          className="w-full ml-auto animate-fade-in"
        >
          Sign in with Google
        </Button>
    </form>

  );
}