"use client"

import { useNotification } from "@/app/(app)/context"
import { UploadButton } from "@/components/files/upload-button"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"
import { UserProfile } from "@/lib/auth"
import config from "@/lib/config"
import {
  Bot,
  BriefcaseBusiness,
  Calculator,
  ChartNoAxesCombined,
  ClockArrowUp,
  FileText,
  Gift,
  House,
  Import,
  LayoutDashboard,
  Package,
  PackageCheck,
  ReceiptText,
  Settings,
  ShoppingCart,
  Upload,
  Users,
  Warehouse,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect } from "react"
import { ColoredText } from "../ui/colored-text"
import { Blinker } from "./blinker"
import { SidebarMenuItemWithHighlight } from "./sidebar-item"
import SidebarUser from "./sidebar-user"

export function AppSidebar({
  profile,
  unsortedFilesCount,
  isSelfHosted,
  organizationName,
}: {
  profile: UserProfile
  unsortedFilesCount: number
  isSelfHosted: boolean
  organizationName?: string
}) {
  const { open, setOpenMobile } = useSidebar()
  const pathname = usePathname()
  const { notification } = useNotification()

  // Hide sidebar on mobile when clicking an item
  useEffect(() => {
    setOpenMobile(false)
  }, [pathname, setOpenMobile])

  return (
    <>
      <Sidebar variant="inset" collapsible="icon">
        <SidebarHeader>
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo/256.png" alt="Logo" className="h-10 w-10 rounded-lg" width={40} height={40} />
            <div className="grid flex-1 text-left leading-tight">
              <span className="truncate font-semibold text-lg">
                <ColoredText>{config.app.title}</ColoredText>
              </span>
              {organizationName && <span className="truncate text-xs text-muted-foreground">{organizationName}</span>}
            </div>
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <UploadButton className="w-full mt-4 mb-2">
              <Upload className="h-4 w-4" />
              {open ? <span>Upload</span> : ""}
            </UploadButton>
          </SidebarGroup>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItemWithHighlight href="/dashboard">
                  <SidebarMenuButton asChild>
                    <Link href="/dashboard">
                      <House />
                      <span>Home</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItemWithHighlight>

                <SidebarMenuItemWithHighlight href="/transactions">
                  <SidebarMenuButton asChild>
                    <Link href="/transactions">
                      <FileText />
                      <span>Transactions</span>
                      {notification && notification.code === "sidebar.transactions" && notification.message && (
                        <Blinker />
                      )}
                      <span></span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItemWithHighlight>

                <SidebarMenuItemWithHighlight href="/unsorted">
                  <SidebarMenuButton asChild>
                    <Link href="/unsorted">
                      <ClockArrowUp />
                      <span>Unsorted</span>
                      {unsortedFilesCount > 0 && (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                          {unsortedFilesCount}
                        </span>
                      )}
                      {notification && notification.code === "sidebar.unsorted" && notification.message && <Blinker />}
                      <span></span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItemWithHighlight>
                <SidebarMenuItemWithHighlight href="/apps">
                  <SidebarMenuButton asChild>
                    <Link href="/apps">
                      <LayoutDashboard />
                      <span>Apps</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItemWithHighlight>
                <SidebarMenuItemWithHighlight href="/accounting">
                  <SidebarMenuButton asChild>
                    <Link href="/accounting">
                      <Calculator />
                      <span>Accounting</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItemWithHighlight>
                <SidebarMenuItemWithHighlight href="/reports">
                  <SidebarMenuButton asChild>
                    <Link href="/reports">
                      <ChartNoAxesCombined />
                      <span>Reports</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItemWithHighlight>
                <SidebarMenuItemWithHighlight href="/taxes/gst">
                  <SidebarMenuButton asChild>
                    <Link href="/taxes/gst">
                      <ReceiptText />
                      <span>GST</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItemWithHighlight>
                <SidebarMenuItemWithHighlight href="/customers">
                  <SidebarMenuButton asChild>
                    <Link href="/customers">
                      <Users />
                      <span>Customers</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItemWithHighlight>
                <SidebarMenuItemWithHighlight href="/vendors">
                  <SidebarMenuButton asChild>
                    <Link href="/vendors">
                      <BriefcaseBusiness />
                      <span>Vendors</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItemWithHighlight>
                <SidebarMenuItemWithHighlight href="/sales">
                  <SidebarMenuButton asChild>
                    <Link href="/sales">
                      <ShoppingCart />
                      <span>Sales</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItemWithHighlight>
                <SidebarMenuItemWithHighlight href="/jobs">
                  <SidebarMenuButton asChild>
                    <Link href="/jobs">
                      <Package />
                      <span>Jobs</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItemWithHighlight>
                <SidebarMenuItemWithHighlight href="/inventory">
                  <SidebarMenuButton asChild>
                    <Link href="/inventory">
                      <Warehouse />
                      <span>Inventory</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItemWithHighlight>
                <SidebarMenuItemWithHighlight href="/purchasing">
                  <SidebarMenuButton asChild>
                    <Link href="/purchasing">
                      <PackageCheck />
                      <span>Purchasing</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItemWithHighlight>
                <SidebarMenuItemWithHighlight href="/automation">
                  <SidebarMenuButton asChild>
                    <Link href="/automation">
                      <Bot />
                      <span>Automation</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItemWithHighlight>
                <SidebarMenuItemWithHighlight href="/settings">
                  <SidebarMenuButton asChild>
                    <Link href="/settings">
                      <Settings />
                      <span>Settings</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItemWithHighlight>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarRail />
        <SidebarFooter>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link href="/import/csv">
                      <Import />
                      Import from CSV
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                {isSelfHosted && (
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <Link href="https://vas3k.com/donate/" target="_blank">
                        <Gift />
                        Thank the author
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
                {!open && (
                  <SidebarMenuItem>
                    <SidebarTrigger />
                  </SidebarMenuItem>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarUser profile={profile} isSelfHosted={isSelfHosted} />
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarFooter>
      </Sidebar>
    </>
  )
}
