import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Plus, Search, Filter, Trash2, X, BookOpen, Tag as TagIcon, Loader2 } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { getSupabase } from "@/lib/supabase";

export const Route = createFileRoute("/mistakes")({
  head: () => ({
    meta: [
      { title: "错题收纳盒 · 智学助手" },
      { name: "description", content: "Notion 风格的错题卡片管理,支持标签、筛选与云端存储。" },
    ],
  }),
  component: MistakesPage,
});

const SUBJECTS = ["语文", "数学", "英语", "物理", "化学", "生物", "历史", "地理", "政治"] as const;
const ERROR_TYPES = ["计算失误", "概念不清", "审题错误", "粗心", "知识盲点", "方法不当"] as const;

type Mistake = {
  id: string;
  subject: string;
  question: string;
  reason: string;
  errorType: string;
  tags: string[];
  created_at: string;
};

const SEED: Omit<Mistake, "id" | "created_at">[] = [
  {
    subject: "数学",
    question: "已知 sin(α) + cos(α) = 1/2, 求 sin(2α) 的值。",
    reason: "忘记将两边平方后使用 sin²+cos²=1 的恒等变形,直接展开导致失误。",
    errorType: "方法不当",
    tags: ["三角函数", "公式变形"],
  },
  {
    subject: "英语",
    question: "The number of students ___ (be) increasing rapidly.",
    reason: "The number of + 复数名词 作主语时,谓语用单数;误用了 are。",
    errorType: "概念不清",
    tags: ["主谓一致", "语法"],
  },
  {
    subject: "物理",
    question: "斜面上物体受力分析,摩擦系数为 μ,求最小推力...",
    reason: "受力方向拆分错误,把摩擦力方向判断反了。",
    errorType: "审题错误",
    tags: ["受力分析", "力学"],
  },
];

