import { aiCheckSensitive } from "./ai";
import { addBlockedWords, containsBlocked } from "./blockedWords";

export async function evaluateContent(
  text: string
): Promise<{ blocked: boolean; reason: string }> {
  if (containsBlocked(text)) return { blocked: true, reason: "" };
  const ai = await aiCheckSensitive(text);
  if (ai?.sensitive) {
    // 把 AI 识别出的具体敏感词加入本地词表（只加词，不加整句）
    if (ai.words.length > 0) {
      addBlockedWords(ai.words);
    }
    const reason = ai.category ? `${ai.category}：${ai.reason}` : ai.reason;
    return { blocked: true, reason: reason || "包含不合适的内容" };
  }
  return { blocked: false, reason: "" };
}
