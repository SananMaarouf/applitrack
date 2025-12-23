import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  
  if (userId) {
    return redirect("/dashboard");
  }

  return (
    <section className="w-11/12 max-w-xl flex-1 mx-auto grow flex-col">
      {children}
    </section>
  );
}