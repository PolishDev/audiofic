'use client';

import { useState } from 'react';
import {
  Trash2,
  AlertTriangle,
  CheckCircle2,
  KeyRound,
  Mail,
  Loader2,
  ShieldAlert,
  Smartphone,
  ChevronRight,
} from 'lucide-react';

export function DeletionForm() {
  const [tab, setTab] = useState<'direct' | 'manual'>('direct');

  // Form states for Direct Deletion
  const [directEmail, setDirectEmail] = useState('');
  const [directPassword, setDirectPassword] = useState('');
  const [directConfirm, setDirectConfirm] = useState(false);
  const [directLoading, setDirectLoading] = useState(false);
  const [directError, setDirectError] = useState<string | null>(null);
  const [directSuccess, setDirectSuccess] = useState<string | null>(null);

  // Form states for Manual Request
  const [manualEmail, setManualEmail] = useState('');
  const [manualReason, setManualReason] = useState('Nao desejo mais utilizar o servico');
  const [manualConfirm, setManualConfirm] = useState(false);
  const [manualLoading, setManualLoading] = useState(false);
  const [manualError, setManualError] = useState<string | null>(null);
  const [manualProtocol, setManualProtocol] = useState<string | null>(null);

  const handleDirectDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    setDirectError(null);

    if (!directEmail.trim() || !directPassword) {
      setDirectError('Preencha seu e-mail e senha cadastrados no AudioFic.');
      return;
    }

    if (!directConfirm) {
      setDirectError('Você precisa confirmar que compreende o caráter irreversível da exclusão.');
      return;
    }

    setDirectLoading(true);

    try {
      const res = await fetch('/api/account/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'direct_delete',
          email: directEmail,
          password: directPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Falha ao processar exclusão.');
      }

      setDirectSuccess(data.message);
      setDirectEmail('');
      setDirectPassword('');
      setDirectConfirm(false);
    } catch (err: any) {
      setDirectError(err.message || 'Erro ao conectar ao servidor.');
    } finally {
      setDirectLoading(false);
    }
  };

  const handleManualRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setManualError(null);

    if (!manualEmail.trim()) {
      setManualError('Informe o endereço de e-mail associado à sua conta.');
      return;
    }

    if (!manualConfirm) {
      setManualError('Confirme a solicitação de exclusão definitiva.');
      return;
    }

    setManualLoading(true);

    try {
      const res = await fetch('/api/account/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'request_manual',
          email: manualEmail,
          reason: manualReason,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Falha ao registrar solicitação.');
      }

      setManualProtocol(data.protocol);
      setManualEmail('');
      setManualConfirm(false);
    } catch (err: any) {
      setManualError(err.message || 'Erro ao registrar solicitação.');
    } finally {
      setManualLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Selector Tabs */}
      <div className="flex border-b border-zinc-800">
        <button
          type="button"
          onClick={() => setTab('direct')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-colors ${
            tab === 'direct'
              ? 'border-rose-500 text-rose-400 bg-rose-500/5'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <KeyRound className="h-4 w-4" />
          Exclusão Instantânea (com Senha)
        </button>
        <button
          type="button"
          onClick={() => setTab('manual')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-colors ${
            tab === 'manual'
              ? 'border-amber-500 text-amber-400 bg-amber-500/5'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Mail className="h-4 w-4" />
          Solicitação sem Senha (Manual)
        </button>
      </div>

      {/* Tab 1: Direct Deletion */}
      {tab === 'direct' && (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 sm:p-8 backdrop-blur-sm">
          {directSuccess ? (
            <div className="space-y-4 text-center py-6">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold text-white">Conta Excluída com Sucesso</h3>
              <p className="text-sm text-zinc-300 max-w-lg mx-auto leading-relaxed">
                {directSuccess}
              </p>
              <p className="text-xs text-zinc-500">
                Todos os seus registros de histórico, sessões e progresso foram permanentemente expurgados.
              </p>
              <button
                type="button"
                onClick={() => setDirectSuccess(null)}
                className="mt-4 inline-flex items-center rounded-lg bg-zinc-800 px-4 py-2 text-xs font-semibold text-zinc-200 hover:bg-zinc-700 transition-colors"
              >
                Voltar ao formulário
              </button>
            </div>
          ) : (
            <form onSubmit={handleDirectDelete} className="space-y-6">
              <div className="flex items-start gap-3 rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-rose-300 text-xs sm:text-sm">
                <ShieldAlert className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold text-rose-200">Ação irreversível e imediata</p>
                  <p className="text-rose-300/80 leading-relaxed">
                    Ao confirmar a autenticação, sua conta será eliminada imediatamente de nosso banco de dados. Você perderá todo o histórico de escuta, favoritos e progresso de episódios salvos.
                  </p>
                </div>
              </div>

              {directError && (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3.5 text-xs text-red-200 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
                  <span>{directError}</span>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                    Endereço de E-mail Cadastrado
                  </label>
                  <input
                    type="email"
                    value={directEmail}
                    onChange={(e) => setDirectEmail(e.target.value)}
                    placeholder="seu.email@exemplo.com"
                    required
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                    Sua Senha do AudioFic
                  </label>
                  <input
                    type="password"
                    value={directPassword}
                    onChange={(e) => setDirectPassword(e.target.value)}
                    placeholder="••••••••••••"
                    required
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500 transition-colors"
                  />
                </div>

                <div className="pt-2">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={directConfirm}
                      onChange={(e) => setDirectConfirm(e.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-rose-600 focus:ring-rose-500"
                    />
                    <span className="text-xs text-zinc-400 select-none leading-relaxed">
                      Estou ciente de que a exclusão é <strong className="text-zinc-200">definitiva</strong> e apagará permanentemente todos os meus dados, progresso e histórico de áudio sem possibilidade de recuperação.
                    </span>
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={directLoading}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-rose-950/50 hover:bg-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:ring-offset-2 focus:ring-offset-zinc-950 disabled:opacity-50 transition-all cursor-pointer"
              >
                {directLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processando exclusão definitiva...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    Excluir Minha Conta Permanentemente
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      )}

      {/* Tab 2: Manual Request */}
      {tab === 'manual' && (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 sm:p-8 backdrop-blur-sm">
          {manualProtocol ? (
            <div className="space-y-4 text-center py-6">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold text-white">Solicitação de Exclusão Registrada</h3>
              <p className="text-sm text-zinc-300 max-w-lg mx-auto leading-relaxed">
                Registramos seu pedido com o protocolo:{' '}
                <strong className="font-mono text-amber-400 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800">
                  {manualProtocol}
                </strong>
              </p>
              <p className="text-xs text-zinc-400 max-w-md mx-auto leading-relaxed">
                Conforme as normas da LGPD e as políticas do Google Play, se houver uma conta associada a este e-mail, todos os dados serão expurgados em até 15 dias úteis.
              </p>
              <button
                type="button"
                onClick={() => setManualProtocol(null)}
                className="mt-4 inline-flex items-center rounded-lg bg-zinc-800 px-4 py-2 text-xs font-semibold text-zinc-200 hover:bg-zinc-700 transition-colors"
              >
                Fazer nova solicitação
              </button>
            </div>
          ) : (
            <form onSubmit={handleManualRequest} className="space-y-6">
              <div className="flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-amber-200 text-xs sm:text-sm">
                <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold text-amber-100">Para usuários sem acesso ao aplicativo ou à senha</p>
                  <p className="text-amber-300/80 leading-relaxed">
                    Caso tenha desinstalado o aplicativo ou não se recorde de sua senha, utilize este formulário para requisitar a exclusão manual de seus dados por nosso time de privacidade.
                  </p>
                </div>
              </div>

              {manualError && (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3.5 text-xs text-red-200 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
                  <span>{manualError}</span>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                    E-mail Utilizado no Cadastro
                  </label>
                  <input
                    type="email"
                    value={manualEmail}
                    onChange={(e) => setManualEmail(e.target.value)}
                    placeholder="seu.email@exemplo.com"
                    required
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                    Motivo da Exclusão (Opcional)
                  </label>
                  <select
                    value={manualReason}
                    onChange={(e) => setManualReason(e.target.value)}
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-sm text-zinc-100 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-colors"
                  >
                    <option value="Nao desejo mais utilizar o servico">Não desejo mais utilizar o serviço</option>
                    <option value="Preocupacao com privacidade ou dados">Preocupação com privacidade ou proteção de dados</option>
                    <option value="Troca de dispositivo / desinstalacao do app">Desinstalei o aplicativo e não utilizo mais</option>
                    <option value="Outro motivo">Outro motivo</option>
                  </select>
                </div>

                <div className="pt-2">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={manualConfirm}
                      onChange={(e) => setManualConfirm(e.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-amber-500 focus:ring-amber-400"
                    />
                    <span className="text-xs text-zinc-400 select-none leading-relaxed">
                      Requisito formalmente a exclusão permanente da minha conta do AudioFic e de todos os dados pessoais e de reprodução associados ao e-mail informado.
                    </span>
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={manualLoading}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-6 py-3 text-sm font-bold text-zinc-950 shadow-lg shadow-amber-950/40 hover:bg-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:opacity-50 transition-all cursor-pointer"
              >
                {manualLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Enviando solicitação...
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4" />
                    Enviar Solicitação de Exclusão
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      )}

      {/* Como excluir pelo aplicativo móvel */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-6 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Smartphone className="h-4 w-4 text-rose-400" />
          Como excluir sua conta diretamente pelo aplicativo móvel
        </h3>
        <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
          Se você ainda tem o aplicativo AudioFic instalado em seu aparelho celular Android ou iOS:
        </p>
        <ol className="space-y-2 text-xs sm:text-sm text-zinc-300 pl-1">
          <li className="flex items-center gap-2">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-[10px] font-bold text-zinc-300">1</span>
            Abra o app <strong className="text-white">AudioFic</strong> e acesse a aba <strong className="text-white">Perfil</strong>.
          </li>
          <li className="flex items-center gap-2">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-[10px] font-bold text-zinc-300">2</span>
            Toque na opção <strong className="text-white">Configurações de Conta</strong>.
          </li>
          <li className="flex items-center gap-2">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-[10px] font-bold text-zinc-300">3</span>
            Role até o final da tela e selecione <strong className="text-rose-400">Excluir Conta</strong>.
          </li>
          <li className="flex items-center gap-2">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-[10px] font-bold text-zinc-300">4</span>
            Confirme o aviso e a sua conta será eliminada na mesma hora.
          </li>
        </ol>
      </div>
    </div>
  );
}
