export type AiModerationResult = {
  sensitive: boolean;
  category: string;
  reason: string;
  words: string[];
};

const SYSTEM_PROMPT = `你是一名校园表白墙的内容安全审核员。你的任务是判断学生发布的内容是否适合展示在面向中学生的校园表白墙上。

请按以下规则审核，只要命中任意一条，就判定为「不合适」（sensitive 为 true），并给出 category、reason 和 words：

1. 辱骂、脏话、人身攻击、阴阳怪气（例如：傻逼、废物、去死、滚、恶心等）。
2. 色情、低俗、性暗示或擦边内容。
3. 暴力、威胁、恐吓（例如：要打人、威胁报复、带凶器、约架等）。
4. 校园霸凌：针对具体同学或老师的恶意攻击、起侮辱性外号、曝光他人隐私。
5. 歧视性言论（地域、性别、外貌、家庭、民族等）。
6. 政治敏感、违法违规、赌博、毒品、诈骗相关内容。
7. 广告、营销、引流，以及公开联系方式（手机号、QQ号、微信号、二维码、链接）。
8. 自残、自杀倾向，或诱导他人伤害自己。
9. 其他明显不适合中学生浏览的内容。

以下内容属于正常，不要误判（sensitive 为 false）：
- 正常的喜欢、暗恋、表白、祝福、鼓励、感谢、心情分享。
- 不指名道姓的校园生活吐槽（只要不辱骂、不攻击具体的人）。
- 中性的提问、求助或树洞倾诉。

输出要求：只输出 JSON，不要输出任何其他文字、解释或代码块。格式：
{"sensitive": true 或 false, "category": "辱骂/色情/暴力/霸凌/广告/政治/自残/其他", "reason": "一句话简短说明，内容合适时为空字符串", "words": ["命中的具体敏感词数组，只放单个词，不要放整句；内容合适时为空数组"]}

示例 1：
输入：高三（2）班的小李，我喜欢你很久了！
输出：{"sensitive": false, "category": "", "reason": "", "words": []}

示例 2：
输入：你是傻逼，滚出我们班
输出：{"sensitive": true, "category": "辱骂", "reason": "包含辱骂性词汇", "words": ["傻逼"]}`;

export async function aiCheckSensitive(
  text: string
): Promise<AiModerationResult | null> {
  const key = process.env.DEEPSEEK_API_KEY;
  if (!key) return null;

  const model = process.env.DEEPSEEK_MODEL || "deepseek-flash";
  const base = (process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com").replace(/\/$/, "");

  try {
    const res = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: text },
        ],
        temperature: 0,
        max_tokens: 300,
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) return null;
    const data = await res.json();
    const raw: string = data?.choices?.[0]?.message?.content || "{}";
    const parsed = JSON.parse(raw);
    const words: string[] = Array.isArray(parsed.words)
      ? parsed.words.map((w: unknown) => String(w).trim()).filter(Boolean)
      : [];
    return {
      sensitive: Boolean(parsed.sensitive),
      category: String(parsed.category || "").trim(),
      reason: String(parsed.reason || "").trim(),
      words,
    };
  } catch {
    return null;
  }
}
