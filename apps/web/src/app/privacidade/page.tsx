import Link from 'next/link';
import { Shield, Lock, EyeOff, Server, UserCheck, Trash2, Mail, AlertCircle, ArrowRight } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Política de Privacidade · AudioFic',
  description: 'Saiba como o AudioFic coleta, utiliza, armazena e protege seus dados em conformidade com a LGPD e as diretrizes do Google Play.',
};

export default function PrivacidadePage() {
  const lastUpdated = '21 de outubro de 2026';

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
      {/* Header */}
      <div className="mb-10 space-y-4 border-b border-zinc-800 pb-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-rose-500/20 bg-rose-500/10 px-3.5 py-1 text-xs font-semibold text-rose-400">
          <Shield className="h-3.5 w-3.5" />
          Conformidade LGPD & Google Play Store
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
          Política de Privacidade
        </h1>
        <p className="text-sm text-zinc-400">
          Aplicativo <strong className="text-zinc-200">AudioFic</strong> (Identificador de pacote:{' '}
          <code className="rounded bg-zinc-800 px-1.5 py-0.5 font-mono text-zinc-300">com.sahlo.alves.audiofic</code>)
        </p>
        <p className="text-xs text-zinc-500">Última atualização: {lastUpdated}</p>
      </div>

      {/* Callout Exclusão de Conta */}
      <div className="mb-12 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 sm:p-6 text-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <Trash2 className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-amber-100 text-sm">Deseja excluir sua conta e dados?</h3>
            <p className="text-xs text-amber-300/80 mt-1">
              Você pode solicitar a eliminação imediata e permanente de todos os seus dados diretamente pelo nosso portal.
            </p>
          </div>
        </div>
        <Link
          href="/exclusao-de-conta"
          className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-4 py-2 text-xs font-bold text-zinc-950 hover:bg-amber-400 transition-colors shrink-0"
        >
          Acessar Exclusão de Conta
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Content */}
      <div className="space-y-10 text-sm sm:text-base leading-relaxed text-zinc-300">
        {/* Seção 1 */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            1. Introdução e Identificação
          </h2>
          <p>
            Esta Política de Privacidade explica como o aplicativo <strong>AudioFic</strong> coleta, utiliza, armazena, compartilha e protege as informações de seus usuários.
          </p>
          <p>
            O AudioFic é uma plataforma digital dedicada à transmissão de histórias ficcionais narradas em áudio seriado (especializada em terror, suspense e mistério). Nós valorizamos a sua privacidade e operamos em total conformidade com a <strong>Lei Geral de Proteção de Dados Pessoais (LGPD - Lei Federal nº 13.709/2018)</strong> e com os requisitos do programa <strong>Google Play Data Safety</strong>.
          </p>
        </section>

        {/* Seção 2 */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            2. Dados Coletados e Finalidades
          </h2>
          <p>
            Coletamos apenas os dados estritamente necessários para viabilizar a experiência do usuário e a continuidade da audição:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 space-y-2">
              <h3 className="font-semibold text-white text-sm flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-rose-400" />
                Dados de Conta e Perfil
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                <strong>O que coletamos:</strong> Nome, endereço de e-mail e credenciais de acesso com hash criptográfico (nunca temos acesso à sua senha original em texto puro).
                <br />
                <strong>Finalidade:</strong> Criação de conta, autenticação segura do usuário e identificação da titularidade da assinatura.
              </p>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 space-y-2">
              <h3 className="font-semibold text-white text-sm flex items-center gap-2">
                <Lock className="h-4 w-4 text-rose-400" />
                Progresso e Histórico de Áudio
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                <strong>O que coletamos:</strong> Posição em segundos de cada episódio reproduzido, episódios marcados como concluídos e séries adicionadas aos favoritos.
                <br />
                <strong>Finalidade:</strong> Permitir que você retome exatamente de onde parou em qualquer dispositivo conectado.
              </p>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 space-y-2">
              <h3 className="font-semibold text-white text-sm flex items-center gap-2">
                <Server className="h-4 w-4 text-rose-400" />
                Informações Técnicas do Dispositivo
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                <strong>O que coletamos:</strong> Sistema operacional (Android / iOS), versão do app instalado e tokens temporários de sessão.
                <br />
                <strong>Finalidade:</strong> Diagnóstico de erros de reprodução, estabilidade técnica e prevenção de acessos fraudulentos.
              </p>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 space-y-2">
              <h3 className="font-semibold text-white text-sm flex items-center gap-2">
                <EyeOff className="h-4 w-4 text-emerald-400" />
                Dados Financeiros (Não Coletados)
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                <strong>Importante:</strong> O AudioFic <strong>não armazena nem processa diretamente números de cartão de crédito</strong> ou contas bancárias. Todas as transações financeiras são efetuadas diretamente pelos sistemas de pagamento do <strong>Google Play Billing</strong> e intermediadas com segurança pelo <strong>RevenueCat</strong>.
              </p>
            </div>
          </div>
        </section>

        {/* Seção 3 */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            3. Compartilhamento de Dados com Terceiros
          </h2>
          <p>
            <strong>Não vendemos, não alugamos e não compartilhamos seus dados pessoais com corretores de dados (data brokers) ou empresas de publicidade direcionada de terceiros.</strong>
          </p>
          <p>
            O compartilhamento de dados ocorre exclusivamente com os seguintes provedores de infraestrutura essenciais para o funcionamento do app:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-zinc-300">
            <li>
              <strong>Cloudflare R2:</strong> Armazenamento em nuvem onde residem os arquivos de áudio comprimidos. A entrega de conteúdo premium ocorre via URLs pré-assinadas temporárias geradas pelo nosso servidor, sem expor credenciais ao dispositivo.
            </li>
            <li>
              <strong>RevenueCat & Google Play:</strong> Processamento e validação no servidor de assinaturas e compras no app (in-app purchases). Apenas recebemos confirmação de status (ex: ativo/inativo) via webhooks autenticados.
            </li>
            <li>
              <strong>Autoridades Judiciais:</strong> Apenas mediante ordem judicial ou exigência legal expressa nos termos da legislação brasileira.
            </li>
          </ul>
        </section>

        {/* Seção 4 */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            4. Segurança dos Dados
          </h2>
          <p>
            Adotamos medidas técnicas e administrativas rigorosas para proteger seus dados contra acessos não autorizados, destruição, perda ou alteração:
          </p>
          <ul className="list-disc pl-6 space-y-1.5 text-zinc-300">
            <li>Todo o tráfego de dados entre o aplicativo, o backend e os servidores de mídia é protegido por criptografia de ponta a ponta via protocolo <strong>HTTPS (TLS)</strong>.</li>
            <li>As senhas de usuário são submetidas a algoritmos de derivação de chaves e hash criptográfico seguro (não sendo possível sua leitura por nenhum administrador).</li>
            <li>O acesso aos bancos de dados de produção é restrito, isolado e protegido por chaves criptográficas fortes.</li>
          </ul>
        </section>

        {/* Seção 5 */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            5. Retenção e Exclusão de Dados
          </h2>
          <p>
            Seus dados são retidos enquanto a sua conta estiver ativa no AudioFic. Você tem o direito irrestrito de solicitar a exclusão de sua conta e de todos os dados vinculados a qualquer momento.
          </p>
          <p>
            Ao solicitar a exclusão:
          </p>
          <ul className="list-disc pl-6 space-y-1 text-zinc-300">
            <li>Seu perfil, e-mail, nome e credenciais são apagados permanentemente.</li>
            <li>Todo o seu histórico de escuta, posições de reprodução e favoritos são removidos em cascata.</li>
            <li>Suas sessões em todos os dispositivos são invalidadas imediatamente.</li>
          </ul>
          <p className="pt-1">
            Para realizar a exclusão autônoma ou solicitar atendimento, acesse nossa página dedicada:{' '}
            <Link href="/exclusao-de-conta" className="text-rose-400 font-semibold underline hover:text-rose-300">
              audiofic.app/exclusao-de-conta
            </Link>.
          </p>
        </section>

        {/* Seção 6 */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            6. Direitos do Titular de Dados (LGPD)
          </h2>
          <p>
            Em conformidade com o Artigo 18 da LGPD, você possui os seguintes direitos em relação aos seus dados:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs">
            <div className="rounded-lg bg-zinc-900 border border-zinc-800 p-3">
              <span className="font-bold text-zinc-200">1. Confirmação e Acesso:</span>
              <p className="text-zinc-400 mt-0.5">Saber se tratamos seus dados e solicitar uma cópia dos mesmos.</p>
            </div>
            <div className="rounded-lg bg-zinc-900 border border-zinc-800 p-3">
              <span className="font-bold text-zinc-200">2. Correção:</span>
              <p className="text-zinc-400 mt-0.5">Solicitar a retificação de dados incorretos, inexatos ou desatualizados.</p>
            </div>
            <div className="rounded-lg bg-zinc-900 border border-zinc-800 p-3">
              <span className="font-bold text-zinc-200">3. Anonimização ou Bloqueio:</span>
              <p className="text-zinc-400 mt-0.5">Pedir limitação do tratamento caso considere excessivo.</p>
            </div>
            <div className="rounded-lg bg-zinc-900 border border-zinc-800 p-3">
              <span className="font-bold text-zinc-200">4. Eliminação Total:</span>
              <p className="text-zinc-400 mt-0.5">Excluir sua conta e todos os dados associados a qualquer tempo.</p>
            </div>
          </div>
        </section>

        {/* Seção 7 */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            7. Menores de Idade
          </h2>
          <p>
            O AudioFic publica histórias focadas em terror, suspense e ficção macabra. Nosso serviço não é direcionado a crianças menores de 13 anos. Caso tome conhecimento de que uma criança menor de 13 anos forneceu dados pessoais sem o consentimento dos responsáveis, entre em contato para que possamos providenciar a exclusão imediata dos registros.
          </p>
        </section>

        {/* Seção 8 */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            8. Canal de Contato do Encarregado (DPO)
          </h2>
          <p>
            Se você tiver quaisquer dúvidas sobre esta Política de Privacidade, ou desejar exercer qualquer um dos seus direitos garantidos pela LGPD, envie um e-mail para o nosso Encarregado de Proteção de Dados:
          </p>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 flex items-center gap-3">
            <Mail className="h-5 w-5 text-rose-400 shrink-0" />
            <div>
              <p className="text-xs text-zinc-400">Canal Oficial de Privacidade e Suporte:</p>
              <a
                href="mailto:suporte@audiofic.app"
                className="font-mono text-sm font-semibold text-rose-400 hover:text-rose-300"
              >
                suporte@audiofic.app
              </a>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
