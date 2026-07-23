import { useEffect, useState } from "react";
import type { InputHTMLAttributes, ReactNode } from "react";
import { useForm } from "react-hook-form";
import type { ReplyStyle, UserSettings } from "@bloom/shared";
import { apiClient } from "@/lib-api";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { SectionTitle } from "@/components/SectionTitle";
import { useBloomStore } from "@/store/useBloomStore";
import { useTheme } from "@/hooks/useTheme";
import { useLocalReminder } from "@/hooks/useLocalReminder";
import { WheelTimePicker } from "@/components/WheelTimePicker";

const replyStyles: ReplyStyle[] = ["治愈陪伴", "结构清晰", "精准鼓励"];

export function SettingsPage() {
  const { bootstrap, updateSettings } = useBloomStore();
  const [saved, setSaved] = useState(false);
  const { register, handleSubmit, reset, watch, setValue } = useForm<UserSettings>({
    defaultValues: bootstrap?.settings,
  });

  const values = watch();
  useTheme(values.darkMode);
  useLocalReminder(
    values.reminderEnabled,
    values.reminderWindow,
    values.eveningReviewTime,
    () => window.alert("Bloom 提醒你：别忘了在约定时间记录今天的成长。"),
    () => {
      // Evening reminder fires - the user can go to the Session page to see the summary
      if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
        new Notification("Bloom", { body: "来看看今天的成长小结 🌙", icon: "/favicon-64x64.png" });
      }
    },
  );

  useEffect(() => {
    if (bootstrap?.settings) {
      reset(bootstrap.settings);
    }
  }, [bootstrap?.settings, reset]);

  const onSubmit = async (nextValues: UserSettings) => {
    const next = await apiClient.updateSettings(nextValues);
    updateSettings(next);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1200);
  };

  return (
    <div className="space-y-6">
      <SectionTitle eyebrow="Preferences" title="设置" subtitle="调整提醒、节奏与输入方式，让 Bloom 更贴合你的成长习惯。" />

      <Card className="p-6">
        <form className="grid gap-6 xl:grid-cols-[1.25fr_1fr]" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-6">
            <Field label="AI 回复风格">
              <div className="flex flex-wrap gap-3">
                {replyStyles.map((style) => (
                  <button
                    key={style}
                    type="button"
                    onClick={() => setValue("replyStyle", style)}
                    className={`interactive rounded-full px-4 py-2 text-sm font-medium ${
                      values.replyStyle === style ? "bg-primary-500 text-white shadow-soft" : "bg-primary-50 text-primary-600 dark:bg-[#261D46] dark:text-[#D8CDFF]"
                    }`}
                  >
                    {style}
                  </button>
                ))}
              </div>
            </Field>

            <div className="grid gap-5 md:grid-cols-2">
              <Field label="每日提醒时间">
                <WheelTimePicker value={values.reminderWindow} onChange={(value) => setValue("reminderWindow", value)} />
              </Field>
              <Field label="每日复盘时间">
                <WheelTimePicker value={values.eveningReviewTime} onChange={(value) => setValue("eveningReviewTime", value)} />
              </Field>
            </div>

            <Field label="字体大小">
              <select {...register("fontScale")} className="w-full rounded-2xl border border-line bg-surface px-4 py-3 outline-none dark:bg-[#1B1531]">
                <option value="小">小</option>
                <option value="中">中</option>
                <option value="大">大</option>
              </select>
            </Field>
          </div>

          <div className="space-y-4 rounded-[26px] border border-line bg-surface/70 p-5 dark:bg-[#1B1531]">
            <Toggle label="AI 温柔风格" {...register("personalizedRhythm")} />
            <Toggle label="语音输入" {...register("voiceEnabled")} />
            <Toggle label="图片输入" {...register("imageEnabled")} />
            <Toggle label="提醒启用" {...register("reminderEnabled")} />
            <Toggle label="深色模式" {...register("darkMode")} />
            <div className="rounded-[20px] bg-white px-4 py-4 text-sm text-muted dark:bg-[#171127]">
              保存后将即时生效：深色模式、提醒时间、AI 回复风格、输入方式开关。
            </div>
            <div className="pt-4">
              <Button type="submit" fullWidth>
                {saved ? "已保存设置" : "保存设置"}
              </Button>
            </div>
          </div>
        </form>
      </Card>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-3">
      <div className="text-sm font-semibold text-text">{label}</div>
      {children}
    </label>
  );
}

function Toggle({ label, ...props }: { label: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="interactive flex items-center justify-between gap-4 rounded-[20px] bg-white px-4 py-4 text-sm font-medium text-text dark:bg-[#171127]">
      <span>{label}</span>
      <input type="checkbox" className="h-5 w-5 accent-[#7C4DFF]" {...props} />
    </label>
  );
}
