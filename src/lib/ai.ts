type EssayResult = {
  score: number;
  max: number;
  dims: { name: string; score: number; max: number }[];
  highlights: string[];
  errors: { text: string; fix: string; type: string }[];
  comment: string;
};

type PaperAnalysisResult = {
  fileName: string;
  highRisk: { topic: string; rate: number };
  total: number;
  points: number;
  analysis: string;
  suggestions: string[];
};

interface AiClient {
  gradeEssay(text: string, language: "chinese" | "english"): Promise<EssayResult>;
  analyzePaper(fileContent: string, fileName: string): Promise<PaperAnalysisResult>;
}

class OpenAiClient implements AiClient {
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model: string = "gpt-4o-mini") {
    this.apiKey = apiKey;
    this.model = model;
  }

  private async request(messages: { role: string; content: string }[]): Promise<string> {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "AI API 请求失败");
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  async gradeEssay(text: string, language: "chinese" | "english"): Promise<EssayResult> {
    const isChinese = language === "chinese";
    const prompt = isChinese
      ? `请作为资深高中语文老师，按照【高考作文评分标准】批改以下作文：

作文内容：
${text}

评分标准（总分60分）：
一、基础等级（40分）
1. 内容（20分）：题意符合、中心明确、内容充实、思想感情真挚
2. 表达（20分）：文体鲜明、结构完整、语言流畅、标点正确

二、发展等级（20分）：深刻（见解深刻）、丰富（材料丰富）、有文采（语言有文采）、有创意（见解新颖）

请返回JSON格式，包含以下字段：
- score: 总分(0-60)
- max: 60
- dims: 评分维度数组，每项包含name(内容/表达/发展)、score、max(内容和表达各20，发展20)
- highlights: 亮点句子数组（如立意深刻、语言优美的句子）
- errors: 错误修正数组，每项包含text(错误原文)、fix(修正后)、type(错误类型如：错别字/用词不当/语病/标点错误)
- comment: 教师评语（包含优点、不足及改进建议）

请严格按JSON格式返回，不要包含其他内容。`
      : `Please grade the following essay as a professional English teacher:\n\n${text}\n\nReturn JSON format with these fields:\n- score: score (0-20)\n- max: 20\n- dims: array of scoring dimensions, each with name (Content/Grammar/Coherence), score, max\n- highlights: array of highlight sentences\n- errors: array of corrections, each with text (original), fix (corrected), type (error type)\n- comment: teacher comment\n\nReturn strictly JSON format only, no extra content.`;

    const content = await this.request([{ role: "user", content: prompt }]);
    return JSON.parse(content);
  }

  async analyzePaper(fileContent: string, fileName: string): Promise<PaperAnalysisResult> {
    const prompt = `请分析以下试卷内容，识别学生的薄弱知识点：\n\n文件名：${fileName}\n试卷内容：\n${fileContent}\n\n请返回JSON格式，包含以下字段：\n- fileName: 文件名\n- highRisk: { topic: 高风险知识点名称, rate: 错误率(0-100) }\n- total: 题目总数\n- points: 识别到的知识点数量\n- analysis: 分析报告\n- suggestions: 建议数组\n\n请严格按JSON格式返回，不要包含其他内容。`;

    const content = await this.request([{ role: "user", content: prompt }]);
    return JSON.parse(content);
  }
}

