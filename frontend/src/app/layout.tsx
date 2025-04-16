import type { Metadata } from "next";
import { Geist, Geist_Mono, Roboto } from "next/font/google";
import "./globals.css";
import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from '@clerk/nextjs'

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
  weight: ["700"],
  style: ["normal"]
})
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BER: Stock Management System",
  description: "Stock Management System for BER",
  creator: "Amaan Bilwar"
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html 
        lang="en" 
        className={`${roboto.variable} ${geistSans.variable} ${geistMono.variable}`}
        suppressHydrationWarning
      >
        <head>
          <script
            dangerouslySetInnerHTML={{
              __html: `
                if (typeof window !== 'undefined') {
                  const htmlElement = document.documentElement;
                  ['data-__embeded-gyazo-content-j-s', 'data-__gyazo-expander-enabled'].forEach(attr => {
                    if (htmlElement.hasAttribute(attr)) {
                      htmlElement.removeAttribute(attr);
                    }
                  });
                }
              `,
            }}
          />
        </head>
        <body className="antialiased">
          <div className="fixed top-4 right-4 z-50">
            <SignedOut>
              <SignInButton />
              <SignUpButton />
            </SignedOut>
            <SignedIn>
              <UserButton />
            </SignedIn>
          </div>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
