import { Link, useRouterState } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import {
  Radar,
  PenLine,
  Inbox,
  GraduationCap,
  Menu,
  X,
  Bell,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { HelpFab } from "./HelpFab";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navItems = [
  { to: "/", label: "知识漏洞扫描", icon: Radar, desc: "学科健康度雷达" },
  { to: "/essay", label: "AI 作文批改", icon: PenLine, desc: "语文 / 英语作文" },
  { to: "/mistakes", label: "错题收纳盒", icon: Inbox, desc: "错题管理与复习" },
] as const;

export function AppLayout({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="border-b border-border bg-muted/50 py-1.5 text-center text-[11px] text-muted-foreground">
        当前为本地会话模式，数据将保存在云端
      </div>
      <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-lg">
        <div className="flex h-14 items-center gap-3 px-4 sm:px-6">
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground md:hidden"
            aria-label="打开菜单"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <Link to="/" className="flex items-center gap-2 group">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-[var(--shadow-soft)] transition-transform group-hover:scale-105">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="truncate text-base font-bold tracking-tight">智学助手</span>
                <span className="hidden rounded-full bg-accent/15 px-1.5 py-0.5 text-[10px] font-semibold text-accent sm:inline-flex">
                  BETA
                </span>
              </div>
              <p className="hidden text-[11px] text-muted-foreground sm:block">
                高中生个性化学习平台
              </p>
            </div>
          </Link>
          <div className="ml-auto flex items-center gap-2">
            <button className="hidden items-center gap-1.5 rounded-full border border-border bg-secondary/50 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground sm:inline-flex">
              <Sparkles className="h-3.5 w-3.5 text-accent" />
              升级 Pro
            </button>
            <button className="grid h-9 w-9 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
              <Bell className="h-4.5 w-4.5" />
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 transition-colors hover:bg-secondary sm:pr-3">
                  <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-accent to-accent/70 text-sm font-semibold text-accent-foreground">
                    学
                  </div>
                  <span className="hidden text-xs font-medium text-foreground sm:inline">
                    本地用户
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="text-sm font-semibold">本地会话模式</div>
                  <div className="text-[11px] font-normal text-muted-foreground">
                    数据保存在云端
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="flex">
        <aside
          className={cn(
            "fixed inset-y-0 left-0 top-14 z-30 w-64 shrink-0 border-r border-border bg-sidebar transition-transform md:sticky md:top-14 md:h-[calc(100vh-3.5rem)] md:translate-x-0",
            mobileOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <nav className="flex h-full flex-col gap-1 overflow-y-auto p-3">
            <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              功能菜单
            </p>
            {navItems.map((item) => {
              const active = pathname === item.to;
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "group flex items-start gap-3 rounded-lg px-3 py-2.5 text-sm transition-all",
                    active
                      ? "bg-primary text-primary-foreground shadow-[var(--shadow-soft)]"
                      : "text-sidebar-foreground hover:-translate-y-px hover:bg-sidebar-accent",
                  )}
                >
                  <Icon
                    className={cn(
                      "mt-0.5 h-4.5 w-4.5 shrink-0 transition-transform group-hover:scale-110",
                      active ? "" : "text-primary",
                    )}
                  />
                  <div className="min-w-0">
                    <div className="truncate font-medium">{item.label}</div>
                    <div
                      className={cn(
                        "truncate text-[11px]",
                        active ? "text-primary-foreground/80" : "text-muted-foreground",
                      )}
                    >
                      {item.desc}
                    </div>
                  </div>
                </Link>
              );
            })}

            <div className="mt-auto rounded-xl border border-border bg-gradient-to-br from-primary/5 to-accent/10 p-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-accent" />
                <span className="text-xs font-semibold">今日学习</span>
              </div>
              <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
                坚持复盘错题,进步看得见。已连续学习 <span className="font-semibold text-accent">7</span> 天。
              </p>
            </div>
          </nav>
        </aside>

        {mobileOpen && (
          <button
            aria-label="关闭菜单"
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 top-14 z-20 bg-foreground/20 backdrop-blur-sm md:hidden"
          />
        )}

        <main className="min-w-0 flex-1">
          <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">{children}</div>
        </main>
      </div>

      <HelpFab />
    </div>
  );
}