class DeepSeekClient implements AiClient {
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model: string = "deepseek-chat") {
    this.apiKey = apiKey;
    this.model = model;
  }

  private async request(messages: { role: string; content: string }[]): Promise<string> {
    const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "AI API 请求失败");
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  async gradeEssay(text: string, language: "chinese" | "english"): Promise<EssayResult> {
    const isChinese = language === "chinese";
    const prompt = isChinese
      ? `请作为资深高中语文老师，按照【高考作文评分标准】批改以下作文：

作文内容：
${text}

评分标准（总分60分）：
一、基础等级（40分）
1. 内容（20分）：题意符合、中心明确、内容充实、思想感情真挚
2. 表达（20分）：文体鲜明、结构完整、语言流畅、标点正确

二、发展等级（20分）：深刻（见解深刻）、丰富（材料丰富）、有文采（语言有文采）、有创意（见解新颖）

请返回JSON格式，包含以下字段：
- score: 总分(0-60)
- max: 60
- dims: 评分维度数组，每项包含name(内容/表达/发展)、score、max(内容和表达各20，发展20)
- highlights: 亮点句子数组（如立意深刻、语言优美的句子）
- errors: 错误修正数组，每项包含text(错误原文)、fix(修正后)、type(错误类型如：错别字/用词不当/语病/标点错误)
- comment: 教师评语（包含优点、不足及改进建议）

请严格按JSON格式返回，不要包含其他内容。`
      : `Please grade the following essay as a professional English teacher:\n\n${text}\n\nReturn JSON format with these fields:\n- score: score (0-20)\n- max: 20\n- dims: array of scoring dimensions, each with name (Content/Grammar/Coherence), score, max\n- highlights: array of highlight sentences\n- errors: array of corrections, each with text (original), fix (corrected), type (error type)\n- comment: teacher comment\n\nReturn strictly JSON format only, no extra content.`;

    const content = await this.request([{ role: "user", content: prompt }]);
    return JSON.parse(content);
  }

  async analyzePaper(fileContent: string, fileName: string): Promise<PaperAnalysisResult> {
    const prompt = `请分析以下试卷内容，识别学生的薄弱知识点：\n\n文件名：${fileName}\n试卷内容：\n${fileContent}\n\n请返回JSON格式，包含以下字段：\n- fileName: 文件名\n- highRisk: { topic: 高风险知识点名称, rate: 错误率(0-100) }\n- total: 题目总数\n- points: 识别到的知识点数量\n- analysis: 分析报告\n- suggestions: 建议数组\n\n请严格按JSON格式返回，不要包含其他内容。`;

    const content = await this.request([{ role: "user", content: prompt }]);
    return JSON.parse(content);
  }
}

class DoubaoClient implements AiClient {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async request(messages: { role: string; content: string }[]): Promise<string> {
    const response = await fetch("https://ark.cn-beijing.volces.com/api/v3/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: "doubao-pro",
        messages,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "AI API 请求失败");
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  async gradeEssay(text: string, language: "chinese" | "english"): Promise<EssayResult> {
    const isChinese = language === "chinese";
    const prompt = isChinese
      ? `请作为资深高中语文老师，按照【高考作文评分标准】批改以下作文：

作文内容：
${text}

评分标准（总分60分）：
一、基础等级（40分）
1. 内容（20分）：题意符合、中心明确、内容充实、思想感情真挚
2. 表达（20分）：文体鲜明、结构完整、语言流畅、标点正确

二、发展等级（20分）：深刻（见解深刻）、丰富（材料丰富）、有文采（语言有文采）、有创意（见解新颖）

请返回JSON格式，包含以下字段：
- score: 总分(0-60)
- max: 60
- dims: 评分维度数组，每项包含name(内容/表达/发展)、score、max(内容和表达各20，发展20)
- highlights: 亮点句子数组（如立意深刻、语言优美的句子）
- errors: 错误修正数组，每项包含text(错误原文)、fix(修正后)、type(错误类型如：错别字/用词不当/语病/标点错误)
- comment: 教师评语（包含优点、不足及改进建议）

请严格按JSON格式返回，不要包含其他内容。`
      : `Please grade the following essay as a professional English teacher:\n\n${text}\n\nReturn JSON format with these fields:\n- score: score (0-20)\n- max: 20\n- dims: array of scoring dimensions, each with name (Content/Grammar/Coherence), score, max\n- highlights: array of highlight sentences\n- errors: array of corrections, each with text (original), fix (corrected), type (error type)\n- comment: teacher comment\n\nReturn strictly JSON format only, no extra content.`;

    const content = await this.request([{ role: "user", content: prompt }]);
    return JSON.parse(content);
  }

