import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import TryOnClient from "./TryOnClient";

export default async function TryOnPage() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect("/sign-in");
  }

  // We can pass the user ID or email if needed, but for now just pass a flag
  return <TryOnClient userEmail={session.user.email || ""} />;
}
