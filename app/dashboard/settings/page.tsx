import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/server";
import { deleteAccountAction } from "@/app/actions";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export default async function SettingsPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return redirect("/auth");
  }


  return (
      <section className="flex flex-col max-w-3xl mx-auto px-8 lg:px-8 gap-6">
        <nav className="w-full mx-auto mb-4">
          <Link href="/dashboard" className="flex border border-foreground hover:bg-hover hover:text-card-foreground duration-300 transition-colors items-center w-fit p-2 rounded-md text-sm hover:underline" >
            <ArrowLeft className="h-6 w-6 mr-1" /> Back to dashboard
          </Link>
        </nav>
        <Card className="w-full mx-auto p-4 animate-fade-in-slow">
          <h1 className="text-2xl font-bold mb-6">Account Settings</h1>
          <section className="w-full grid grid-cols-1 gap-6 max-w-6xl mx-auto">
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

              <section className="space-y-2 pt-4">
                <h3>Want to re-read the terms of service?</h3>
                <Button variant="columns" className="mt-2" asChild >
                  <Link href="/terms-of-service?from=settings">
                    Click here 
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Link>
                </Button>
              </section>
            </section>

            <section className="w-full flex flex-col justify-end gap-6">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="danger-zone"className="border-b-0">
                  <AccordionTrigger className="text-md font-medium text-destructive">
                    Danger Zone
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <p className="text-sm">Permanently delete your account and all your data</p>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" className="mt-2">Delete account</Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-card text-card-foreground">
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                          <AlertDialogDescription className="text-card-foreground">
                            This action cannot be undone. This will delete your account and remove your data from our server.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel asChild>
                            <Button variant="columns">
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
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </section>
          </section>
        </Card>
      </section>

  );
}