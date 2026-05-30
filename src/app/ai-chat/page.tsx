import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import AIChatClient from "./AIChatClient";

export const metadata = {
  title: "AI Style Assistant — Darpan",
  description:
    "Chat with Darpan's AI stylist. Analyze product links, get outfit recommendations from your wardrobe, and explore fashion trends.",
};

export default async function AIChatPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("gender, replica_image_url")
    .eq("id", user.id)
    .single();

  return <AIChatClient initialGender={profile?.gender} initialUserImageUrl={profile?.replica_image_url} />;
}
