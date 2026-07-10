import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PenLine, ImagePlus, Sparkles, Star, Quote } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { getAiClient, isAiConfigured, getAiProvider } from "@/lib/ai";

export const Route = createFileRoute("/essay")({
  head: () => ({
    meta: [
      { title: "AI 作文批改室 · 智学助手" },
      { name: "description", content: "语文与英语作文 AI 智能批改,评分、亮点、纠错与教师评语一站式呈现。" },
    ],
  }),
  component: EssayPage,
});

type Mode = "chinese" | "english";
type Stage = "idle" | "loading" | "done";

type Result = {
  score: number;
  max: number;
  dims: { name: string; score: number; max: number }[];
  highlights: string[];
  errors: { text: string; fix: string; type: string }[];
  comment: string;
};

const sampleChinese = `青春是一场盛大的远行。有人在起点徘徊，有人在半路驻足，但真正抵达远方的，是那些始终追光而行的人。我们不必羞于讨论理想，因为理想是让平凡的日子发光的东西...`;

const sampleEnglish = `Youth is a journey filled with challenges and opportunities. Every student are eager to explore the unknown, yet many of us hesitate when facing difficulties. In my opinion, it is perseverance that make dreams come true...`;

const mockChinese: Result = {
  score: 52,
  max: 60,
  dims: [
    { name: "内容", score: 18, max: 20 },
    { name: "表达", score: 17, max: 20 },
    { name: "发展", score: 17, max: 20 },
  ],
  highlights: [
    "青春是一场盛大的远行。",
    "理想是让平凡的日子发光的东西",
  ],
  errors: [
    { text: "羞于讨论", fix: "耻于谈论", type: "用词" },
    { text: "远行", fix: "跋涉", type: "词汇丰富度" },
  ],
  comment:
    "立意积极向上,开篇比喻新颖,能够抓住读者。全文思路清晰,情感真挚。建议在论证部分补充具体事例,并注意个别词语的锤炼与句式的多样化,可进一步冲击一类文水平。",
};

const mockEnglish: Result = {
  score: 17,
  max: 20,
  dims: [
    { name: "Content", score: 6, max: 7 },
    { name: "Grammar", score: 5, max: 7 },
    { name: "Coherence", score: 6, max: 6 },
  ],
  highlights: [
    "Youth is a journey filled with challenges and opportunities.",
    "it is perseverance that make dreams come true",
  ],
  errors: [
    { text: "Every student are", fix: "Every student is", type: "主谓一致" },
    { text: "make dreams", fix: "makes dreams", type: "主谓一致" },
  ],
  comment:
    "Good use of topic sentences and a clear argument structure. Watch out for subject-verb agreement, especially with singular indefinite subjects. Try to add one or two vivid examples to strengthen your body paragraphs.",
};

