import type { Metadata } from 'next';
import { Roboto } from 'next/font/google';
import { ToastProvider } from '@/components/ui/Toast';
import './globals.css';

const roboto = Roboto({
  weight: ['400', '500', '700'],
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'MaxiHesaplama — Hakediş Hesaplama',
  description: 'Profesyonel işletme hakediş hesaplama uygulaması',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body className={roboto.className}>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
