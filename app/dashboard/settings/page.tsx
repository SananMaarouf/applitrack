import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { auth, currentUser } from "@clerk/nextjs/server";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { DeleteAccountDialog } from "@/components/delete-account-dialog";
export default async function SettingsPage() {
  const { userId } = await auth();
  const user = await currentUser();
  
  if (!userId || !user) {
    return redirect("/sign-in");
  }

  const userEmail = user.emailAddresses.find(email => email.id === user.primaryEmailAddressId)?.emailAddress || '';

  return (
      <section className="flex flex-col max-w-3xl mx-auto px-8 lg:px-8 gap-6">
        <nav className="w-full mx-auto mb-4">
          <Link href="/dashboard" className="flex w-fit hover:underline bg-primary text-primary-foreground p-2 rounded-md" >
            <ArrowLeft className="h-6 w-6 mr-1" /> Back to dashboard
          </Link>
        </nav>
        <Card className="w-full mx-auto p-4 animate-fade-in-slow">
          <h1 className="text-2xl font-bold mb-6">Account Settings</h1>
          <section className="w-full grid grid-cols-1 gap-6 max-w-6xl mx-auto">
            <section className="w-full space-y-4">
              <section className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={userEmail} disabled className="bg-muted text-muted-foreground" />
                <p className="text-sm text-muted">Your account email cannot be changed here</p>
              </section>

              <section className="space-y-2 pt-4">
                <h3 className="text-md font-medium">Password</h3>
                <p className="text-sm">Update your password to keep your account secure</p>
                <Button variant="default" className="mt-2" asChild >
                  <Link href="/dashboard/settings/change-password">
                    Change Password
                  </Link>
                </Button>
              </section>

              <section className="space-y-2 pt-4">
                <h3>Want to re-read the terms of service?</h3>
                <Button variant="default" className="mt-2" asChild >
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
                  <AccordionTrigger className="text-md font-medium text-destructive cursor-pointer">
                    Danger Zone
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <p className="text-sm">Permanently delete your account and all your data</p>
                    <DeleteAccountDialog userId={userId} />
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </section>
          </section>
        </Card>
      </section>

  );
}