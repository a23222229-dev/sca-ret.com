// 收費方案資料（草稿，逐項取自 billing.php 盤點結果，見 scaretimportplan.md 4.2）
// 目的：把純表格內容資料化，讓 /pricing/ 頁面用同一個元件渲染三張表，
// 符合設計守門規則──元件不寫死內容，內容改這裡就好。

export const PLAN_TIERS = ["契約制定", "退休管家", "訂約＋退休管家"] as const;
export type PlanTier = (typeof PLAN_TIERS)[number];

// 表一：協定意定監護／自書遺囑／安養信託
export const CONTRACT_PLAN = {
  note: "規費另計，不動產民事信託收費相同",
  // null 代表原表格顯示「—」（不提供）
  pricing: [28000, null, 23000] as [number, null | number, number],
  items: [
    "依民法規定相關條文辦理",
    "律師訂約負擔保密義務",
    "法律契約加密封存",
    "戶政行政約定",
    "日常事項約定",
    "社會福利約定",
    "支出管理約定",
    "不動產管理約定",
    "存摺印章保管約定",
    "居住安排約定",
    "照護機構安排約定",
    "日常醫療約定",
  ].map((label) => ({ label, included: [true, false, true] as [boolean, boolean, boolean] })),
};

// 表二：線上秘書服務
export const SECRETARY_SERVICE = {
  items: [
    { label: "樻檔小祕書", note: "以月計／告平信／電話通知／法律文書不代收" },
    { label: "帳務小祕書", note: "以月計／違艱繳費／線上款項代繳，以10筆為限" },
    { label: "行政小祕書", note: "以月計／電子契約生成／可第三方線上簽署，以10筆為限" },
  ].map((item) => ({ ...item, included: [false, true, true] as [boolean, boolean, boolean] })),
};

// 表三：退休/監護項目（依 SCA 委任 A/B/C 型／月）
export const GUARDIANSHIP_TIERS = ["SCA委任A型／月", "SCA委任B型／月", "SCA委任C型／月"] as const;
export const GUARDIANSHIP_PLAN = {
  items: [
    { label: "財產收益", included: [true, true, true] as [boolean, boolean, boolean] },
    { label: "信託管理", included: [true, true, true] as [boolean, boolean, boolean] },
    { label: "機構代理", included: [false, true, true] as [boolean, boolean, boolean] },
    { label: "樂齡安排", included: [false, false, true] as [boolean, boolean, boolean] },
  ],
};
