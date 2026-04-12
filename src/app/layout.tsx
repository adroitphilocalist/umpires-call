import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/providers/ThemeProvider';

const metadataBase = (() => {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!siteUrl) return new URL('http://localhost:3000');
  try {
    return new URL(siteUrl);
  } catch {
    return new URL('http://localhost:3000');
  }
})();

export const metadata: Metadata = {
  metadataBase,
  title: "Umpire's Call - Fantasy Cricket",
  description: 'Play fantasy cricket and compete with others',
  icons: {
    icon: [{ url: '/icon.png', sizes: '64x64', type: 'image/png' }],
    apple: [{ url: '/apple-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  manifest: '/manifest.webmanifest',
  openGraph: {
    title: "Umpire's Call - Fantasy Cricket",
    description: 'Play fantasy cricket and compete with others',
    images: [{ url: '/og-image.png', width: 768, height: 768, alt: "Umpire's Call Logo" }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Umpire's Call - Fantasy Cricket",
    description: 'Play fantasy cricket and compete with others',
    images: ['/twitter-image.png'],
  },
  appleWebApp: {
    capable: true,
    title: "Umpire's Call",
    statusBarStyle: 'black-translucent',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}