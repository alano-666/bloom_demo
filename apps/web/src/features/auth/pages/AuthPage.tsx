import { useEffect, useMemo, useState } from "react";
import { Mail, Lock, ShieldCheck, User2, Sparkles, BrainCircuit, CircleDashed, ChartNoAxesCombined, Eye, EyeOff, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/Button";
import { useAuthStore } from "@/store/useAuthStore";
import { apiClient } from "@/lib-api";
import { useBloomStore } from "@/store/useBloomStore";

type ErrorInfo = { message: string; code?: string; lockedUntil?: string };

export function AuthPage() {
  const navigate = useNavigate();
  const { setBootstrap } = useBloomStore();
  const { authMode, setAuthMode, countdown, setCountdown, login, registerDraft, updateDraft } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [registerForm, setRegisterForm] = useState({
    email: registerDraft.email,
    username: registerDraft.username,
    password: "",
    verificationCode: registerDraft.verificationCode,
    grade: registerDraft.grade,
    mainGoal: registerDraft.mainGoal,
    mainProblem: registerDraft.mainProblem,
  });
  const [error, setError] = useState<ErrorInfo | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = window.setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [countdown, setCountdown]);

  const canContinue = useMemo(
    () => Boolean(registerForm.email && registerForm.username && registerForm.verificationCode),
    [registerForm],
  );

  const triggerCode = () => {
    if (!registerForm.email) {
      setError({ message: "请先输入邮箱" });
      return;
    }
    setCountdown(60);
    window.alert("已发送虚拟验证码：123456");
  };

  const submitLogin = async () => {
    setError(null);
    if (!loginForm.email || !loginForm.password) {
      setError({ message: "请填写邮箱和密码" });
      return;
    }

    setIsSubmitting(true);
    try {
      // Try backend login first
      const result = await apiClient.login(loginForm.email, loginForm.password);
      login({ email: loginForm.email, username: result.user.username, accessToken: result.token });
      const nextBootstrap = await apiClient.getBootstrap();
      setBootstrap(nextBootstrap);
      navigate(nextBootstrap.hasOnboarded ? "/dashboard" : "/onboarding");
    } catch (err: any) {
      const data = err?.response?.data as { error?: string; code?: string; lockedUntil?: string } | undefined;
      if (data?.error) {
        setError({ message: data.error, code: data.code, lockedUntil: data.lockedUntil });
      } else if (err?.code === "ECONNABORTED" || !err?.response) {
        setError({ message: "后端服务暂时无法连接。请确认浏览器可以访问 bloom-demo-api.vercel.app，或检查梯子是否开启。" });
      } else {
        setError({ message: "登录失败，请检查网络连接。" });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitRegister = async () => {
    setError(null);
    if (!canContinue) {
      setError({ message: "请先完成邮箱、用户名与验证码填写" });
      return;
    }
    if (!registerForm.grade.trim() || !registerForm.mainGoal.trim() || !registerForm.mainProblem.trim()) {
      setError({ message: "请完整填写年级、主要目标和当前问题" });
      return;
    }
    if (!registerForm.password || registerForm.password.length < 6) {
      setError({ message: "密码至少需要 6 个字符" });
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await apiClient.register({
        email: registerForm.email,
        username: registerForm.username,
        password: registerForm.password,
      });
      if (!result.token) {
        setError({ message: "注册成功，请先在邮箱中完成确认，再返回登录。" });
        return;
      }
      updateDraft(registerForm);
      login({ email: registerForm.email, username: registerForm.username, accessToken: result.token });
      const profile = await apiClient.submitOnboarding({
        name: registerForm.username,
        username: registerForm.username,
        email: registerForm.email,
        grade: registerForm.grade,
        longTermGoal: registerForm.mainGoal,
        currentChallenge: registerForm.mainProblem,
        mainGoal: registerForm.mainGoal,
        mainProblem: registerForm.mainProblem,
        growthDirection: "职业",
        stage: "求职",
      });
      setBootstrap(profile);
      navigate("/dashboard");
    } catch (err: any) {
      const data = err?.response?.data as { error?: string; code?: string } | undefined;
      if (data?.error) {
        setError({ message: data.error, code: data.code });
      } else if (err?.code === "ECONNABORTED" || !err?.response) {
        setError({ message: "后端服务暂时无法连接。请确认浏览器可以访问 bloom-demo-api.vercel.app，或检查梯子是否开启。" });
      } else {
        setError({ message: "注册失败，请检查网络连接。" });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const dismissError = () => setError(null);

  return (
    <div className="flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(124,77,255,0.18),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(172,155,255,0.18),transparent_26%),#F5F2FF] px-6 py-8 dark:bg-[radial-gradient(circle_at_top_left,rgba(124,77,255,0.16),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(172,155,255,0.12),transparent_26%),#120D22]">
      <div className="grid w-full max-w-[1320px] gap-10 xl:grid-cols-[1.08fr_0.92fr]">
        <section className="relative overflow-hidden rounded-[40px] border border-white/50 bg-white/50 px-10 py-9 shadow-card backdrop-blur dark:border-white/10 dark:bg-white/5">
          <div className="flex items-center gap-3 text-text">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-50 text-primary-500 dark:bg-[#261D46]">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="text-2xl font-semibold">Bloom</div>
              <div className="text-sm text-muted">AI Growth Agent</div>
            </div>
          </div>

          <div className="mt-16 max-w-[520px]">
            <h1 className="text-[58px] font-semibold leading-[1.1] tracking-tight text-text">
              你的<span className="bg-[linear-gradient(90deg,#6F3FEA,#9E74FF)] bg-clip-text text-transparent">成长</span>，
              <br />
              值得被看见和陪伴
            </h1>
            <p className="mt-7 text-lg leading-9 text-muted">
              Bloom 是你的 AI 成长伙伴，帮助你记录每一天、理解你、规划你，陪你成为更好的自己。
            </p>
          </div>

          <div className="mt-10 grid max-w-[520px] gap-5">
            <Feature icon={BrainCircuit} title="理解你" description="长期记住你的目标、习惯与重要时刻" />
            <Feature icon={CircleDashed} title="陪伴你" description="主动提醒与建议，帮你完成每日成长目标" />
            <Feature icon={ChartNoAxesCombined} title="见证你" description="生成成长报告，见证每一步进步与蜕变" />
          </div>

          <div className="mt-14 max-w-[460px] text-lg leading-9 text-[#6D648D] dark:text-[#C5BFDF]">
            "每一个微小的行动，<br />都会让未来的你感谢现在的自己。"
          </div>

          <div className="pointer-events-none absolute bottom-[-40px] right-[-20px] h-[340px] w-[440px] rounded-full bg-[radial-gradient(circle_at_center,rgba(124,77,255,0.32),rgba(124,77,255,0.06),transparent_72%)] blur-xl" />
          <div className="pointer-events-none absolute bottom-10 right-12 h-[220px] w-[320px] rounded-[60%] bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.92),rgba(182,146,255,0.45),transparent_76%)] opacity-90 blur-md" />
        </section>

        <section className="rounded-[40px] border border-white/60 bg-white px-8 py-8 shadow-card dark:border-white/10 dark:bg-[#171127] xl:px-10">
          <div className="flex items-center gap-3 text-sm font-semibold">
            <button className={`interactive rounded-full px-4 py-2 ${authMode === "login" ? "bg-primary-500 text-white shadow-soft" : "bg-primary-50 text-primary-600 dark:bg-[#261D46] dark:text-[#D8CDFF]"}`} onClick={() => { setAuthMode("login"); setError(null); }}>登录</button>
            <button className={`interactive rounded-full px-4 py-2 ${authMode === "register" ? "bg-primary-500 text-white shadow-soft" : "bg-primary-50 text-primary-600 dark:bg-[#261D46] dark:text-[#D8CDFF]"}`} onClick={() => { setAuthMode("register"); setError(null); }}>注册</button>
          </div>

          <div className="mt-8">
            <h2 className="text-[42px] font-semibold tracking-tight text-text">{authMode === "login" ? "欢迎回来 👋" : "加入 Bloom 🌱"}</h2>
            <p className="mt-3 text-base text-muted">{authMode === "login" ? "登录 Bloom，继续你的成长之旅" : "注册 Bloom，开启你的成长之路"}</p>
          </div>

          {authMode === "login" ? (
            <div className="mt-8 space-y-5">
              <Field label="邮箱 / 手机号" icon={<Mail className="h-4 w-4" />}>
                <input
                  value={loginForm.email}
                  onChange={(event) => setLoginForm((state) => ({ ...state, email: event.target.value }))}
                  placeholder="请输入邮箱或手机号"
                  className="w-full bg-transparent outline-none"
                />
              </Field>
              <Field label="密码" icon={<Lock className="h-4 w-4" />} trailing={<button type="button" className="text-muted" onClick={() => setShowPassword((value) => !value)}>{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>}>
                <input
                  type={showPassword ? "text" : "password"}
                  value={loginForm.password}
                  onChange={(event) => setLoginForm((state) => ({ ...state, password: event.target.value }))}
                  placeholder="请输入密码"
                  className="w-full bg-transparent outline-none"
                />
              </Field>
              <div className="flex justify-end">
                <button className="interactive text-sm font-semibold text-primary-500" onClick={() => window.alert("当前为演示环境，测试账号：luna@bloom.demo / 123456")}>忘记密码？</button>
              </div>
              {error ? <ErrorBanner error={error} onDismiss={dismissError} /> : null}
              <Button fullWidth onClick={submitLogin} disabled={isSubmitting}>{isSubmitting ? "登录中..." : "登录"}</Button>
            </div>
          ) : (
            <div className="mt-8 space-y-5">
              <Field label="邮箱" icon={<Mail className="h-4 w-4" />}>
                <input value={registerForm.email} onChange={(event) => setRegisterForm((state) => ({ ...state, email: event.target.value }))} placeholder="请输入邮箱" className="w-full bg-transparent outline-none" />
              </Field>
              <Field label="用户名" icon={<User2 className="h-4 w-4" />}>
                <input value={registerForm.username} onChange={(event) => setRegisterForm((state) => ({ ...state, username: event.target.value }))} placeholder="请输入用户名" className="w-full bg-transparent outline-none" />
              </Field>
              <Field label="密码" icon={<Lock className="h-4 w-4" />}>
                <input
                  type="password"
                  value={registerForm.password}
                  onChange={(event) => setRegisterForm((state) => ({ ...state, password: event.target.value }))}
                  placeholder="至少 6 个字符"
                  className="w-full bg-transparent outline-none"
                />
              </Field>
              <div>
                <div className="mb-3 text-sm font-semibold text-text">虚拟验证码</div>
                <div className="flex gap-3">
                  <div className="flex min-w-0 flex-1 items-center gap-3 rounded-[22px] border border-line bg-surface px-4 py-4 text-sm text-muted dark:bg-[#1B1531]">
                    <ShieldCheck className="h-4 w-4" />
                    <input value={registerForm.verificationCode} onChange={(event) => setRegisterForm((state) => ({ ...state, verificationCode: event.target.value }))} placeholder="请输入验证码，建议填 123456" className="w-full bg-transparent outline-none" />
                  </div>
                  <Button variant="secondary" onClick={triggerCode} disabled={countdown > 0}>{countdown > 0 ? `${countdown}s` : "发送验证码"}</Button>
                </div>
              </div>
              {canContinue ? (
                <div className="grid gap-5 rounded-[28px] border border-line bg-surface/70 p-5 dark:bg-[#1B1531]">
                  <Field label="年级" icon={<User2 className="h-4 w-4" />} compact>
                    <input value={registerForm.grade} onChange={(event) => setRegisterForm((state) => ({ ...state, grade: event.target.value }))} placeholder="如：大四 / 职场过渡期" className="w-full bg-transparent outline-none" />
                  </Field>
                  <Field label="近阶段主要目标" icon={<Sparkles className="h-4 w-4" />} compact>
                    <textarea value={registerForm.mainGoal} onChange={(event) => setRegisterForm((state) => ({ ...state, mainGoal: event.target.value }))} rows={3} className="w-full resize-none bg-transparent outline-none" />
                  </Field>
                  <Field label="现阶段主要问题" icon={<CircleDashed className="h-4 w-4" />} compact>
                    <textarea value={registerForm.mainProblem} onChange={(event) => setRegisterForm((state) => ({ ...state, mainProblem: event.target.value }))} rows={3} className="w-full resize-none bg-transparent outline-none" />
                  </Field>
                </div>
              ) : null}
              {error ? <ErrorBanner error={error} onDismiss={dismissError} /> : null}
              <Button fullWidth onClick={submitRegister} disabled={isSubmitting}>{isSubmitting ? "注册中..." : "注册并开始成长"}</Button>
            </div>
          )}

          <div className="my-8 flex items-center gap-4 text-sm text-muted">
            <div className="h-px flex-1 bg-line" />
            或
            <div className="h-px flex-1 bg-line" />
          </div>

          <div className="space-y-3">
            <SocialButton label="使用微信登录" onClick={() => window.alert("演示环境暂不接入微信登录。")}>🟢</SocialButton>
            <SocialButton label="使用 Apple 登录" onClick={() => window.alert("演示环境暂不接入 Apple 登录。")}></SocialButton>
            <SocialButton label="使用手机号登录" onClick={() => window.alert("演示环境暂不接入手机号登录。")}>📱</SocialButton>
          </div>

          <div className="mt-8 text-center text-sm text-muted">
            {authMode === "login" ? (
              <>
                还没有账号？ <button className="interactive font-semibold text-primary-500" onClick={() => setAuthMode("register")}>立即注册</button>
              </>
            ) : (
              <>
                已有账号？ <button className="interactive font-semibold text-primary-500" onClick={() => setAuthMode("login")}>立即登录</button>
              </>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function ErrorBanner({ error, onDismiss }: { error: ErrorInfo; onDismiss: () => void }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="flex-1">{error.message}</div>
      <button className="shrink-0 font-semibold text-red-500 hover:text-red-700" onClick={onDismiss}>✕</button>
    </div>
  );
}

function Feature({ icon: Icon, title, description }: { icon: typeof BrainCircuit; title: string; description: string }) {
  return (
    <div className="flex items-start gap-4">
      <div className="mt-1 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/70 text-primary-500 shadow-soft dark:bg-white/10">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <div className="text-lg font-semibold text-text">{title}</div>
        <div className="mt-1 text-base leading-7 text-muted">{description}</div>
      </div>
    </div>
  );
}

function Field({ label, icon, trailing, children, compact }: { label: string; icon: React.ReactNode; trailing?: React.ReactNode; children: React.ReactNode; compact?: boolean }) {
  return (
    <div>
      <div className={`mb-3 text-sm font-semibold text-text ${compact ? "mb-2" : ""}`}>{label}</div>
      <div className="flex items-center gap-3 rounded-[22px] border border-line bg-surface px-4 py-4 text-sm text-muted dark:bg-[#1B1531]">
        <span className="text-muted">{icon}</span>
        <div className="min-w-0 flex-1">{children}</div>
        {trailing}
      </div>
    </div>
  );
}

function SocialButton({ label, children, onClick }: { label: string; children: React.ReactNode; onClick: () => void }) {
  return (
    <button onClick={onClick} className="interactive flex w-full items-center justify-center gap-3 rounded-[22px] border border-line bg-white px-4 py-4 text-sm font-medium text-text hover:bg-surface dark:bg-[#171127] dark:hover:bg-[#1E1733]">
      <span>{children}</span>
      {label}
    </button>
  );
}
