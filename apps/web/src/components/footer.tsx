import Link from 'next/link';
import { Headphones, ShieldCheck, Mail } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-zinc-800/80 bg-zinc-950 text-zinc-400">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-600 text-white">
                <Headphones className="h-4 w-4" />
              </div>
              <span className="text-lg font-bold text-white">AudioFic</span>
            </div>
            <p className="text-sm text-zinc-400 leading-relaxed max-w-md">
              Plataforma de ficção seriada em áudio imersivo. Séries originais de terror psicológico, suspense serializado e mistérios atmosféricos produzidos para prender a sua atenção episódio a episódio.
            </p>
            <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/60 px-3 py-1 text-xs text-zinc-400">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              Em total conformidade com a LGPD (Lei nº 13.709/2018) e Google Play Data Safety
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-200">Legal & Privacidade</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/privacidade" className="hover:text-white transition-colors">
                  Política de Privacidade
                </Link>
              </li>
              <li>
                <Link href="/exclusao-de-conta" className="hover:text-white transition-colors text-amber-300/90 hover:text-amber-200">
                  Exclusão de Conta e Dados
                </Link>
              </li>
              <li>
                <Link href="/termos" className="hover:text-white transition-colors">
                  Termos de Uso
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-200">Contato & Suporte</h4>
            <p className="text-sm text-zinc-400">
              Dúvidas sobre seus dados ou suporte com sua conta:
            </p>
            <a
              href="mailto:suporte@audiofic.app"
              className="inline-flex items-center gap-1.5 text-sm text-rose-400 hover:text-rose-300 transition-colors"
            >
              <Mail className="h-4 w-4" />
              suporte@audiofic.app
            </a>
            <div className="text-xs text-zinc-500 pt-2">
              Pacote Android: <code className="text-zinc-400 font-mono">com.sahlo.alves.audiofic</code>
            </div>
          </div>
        </div>

        <div className="mt-12 border-t border-zinc-800/80 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-500 gap-4">
          <p>© {currentYear} AudioFic. Todos os direitos reservados.</p>
          <div className="flex gap-6">
            <Link href="/privacidade" className="hover:text-zinc-400">Privacidade</Link>
            <Link href="/exclusao-de-conta" className="hover:text-zinc-400">Excluir Conta</Link>
            <Link href="/termos" className="hover:text-zinc-400">Termos</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