  async analyzePaper(fileContent: string, fileName: string): Promise<PaperAnalysisResult> {
    const prompt = `请分析以下试卷内容，识别学生的薄弱知识点：\n\n文件名：${fileName}\n试卷内容：\n${fileContent}\n\n请返回JSON格式，包含以下字段：\n- fileName: 文件名\n- highRisk: { topic: 高风险知识点名称, rate: 错误率(0-100) }\n- total: 题目总数\n- points: 识别到的知识点数量\n- analysis: 分析报告\n- suggestions: 建议数组\n\n请严格按JSON格式返回，不要包含其他内容。`;

    const content = await this.request([{ role: "user", content: prompt }]);
    return JSON.parse(content);
  }
}

let aiClientInstance: AiClient | null = null;

function getEnvVar(name: string): string | undefined {
  if (typeof process !== "undefined" && process.env) {
    return process.env[name];
  }
  try {
    return import.meta.env[name];
  } catch {
    return undefined;
  }
}

export function isAiConfigured(): boolean {
  return !!getEnvVar("VITE_AI_API_KEY");
}

export function getAiProvider(): string {
  return getEnvVar("VITE_AI_PROVIDER") || "openai";
}

export function getAiClient(): AiClient {
  if (aiClientInstance) return aiClientInstance;

  const provider = getEnvVar("VITE_AI_PROVIDER") || "openai";
  const apiKey = getEnvVar("VITE_AI_API_KEY");

  if (!apiKey) {
    return createMockClient();
  }

  switch (provider.toLowerCase()) {
    case "deepseek":
      aiClientInstance = new DeepSeekClient(apiKey);
      break;
    case "doubao":
      aiClientInstance = new DoubaoClient(apiKey);
      break;
    case "openai":
    default:
      aiClientInstance = new OpenAiClient(apiKey);
      break;
  }

  return aiClientInstance;
}

function createMockClient(): AiClient {
  return {
    async gradeEssay(text: string, language: "chinese" | "english"): Promise<EssayResult> {
      const isChinese = language === "chinese";
      return {
        score: isChinese ? 52 : 17,
        max: isChinese ? 60 : 20,
        dims: isChinese
          ? [
              { name: "内容", score: 18, max: 20 },
              { name: "表达", score: 17, max: 20 },
              { name: "发展", score: 17, max: 20 },
            ]
          : [
              { name: "Content", score: 6, max: 7 },
              { name: "Grammar", score: 5, max: 7 },
              { name: "Coherence", score: 6, max: 6 },
            ],
        highlights: isChinese
          ? ["作文开篇新颖，立意明确。", "语言流畅，用词恰当。"]
          : ["Good introduction with clear thesis.", "Well-structured paragraphs."],
        errors: isChinese
          ? [
              { text: "羞于讨论", fix: "勇于讨论", type: "用词" },
              { text: "远行", fix: "旅程", type: "词汇丰富度" },
            ]
          : [
              { text: "Every student are", fix: "Every student is", type: "主谓一致" },
            ],
        comment: isChinese
          ? "立意积极向上，开篇比喻新颖，能够抓住读者。全文思路清晰，情感真挚。建议在论证部分补充具体事例，并注意个别词语的锤炼与句式的多样化。"
          : "Good use of topic sentences and a clear argument structure. Watch out for subject-verb agreement. Try to add one or two vivid examples.",
      };
    },
    async analyzePaper(fileContent: string, fileName: string): Promise<PaperAnalysisResult> {
      return {
        fileName,
        highRisk: { topic: "三角函数公式变形", rate: 60 },
        total: 12,
        points: 5,
        analysis: "根据试卷分析，发现以下薄弱知识点需要重点关注：",
        suggestions: ["复习三角函数基本公式", "加强公式变形练习", "多做综合题巩固"],
      };
    },
  };
}