import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/card";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { UpdatePasswordForm } from "@/components/updatePasswordForm";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";

export default async function ChangePasswordPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const hasPassword = user.passwordEnabled;

  return (
    <section className="flex flex-col max-w-3xl mx-auto px-8 lg:px-8 gap-6">
      <nav className="w-full mx-auto mb-4">
          <Link href="/dashboard/settings" className="flex w-fit hover:underline bg-primary text-primary-foreground p-2 rounded-md" >
            <ArrowLeft className="h-6 w-6 mr-1" /> Back to settings
          </Link>
        </nav>

       <Card className="w-full mx-auto p-4 animate-fade-in-slow">
        {!hasPassword ? (
            <Alert>
              <InfoIcon className="h-4 w-4" />
              <AlertTitle>Password Change Unavailable</AlertTitle>
              <AlertDescription>
                Your account uses social login (Google, etc.). Password management
                is handled by your social provider. You cannot set a password for
                this account.
              </AlertDescription>
            </Alert>
        ) : (
          <UpdatePasswordForm />
        )}
      </Card>
    </section>
  );
}