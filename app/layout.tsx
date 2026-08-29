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

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

export const metadata: Metadata = {
  ...(siteUrl ? { metadataBase: new URL(siteUrl) } : {}),
  title: '有限ガチャ',
  description: '任意連が　できるだけ',
  openGraph: {
    title: '有限ガチャ',
    description: '有限のガチャ',
    ...(siteUrl ? { url: siteUrl } : {}),
    siteName: '有限ガチャ',
    ...(siteUrl
      ? {
          images: [
            { url: '/og.png', width: 1792, height: 1024, alt: '有限ガチャ' },
          ],
        }
      : {}),
    locale: 'ja_JP',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: '有限ガチャ',
    description: '有限のガチャ',
    ...(siteUrl ? { images: ['/og.png'] } : {}),
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
