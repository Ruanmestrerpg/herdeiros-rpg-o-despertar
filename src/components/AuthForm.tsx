import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Panel } from "@/components/game";
import { errMsg } from "@/lib/auth";

export function AuthForm({ mode, redirect }: { mode: "login" | "cadastro"; redirect?: string | undefined }) {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const dest = redirect && redirect.startsWith("/") && !redirect.startsWith("//") ? redirect : "/jogador";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        nav({ to: dest });
      } else {
        const { data, error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: window.location.origin, data: { full_name: name } },
        });
        if (error) throw error;
        if (data.session) nav({ to: dest });
        else toast.success("Verifique seu e-mail para confirmar o cadastro.");
      }
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    if (redirect) sessionStorage.setItem("post_login", dest);
    const res = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/login" });
    if (res.error) { toast.error(errMsg(res.error)); return; }
    if (res.redirected) return;
    nav({ to: dest });
  }

  return (
    <main className="mx-auto flex max-w-md flex-col px-4 py-16">
      <Panel>
        <h1 className="text-center text-2xl font-bold text-lilac">{mode === "login" ? "Entrar" : "Criar conta"}</h1>
        <form onSubmit={submit} className="mt-6 space-y-4">
          {mode === "cadastro" && (
            <div><Label>Nome de mesa</Label><Input value={name} onChange={(e) => setName(e.target.value)} required /></div>
          )}
          <div><Label>E-mail</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
          <div><Label>Senha</Label><Input type="password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
          <Button className="w-full" disabled={busy}>{mode === "login" ? "Entrar" : "Cadastrar"}</Button>
        </form>
        <div className="my-4 text-center text-xs text-muted-foreground">ou</div>
        <Button variant="outline" className="w-full" onClick={google}>Continuar com Google</Button>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          {mode === "login" ? (
            <>Não tem conta? <Link to="/cadastro" search={redirect ? { redirect } : {}} className="text-lilac">Cadastre-se</Link></>
          ) : (
            <>Já tem conta? <Link to="/login" search={redirect ? { redirect } : {}} className="text-lilac">Entrar</Link></>
          )}
        </p>
      </Panel>
    </main>
  );
}
