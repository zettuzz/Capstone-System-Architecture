import {ClerkProvider} from "@clerk/nextjs";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";
import { LLMProviderProvider } from "@/components/LLMProviderContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["600", "700"],
});

export const metadata: Metadata = {
  title: "CapstoneAI - Terminal Ideation",
  description: "AI-powered capstone ideation assistant",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${spaceGrotesk.variable} h-full antialiased`}
    >
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        />
      </head>
      <body suppressHydrationWarning>
        <ClerkProvider
          appearance={{
            elements: {
              card: "bg-[#0a0a0a] border border-white/10 shadow-none",
              formButtonPrimary: "bg-white text-black font-mono font-bold uppercase tracking-wider hover:bg-neutral-200",
              formFieldInput: "bg-[#171717] border border-white/10 text-white font-mono",
              formFieldLabel: "text-[#a3a3a3] font-mono uppercase tracking-wider text-[11px]",
              footerActionLink: "text-[#a3a3a3] hover:text-white font-mono",
              dividerLine: "bg-white/10",
              dividerText: "text-[#a3a3a3] font-mono",
              socialButtonsBlockButton: "bg-[#171717] border border-white/10 text-white font-mono hover:bg-[#1a1a1a]",
              socialButtonsBlockButtonText: "text-white font-mono",
              navbar: "bg-[#0a0a0a] border-b border-white/10",
              navbarButton: "text-[#a3a3a3] hover:text-white",
              userButtonPopoverCard: "bg-[#0a0a0a] border border-white/10",
              userButtonPopoverActions: "bg-[#0a0a0a]",
              userButtonPopoverActionButton: "text-[#a3a3a3] hover:text-white hover:bg-[#171717]",
            },
          }}
        >
          <LLMProviderProvider>
          <div className="min-h-full flex flex-col">{children}</div>
          </LLMProviderProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}