import fs from "fs";
import path from "path";

// 文件丢失时的兜底词表
const DEFAULT_WORDS = [
  "傻逼", "妈的", "去死", "滚蛋", "垃圾",
  "色情", "裸照", "约炮", "嫖", "赌博", "毒品",
  "自杀", "砍死", "弄死", "人肉",
];

const FILE_PATH = path.join(process.cwd(), "data", "blocked-words.json");

let cache: string[] | null = null;

function loadWords(): string[] {
  if (cache) return cache;
  try {
    if (fs.existsSync(FILE_PATH)) {
      const parsed = JSON.parse(fs.readFileSync(FILE_PATH, "utf-8"));
      if (Array.isArray(parsed)) {
        cache = parsed.map((w) => String(w).trim()).filter(Boolean);
        return cache;
      }
    }
  } catch (error) {
    console.error("读取敏感词表失败：", error);
  }
  cache = [...DEFAULT_WORDS];
  return cache;
}

function saveWords(words: string[]): void {
  try {
    fs.mkdirSync(path.dirname(FILE_PATH), { recursive: true });
    fs.writeFileSync(FILE_PATH, JSON.stringify(words, null, 2), "utf-8");
  } catch (error) {
    console.error("保存敏感词表失败：", error);
  }
}

export function getBlockedWords(): string[] {
  return loadWords();
}

export function containsBlocked(text: string): boolean {
  const lowered = text.toLowerCase();
  if (getBlockedWords().some((word) => lowered.includes(word.toLowerCase()))) {
    return true;
  }
  // 手机号也视为需要拦截的敏感信息
  return /1[3-9]\d{9}/.test(text);
}

// 只接受「单个词」：去空白、长度不超过 16、不含空格（避免把整句当词加入）
function normalizeWord(word: string): string | null {
  const value = String(word || "").trim();
  if (!value || value.length > 16 || /\s/.test(value)) return null;
  return value;
}

export function addBlockedWords(words: string[]): void {
  const current = new Set(getBlockedWords().map((w) => w.toLowerCase()));
  let changed = false;

  for (const raw of words) {
    const word = normalizeWord(raw);
    if (word && !current.has(word.toLowerCase())) {
      current.add(word.toLowerCase());
      changed = true;
    }
  }

  if (changed) {
    cache = Array.from(current);
    saveWords(cache);
  }
}
