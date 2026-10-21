import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';

export const metadata: Metadata = {
  title: 'AudioFic · Ficção Seriada em Áudio & Termos Legais',
  description:
    'Portal oficial do aplicativo AudioFic. Histórias seriadas de terror, suspense e mistério em áudio. Informações de privacidade, termos de uso e fluxo de exclusão de conta.',
  metadataBase: new URL('https://audiofic.app'),
  openGraph: {
    title: 'AudioFic · Ficção Seriada em Áudio',
    description: 'Portal oficial e políticas de privacidade do AudioFic.',
    siteName: 'AudioFic',
    locale: 'pt_BR',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="dark h-full antialiased">
      <body className="min-h-full flex flex-col bg-[#09090b] text-zinc-100 selection:bg-rose-950 selection:text-rose-200">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
