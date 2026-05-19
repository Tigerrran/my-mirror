const fs = require('fs');
const path = require('path');

const ROOT_DIR = __dirname;
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || "";
const SILICONFLOW_API_KEY = process.env.SILICONFLOW_API_KEY || "";
const DEEPSEEK_URL = "https://api.deepseek.com/chat/completions";
const SILICONFLOW_URL = "https://api.siliconflow.cn/v1/images/generations";

const CONTENT_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathname = url.pathname;

    // Health check
    if (req.method === "GET" && pathname === "/api/health") {
      return res.json({
        ok: true,
        deepseekConfigured: Boolean(DEEPSEEK_API_KEY),
        siliconflowConfigured: Boolean(SILICONFLOW_API_KEY),
      });
    }

    // API Routes
    if (req.method === "POST" && pathname === "/api/generate-visual-prompt") {
      requireApiKey(DEEPSEEK_API_KEY, "DEEPSEEK_API_KEY");
      const { vibe, emotions } = req.body;
      assertText(vibe, "vibe");
      const emotionContext = emotions ? `Emotions captured: ${emotions}. ` : "";

      const promptData = await proxyJson(DEEPSEEK_URL, DEEPSEEK_API_KEY, {
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: "Create an image prompt in soft crayon style. Base the scene directly on what the user describes. Keep it simple and literal - if they mention a desk, show a desk. If they mention walking, show someone walking. Avoid adding your own interpretation. Human figures should be distant silhouettes or not at all. If humans appear, they must be Chinese/Asian. Under 60 words in English.",
          },
          { role: "user", content: `${emotionContext}User's description: ${vibe.trim()}` },
        ],
      });

      const visualPrompt = promptData?.choices?.[0]?.message?.content?.trim();
      if (!visualPrompt) {
        throw createHttpError(502, "DeepSeek did not return a visual prompt.");
      }
      return res.json({ visualPrompt });
    }

    if (req.method === "POST" && pathname === "/api/generate-portrait") {
      requireApiKey(SILICONFLOW_API_KEY, "SILICONFLOW_API_KEY");
      const { prompt } = req.body;
      assertText(prompt, "prompt");

      const imageData = await proxyJson(SILICONFLOW_URL, SILICONFLOW_API_KEY, {
        model: "Kwai-Kolors/Kolors",
        prompt: prompt.trim(),
        width: 1024,
        height: 1024,
        num_inference_steps: 25,
      });

      const imageUrl = imageData?.images?.[0]?.url;
      if (!imageUrl) {
        throw createHttpError(502, "SiliconFlow did not return an image URL.");
      }
      return res.json({ imageUrl });
    }

    if (req.method === "POST" && pathname === "/api/modify-portrait") {
      requireApiKey(SILICONFLOW_API_KEY, "SILICONFLOW_API_KEY");
      requireApiKey(DEEPSEEK_API_KEY, "DEEPSEEK_API_KEY");
      const { imageUrl, positiveText } = req.body;
      assertText(imageUrl, "imageUrl");
      assertText(positiveText, "positiveText");

      const promptRes = await proxyJson(DEEPSEEK_URL, DEEPSEEK_API_KEY, {
        model: "deepseek-chat",
        messages: [{
          role: "system",
          content: "You create image editing prompts that transform negative scenes to positive ones."
        }, {
          role: "user",
          content: `Transform this image to a positive version while keeping the exact same scene composition and objects.

Changes:
- Make it bright and sunny (if dark/night)
- Make it warm and pleasant (if cold)
- Make it clear and peaceful (if stormy/messy)
- Add soft warm light and gentle colors

Style: Keep the original art style.

Describe in 50 words, English only:`
        }],
      });

      const editPrompt = promptRes?.choices?.[0]?.message?.content?.trim();
      if (!editPrompt) {
        throw createHttpError(502, "Failed to generate edit prompt.");
      }

      const imageData = await proxyJson(SILICONFLOW_URL, SILICONFLOW_API_KEY, {
        model: "Qwen/Qwen-Image-Edit",
        prompt: editPrompt,
        image: imageUrl,
        strength: 0.4,
      });

      const positiveImageUrl = imageData?.images?.[0]?.url;
      if (!positiveImageUrl) {
        throw createHttpError(502, "Image edit failed.");
      }
      return res.json({ imageUrl: positiveImageUrl });
    }

    if (req.method === "POST" && pathname === "/api/analyze-theater") {
      requireApiKey(DEEPSEEK_API_KEY, "DEEPSEEK_API_KEY");
      const { input } = req.body;
      assertText(input, "input");

      const systemPrompt = `你是一位精通对话自我理论(DST)的心理专家。
请根据用户的冲突，识别出2-4个具象的子人格视角。
要求：
1. 角色名：结合情境起贴切的中文名（如：完美主义设计师、务实的程序员）。
2. 视角：必须代表截然不同的利益诉求。
3. 滤镜分配：必须严格使用以下三个之一——pioneer(激进/情感), navigator(理性/硬核), observer(全局/虚化)。
4. 严禁编造没有事实依据的具体数字、百分比或统计数据。如有需要，使用定性描述（如"很多""部分""一些"）而非定量数据。
5. 严禁编造任何未经用户确认的个人情况（如技能水平、年龄、背景、经历等），只基于用户输入的原始内容进行分析。
格式：【名字|图标|滤镜类型】内容
注意：滤镜类型必须是pioneer、navigator或observer之一，不要使用其他词汇`;

      const data = await proxyJson(DEEPSEEK_URL, DEEPSEEK_API_KEY, {
        model: "deepseek-chat",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: input.trim() },
        ],
        temperature: 1.1,
      });

      const content = data?.choices?.[0]?.message?.content?.trim();
      if (!content) {
        throw createHttpError(502, "DeepSeek did not return theater analysis.");
      }
      return res.json({ content });
    }

    if (req.method === "POST" && pathname === "/api/summarize-theater") {
      requireApiKey(DEEPSEEK_API_KEY, "DEEPSEEK_API_KEY");
      const { lastPositions } = req.body;
      assertText(lastPositions, "lastPositions");

      const summaryPrompt = `针对以下几种内在声音的冲突：
${lastPositions.trim()}

请先给出一个引导性的段落（约100字），引导用户反思：
- 这三条声音里，哪一个在此刻最响？哪一个被你暗暗压制了？
- 可以先写下它们各自的诉求，再思考如何在接下来的行动中让它们达成协作而不是互相消耗。

然后给出整合建议：
1. 拒绝文艺辞藻和抽象鸡汤，不要写得像诗。
2. 深度识别各方声音中的"核心合理诉求"。
3. 给出一个包含3点具体的、可落地的、能够兼顾各方的行动策略。
4. 语气要专业、理性且果断，字数总计300字内。使用中文。`;

      const data = await proxyJson(DEEPSEEK_URL, DEEPSEEK_API_KEY, {
        model: "deepseek-chat",
        messages: [{ role: "user", content: summaryPrompt }],
      });

      const content = data?.choices?.[0]?.message?.content?.trim();
      if (!content) {
        throw createHttpError(502, "DeepSeek did not return summary content.");
      }
      return res.json({ content });
    }

    if (req.method === "POST" && pathname === "/api/positive-rewrite") {
      requireApiKey(DEEPSEEK_API_KEY, "DEEPSEEK_API_KEY");
      const { input } = req.body;
      assertText(input, "input");

      const rewritePrompt = `改写为积极表达，保持第一人称和句子数量一致，只输出改写内容，用中文：
${input.trim()}`;

      const data = await proxyJson(DEEPSEEK_URL, DEEPSEEK_API_KEY, {
        model: "deepseek-chat",
        max_tokens: 500,
        messages: [{ role: "user", content: rewritePrompt }],
      });

      const content = data?.choices?.[0]?.message?.content?.trim();
      if (!content) {
        throw createHttpError(502, "DeepSeek did not return rewritten content.");
      }
      return res.json({ content });
    }

    // Serve static files
    return serveStaticFile(pathname, res);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({ error: error.message || "Server error" });
  }
}

function serveStaticFile(requestPath, res) {
  const normalizedPath = requestPath === "/" ? "index.html" : path.normalize(requestPath).replace(/^([/\\])+/, "");
  const filePath = path.join(ROOT_DIR, normalizedPath);

  if (!filePath.startsWith(ROOT_DIR)) {
    return res.status(403).json({ error: "Forbidden" });
  }

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    return res.status(404).json({ error: "File not found" });
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = CONTENT_TYPES[ext] || "application/octet-stream";

  res.setHeader('Content-Type', contentType);
  const content = fs.readFileSync(filePath);
  return res.send(content);
}

async function proxyJson(url, apiKey, payload) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data?.error?.message || data?.message || `Upstream request failed with status ${response.status}.`;
    throw createHttpError(response.status, message);
  }
  return data;
}

function requireApiKey(value, name) {
  if (!value) {
    throw createHttpError(500, `${name} is not configured.`);
  }
}

function assertText(value, fieldName) {
  if (typeof value !== "string" || !value.trim()) {
    throw createHttpError(400, `${fieldName} is required.`);
  }
}

function createHttpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}