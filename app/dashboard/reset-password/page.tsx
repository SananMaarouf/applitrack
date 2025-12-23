import Link from "next/link";

export default function ResetPassword() {
  return (
    <section className="flex flex-col w-full max-w-md mx-auto p-4 gap-4">
      <h1 className="text-2xl font-medium">Reset password</h1>
      <p className="text-sm text-foreground">
        Password reset is now handled through Clerk's authentication system.
      </p>
      <p className="text-sm text-muted-foreground">
        Please use the "Forgot password?" link on the{" "}
        <Link href="/sign-in" className="text-foreground underline">
          sign-in page
        </Link>{" "}
        to reset your password.
      </p>
    </section>
  );
}
