// src/app/layout.tsx
import type { Metadata } from "next"
import { cookies } from "next/headers"
import "./globals.css"
import { fontKhmerDigital } from "@/lib/font"
import { AuthProvider } from "@/contexts/AuthContext"
import { TenantProvider } from "@/contexts/TenantContext"
import { ToastProvider } from "@/contexts/ToastContext"
import { ClientLayoutWrapper } from "@/components/layout/client-layout-wrapper"
import { ThemeRuntime } from "@/components/theme/theme-runtime"

export const metadata: Metadata = {
  title: "Management Console",
  description: "Modern CMS dashboard with responsive design",
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // ✅ cookies() is async in your setup → await is CORRECT
  const cookieStore = await cookies()
  const locale = cookieStore.get("locale")?.value === "km" ? "km" : "en"
  const colorSchemeScript = `
    try {
      var scheme = localStorage.getItem('pulse-news-color-scheme') || 'system';
      var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.classList.toggle('dark', scheme === 'dark' || (scheme === 'system' && prefersDark));
    } catch (_) {}
  `

  return (
    <html
      lang={locale}
      data-locale={locale}
      className={fontKhmerDigital.variable}
      suppressHydrationWarning
    >
      <body className={`min-h-screen bg-slate-50 text-slate-900 antialiased ${fontKhmerDigital.className}`}>
        <script dangerouslySetInnerHTML={{ __html: colorSchemeScript }} />
        <AuthProvider>
          <TenantProvider>
            <ToastProvider>
              <ThemeRuntime />
              <ClientLayoutWrapper>
                {children}
              </ClientLayoutWrapper>
            </ToastProvider>
          </TenantProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
