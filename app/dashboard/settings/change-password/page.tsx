import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { changePasswordAction } from "@/app/actions";
import { createClient } from "@/utils/supabase/server";
import { FormMessage, Message } from "@/components/form-message";

export default async function ChangePasswordPage(props: {
  searchParams: Promise<Message>;
}) {
  const searchParams = await props.searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
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
        <form className="flex flex-col mx-auto w-full p-4 gap-2 [&>input]:mb-4">
          <h1 className="text-2xl font-medium">Update password</h1>
          <p className="text-sm">
            Please enter your new password below.
          </p>
          <Label htmlFor="password">New password</Label>
          <Input
            type="password"
            name="password"
            placeholder="New password"
            required
          />
          <Label htmlFor="confirmPassword">Confirm password</Label>
          <Input
            type="password"
            name="confirmPassword"
            placeholder="Confirm password"
            required
          />
          <Button
            type="submit"
            variant={"columns"}
            formAction={changePasswordAction}
            className="w-full md:w-1/3 md:ml-auto"
          >
            Update password
          </Button>
          <FormMessage message={searchParams} />
        </form>
      </Card>
    </>
  );
}