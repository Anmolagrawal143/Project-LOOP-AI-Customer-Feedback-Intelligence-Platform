import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { AskLoopChat } from "@/components/ask/AskLoopChat";

export default async function AskPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  return <AskLoopChat />;
}
