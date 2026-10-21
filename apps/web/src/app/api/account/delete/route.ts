import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, email, password, reason } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'O endereço de e-mail é obrigatório.' },
        { status: 400 }
      );
    }

    // Modalidade 1: Exclusão direta autenticada com senha
    if (action === 'direct_delete') {
      if (!password) {
        return NextResponse.json(
          { error: 'A senha é obrigatória para exclusão direta imediata.' },
          { status: 400 }
        );
      }

      // 1. Tentar login no backend via Better Auth
      const authRes = await fetch(`${BACKEND_URL}/api/auth/sign-in/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      if (!authRes.ok) {
        const errorData = await authRes.json().catch(() => ({}));
        return NextResponse.json(
          {
            error:
              errorData.message ||
              'Credenciais inválidas. Verifique seu e-mail e senha cadastrados no AudioFic.',
          },
          { status: 401 }
        );
      }

      const authData = await authRes.json();
      const token = authData.token || authData.session?.token;
      const cookieHeader = authRes.headers.get('set-cookie');

      // 2. Chamar endpoint de exclusão de conta
      const deleteHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        deleteHeaders['Authorization'] = `Bearer ${token}`;
      }
      if (cookieHeader) {
        deleteHeaders['Cookie'] = cookieHeader;
      }

      const deleteRes = await fetch(`${BACKEND_URL}/users/me`, {
        method: 'DELETE',
        headers: deleteHeaders,
      });

      if (!deleteRes.ok) {
        const deleteError = await deleteRes.json().catch(() => ({}));
        return NextResponse.json(
          {
            error:
              deleteError.message ||
              'Não foi possível concluir a exclusão. Tente novamente ou abra uma solicitação manual.',
          },
          { status: deleteRes.status }
        );
      }

      return NextResponse.json({
        success: true,
        message:
          'Sua conta, progresso de áudio, histórico e todos os dados associados foram excluídos permanentemente de nossos servidores.',
      });
    }

    // Modalidade 2: Solicitação manual (usuário sem acesso/sem senha)
    if (action === 'request_manual') {
      const protocolNumber = `DEL-${Date.now().toString().slice(-6)}-${Math.random()
        .toString(36)
        .substring(2, 6)
        .toUpperCase()}`;

      // Registra a solicitação nos logs do sistema
      console.log(
        `[AudioFic Exclusão] Nova solicitação manual registrada - Protocolo: ${protocolNumber}, E-mail: ${email.trim()}, Motivo: ${reason || 'Não informado'}`
      );

      return NextResponse.json({
        success: true,
        protocol: protocolNumber,
        message:
          'Sua solicitação de exclusão foi registrada com sucesso sob as diretrizes da LGPD e Google Play Store. Caso este e-mail esteja cadastrado, a exclusão definitiva dos dados será processada em até 15 dias úteis.',
      });
    }

    return NextResponse.json(
      { error: 'Ação de exclusão inválida.' },
      { status: 400 }
    );
  } catch (err: any) {
    console.error('[Account Deletion API Error]', err);
    return NextResponse.json(
      {
        error:
          'Ocorreu uma instabilidade temporária ao conectar com os servidores. Por favor, tente novamente ou entre em contato via suporte@audiofic.app.',
      },
      { status: 500 }
    );
  }
}
