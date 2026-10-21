import { UserX, ShieldCheck, Database, FileCheck, HelpCircle, Mail } from 'lucide-react';
import type { Metadata } from 'next';
import { DeletionForm } from '@/components/deletion-form';

export const metadata: Metadata = {
  title: 'Exclusão de Conta e Dados · AudioFic',
  description:
    'Solicite a exclusão definitiva da sua conta e de todos os dados pessoais e de reprodução associados ao aplicativo AudioFic.',
};

export default function ExclusaoDeContaPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
      {/* Header */}
      <div className="mb-10 space-y-4 border-b border-zinc-800 pb-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3.5 py-1 text-xs font-semibold text-amber-400">
          <UserX className="h-3.5 w-3.5" />
          Gerenciamento de Dados & Exclusão de Conta (Google Play & LGPD)
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
          Exclusão de Conta e Dados Pessoais
        </h1>
        <p className="text-sm text-zinc-400 leading-relaxed">
          Nesta página, você pode exercer seu direito de exclusão definitiva de conta e dos dados associados no aplicativo{' '}
          <strong className="text-zinc-200">AudioFic</strong> (Identificador do pacote:{' '}
          <code className="rounded bg-zinc-800 px-1.5 py-0.5 font-mono text-zinc-300">com.sahlo.alves.audiofic</code>),{' '}
          mesmo que já tenha desinstalado o aplicativo do seu celular.
        </p>
      </div>

      {/* Tabela de Transparência de Dados (Exigida pelo Google Play Data Safety) */}
      <div className="mb-12 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Dados Excluídos */}
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-5 space-y-3">
          <h3 className="font-bold text-rose-300 text-sm flex items-center gap-2">
            <Database className="h-4 w-4 text-rose-400" />
            Dados Excluídos Permanentemente
          </h3>
          <p className="text-xs text-zinc-400">
            Estes dados são expurgados do banco de dados e não podem ser restaurados:
          </p>
          <ul className="space-y-1.5 text-xs text-zinc-300 pl-1">
            <li className="flex items-start gap-2">
              <span className="text-rose-400 mt-0.5">•</span>
              <span><strong>Dados de Perfil:</strong> Nome, e-mail cadastrado e senha criptografada.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-rose-400 mt-0.5">•</span>
              <span><strong>Histórico de Áudio:</strong> Posição em segundos de episódios pausados.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-rose-400 mt-0.5">•</span>
              <span><strong>Progresso:</strong> Lista de episódios concluídos e temporadas acompanhadas.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-rose-400 mt-0.5">•</span>
              <span><strong>Favoritos:</strong> Histórias e séries marcadas como preferidas.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-rose-400 mt-0.5">•</span>
              <span><strong>Sessões:</strong> Desconexão e invalidação de todos os tokens de acesso.</span>
            </li>
          </ul>
        </div>

        {/* Dados Retidos */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 space-y-3">
          <h3 className="font-bold text-zinc-200 text-sm flex items-center gap-2">
            <FileCheck className="h-4 w-4 text-emerald-400" />
            Dados Retidos por Exigência Legal (Se Houver)
          </h3>
          <p className="text-xs text-zinc-400">
            Em conformidade com as diretrizes do Google Play e com a legislação brasileira:
          </p>
          <ul className="space-y-1.5 text-xs text-zinc-300 pl-1">
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 mt-0.5">•</span>
              <span><strong>Registros Financeiros de Compra:</strong> Caso tenha assinado ou adquirido itens pagos via Google Play Billing, os comprovantes de transação fiscal são retidos pelo prazo legal obrigatório (5 anos, conforme Código Tributário Nacional e CDC).</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 mt-0.5">•</span>
              <span><strong>Não Retenção de Hábitos de Consumo:</strong> Nenhum dado de áudio, série ou navegação é mantido após a exclusão.</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Formulário Interativo de Exclusão */}
      <div className="mb-12">
        <h2 className="text-xl font-bold text-white mb-2">Solicitar Exclusão</h2>
        <p className="text-sm text-zinc-400 mb-6">
          Escolha abaixo se deseja excluir sua conta na hora (fornecendo sua senha) ou enviar uma solicitação manual de exclusão caso não se lembre das credenciais.
        </p>

        <DeletionForm />
      </div>

      {/* Dúvidas e Suporte */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <HelpCircle className="h-5 w-5 text-zinc-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-zinc-200 text-sm">Precisa de assistência com sua conta?</h4>
            <p className="text-xs text-zinc-400 mt-0.5">
              Nossa equipe de suporte está à disposição para esclarecer qualquer dúvida sobre privacidade ou dados.
            </p>
          </div>
        </div>
        <a
          href="mailto:suporte@audiofic.app?subject=Solicitacao%20de%20Exclusao%20AudioFic"
          className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-xs font-semibold text-zinc-200 hover:bg-zinc-700 hover:text-white transition-colors shrink-0"
        >
          <Mail className="h-4 w-4" />
          Falar com Suporte
        </a>
      </div>
    </div>
  );
}
