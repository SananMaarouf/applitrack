import { createClient } from "@/utils/supabase/server";
import { InfoIcon } from "lucide-react";
import { redirect } from "next/navigation";

export default async function DasboardPage() {
  const supabase = await createClient();
  /* 
    getUser() Gets the current user details if there is an existing session. 
    This method performs a network request to the Supabase Auth server, 
    so the returned value is authentic and can be used to base authorization rules on.
    This method fetches the user object from the database instead of local session.
    This method is useful for checking if the user is authorized because it 
    validates the user's access token JWT on the server.
    Should always be used when checking for user authorization on the server. 
    On the client, you can instead use getSession().session.user for faster results. 
    getSession is insecure on the server. 
  */
  const { data: { user }} = await supabase.auth.getUser();
  const { data: applications } = await supabase.from("applications").select();

  if (!user) { return redirect("/sign-in") }


  return (
    <div className="flex-1 w-full border-2 border-red-500 flex flex-col gap-12">
      <div className="flex flex-col gap-2 items-start">
        <h2 className="font-bold text-2xl mb-4">Your user details</h2>
        <pre className="text-xs font-mono p-3 rounded border w-full max-h-80 overflow-auto">
          {JSON.stringify(user, null, 2)}
        </pre>
        <h2 className="font-bold text-2xl mb-4">Your users data from db</h2>
        <pre className="text-xs font-mono p-3 rounded border w-full max-h-80 overflow-auto">
          {JSON.stringify(applications, null, 2)}
        </pre>
      </div>
    </div>
  );
}
