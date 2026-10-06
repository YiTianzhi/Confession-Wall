const NICKNAMES = [
  "小鹿", "晚风", "星光", "橙子", "桃子", "云朵", "海盐",
  "汽水", "月亮", "柠檬", "小熊", "樱花", "薄荷", "银河",
  "清晨", "萤火", "纸飞机", "蒲公英", "南风", "北岛",
];

export function randomNickname(): string {
  return "匿名" + NICKNAMES[Math.floor(Math.random() * NICKNAMES.length)];
}
