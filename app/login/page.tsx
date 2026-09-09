import { redirect } from "next/navigation";
import { LoginForm } from "@/components/login-form";
import { currentPlayer } from "@/lib/server/auth";

export default async function LoginPage() {
  if (await currentPlayer()) redirect("/");
  return <main className="landscape-page centered-page"><section className="minimal-form"><LoginForm /></section></main>;
}
