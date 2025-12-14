import Link from "next/link";

export const dynamic = 'force-dynamic';

export default function ForgotPassword() {
  return (
    <section className="flex-1 flex flex-col w-full gap-2 text-foreground min-w-64 max-w-md mx-auto">
      <div>
        <h1 className="text-2xl font-medium">Reset Password</h1>
        <p className="text-sm text-secondary-foreground mt-2">
          Password reset is now handled through the sign-in page.{" "}
          <Link className="text-foreground underline" href="/sign-in">
            Go to sign in
          </Link>
        </p>
        <p className="text-sm text-muted-foreground mt-4">
          Click "Forgot password?" on the sign-in page to reset your password.
        </p>
      </div>
    </section>
  );
}
