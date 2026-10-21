import Link from 'next/link';
import { Headphones, Shield, UserX, FileText } from 'lucide-react';

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-rose-600 to-rose-900 text-white shadow-md shadow-rose-950/40 group-hover:scale-105 transition-transform">
            <Headphones className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
              AudioFic
              <span className="text-[10px] font-medium tracking-wide uppercase px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
                Oficial
              </span>
            </span>
          </div>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2">
          <Link
            href="/privacidade"
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-zinc-300 hover:text-white hover:bg-zinc-800/60 transition-colors"
          >
            <Shield className="h-4 w-4 text-rose-400" />
            <span className="hidden sm:inline">Política de</span> Privacidade
          </Link>
          <Link
            href="/exclusao-de-conta"
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-zinc-300 hover:text-white hover:bg-zinc-800/60 transition-colors"
          >
            <UserX className="h-4 w-4 text-amber-400" />
            <span>Exclusão de Conta</span>
          </Link>
          <Link
            href="/termos"
            className="hidden md:flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-zinc-300 hover:text-white hover:bg-zinc-800/60 transition-colors"
          >
            <FileText className="h-4 w-4 text-zinc-400" />
            <span>Termos</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
