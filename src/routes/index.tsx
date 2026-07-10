import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import {
  Radar as RadarIcon,
  Upload,
  AlertTriangle,
  TrendingDown,
  Loader2,
  CheckCircle2,
  FileText,
  Sparkles,
  Target,
  ScanLine,
  Brain,
  Lightbulb,
  RefreshCw,
  FileCheck2,
  Image,
} from "lucide-react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getSupabase } from "@/lib/supabase";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "知识漏洞扫描 · 智学助手" },
      { name: "description", content: "AI 扫描试卷,精准定位薄弱知识点,让复习不再盲目。" },
    ],
  }),
  component: Dashboard,
});

type Subject = {
  subject: string;
  score: number;
  fullMark: 100;
};

const initialData: Subject[] = [
  { subject: "语文", score: 82, fullMark: 100 },
  { subject: "数学", score: 65, fullMark: 100 },
  { subject: "英语", score: 78, fullMark: 100 },
  { subject: "物理", score: 58, fullMark: 100 },
  { subject: "化学", score: 71, fullMark: 100 },
];

const initialWarnings = [
  { level: "high", subject: "数学", title: "三角函数公式变形", rate: 60 },
  { level: "high", subject: "物理", title: "牛顿第二定律受力分析", rate: 55 },
  { level: "mid", subject: "化学", title: "氧化还原反应配平", rate: 38 },
  { level: "mid", subject: "英语", title: "非谓语动词辨析", rate: 32 },
  { level: "low", subject: "语文", title: "文言文虚词用法", rate: 20 },
];

const weakPoints = [
  { subject: "数学", topic: "三角函数", mastery: 40, delta: -12 },
  { subject: "物理", topic: "力学综合", mastery: 45, delta: -8 },
  { subject: "化学", topic: "有机化学", mastery: 62, delta: 4 },
  { subject: "英语", topic: "阅读理解 D 篇", mastery: 68, delta: 6 },
];

const SCAN_STEPS = [
  { key: "upload", label: "读取试卷文件", icon: FileCheck2, hint: "识别 PDF / 图片格式" },
  { key: "ocr", label: "OCR 题干识别", icon: ScanLine, hint: "提取文字与公式" },
  { key: "match", label: "AI 知识点匹配", icon: Brain, hint: "对齐高考知识体系" },
  { key: "report", label: "生成诊断报告", icon: Lightbulb, hint: "输出薄弱点与建议" },
] as const;

const SCAN_RESULTS = [
  {
    fileName: "2026-高三月考-数学.pdf",
    highRisk: { topic: "三角函数公式变形", rate: 60 },
    total: 12,
    points: 5,
  },
  {
    fileName: "2026-高三周测-物理.pdf",
    highRisk: { topic: "牛顿第二定律受力分析", rate: 55 },
    total: 10,
    points: 4,
  },
  {
    fileName: "2026-高三月考-化学.pdf",
    highRisk: { topic: "氧化还原反应配平", rate: 47 },
    total: 14,
    points: 6,
  },
];

