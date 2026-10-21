import Link from 'next/link';
import {
  Headphones,
  Shield,
  UserX,
  Sparkles,
  Lock,
  Ghost,
  Radio,
  FileText,
  ChevronRight,
  ArrowRight,
  Smartphone,
} from 'lucide-react';

export default function HomePage() {
  return (
    <div className="relative overflow-hidden">
      {/* Background glow effects */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-rose-900/20 blur-[130px] rounded-full" />
      <div className="pointer-events-none absolute top-96 right-0 w-[400px] h-[400px] bg-purple-900/10 blur-[120px] rounded-full" />

      {/* Hero Section */}
      <section className="relative mx-auto max-w-6xl px-4 pt-16 pb-20 sm:px-6 sm:pt-24 sm:pb-28 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-rose-500/20 bg-rose-500/10 px-4 py-1.5 text-xs font-semibold text-rose-400 mb-6 backdrop-blur-sm">
          <Ghost className="h-3.5 w-3.5" />
          Ficção Seriada em Áudio · Terror & Suspense
        </div>

        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white max-w-3xl mx-auto leading-[1.15]">
          Histórias que prendem do primeiro ao{' '}
          <span className="bg-gradient-to-r from-rose-500 via-rose-400 to-amber-300 bg-clip-text text-transparent">
            último segundo.
          </span>
        </h1>

        <p className="mt-6 text-base sm:text-lg text-zinc-400 max-w-2xl mx-auto leading-relaxed">
          O <strong className="text-zinc-200">AudioFic</strong> traz audio dramas seriados de terror psicológico, folclore macabro e mistérios investigativos criados para ouvir no escuro ou nos seus trajetos diários.
        </p>

        {/* CTA Buttons */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/privacidade"
            className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 border border-zinc-700/80 px-6 py-3.5 text-sm font-bold text-zinc-100 hover:bg-zinc-800 hover:border-zinc-600 transition-all shadow-lg"
          >
            <Shield className="h-4 w-4 text-rose-400" />
            Política de Privacidade
          </Link>

          <Link
            href="/exclusao-de-conta"
            className="inline-flex items-center gap-2 rounded-xl bg-amber-500/10 border border-amber-500/30 px-6 py-3.5 text-sm font-bold text-amber-300 hover:bg-amber-500/20 hover:border-amber-500/50 transition-all shadow-lg"
          >
            <UserX className="h-4 w-4 text-amber-400" />
            Exclusão de Conta e Dados
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-8 flex items-center justify-center gap-2 text-xs text-zinc-500">
          <Smartphone className="h-3.5 w-3.5" />
          Aplicativo disponível para Android · Pacote:{' '}
          <code className="text-zinc-400 font-mono">com.sahlo.alves.audiofic</code>
        </div>
      </section>

      {/* Feature Highlights */}
      <section className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 border-t border-zinc-800/80">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-6 space-y-3 backdrop-blur-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <Radio className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-bold text-white">Áudio Dramas Seriados</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Episódios curtos e envolventes com ganchos instigantes. Progressão narrativa com vozes marcantes e ambientação sonora atmosférica.
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-6 space-y-3 backdrop-blur-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Lock className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-bold text-white">Privacidade & Segurança</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Respeito total às normas da LGPD. Seus dados nunca são vendidos a corretores nem compartilhados com redes de anúncios de terceiros.
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-6 space-y-3 backdrop-blur-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <UserX className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-bold text-white">Autonomia do Usuário</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Exclusão simples e autônoma da conta e dos dados a qualquer momento, pelo próprio aplicativo ou diretamente pelo nosso portal web.
            </p>
          </div>
        </div>
      </section>

      {/* Legal & Compliance Banner */}
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="rounded-3xl border border-zinc-800 bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 p-8 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-400">
              <Shield className="h-3.5 w-3.5" />
              Transparência para a Google Play Store
            </div>
            <h2 className="text-2xl font-bold text-white">Diretrizes Legais e Direitos do Titular</h2>
            <p className="text-sm text-zinc-400 max-w-xl">
              Consulte nossos documentos completos sobre armazenamento de arquivos no Cloudflare R2, cobranças no RevenueCat e seus direitos garantidos pela LGPD.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto shrink-0">
            <Link
              href="/privacidade"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-800 px-5 py-3 text-xs font-bold text-white hover:bg-zinc-700 transition-colors"
            >
              <FileText className="h-4 w-4" />
              Política de Privacidade
            </Link>
            <Link
              href="/exclusao-de-conta"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-5 py-3 text-xs font-bold text-zinc-950 hover:bg-amber-400 transition-colors"
            >
              <UserX className="h-4 w-4" />
              Exclusão de Conta
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
