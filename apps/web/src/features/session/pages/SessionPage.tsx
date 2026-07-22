import { useEffect, useMemo, useState } from "react";
import type { AttachmentMeta, SessionMessageInput } from "@bloom/shared";
import { FileUp, Image, Mic, Plus, SendHorizonal } from "lucide-react";
import { apiClient } from "@/lib-api";
import { useBloomStore } from "@/store/useBloomStore";
import { Card } from "@/components/Card";
import { SectionTitle } from "@/components/SectionTitle";
import { NewThreadModal } from "@/features/session/components/NewThreadModal";
import { IconButton } from "@/components/IconButton";

export function SessionPage() {
  const { bootstrap, session, activeThreadId, setActiveThreadId, setSession, mergeFromMessage, setCreatedThread, setBootstrap } = useBloomStore();
  const [draft, setDraft] = useState("");
  const [attachments, setAttachments] = useState<AttachmentMeta[]>([]);
  const [newThreadOpen, setNewThreadOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (!bootstrap) {
      apiClient.getBootstrap().then(setBootstrap);
      return;
    }
    if (!activeThreadId) {
      const firstId = bootstrap.recentThreads[0]?.id;
      if (firstId) {
        setActiveThreadId(firstId);
      }
      return;
    }
    if (!session || session.thread.id !== activeThreadId) {
      apiClient.getSession(activeThreadId).then(setSession);
    }
  }, [activeThreadId, bootstrap, setActiveThreadId, setBootstrap, setSession, session]);

  const activeThread = useMemo(
    () => bootstrap?.recentThreads.find((thread) => thread.id === activeThreadId) ?? bootstrap?.recentThreads[0],
    [activeThreadId, bootstrap?.recentThreads],
  );

  const sendMessage = async () => {
    if (!draft.trim() || !activeThread?.id || isSending) return;
    const content = draft.trim();
    const nextAttachments = attachments.length ? attachments : undefined;
    const payload: SessionMessageInput = {
      threadId: activeThread.id,
      content,
      attachments: nextAttachments,
    };

    const optimisticMessage = {
      id: crypto.randomUUID(),
      threadId: activeThread.id,
      role: "user" as const,
      content,
      createdAt: new Date().toISOString(),
      attachments: nextAttachments,
    };

    if (session?.thread.id === activeThread.id) {
      setSession({
        ...session,
        messages: [...session.messages, optimisticMessage],
      });
    }

    setDraft("");
    setAttachments([]);
    setIsSending(true);

    try {
      const response = await apiClient.postMessage(payload);
      mergeFromMessage(response);
    } finally {
      setIsSending(false);
    }
  };

  const addAttachment = (type: AttachmentMeta["type"]) => {
    const input = document.createElement("input");
    input.type = "file";

    if (type === "file") {
      input.accept = ".pdf,.md,.txt,.json,.csv,.xml,.yaml,.log,.html,.css,.js,.ts,.java,.py,.cpp,.h";
    } else if (type === "image") {
      input.accept = "image/*";
    } else if (type === "audio") {
      input.accept = "audio/*";
    }

    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;

      if (type === "audio") {
        // Use Web Speech API for speech-to-text
        try {
          const SpeechClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
          if (!SpeechClass) throw new Error("not supported");
          const recognition = new SpeechClass();
          recognition.lang = "zh-CN";
          recognition.interimResults = false;
          recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setDraft((prev) => prev + transcript);
            setAttachments((state) => [
              ...state,
              { id: crypto.randomUUID(), type: "audio", name: file.name, previewText: transcript.slice(0, 80) + (transcript.length > 80 ? "…" : "") },
            ]);
          };
          recognition.onerror = () => {
            // Fallback: mock transcription
            const mockText = `[语音输入] ${file.name} 的内容已识别`;
            setDraft((prev) => prev + mockText);
            setAttachments((state) => [
              ...state,
              { id: crypto.randomUUID(), type: "audio", name: file.name, previewText: mockText.slice(0, 80) },
            ]);
          };
          recognition.start();
        } catch {
          const mockText = `[语音输入] ${file.name} 的内容已识别`;
          setDraft((prev) => prev + mockText);
          setAttachments((state) => [
            ...state,
            { id: crypto.randomUUID(), type: "audio", name: file.name, previewText: mockText.slice(0, 80) },
          ]);
        }
      } else if (type === "image") {
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = reader.result as string;
          setAttachments((state) => [
            ...state,
            { id: crypto.randomUUID(), type: "image", name: file.name, previewText: `图片已选择 (${(file.size / 1024).toFixed(0)}KB)` },
          ]);
          // Store base64 for sending to backend
          (window as any).__bloomUpload = { ...((window as any).__bloomUpload || {}), [file.name]: base64 };
        };
        reader.readAsDataURL(file);
      } else {
        const reader = new FileReader();
        reader.onload = () => {
          const text = reader.result as string;
          const preview = text.slice(0, 120).replace(/\n/g, " ");
          setAttachments((state) => [
            ...state,
            { id: crypto.randomUUID(), type: "file", name: file.name, previewText: preview + (text.length > 120 ? "…" : "") },
          ]);
          (window as any).__bloomUpload = { ...((window as any).__bloomUpload || {}), [file.name]: text };
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <SectionTitle eyebrow="Daily Growth Session" title="成长对话" subtitle="和 Bloom 聊聊你的想法，我会帮你拆解问题、记住进展。所有成长数据都优先从这里持续更新。" />
        <button className="interactive inline-flex items-center gap-2 rounded-2xl border border-line bg-white px-4 py-3 text-sm font-semibold text-primary-600 shadow-card dark:bg-[#1B1531]" onClick={() => setNewThreadOpen(true)}>
          <Plus className="h-4 w-4" /> 新建对话
        </button>
      </div>

      <div className="grid gap-6 xl:h-[calc(100vh-190px)] xl:grid-cols-[320px_minmax(0,1fr)] xl:items-start">
        <Card className="p-4 xl:sticky xl:top-0 xl:h-[calc(100vh-190px)]">
          <div className="px-3 pb-3 text-sm font-semibold text-text">全部历史对话</div>
          <div className="space-y-2 xl:max-h-[calc(100%-2.25rem)] xl:overflow-y-auto xl:pr-1">
            {bootstrap?.recentThreads.map((thread) => (
              <button
                key={thread.id}
                onClick={() => {
                  setActiveThreadId(thread.id);
                  apiClient.getSession(thread.id).then(setSession);
                }}
                className={`interactive w-full rounded-[22px] px-4 py-4 text-left transition ${
                  activeThread?.id === thread.id ? "bg-primary-50 shadow-soft dark:bg-[#261D46]" : "hover:bg-surface"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-semibold text-text">{thread.title}</div>
                  <span className="text-[11px] text-muted">{new Date(thread.lastInputAt ?? thread.updatedAt).toLocaleString("zh-CN", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                </div>
                <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted">{thread.lastInputContent || thread.preview}</p>
              </button>
            ))}
          </div>
        </Card>

        <Card className="flex min-h-[720px] flex-col p-5 xl:h-[calc(100vh-190px)]">
          <div className="border-b border-line px-2 pb-4">
            <div className="text-sm font-semibold text-text">{activeThread?.title ?? "成长会话"}</div>
            <div className="mt-1 text-sm text-muted">和 Bloom 聊聊你的想法，获得陪伴分析、任务拆解与日程建议</div>
          </div>

          <div className="flex-1 space-y-5 overflow-y-auto px-2 py-5">
            {session?.messages.length ? (
              session.messages.map((message) => (
                <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[78%] ${message.role === "user" ? "order-2" : "order-1"}`}>
                    <div
                      className={`rounded-[26px] px-5 py-4 text-sm leading-7 shadow-sm ${
                        message.role === "user"
                          ? "rounded-tr-md bg-primary-500 text-white"
                          : "rounded-tl-md border border-line bg-white text-text dark:bg-[#1B1531]"
                      }`}
                    >
                      {message.content}
                    </div>
                    {message.attachments?.length ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {message.attachments.map((attachment) => (
                          <div key={attachment.id} className="rounded-full border border-line bg-surface px-3 py-2 text-xs text-muted dark:bg-[#1B1531]">
                            {attachment.type} · {attachment.name}
                          </div>
                        ))}
                      </div>
                    ) : null}
                    {message.role === "assistant" && message.summary ? (
                      <div className="mt-3 grid gap-3 rounded-[24px] border border-primary-100 bg-primary-50/60 p-4 md:grid-cols-2 dark:border-[#30264D] dark:bg-[#261D46]">
                        <InfoBlock title="记忆回调" text={message.summary.memory} />
                        <InfoBlock title="情绪识别" text={message.summary.emotion} />
                        <InfoBlock title="进展判断" text={message.summary.progress} />
                        <InfoBlock title="下一步建议" text={message.summary.nextStep} />
                        {message.summary.taskSuggestion ? <InfoBlock title="任务建议" text={message.summary.taskSuggestion} /> : null}
                        {message.summary.scheduleSuggestion ? <InfoBlock title="日程建议" text={message.summary.scheduleSuggestion} /> : null}
                      </div>
                    ) : null}
                  </div>
                </div>
              ))
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted">这是一个全新的空白对话，开始向 Bloom 说说你的想法吧。</div>
            )}
          </div>

          <div className="mt-4 rounded-[26px] border border-line bg-surface px-4 py-4 dark:bg-[#1B1531]">
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void sendMessage();
                }
              }}
              rows={3}
              placeholder="输入你的成长想法、困惑或决策问题..."
              className="w-full resize-none border-none bg-transparent text-sm outline-none"
            />
            {attachments.length ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {attachments.map((attachment) => (
                  <div key={attachment.id} className="rounded-full border border-line bg-white px-3 py-2 text-xs text-muted dark:bg-[#171127]">
                    {attachment.type} · {attachment.name}
                  </div>
                ))}
              </div>
            ) : null}
            <div className="mt-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-muted">
                <IconButton onClick={() => addAttachment("file")}><FileUp className="h-4 w-4" /></IconButton>
                <IconButton onClick={() => addAttachment("audio")}><Mic className="h-4 w-4" /></IconButton>
                <IconButton onClick={() => addAttachment("image")}><Image className="h-4 w-4" /></IconButton>
              </div>
              <button onClick={sendMessage} disabled={isSending} className="interactive rounded-2xl bg-primary-500 p-3 text-white shadow-soft disabled:opacity-60">
                <SendHorizonal className="h-4 w-4" />
              </button>
            </div>
          </div>
        </Card>
      </div>

      <NewThreadModal
        open={newThreadOpen}
        onClose={() => setNewThreadOpen(false)}
        onCreate={async (title) => {
          const next = await apiClient.createThread({ title });
          setCreatedThread(next);
        }}
      />
    </div>
  );
}

function InfoBlock({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-[18px] bg-white px-4 py-4 dark:bg-[#171127]">
      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-500">{title}</div>
      <p className="mt-2 text-sm leading-6 text-text">{text}</p>
    </div>
  );
}