function Dashboard() {
  const [data] = useState<Subject[]>(initialData);
  const [scanOpen, setScanOpen] = useState(false);
  const [scanStage, setScanStage] = useState<"idle" | "uploading" | "loading" | "done">("idle");
  const [scanStep, setScanStep] = useState(0);
  const [runCount, setRunCount] = useState(0);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadUrl, setUploadUrl] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const avg = Math.round(data.reduce((s, d) => s + d.score, 0) / data.length);
  const currentResult = SCAN_RESULTS[runCount % SCAN_RESULTS.length];

  useEffect(() => {
    if (scanStage !== "loading") return;
    setScanStep(0);
    const timers: ReturnType<typeof setTimeout>[] = [];
    SCAN_STEPS.forEach((_, i) => {
      timers.push(setTimeout(() => setScanStep(i + 1), (i + 1) * 650));
    });
    timers.push(
      setTimeout(() => setScanStage("done"), SCAN_STEPS.length * 650 + 200),
    );
    return () => timers.forEach(clearTimeout);
  }, [scanStage, runCount]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setScanOpen(true);
    setScanStage("uploading");
    setUploadProgress(0);
    setUploadUrl(null);
    setUploadError(null);

    const fileName = `${Date.now()}-${file.name}`;

    try {
      const { data, error } = await getSupabase().storage
        .from("papers")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
          onUploadProgress: (progress) => {
            setUploadProgress(Math.round((progress.loaded / progress.total) * 100));
          },
        });

      if (error) {
        throw error;
      }

      const { data: urlData } = await getSupabase().storage
        .from("papers")
        .getPublicUrl(fileName);

      if (urlData) {
        setUploadUrl(urlData.publicUrl);
      }

      setScanStage("loading");
    } catch (err) {
      console.error("Upload failed:", err);
      setUploadError(err instanceof Error ? err.message : "上传失败");
      setScanStage("idle");
    }
  };

  const startScan = () => {
    fileInputRef.current?.click();
  };

  const rescan = () => {
    setRunCount((c) => c + 1);
    setScanStage("loading");
  };

  const closeScan = () => {
    setScanOpen(false);
    setTimeout(() => {
      setScanStage("idle");
      setScanStep(0);
      setUploadUrl(null);
      setUploadError(null);
    }, 200);
  };

  return (
    <AppLayout>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.pdf"
        onChange={handleFileSelect}
        className="hidden"
      />
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 sm:flex sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>仪表盘</span>
            <span>·</span>
            <span className="text-accent">今日更新</span>
          </div>
          <h1 className="mt-1 truncate text-2xl font-bold tracking-tight sm:text-3xl">
            知识漏洞扫描仪
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            上传试卷或练习,AI 自动识别薄弱点,让复习有的放矢。
          </p>
        </div>
        <Button
          size="lg"
          onClick={startScan}
          className="shrink-0 gap-2 bg-accent text-accent-foreground shadow-[var(--shadow-soft)] transition-all hover:-translate-y-0.5 hover:bg-accent/90"
        >
          <Upload className="h-4 w-4" />
          <span className="hidden sm:inline">上传试卷</span>
          <span className="sm:hidden">上传</span>
        </Button>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "综合健康度", value: `${avg}`, unit: "分", tone: "primary", icon: Target },
          { label: "高风险知识点", value: "2", unit: "个", tone: "destructive", icon: AlertTriangle },
          { label: "本周新增错题", value: "17", unit: "道", tone: "accent", icon: FileText },
          { label: "已掌握", value: "83", unit: "点", tone: "success", icon: CheckCircle2 },
        ].map((m) => (
          <div
            key={m.label}
            className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)] transition-transform hover:-translate-y-0.5"
          >
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <m.icon
                className={cn(
                  "h-3.5 w-3.5",
                  m.tone === "primary" && "text-primary",
                  m.tone === "destructive" && "text-destructive",
                  m.tone === "accent" && "text-accent",
                  m.tone === "success" && "text-success",
                )}
              />
              {m.label}
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-2xl font-bold sm:text-3xl">{m.value}</span>
              <span className="text-xs text-muted-foreground">{m.unit}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <RadarIcon className="h-4 w-4 text-primary" />
                <h2 className="font-semibold">学科健康度雷达</h2>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                基于近 30 天的答题数据综合评估
              </p>
            </div>
            <Badge variant="secondary" className="gap-1 rounded-full">
              <span className="h-1.5 w-1.5 rounded-full bg-success" />
              数据实时
            </Badge>
          </div>
          <div className="mt-2 h-[340px] w-full sm:h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={data} outerRadius="72%">
                <PolarGrid stroke="var(--border)" />
                <PolarAngleAxis
                  dataKey="subject"
                  tick={{ fill: "var(--foreground)", fontSize: 13, fontWeight: 600 }}
                />
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, 100]}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                  axisLine={false}
                />
                <Radar
                  name="健康度"
                  dataKey="score"
                  stroke="var(--primary)"
                  fill="var(--primary)"
                  fillOpacity={0.25}
                  strokeWidth={2}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-2 border-t border-border pt-4">
            <div className="mb-3 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <h3 className="font-semibold">风险预警</h3>
              <Badge variant="outline" className="ml-auto text-[11px]">
                {initialWarnings.length} 项
              </Badge>
            </div>
            <ul className="space-y-2">
              {initialWarnings.map((w) => (
                <li
                  key={w.title}
                  className="flex items-center gap-3 rounded-xl border border-border bg-secondary/40 px-3 py-2.5 transition-colors hover:bg-secondary"
                >
                  <span
                    className={cn(
                      "grid h-8 w-8 shrink-0 place-items-center rounded-lg text-xs font-bold",
                      w.level === "high" && "bg-destructive/15 text-destructive",
                      w.level === "mid" && "bg-warning/20 text-warning-foreground",
                      w.level === "low" && "bg-success/15 text-success",
                    )}
                  >
                    {w.subject}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{w.title}</div>
                    <div className="text-[11px] text-muted-foreground">
                      错误率 {w.rate}% · 建议优先复习
                    </div>
                  </div>
                  <div
                    className={cn(
                      "shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold",
                      w.level === "high" && "bg-destructive text-destructive-foreground",
                      w.level === "mid" && "bg-warning text-warning-foreground",
                      w.level === "low" && "bg-success text-success-foreground",
                    )}
                  >
                    {w.level === "high" ? "高风险" : w.level === "mid" ? "中风险" : "低风险"}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
          <div className="flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-accent" />
            <h2 className="font-semibold">薄弱知识点</h2>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            按掌握度升序排列
          </p>
          <div className="mt-4 space-y-4">
            {weakPoints.map((p) => (
              <div key={p.topic} className="group">
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-muted-foreground">{p.subject}</span>
                      <span className="text-xs text-border">·</span>
                      <span className="truncate text-sm font-medium">{p.topic}</span>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-baseline gap-1">
                    <span
                      className={cn(
                        "text-sm font-bold tabular-nums",
                        p.mastery < 50 ? "text-destructive" : p.mastery < 70 ? "text-warning-foreground" : "text-success",
                      )}
                    >
                      {p.mastery}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {p.delta > 0 ? `+${p.delta}` : p.delta}
                    </span>
                  </div>
                </div>
                <Progress value={p.mastery} className="h-2" />
              </div>
            ))}
          </div>
          <button className="mt-5 w-full rounded-xl border border-dashed border-border py-2.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary hover:text-primary">
            查看全部薄弱点 →
          </button>
        </div>
      </div>

      <Dialog open={scanOpen} onOpenChange={(v) => (v ? null : closeScan())}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-accent" />
              AI 智能扫描
            </DialogTitle>
            <DialogDescription>
              {scanStage === "uploading" && "正在上传试卷文件..."}
              {scanStage === "loading" && "正在识别试卷内容并分析知识点..."}
              {scanStage === "done" && "扫描完成,已发现你的薄弱点。"}
            </DialogDescription>
          </DialogHeader>

          {scanStage === "uploading" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2.5 rounded-xl border border-border bg-secondary/40 p-2.5">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                  <FileText className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">上传中...</div>
                  <div className="text-[11px] text-muted-foreground">
                    正在传输文件到云端
                  </div>
                </div>
                <span className="shrink-0 text-[10px] font-semibold text-primary">
                  {uploadProgress}%
                </span>
              </div>
              <div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
              {uploadError && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                  {uploadError}
                </div>
              )}
            </div>
          )}

          {(scanStage === "loading" || scanStage === "done") && (
            <>
              <div className="flex items-center gap-2.5 rounded-xl border border-border bg-secondary/40 p-2.5">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                  <Image className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{currentResult.fileName}</div>
                  <div className="text-[11px] text-muted-foreground">
                    共 {currentResult.total} 道题目 · 已上传
                  </div>
                </div>
                <span
                  className={cn(
                    "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                    scanStage === "loading"
                      ? "bg-primary/15 text-primary"
                      : "bg-success/15 text-success",
                  )}
                >
                  {scanStage === "loading" ? "解析中" : "已完成"}
                </span>
              </div>

              {uploadUrl && (
                <div className="mt-3 rounded-xl border border-border bg-secondary/40 p-3">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
                    <FileText className="h-3 w-3" />
                    上传成功
                  </div>
                  <a
                    href={uploadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 block truncate text-xs text-primary hover:underline"
                  >
                    {uploadUrl}
                  </a>
                </div>
              )}

              {scanStage === "loading" && (
                <div className="space-y-4 py-1">
                  <div>
                    <div className="mb-1.5 flex items-center justify-between text-[11px]">
                      <span className="font-medium text-muted-foreground">
                        步骤 {Math.min(scanStep + 1, SCAN_STEPS.length)} / {SCAN_STEPS.length}
                      </span>
                      <span className="font-semibold tabular-nums text-primary">
                        {Math.round((scanStep / SCAN_STEPS.length) * 100)}%
                      </span>
                    </div>
                    <Progress
                      value={(scanStep / SCAN_STEPS.length) * 100}
                      className="h-2"
                    />
                  </div>

                  <ul className="space-y-2">
                    {SCAN_STEPS.map((s, i) => {
                      const done = i < scanStep;
                      const active = i === scanStep;
                      const Icon = s.icon;
                      return (
                        <li
                          key={s.key}
                          className={cn(
                            "flex items-center gap-3 rounded-xl border px-3 py-2 transition-all",
                            done && "border-success/30 bg-success/5",
                            active && "border-primary/40 bg-primary/5 shadow-[var(--shadow-soft)]",
                            !done && !active && "border-border bg-secondary/30 opacity-60",
                          )}
                        >
                          <div
                            className={cn(
                              "grid h-8 w-8 shrink-0 place-items-center rounded-lg",
                              done && "bg-success text-success-foreground",
                              active && "bg-primary text-primary-foreground",
                              !done && !active && "bg-muted text-muted-foreground",
                            )}
                          >
                            {done ? (
                              <CheckCircle2 className="h-4 w-4" />
                            ) : active ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Icon className="h-4 w-4" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-medium">{s.label}</div>
                            <div className="truncate text-[11px] text-muted-foreground">
                              {s.hint}
                            </div>
                          </div>
                          {active && (
                            <span className="shrink-0 text-[10px] font-semibold text-primary">
                              进行中
                            </span>
                          )}
                          {done && (
                            <span className="shrink-0 text-[10px] font-semibold text-success">
                              完成
                            </span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              {scanStage === "done" && (
                <div className="space-y-3">
                  <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                      <span className="text-sm font-semibold">高风险发现</span>
                    </div>
                    <p className="mt-1.5 text-sm text-foreground">
                      检测到「{currentResult.highRisk.topic}」错误率
                      <span className="mx-1 font-bold text-destructive">
                        {currentResult.highRisk.rate}%
                      </span>
                      ,建议优先复习。
                    </p>
                  </div>
                  <div className="rounded-xl border border-border bg-secondary/40 p-3 text-xs text-muted-foreground">
                    共识别{" "}
                    <span className="font-semibold text-foreground">
                      {currentResult.total}
                    </span>{" "}
                    道题目,涵盖{" "}
                    <span className="font-semibold text-foreground">
                      {currentResult.points}
                    </span>{" "}
                    个知识点,已同步至错题收纳盒。
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={rescan}
                      className="gap-1.5 transition-all hover:-translate-y-0.5"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      重新解析
                    </Button>
                    <Button
                      className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90"
                      onClick={closeScan}
                    >
                      查看详细报告
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}