export interface FormattedError {
  title: string;
  message: string;
}

/**
 * Translates and formats raw Better Auth, network, or validation errors
 * into human-readable, clear Brazilian Portuguese messages.
 */
export function formatAuthError(error: any): FormattedError {
  const rawMessage: string = (
    error?.message ||
    error?.statusText ||
    error?.error?.message ||
    error?.response?.data?.message ||
    (typeof error === 'string' ? error : '') ||
    ''
  ).toLowerCase();

  // Invalid credentials / password
  if (
    rawMessage.includes('invalid email or password') ||
    rawMessage.includes('invalid_email_or_password') ||
    rawMessage.includes('invalid credentials') ||
    rawMessage.includes('credenciais inválidas') ||
    rawMessage.includes('senha incorreta') ||
    rawMessage.includes('falha ao autenticar')
  ) {
    return {
      title: 'Credenciais Incorretas',
      message: 'E-mail ou senha inválidos. Verifique os dados digitados e tente novamente.',
    };
  }

  // User already registered
  if (
    rawMessage.includes('user already exists') ||
    rawMessage.includes('user_already_exists') ||
    rawMessage.includes('email already in use') ||
    rawMessage.includes('already exists')
  ) {
    return {
      title: 'E-mail Já Cadastrado',
      message: 'Já existe uma conta associada a este e-mail. Faça login ou utilize outro e-mail.',
    };
  }

  // Password requirements
  if (
    rawMessage.includes('password too short') ||
    rawMessage.includes('password_too_short') ||
    rawMessage.includes('pelo menos 8 caracteres') ||
    rawMessage.includes('pelo menos 6 caracteres')
  ) {
    return {
      title: 'Senha Muito Curta',
      message: 'Sua senha deve ter no mínimo 8 caracteres para garantir sua segurança.',
    };
  }

  // Invalid email format
  if (
    rawMessage.includes('invalid email') ||
    rawMessage.includes('invalid_email') ||
    rawMessage.includes('email inválido')
  ) {
    return {
      title: 'E-mail Inválido',
      message: 'Digite um endereço de e-mail válido (ex: seuemail@exemplo.com).',
    };
  }

  // User not found
  if (
    rawMessage.includes('user not found') ||
    rawMessage.includes('user_not_found')
  ) {
    return {
      title: 'Conta Não Encontrada',
      message: 'Não encontramos nenhuma conta com esse e-mail. Verifique o endereço ou cadastre-se.',
    };
  }

  // Connection timeout / network failure
  if (
    rawMessage.includes('tempo esgotado') ||
    rawMessage.includes('timeout') ||
    rawMessage.includes('network error') ||
    rawMessage.includes('network request failed') ||
    rawMessage.includes('failed to fetch') ||
    rawMessage.includes('econnrefused') ||
    rawMessage.includes('enotfound') ||
    rawMessage.includes('porta 3000')
  ) {
    return {
      title: 'Falha de Conexão',
      message: 'Não foi possível se comunicar com o servidor. Verifique sua conexão à internet e tente novamente.',
    };
  }

  // Rate limiting / too many attempts
  if (
    rawMessage.includes('too many requests') ||
    rawMessage.includes('rate limit') ||
    rawMessage.includes('muitas tentativas')
  ) {
    return {
      title: 'Muitas Tentativas',
      message: 'Você realizou muitas tentativas em pouco tempo. Aguarde alguns minutos antes de tentar de novo.',
    };
  }

  // Missing fields
  if (
    rawMessage.includes('missing') ||
    rawMessage.includes('required') ||
    rawMessage.includes('preencha')
  ) {
    return {
      title: 'Campos Obrigatórios',
      message: 'Por favor, preencha todos os campos necessários para continuar.',
    };
  }

  // Server error
  if (
    rawMessage.includes('internal server error') ||
    rawMessage.includes('500') ||
    rawMessage.includes('server error')
  ) {
    return {
      title: 'Instabilidade no Servidor',
      message: 'Nosso serviço encontrou uma instabilidade temporária. Tente novamente em instantes.',
    };
  }

  // Default fallback with clean translation
  return {
    title: 'Atenção',
    message:
      typeof error?.message === 'string' &&
      error.message.length > 0 &&
      !error.message.includes('[object')
        ? error.message
        : 'Ocorreu um erro ao processar sua solicitação. Tente novamente.',
  };
}
