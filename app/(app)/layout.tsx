import { SubscriptionExpired } from "@/components/auth/subscription-expired"
import ScreenDropArea from "@/components/files/screen-drop-area"
import MobileMenu from "@/components/sidebar/mobile-menu"
import { AppSidebar } from "@/components/sidebar/sidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Toaster } from "@/components/ui/sonner"
import { TaxAdvisorChat } from "@/components/tax-advisor/tax-advisor-chat"
import { getCurrentUser, isSubscriptionExpired } from "@/lib/auth"
import config from "@/lib/config"
import { getApps } from "@/app/(app)/apps/common"
import { getUnsortedFilesCount } from "@/models/files"
import { ensureActiveOrganization } from "@/models/organizations"
import type { Metadata, Viewport } from "next"
import "../globals.css"
import { NotificationProvider } from "./context"

export const metadata: Metadata = {
  title: {
        template: "%s | Formulated Tax",
    default: "Formulated Tax",
  },
  description: config.app.description,
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
}

export const viewport: Viewport = {
  themeColor: "#ffffff",
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()
  const organization = await ensureActiveOrganization(user)
  const [unsortedFilesCount, apps] = await Promise.all([getUnsortedFilesCount(user.id, organization.id), getApps()])

  const userProfile = {
    id: user.id,
    name: user.name || "",
    email: user.email,
    avatar: user.avatar ? user.avatar + "?" + user.id : undefined,
    membershipPlan: user.membershipPlan || "unlimited",
    storageUsed: user.storageUsed || 0,
    storageLimit: user.storageLimit || -1,
    aiBalance: user.aiBalance || 0,
  }

  return (
    <NotificationProvider>
      <ScreenDropArea>
        <SidebarProvider>
          <MobileMenu unsortedFilesCount={unsortedFilesCount} />
          <AppSidebar
            profile={userProfile}
            unsortedFilesCount={unsortedFilesCount}
            isSelfHosted={config.selfHosted.isEnabled}
            organizationName={organization.name}
            apps={apps.map((app) => ({
              id: app.id,
              name: app.manifest.name,
              icon: app.manifest.icon,
            }))}
          />
          <SidebarInset className="w-full h-full mt-[60px] md:mt-0 overflow-auto">
            {isSubscriptionExpired(user) && <SubscriptionExpired />}
            {children}
          </SidebarInset>
        </SidebarProvider>
        <TaxAdvisorChat />
        <Toaster />
      </ScreenDropArea>
    </NotificationProvider>
  )
}

export const dynamic = "force-dynamic"