function useMistakes() {
  const [list, setList] = useState<Mistake[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMistakes = async () => {
    setLoading(true);
    try {
      const { data, error } = await getSupabase()
        .from("wrong_questions")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) {
        console.error("Failed to fetch mistakes:", error);
        setList([]);
        return;
      }
      if (!data || data.length === 0) {
        await seedInitialData();
        const { data: seededData } = await getSupabase()
          .from("wrong_questions")
          .select("*")
          .order("created_at", { ascending: false });
        setList(seededData || []);
      } else {
        setList(data as Mistake[]);
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setList([]);
    } finally {
      setLoading(false);
    }
  };

  const seedInitialData = async () => {
    for (const item of SEED) {
      await getSupabase().from("wrong_questions").insert([item]);
    }
  };

  useEffect(() => {
    fetchMistakes();
  }, []);

  const addMistake = async (item: Omit<Mistake, "id" | "created_at">) => {
    try {
      const { data, error } = await getSupabase()
        .from("wrong_questions")
        .insert([item])
        .select();
      if (error) {
        console.error("Failed to add mistake:", error);
        return false;
      }
      if (data && data.length > 0) {
        setList([data[0] as Mistake, ...list]);
      }
      return true;
    } catch (err) {
      console.error("Add error:", err);
      return false;
    }
  };

  const deleteMistake = async (id: string) => {
    try {
      const { error } = await getSupabase()
        .from("wrong_questions")
        .delete()
        .eq("id", id);
      if (error) {
        console.error("Failed to delete mistake:", error);
        return false;
      }
      setList(list.filter((m) => m.id !== id));
      return true;
    } catch (err) {
      console.error("Delete error:", err);
      return false;
    }
  };

  return { list, loading, addMistake, deleteMistake, refresh: fetchMistakes };
}

function MistakesPage() {
  const { list, loading, addMistake, deleteMistake } = useMistakes();
  const [subjectFilter, setSubjectFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [flipped, setFlipped] = useState<Set<string>>(new Set());
  const [formOpen, setFormOpen] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  const [draft, setDraft] = useState<Omit<Mistake, "id" | "created_at">>({
    subject: "数学",
    question: "",
    reason: "",
    errorType: "计算失误",
    tags: [],
  });
  const [tagInput, setTagInput] = useState("");

  const filtered = useMemo(() => {
    return list
      .filter((m) => subjectFilter === "all" || m.subject === subjectFilter)
      .filter((m) => typeFilter === "all" || m.errorType === typeFilter)
      .filter(
        (m) =>
          !search ||
          m.question.toLowerCase().includes(search.toLowerCase()) ||
          m.reason.toLowerCase().includes(search.toLowerCase()) ||
          m.tags.some((t) => t.toLowerCase().includes(search.toLowerCase())),
      )
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [list, subjectFilter, typeFilter, search]);

  const toggleFlip = (id: string) => {
    setFlipped((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const resetDraft = () => {
    setDraft({ subject: "数学", question: "", reason: "", errorType: "计算失误", tags: [] });
    setTagInput("");
  };

  const openForm = () => {
    resetDraft();
    setFormOpen(true);
  };

  const addTag = (t: string) => {
    const clean = t.trim().replace(/^#/, "");
    if (!clean) return;
    if (draft.tags.includes(clean)) return;
    setDraft({ ...draft, tags: [...draft.tags, clean] });
    setTagInput("");
  };

  const removeTag = (t: string) =>
    setDraft({ ...draft, tags: draft.tags.filter((x) => x !== t) });

  const submit = async () => {
    if (!draft.question.trim() || !draft.reason.trim()) return;
    setSaveLoading(true);
    const success = await addMistake(draft);
    setSaveLoading(false);
    if (success) {
      setFormOpen(false);
      resetDraft();
    }
  };

  const deleteItem = (id: string) => {
    deleteMistake(id);
  };

  return (
    <AppLayout>
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 sm:flex sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>学习记录</span>
            <span>·</span>
            <span className="text-accent">云端存储</span>
          </div>
          <h1 className="mt-1 truncate text-2xl font-bold tracking-tight sm:text-3xl">
            错题收纳盒
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            分类归档,标签检索,让每一道错题都不白错。
          </p>
        </div>
        <Button
          onClick={openForm}
          size="lg"
          className="shrink-0 gap-2 bg-accent text-accent-foreground shadow-[var(--shadow-soft)] transition-all hover:-translate-y-0.5 hover:bg-accent/90"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">新增错题</span>
          <span className="sm:hidden">新增</span>
        </Button>
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-card p-3 shadow-[var(--shadow-card)]">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-0 flex-1 basis-56">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索题干、原因或标签..."
              className="pl-8"
            />
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Filter className="h-3.5 w-3.5" />
            筛选
          </div>
          <Select value={subjectFilter} onValueChange={setSubjectFilter}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="科目" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部科目</SelectItem>
              {SUBJECTS.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="错误类型" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部类型</SelectItem>
              {ERROR_TYPES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="mt-6 grid place-items-center rounded-2xl border border-dashed border-border p-16 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-3 text-sm text-muted-foreground">加载中...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="mt-6 grid place-items-center rounded-2xl border border-dashed border-border p-16 text-center">
          <div className="grid h-14 w-14 place-items-center rounded-full bg-primary/10">
            <BookOpen className="h-6 w-6 text-primary" />
          </div>
          <p className="mt-3 text-sm font-medium">还没有错题</p>
          <p className="mt-1 text-xs text-muted-foreground">
            点击右上角「新增错题」开始建立你的错题库
          </p>
        </div>
      ) : (
        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((m) => {
            const isFlipped = flipped.has(m.id);
            return (
              <div
                key={m.id}
                className={cn(
                  "group relative overflow-hidden rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)] transition-all cursor-pointer hover:-translate-y-0.5 hover:shadow-[var(--shadow-soft)]",
                )}
                onClick={() => toggleFlip(m.id)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                      {m.subject}
                    </span>
                    <span className="rounded-md bg-accent/15 px-2 py-0.5 text-[11px] font-semibold text-accent">
                      {m.errorType}
                    </span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteItem(m.id);
                    }}
                    className="rounded-md p-1 text-muted-foreground opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                {!isFlipped ? (
                  <div className="mt-3">
                    <p className="line-clamp-4 text-sm leading-relaxed text-foreground">
                      {m.question}
                    </p>
                  </div>
                ) : (
                  <div className="mt-3 animate-in fade-in">
                    <div className="text-[11px] font-semibold text-muted-foreground">
                      错误原因
                    </div>
                    <p className="mt-1 line-clamp-4 rounded-lg bg-destructive/5 p-2 text-sm leading-relaxed text-foreground">
                      {m.reason}
                    </p>
                  </div>
                )}

                {m.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {m.tags.map((t) => (
                      <Badge
                        key={t}
                        variant="secondary"
                        className="gap-0.5 rounded-full text-[10px] font-normal"
                      >
                        <span className="text-muted-foreground">#</span>
                        {t}
                      </Badge>
                    ))}
                  </div>
                )}

                <div className="mt-3 flex items-center justify-between border-t border-border pt-2 text-[10px] text-muted-foreground">
                  <span>{new Date(m.created_at).toLocaleDateString("zh-CN")}</span>
                  <span className="text-primary opacity-0 transition-opacity group-hover:opacity-100">
                    {isFlipped ? "查看题干 →" : "查看原因 →"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>新增错题</DialogTitle>
            <DialogDescription>
              记录错题的关键信息,方便后续复习。
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">科目</Label>
                <Select
                  value={draft.subject}
                  onValueChange={(v) => setDraft({ ...draft, subject: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SUBJECTS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">错误类型</Label>
                <Select
                  value={draft.errorType}
                  onValueChange={(v) => setDraft({ ...draft, errorType: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ERROR_TYPES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">题干</Label>
              <Textarea
                value={draft.question}
                onChange={(e) => setDraft({ ...draft, question: e.target.value })}
                placeholder="粘贴或输入题目内容..."
                className="min-h-[80px] resize-none text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">错误原因</Label>
              <Textarea
                value={draft.reason}
                onChange={(e) => setDraft({ ...draft, reason: e.target.value })}
                placeholder="错在哪里?为什么错?正确思路是什么?"
                className="min-h-[80px] resize-none text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1">
                <TagIcon className="h-3 w-3" />
                标签
              </Label>
              <div className="flex gap-1.5">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addTag(tagInput);
                    }
                  }}
                  placeholder="输入标签,回车添加(如:计算失误)"
                  className="text-sm"
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => addTag(tagInput)}
                  disabled={!tagInput.trim()}
                >
                  添加
                </Button>
              </div>
              {draft.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {draft.tags.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => removeTag(t)}
                      className="group inline-flex items-center gap-1 rounded-full bg-accent/15 px-2 py-0.5 text-[11px] font-medium text-accent transition-colors hover:bg-destructive/15 hover:text-destructive"
                    >
                      #{t}
                      <X className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
                    </button>
                  ))}
                </div>
              )}
              <p className="text-[10px] text-muted-foreground">
                建议:#计算失误 #概念不清 #审题错误
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setFormOpen(false)}>
              取消
            </Button>
            <Button
              onClick={submit}
              disabled={!draft.question.trim() || !draft.reason.trim() || saveLoading}
              className="bg-accent text-accent-foreground hover:bg-accent/90"
            >
              {saveLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  保存中...
                </>
              ) : (
                "保存错题"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}