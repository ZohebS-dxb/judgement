import { redirect } from "next/navigation";
import { Brand } from "@/components/brand";
import { LoginForm } from "@/components/login-form";
import { currentPlayer } from "@/lib/server/auth";

export default async function LoginPage() {
  if (await currentPlayer()) redirect("/");
  return <main className="ambient login-wrap"><section className="panel login-card">
    <Brand /><div style={{ height: 34 }} />
    <div className="eyebrow">Private table</div><h2 style={{ marginTop: 8 }}>Welcome back.</h2>
    <p className="subtle">Choose your usual player name and enter your table PIN.</p><LoginForm />
  </section></main>;
}
