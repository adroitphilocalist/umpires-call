import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: "Umpire's Call - Fantasy Cricket",
  description: 'Play fantasy cricket and compete with others',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}