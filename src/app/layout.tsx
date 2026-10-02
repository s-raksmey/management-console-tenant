// src/app/layout.tsx
import type { Metadata } from "next"
import { cookies } from "next/headers"
import "./globals.css"
import { fontJetBrainsMono, fontKantumruyPro } from "@/lib/font"
import { AuthProvider } from "@/contexts/AuthContext"
import { TenantProvider } from "@/contexts/TenantContext"
import { ToastProvider } from "@/contexts/ToastContext"
import { ClientLayoutWrapper } from "@/components/layout/client-layout-wrapper"
import { ThemeRuntime } from "@/components/theme/theme-runtime"
import { COLOR_SCHEME_STORAGE_KEY, themeBootScript } from "@/lib/tweakcn-theme"
import { BRAND_CACHE_COOKIE, parseCachedBrand } from "@/lib/brand-cache"
import { AdminLocaleProvider } from "@/hooks/useAdminLocale"

export const metadata: Metadata = {
  title: "Tenant Console",
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
  const colorScheme = cookieStore.get(COLOR_SCHEME_STORAGE_KEY)?.value
  const initialBrand = parseCachedBrand(cookieStore.get(BRAND_CACHE_COOKIE)?.value)
  const colorSchemeScript = themeBootScript()

  return (
    <html
      lang={locale}
      data-locale={locale}
      className={`${fontJetBrainsMono.variable} ${fontKantumruyPro.variable} locale-${locale}${colorScheme === "dark" ? " dark" : ""}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: colorSchemeScript }} />
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <AuthProvider>
          <TenantProvider initialBrand={initialBrand}>
            <ToastProvider>
              <AdminLocaleProvider initialLocale={locale}>
                <ThemeRuntime />
                <ClientLayoutWrapper>
                  {children}
                </ClientLayoutWrapper>
              </AdminLocaleProvider>
            </ToastProvider>
          </TenantProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