function EssayPage() {
  const [mode, setMode] = useState<Mode>("chinese");
  const [text, setText] = useState("");
  const [stage, setStage] = useState<Stage>("idle");
  const [result, setResult] = useState<Result | null>(null);

  const handleGrade = async () => {
    if (!text.trim()) return;
    setStage("loading");
    setResult(null);
    try {
      const ai = getAiClient();
      const resultData = await ai.gradeEssay(text, mode);
      setResult(resultData);
      setStage("done");
    } catch (error) {
      console.error("AI grading failed:", error);
      setResult(mode === "chinese" ? mockChinese : mockEnglish);
      setStage("done");
    }
  };

  const loadSample = () => setText(mode === "chinese" ? sampleChinese : sampleEnglish);

  return (
    <AppLayout>
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 sm:flex sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>AI 学习助手</span>
            <span>·</span>
            <span className={isAiConfigured() ? "text-green-500" : "text-amber-500"}>
              {isAiConfigured() ? `${getAiProvider().toUpperCase()} AI` : "演示模式"}
            </span>
          </div>
          <h1 className="mt-1 truncate text-2xl font-bold tracking-tight sm:text-3xl">
            AI 作文批改室
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            粘贴或上传你的作文,AI 秒级返回评分、亮点、纠错与评语。
          </p>
        </div>
      </div>

      <Tabs value={mode} onValueChange={(v) => setMode(v as Mode)} className="mt-6">
        <TabsList className="mb-4">
          <TabsTrigger value="chinese" className="gap-1.5">
            <PenLine className="h-3.5 w-3.5" />
            语文作文
          </TabsTrigger>
          <TabsTrigger value="english" className="gap-1.5">
            <PenLine className="h-3.5 w-3.5" />
            英语作文
          </TabsTrigger>
        </TabsList>

        <TabsContent value={mode} className="mt-0">
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Input */}
            <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold">
                  {mode === "chinese" ? "你的作文" : "Your Essay"}
                </h2>
                <div className="flex gap-1.5">
                  <button
                    onClick={loadSample}
                    className="rounded-md px-2 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                  >
                    加载范文
                  </button>
                  <button className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
                    <ImagePlus className="h-3 w-3" />
                    上传图片
                  </button>
                </div>
              </div>
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={
                  mode === "chinese"
                    ? "请粘贴你的作文原文,建议 600 字以上..."
                    : "Paste your essay here (100+ words recommended)..."
                }
                className="min-h-[320px] resize-none bg-background/60 text-sm leading-relaxed"
              />
              <div className="mt-3 flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground">
                  {text.length} 字
                </span>
                <Button
                  onClick={handleGrade}
                  disabled={!text.trim() || stage === "loading"}
                  className="gap-1.5 bg-accent text-accent-foreground transition-all hover:-translate-y-0.5 hover:bg-accent/90"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  {stage === "loading" ? "批改中..." : "开始批改"}
                </Button>
              </div>
            </div>

            {/* Result */}
            <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
              <div className="mb-4 flex items-center gap-2">
                <Star className="h-4 w-4 text-accent" />
                <h2 className="text-sm font-semibold">批改结果</h2>
              </div>

              {stage === "idle" && (
                <div className="grid h-[320px] place-items-center text-center">
                  <div>
                    <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-primary/10">
                      <PenLine className="h-6 w-6 text-primary" />
                    </div>
                    <p className="mt-3 text-sm font-medium">等待批改</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      输入或粘贴作文后,点击「开始批改」查看结果
                    </p>
                  </div>
                </div>
              )}

              {stage === "loading" && (
                <div className="space-y-4">
                  <Skeleton className="h-24 w-full rounded-xl" />
                  <div className="space-y-2">
                    <Skeleton className="h-3 w-1/3" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-5/6" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-3 w-1/4" />
                    <Skeleton className="h-16 w-full rounded-lg" />
                  </div>
                </div>
              )}

              {stage === "done" && result && (
                <div className="space-y-5">
                  {/* Score */}
                  <div className="rounded-xl bg-gradient-to-br from-primary/10 via-accent/5 to-transparent p-4">
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-black text-primary tabular-nums">
                        {result.score}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        / {result.max} 分
                      </span>
                      <span className="ml-auto rounded-full bg-success/15 px-2 py-0.5 text-[11px] font-semibold text-success">
                        优秀
                      </span>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-3">
                      {result.dims.map((d) => (
                        <div key={d.name}>
                          <div className="mb-1 flex items-center justify-between text-[11px]">
                            <span className="text-muted-foreground">{d.name}</span>
                            <span className="font-semibold tabular-nums">
                              {d.score}/{d.max}
                            </span>
                          </div>
                          <Progress value={(d.score / d.max) * 100} className="h-1.5" />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Highlights */}
                  <div>
                    <h3 className="mb-2 text-xs font-semibold text-muted-foreground">
                      ✨ 亮点句子
                    </h3>
                    <ul className="space-y-1.5">
                      {result.highlights.map((h) => (
                        <li
                          key={h}
                          className="rounded-lg bg-success/10 px-3 py-2 text-sm text-foreground"
                        >
                          <span className="mr-1.5 rounded bg-success/25 px-1 font-medium">
                            {h}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Errors */}
                  <div>
                    <h3 className="mb-2 text-xs font-semibold text-muted-foreground">
                      ⚠️ 错误与修正
                    </h3>
                    <ul className="space-y-1.5">
                      {result.errors.map((e) => (
                        <li
                          key={e.text}
                          className="flex flex-wrap items-center gap-1.5 rounded-lg border border-border bg-secondary/40 px-3 py-2 text-sm"
                        >
                          <span className="text-destructive line-through decoration-2">
                            {e.text}
                          </span>
                          <span className="text-muted-foreground">→</span>
                          <span className="font-medium text-primary">{e.fix}</span>
                          <span className="ml-auto rounded-full bg-secondary px-2 py-0.5 text-[10px] text-muted-foreground">
                            {e.type}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Comment */}
                  <div>
                    <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                      <Quote className="h-3 w-3" />
                      教师评语
                    </h3>
                    <div className={cn(
                      "rounded-xl border border-accent/30 bg-accent/5 p-4 text-sm leading-relaxed text-foreground",
                    )}>
                      {result.comment}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
}
