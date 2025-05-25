"use client";

import { signInWithGoogle } from "@/app/actions";
import { Button } from "@/components/ui/button";

type GoogleAuthType = "signIn" | "signUp";

interface GoogleAuthProps {
  type?: GoogleAuthType;
}

export function GoogleAuth({ type = "signIn" }: GoogleAuthProps) {
  const buttonText =
    type === "signUp" ? "Sign up with Google" : "Sign in with Google";

  return (
    <form action={signInWithGoogle}>
      <Button
        type="submit"
        variant={"add"}
        className="w-full ml-auto animate-fade-in"
      >
        {buttonText}
      </Button>
    </form>
  );
}