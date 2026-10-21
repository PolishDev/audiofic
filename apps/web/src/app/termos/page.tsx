import Link from 'next/link';
import { FileText, Shield, ArrowRight } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Termos de Uso · AudioFic',
  description: 'Termos e Condições de Uso da plataforma e aplicativo AudioFic.',
};

export default function TermosPage() {
  const lastUpdated = '21 de outubro de 2026';

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
      {/* Header */}
      <div className="mb-10 space-y-4 border-b border-zinc-800 pb-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-800/60 px-3.5 py-1 text-xs font-semibold text-zinc-300">
          <FileText className="h-3.5 w-3.5 text-zinc-400" />
          Termos e Condições Gerais
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
          Termos de Uso
        </h1>
        <p className="text-sm text-zinc-400">
          Aplicativo <strong className="text-zinc-200">AudioFic</strong> (Identificador:{' '}
          <code className="rounded bg-zinc-800 px-1.5 py-0.5 font-mono text-zinc-300">com.sahlo.alves.audiofic</code>)
        </p>
        <p className="text-xs text-zinc-500">Última atualização: {lastUpdated}</p>
      </div>

      <div className="space-y-10 text-sm sm:text-base leading-relaxed text-zinc-300">
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white">1. Aceitação dos Termos</h2>
          <p>
            Ao baixar, instalar, cadastrar-se ou utilizar o aplicativo e serviços do <strong>AudioFic</strong>, você declara ter lido, compreendido e concordado integralmente com estes Termos de Uso e com a nossa{' '}
            <Link href="/privacidade" className="text-rose-400 underline hover:text-rose-300">
              Política de Privacidade
            </Link>.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white">2. Descrição do Serviço</h2>
          <p>
            O AudioFic é uma plataforma digital que disponibiliza histórias seriadas narradas em áudio nos gêneros de terror, suspense e mistério. O acesso ao catálogo pode incluir episódios gratuitos para degustação e episódios exclusivos disponibilizados mediante assinatura periódica ou compras avulsas.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white">3. Cadastro e Segurança da Conta</h2>
          <p>
            Para usufruir de recursos como salvamento de progresso entre aparelhos e favoritos, o usuário deve criar uma conta utilizando um endereço de e-mail válido. O usuário é o único responsável pela guarda e confidencialidade de sua senha, bem como por todas as atividades realizadas em sua conta.
          </p>
          <p>
            Você pode solicitar a exclusão definitiva de sua conta a qualquer momento por meio da página{' '}
            <Link href="/exclusao-de-conta" className="text-rose-400 underline hover:text-rose-300">
              Exclusão de Conta
            </Link>.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white">4. Propriedade Intelectual</h2>
          <p>
            Todas as histórias, roteiros, títulos, artes conceituais, efeitos sonoros, mixagens, trilhas sonoras e gravações de voz disponibilizadas no AudioFic são obras intelectuais protegidas pela legislação brasileira e internacional de direitos autorais. É terminantemente proibido copiar, gravar, redistribuir, vender ou explorar comercialmente qualquer áudio ou texto do AudioFic sem autorização prévia por escrito.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white">5. Assinaturas e Pagamentos</h2>
          <p>
            As assinaturas e compras dentro do aplicativo são processadas exclusivamente pelos canais de faturamento autorizados (Google Play Billing / Apple App Store). O cancelamento de renovações recorrentes deve ser gerenciado pelo usuário diretamente na respectiva loja de aplicativos do seu sistema operacional.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white">6. Legislação Aplicável</h2>
          <p>
            Estes Termos são regidos e interpretados de acordo com as leis da República Federativa do Brasil. Fica eleito o foro da comarca de domicílio do usuário para dirimir eventuais controvérsias oriundas do presente instrumento.
          </p>
        </section>
      </div>
    </div>
  );
}
