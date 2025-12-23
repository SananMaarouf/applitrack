import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/card";
import { auth } from "@clerk/nextjs/server";
import { UpdatePasswordForm } from "@/components/updatePasswordForm";

export default async function ChangePasswordPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <>
      <div className="mb-4 w-full max-w-4xl mx-auto">
        <Link
          href="/dashboard/settings"
          className="flex items-center w-fit text-sm hover:underline"
        >
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Settings
        </Link>
      </div>

      <Card className="w-full mx-auto max-w-3xl">
        <UpdatePasswordForm />
      </Card>
    </>
  );
}