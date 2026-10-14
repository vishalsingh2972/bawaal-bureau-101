import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'Bawaal Bureau — Tiny problem. National emergency.', description: 'Chhoti si problem. National level bawaal. A fictional comedy control room powered by Sarvam Bulbul V4 Flash.' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
