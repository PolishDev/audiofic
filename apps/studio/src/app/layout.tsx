import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'ShortStory Studio · IA Audio Drama Creator',
  description:
    'Estúdio minimalista local para criação e mixagem de ficção seriada em áudio com Ollama e TTS.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} dark h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#0c0c0e] text-zinc-100 font-sans selection:bg-rose-950 selection:text-rose-200">
        {children}
      </body>
    </html>
  );
}
