import { useEffect } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { Calendar, ChartColumnBig, Goal, Home, MessageCircle, Settings, Sparkles } from "lucide-react";
import { useBloomStore } from "@/store/useBloomStore";
import { apiClient } from "@/lib-api";
import { useAuthStore } from "@/store/useAuthStore";
import { useTheme } from "@/hooks/useTheme";
import { ProfileModal } from "@/features/settings/components/ProfileModal";

const navItems = [
  { to: "/dashboard", label: "今日成长", icon: Home },
  { to: "/session", label: "成长对话", icon: MessageCircle },
  { to: "/trajectory", label: "成长轨迹", icon: ChartColumnBig },
  { to: "/reports", label: "周期报告", icon: Calendar },
  { to: "/goals", label: "我的目标", icon: Goal },
  { to: "/settings", label: "设置", icon: Settings },
];

export function AppShell() {
  const navigate = useNavigate();
  const { bootstrap, setBootstrap, setProfileModalOpen, clear } = useBloomStore();
  const { isAuthenticated, hydrate, username } = useAuthStore();

  useTheme(bootstrap?.settings.darkMode);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!isAuthenticated) {
      clear();
      navigate("/auth", { replace: true });
      return;
    }

    apiClient.getBootstrap()
      .then((payload) => {
        setBootstrap(payload);
        if (!payload.hasOnboarded) navigate("/onboarding", { replace: true });
      })
      .catch(() => {
        console.warn("后端不可用，无法加载个人数据");
      });
  }, [isAuthenticated, navigate, setBootstrap, clear]);

  const displayName = bootstrap?.profile?.username ?? bootstrap?.profile?.name ?? username ?? "Bloom User";
  const displayAvatar = bootstrap?.profile?.avatarName ?? (displayName || "L").slice(0, 1).toUpperCase();

  return (
    <div className="flex h-screen overflow-hidden gap-6 p-5 text-text lg:p-7">
      <aside className="hidden h-full w-[248px] shrink-0 rounded-panel border border-white/70 bg-white/80 p-5 shadow-card backdrop-blur dark:border-white/10 dark:bg-white/5 lg:flex lg:flex-col">
        <div className="flex items-center gap-3 px-2 pb-6">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-50 text-primary-500 dark:bg-[#261D46]">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <div className="text-lg font-semibold">Bloom</div>
            <div className="text-xs text-muted">AI Growth Agent</div>
          </div>
        </div>
        <nav className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  [
                    "interactive flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-150",
                    isActive ? "bg-primary-50 text-primary-600 shadow-soft dark:bg-[#261D46] dark:text-[#E4DBFF]" : "text-muted hover:bg-surface hover:text-text",
                  ].join(" ")
                }
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        <button className="interactive mt-auto rounded-[24px] border border-line bg-surface/70 p-4 text-left dark:bg-[#1B1531]" onClick={() => setProfileModalOpen(true)}>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[linear-gradient(135deg,#A78BFA,#7C4DFF)] text-white">
              {displayAvatar}
            </div>
            <div>
              <div className="text-sm font-semibold">{displayName}</div>
              <div className="text-xs text-muted">点击编辑个人信息</div>
            </div>
          </div>
        </button>
      </aside>

      <main className="min-w-0 flex-1 overflow-y-auto rounded-[34px] border border-white/70 bg-white/70 p-6 shadow-card backdrop-blur dark:border-white/10 dark:bg-white/5 lg:p-7">
        <Outlet />
      </main>

      <ProfileModal />
    </div>
  );
}
