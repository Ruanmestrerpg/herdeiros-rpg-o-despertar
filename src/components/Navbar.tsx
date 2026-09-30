import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { useUser } from "@/lib/auth";

const links = [
  { to: "/jogador", label: "Jogador" },
  { to: "/mesa", label: "Mesa" },
  { to: "/mestre", label: "Mestre" },
  { to: "/rolador", label: "Rolador" },
  { to: "/regras", label: "Regras" },
] as const;

export function Navbar() {
  const [open, setOpen] = useState(false);
  const { user } = useUser();
  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="font-display text-xl font-bold tracking-[0.2em] text-lilac">HERDEIROS</Link>
        <div className="hidden items-center gap-6 md:flex">
          {links.map((l) => (
            <Link key={l.to} to={l.to} className="text-sm text-muted-foreground transition hover:text-lilac" activeProps={{ className: "text-lilac" }}>
              {l.label}
            </Link>
          ))}
          <Link to={user ? "/conta" : "/login"} className="text-sm text-muted-foreground hover:text-lilac">
            {user ? "Conta" : "Entrar"}
          </Link>
          <Link to="/mestre" className="rounded-md bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90">Mestre</Link>
        </div>
        <button className="md:hidden" onClick={() => setOpen(!open)} aria-label="Menu">{open ? <X /> : <Menu />}</button>
      </nav>
      {open && (
        <div className="flex flex-col gap-3 border-t px-4 py-4 md:hidden">
          {links.map((l) => (
            <Link key={l.to} to={l.to} onClick={() => setOpen(false)} className="text-muted-foreground">{l.label}</Link>
          ))}
          <Link to={user ? "/conta" : "/login"} onClick={() => setOpen(false)} className="text-muted-foreground">{user ? "Conta" : "Entrar"}</Link>
        </div>
      )}
    </header>
  );
}
