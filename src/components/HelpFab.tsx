import { useEffect, useState } from "react";
import {
  HelpCircle,
  X,
  BookOpen,
  Sparkles,
  Radar,
  PenLine,
  Inbox,
  ChevronRight,
  MessageSquareHeart,
  Send,
  CheckCircle2,
  Star,
  ArrowLeft,
  Keyboard,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

type View = "menu" | "guide" | "feedback";

type GuideEntry = {
  id: string;
  title: string;
  icon: typeof Radar;
  color: "primary" | "accent" | "success";
  intro: string;
  steps: { title: string; desc: string }[];
  tips: string[];
};

const GUIDES: GuideEntry[] = [
  {
    id: "scanner",
    title: "知识漏洞扫描仪",
    icon: Radar,
    color: "primary",
    intro:
      "上传近期练习或试卷,AI 会自动定位薄弱知识点,用雷达图直观呈现学科健康度,并给出优先复习建议。",
    steps: [
      {
        title: "上传试卷",
        desc: "点击首页右上角「上传试卷」按钮,支持 PDF 或图片(单份 ≤ 20MB)。",
      },
      {
        title: "等待 AI 解析",
        desc: "系统会依次完成 OCR 识别、知识点匹配、生成报告 4 个步骤,过程约 5-10 秒。",
      },
      {
        title: "查看诊断结果",
        desc: "雷达图展示 5 大学科健康度,风险预警列表按错误率降序排列,红色为高风险。",
      },
      {
        title: "复盘薄弱点",
        desc: "右侧「薄弱知识点」卡片可查看单个知识点掌握度趋势,进度条越短越需要重点复习。",
      },
    ],
    tips: [
      "同一份试卷可多次「重新解析」以对比不同批次的结果。",
      "健康度低于 60 分的学科建议每周至少一次专项训练。",
    ],
  },
  {
    id: "essay",
    title: "AI 作文批改室",
    icon: PenLine,
    color: "accent",
    intro:
      "支持语文(满分 60)与英语(满分 20)作文的智能批改,输出多维评分、亮点句、错别字/语法纠正与教师评语。",
    steps: [
      {
        title: "选择作文类型",
        desc: "顶部 Tab 切换「语文作文」或「英语作文」,不同类型使用不同评分维度。",
      },
      {
        title: "粘贴或上传",
        desc: "左侧输入框支持粘贴文本,也可点击「上传图片」用 OCR 识别手写作文。",
      },
      {
        title: "开始批改",
        desc: "点击「开始批改」,右侧骨架屏加载完成后展示结果。",
      },
      {
        title: "解读批改结果",
        desc: "绿色高亮为亮点句,红色删除线为错误、蓝色为建议改法;底部为整体评语。",
      },
    ],
    tips: [
      "字数建议:语文 ≥ 600 字、英语 ≥ 120 词,AI 分析更精准。",
      "可点击「加载范文」快速体验批改效果。",
    ],
  },
  {
    id: "mistakes",
    title: "错题收纳盒",
    icon: Inbox,
    color: "success",
    intro:
      "Notion 风格的错题卡片库,支持科目/错误类型筛选、标签检索,数据存于本地,清除浏览器缓存前不会丢失。",
    steps: [
      {
        title: "新增错题",
        desc: "右上角「新增错题」→ 填写科目、题干、错误原因,添加标签(如 #计算失误)。",
      },
      {
        title: "筛选与检索",
        desc: "顶部筛选栏可按科目、错误类型过滤;搜索框支持题干、原因、标签模糊匹配。",
      },
      {
        title: "翻转查看",
        desc: "点击卡片可翻转查看「错误原因」,再次点击返回题干正面。",
      },
      {
        title: "定期复盘",
        desc: "建议每周日复盘一次,把已掌握的错题删除,保留仍需巩固的部分。",
      },
    ],
    tips: [
      "标签建议使用统一命名,如 #主谓一致、#三角函数、#受力分析。",
      "错题数据仅保存在本机浏览器,换设备前请自行备份。",
    ],
  },
];

const SHORTCUTS = [
  { keys: ["/"], desc: "快速聚焦搜索框" },
  { keys: ["N"], desc: "新增错题" },
  { keys: ["G", "S"], desc: "跳转到扫描仪" },
  { keys: ["Esc"], desc: "关闭当前弹窗" },
];

const FEEDBACK_TYPES = [
  { id: "bug", label: "问题反馈", emoji: "🐞", desc: "功能异常或体验问题" },
  { id: "feature", label: "功能建议", emoji: "💡", desc: "希望新增的功能" },
  { id: "content", label: "内容纠错", emoji: "📚", desc: "知识点或解析错误" },
  { id: "praise", label: "表扬鼓励", emoji: "🌟", desc: "喜欢的地方" },
] as const;

type FeedbackType = (typeof FEEDBACK_TYPES)[number]["id"];
type FeedbackDraft = {
  type: FeedbackType;
  content: string;
  contact: string;
  rating: number;
};

const FEEDBACK_STORAGE = "zhixue.feedback.v1";

export function HelpFab() {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<View>("menu");
  const [activeGuide, setActiveGuide] = useState<GuideEntry | null>(null);

  const [draft, setDraft] = useState<FeedbackDraft>({
    type: "bug",
    content: "",
    contact: "",
    rating: 5,
  });
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!open) {
      // Reset navigation after close animation
      const t = setTimeout(() => {
        setView("menu");
        setActiveGuide(null);
        setSubmitted(false);
      }, 200);
      return () => clearTimeout(t);
    }
  }, [open]);

  const submitFeedback = () => {
    if (!draft.content.trim()) return;
    try {
      const raw = localStorage.getItem(FEEDBACK_STORAGE);
      const list = raw ? JSON.parse(raw) : [];
      list.unshift({ ...draft, submittedAt: Date.now() });
      localStorage.setItem(FEEDBACK_STORAGE, JSON.stringify(list));
    } catch {
      /* ignore */
    }
    setSubmitted(true);
  };

  const resetFeedback = () => {
    setDraft({ type: "bug", content: "", contact: "", rating: 5 });
    setSubmitted(false);
  };

  return (
    <>
      {open && (
        <div className="fixed inset-x-3 bottom-24 z-50 mx-auto max-h-[75vh] w-auto max-w-md overflow-hidden rounded-2xl border border-border bg-card shadow-[0_20px_50px_-12px_oklch(0.5_0.1_245/0.35)] animate-in fade-in slide-in-from-bottom-2 sm:inset-x-auto sm:right-6 sm:w-96">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border bg-gradient-to-r from-primary/5 to-accent/10 px-4 py-3">
            <div className="flex min-w-0 items-center gap-2">
              {view !== "menu" && (
                <button
                  onClick={() => {
                    if (view === "guide" && activeGuide) {
                      setActiveGuide(null);
                    } else {
                      setView("menu");
                      setActiveGuide(null);
                    }
                  }}
                  className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
              )}
              <Sparkles className="h-4 w-4 shrink-0 text-accent" />
              <p className="truncate text-sm font-semibold">
                {view === "menu" && "帮助中心"}
                {view === "guide" && (activeGuide ? activeGuide.title : "使用指南")}
                {view === "feedback" && "反馈建议"}
              </p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="rounded-md p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="max-h-[calc(75vh-3rem)] overflow-y-auto p-4">
            {/* MENU */}
            {view === "menu" && (
              <div className="space-y-2">
                <p className="mb-1 text-[11px] text-muted-foreground">
                  遇到问题?我们为你准备了详细的操作指南与反馈通道。
                </p>
                {[
                  {
                    icon: BookOpen,
                    label: "使用指南",
                    desc: "三大核心模块的分步教程与技巧",
                    onClick: () => setView("guide"),
                  },
                  {
                    icon: MessageSquareHeart,
                    label: "反馈建议",
                    desc: "问题反馈 / 功能建议 / 内容纠错",
                    onClick: () => setView("feedback"),
                  },
                ].map((it) => (
                  <button
                    key={it.label}
                    onClick={it.onClick}
                    className="flex w-full items-center gap-3 rounded-xl border border-border p-3 text-left transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:bg-secondary/50"
                  >
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                      <it.icon className="h-4.5 w-4.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold">{it.label}</div>
                      <div className="text-[11px] text-muted-foreground">{it.desc}</div>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </button>
                ))}

                <div className="mt-3 rounded-xl border border-border bg-secondary/40 p-3">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
                    <Keyboard className="h-3 w-3" />
                    快捷键
                  </div>
                  <ul className="mt-2 space-y-1.5">
                    {SHORTCUTS.map((s) => (
                      <li
                        key={s.desc}
                        className="flex items-center justify-between text-[11px]"
                      >
                        <span className="text-muted-foreground">{s.desc}</span>
                        <span className="flex gap-1">
                          {s.keys.map((k) => (
                            <kbd
                              key={k}
                              className="rounded border border-border bg-card px-1.5 py-0.5 text-[10px] font-semibold text-foreground shadow-sm"
                            >
                              {k}
                            </kbd>
                          ))}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* GUIDE LIST */}
            {view === "guide" && !activeGuide && (
              <div className="space-y-2">
                {GUIDES.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => setActiveGuide(g)}
                    className="flex w-full items-start gap-3 rounded-xl border border-border p-3 text-left transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:bg-secondary/50"
                  >
                    <div
                      className={cn(
                        "grid h-10 w-10 shrink-0 place-items-center rounded-lg",
                        g.color === "primary" && "bg-primary/10 text-primary",
                        g.color === "accent" && "bg-accent/15 text-accent",
                        g.color === "success" && "bg-success/15 text-success",
                      )}
                    >
                      <g.icon className="h-4.5 w-4.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold">{g.title}</div>
                      <div className="mt-0.5 line-clamp-2 text-[11px] leading-relaxed text-muted-foreground">
                        {g.intro}
                      </div>
                      <div className="mt-1 text-[10px] font-medium text-primary">
                        {g.steps.length} 个步骤 · {g.tips.length} 条小贴士
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* GUIDE DETAIL */}
            {view === "guide" && activeGuide && (
              <div className="space-y-4">
                <p className="rounded-lg bg-secondary/50 p-3 text-xs leading-relaxed text-foreground">
                  {activeGuide.intro}
                </p>

                <div>
                  <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    操作步骤
                  </div>
                  <ol className="space-y-2">
                    {activeGuide.steps.map((s, i) => (
                      <li
                        key={s.title}
                        className="flex gap-3 rounded-lg border border-border bg-card p-2.5"
                      >
                        <div
                          className={cn(
                            "grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-bold",
                            activeGuide.color === "primary" &&
                              "bg-primary text-primary-foreground",
                            activeGuide.color === "accent" &&
                              "bg-accent text-accent-foreground",
                            activeGuide.color === "success" &&
                              "bg-success text-success-foreground",
                          )}
                        >
                          {i + 1}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-semibold">{s.title}</div>
                          <div className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
                            {s.desc}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>

                <div>
                  <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    <Sparkles className="h-3 w-3 text-accent" />
                    小贴士
                  </div>
                  <ul className="space-y-1.5">
                    {activeGuide.tips.map((t) => (
                      <li
                        key={t}
                        className="flex gap-2 rounded-lg bg-accent/5 p-2.5 text-[11px] leading-relaxed text-foreground"
                      >
                        <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                        {t}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* FEEDBACK */}
            {view === "feedback" && !submitted && (
              <div className="space-y-4">
                <div>
                  <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    反馈类型
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {FEEDBACK_TYPES.map((t) => {
                      const active = draft.type === t.id;
                      return (
                        <button
                          key={t.id}
                          onClick={() => setDraft({ ...draft, type: t.id })}
                          className={cn(
                            "rounded-xl border p-2.5 text-left transition-all hover:-translate-y-0.5",
                            active
                              ? "border-primary bg-primary/5 shadow-[var(--shadow-soft)]"
                              : "border-border hover:border-primary/40",
                          )}
                        >
                          <div className="flex items-center gap-1.5">
                            <span className="text-base">{t.emoji}</span>
                            <span className="text-xs font-semibold">{t.label}</span>
                          </div>
                          <div className="mt-0.5 text-[10px] text-muted-foreground">
                            {t.desc}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    详细描述 <span className="text-destructive">*</span>
                  </div>
                  <Textarea
                    value={draft.content}
                    onChange={(e) =>
                      setDraft({ ...draft, content: e.target.value.slice(0, 500) })
                    }
                    placeholder={
                      draft.type === "bug"
                        ? "请描述遇到的问题、复现步骤和期望结果..."
                        : draft.type === "feature"
                          ? "希望增加什么功能?能解决你的什么困扰?"
                          : draft.type === "content"
                            ? "请指出错误位置(截图或路径)和正确内容..."
                            : "喜欢哪个功能?哪里让你感到惊喜?"
                    }
                    className="min-h-[100px] resize-none text-sm"
                  />
                  <div className="mt-1 text-right text-[10px] text-muted-foreground">
                    {draft.content.length} / 500
                  </div>
                </div>

                <div>
                  <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    整体满意度
                  </div>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        onClick={() => setDraft({ ...draft, rating: n })}
                        className="p-0.5 transition-transform hover:scale-110"
                      >
                        <Star
                          className={cn(
                            "h-6 w-6 transition-colors",
                            n <= draft.rating
                              ? "fill-accent text-accent"
                              : "text-muted-foreground/40",
                          )}
                        />
                      </button>
                    ))}
                    <span className="ml-1 text-[11px] text-muted-foreground">
                      {["", "很差", "较差", "一般", "满意", "非常满意"][draft.rating]}
                    </span>
                  </div>
                </div>

                <div>
                  <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    联系方式(选填)
                  </div>
                  <Input
                    value={draft.contact}
                    onChange={(e) =>
                      setDraft({ ...draft, contact: e.target.value.slice(0, 60) })
                    }
                    placeholder="邮箱或手机号,方便我们回复你"
                    className="text-sm"
                  />
                </div>

                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  <ShieldCheck className="h-3 w-3 text-success" />
                  反馈内容仅用于产品改进,不会用于其他用途。
                </div>

                <Button
                  onClick={submitFeedback}
                  disabled={!draft.content.trim()}
                  className="w-full gap-1.5 bg-accent text-accent-foreground transition-all hover:-translate-y-0.5 hover:bg-accent/90"
                >
                  <Send className="h-3.5 w-3.5" />
                  提交反馈
                </Button>
              </div>
            )}

            {/* FEEDBACK DONE */}
            {view === "feedback" && submitted && (
              <div className="py-4 text-center">
                <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-success/15">
                  <CheckCircle2 className="h-7 w-7 text-success" />
                </div>
                <p className="mt-3 text-sm font-semibold">感谢你的反馈!</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  我们已收到你的建议,产品团队会认真阅读每一条内容。
                </p>
                <div className="mt-4 flex gap-2">
                  <Button
                    variant="outline"
                    onClick={resetFeedback}
                    className="flex-1"
                  >
                    再提一条
                  </Button>
                  <Button
                    onClick={() => setOpen(false)}
                    className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90"
                  >
                    完成
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="帮助"
        className={cn(
          "fixed bottom-6 right-4 z-50 grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-accent to-accent/80 text-accent-foreground shadow-[0_8px_24px_-4px_oklch(0.72_0.17_55/0.5)] transition-all hover:scale-110 hover:shadow-[0_12px_32px_-4px_oklch(0.72_0.17_55/0.6)] sm:right-6",
          open && "rotate-90",
        )}
      >
        {open ? <X className="h-5 w-5" /> : <HelpCircle className="h-5 w-5" />}
      </button>
    </>
  );
}
