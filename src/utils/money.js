export const money = (n) =>
  typeof n === "number" ? n.toLocaleString("ko-KR") + "원" : n;
