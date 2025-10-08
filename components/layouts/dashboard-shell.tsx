"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  TrendingUp,
  Calendar,
  Settings,
  Home,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { UserNav } from "./user-nav";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Workouts", href: "/workouts/new", icon: Activity },
  { name: "Insights", href: "/insights", icon: TrendingUp },
  { name: "Plans", href: "/plans", icon: Calendar },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function DashboardShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-white dark:bg-gray-800">
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center border-b px-6">
            <Activity className="h-6 w-6 text-blue-600" />
            <span className="ml-2 text-lg font-semibold">
              Workout Assistant
            </span>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-3 py-4">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-blue-50 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400"
                      : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                  )}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* User Profile */}
          <div className="border-t p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Profile</span>
              <UserNav />
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
