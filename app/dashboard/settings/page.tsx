import Link from "next/link";
import Loading from "../loading";
import { Suspense } from "react";
import { ArrowLeft } from "lucide-react";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/server";
import { deleteAccountAction } from "@/app/actions";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export default async function SettingsPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return redirect("/sign-in");
  }


  return (
    <Suspense fallback={<Loading />}>
      <section className="flex flex-col max-w-3xl mx-auto gap-6">

        <nav className="w-full mx-auto">
          <Link href="/dashboard" className="flex items-center w-fit p-2 rounded-md text-sm hover:underline" >
            <ArrowLeft className="h-6 w-6 mr-1" /> Back to dashboard
          </Link>
        </nav>

        <Card className="w-full mx-auto p-4">
          <h1 className="text-2xl font-bold mb-6">Account Settings</h1>
          <section className="w-full grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto">
            <section className="w-full space-y-4">
              <section className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={user.email || ''} disabled className="bg-muted text-muted-foreground" />
                <p className="text-sm text-muted">Your account email cannot be changed</p>
              </section>

              <section className="space-y-2 pt-4">
                <h3 className="text-md font-medium">Password</h3>
                <p className="text-sm">Update your password to keep your account secure</p>
                <Button variant="columns" className="mt-2" asChild >
                  <Link href="/dashboard/settings/change-password">
                    Change Password
                  </Link>
                </Button>
              </section>
            </section>

            <section className="w-full flex flex-col justify-end gap-6">
              <section className="space-y-2">
                <h3 className="text-md font-medium text-destructive">Danger Zone</h3>
                <p className="text-sm">Permanently delete your account and all your data</p>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="mt-2">Delete account</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-card text-card-foreground">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription className="text-card-foreground">
                        This action cannot be undone. This will permanently delete your account and remove all your data from our servers.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel asChild>
                        <Button
                          variant="columns">
                          Cancel
                        </Button>
                      </AlertDialogCancel>
                      <form action={deleteAccountAction.bind(null, user.id)}>
                        <AlertDialogAction asChild>
                          <Button
                            type="submit"
                            variant="destructive"
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Delete Account
                          </Button>
                        </AlertDialogAction>
                      </form>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </section>
            </section>
          </section>
        </Card>
      </section>

    </Suspense>
  );
}