import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (user) {
    return redirect("/dashboard");
  }

  return (
    <section className="w-11/12 max-w-xl flex-1 mx-auto grow flex-col">
      {children}
    </section>
  );
}