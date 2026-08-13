// 商家資訊唯一來源：要改公司名/聯絡方式/外部連結/導覽 → 只改這裡。
//
// 【草稿 v0.1】依 scaretimportplan.md 的盤點結果整理，尚未確認的欄位以 TODO 標記，
// 正式建置前需與用戶核對；命名/路徑沿用 credo.com.tw 的 src/lib/site.ts 慣例。
//
// 【重要背景】sca-ret.com 與 credo.com.tw 是同一家公司（詠業商略顧問有限公司）
// 旗下的兩個獨立站台：credo.com.tw 是法律顧問品牌站，sca-ret.com 是退休安心
// 服務品牌站。credo.com.tw 的 site.ts 已有 SCA_URL 常數對外連到 sca-ret.com，
// 這裡對稱地加回 CREDO_URL。兩站目前各自維護一份 site.ts；若之後決定共用同一份
// 公司基本資料，屆時再抽成共用套件（見 scaretimportplan.md 第 7 節待確認事項）。

export const SITE_NAME = "詠業商略顧問有限公司"; // 與 credo.com.tw 一致，出自 sca-ret 頁尾著作權標示
export const SITE_BRAND = "Sca Ret."; // 純文字商標「Sca Ⓡet.」，橘色系粗體圓角字體，圓圈框住 R 是造字設計、無吉祥物插畫（已用實際 logo 圖檔核對）
export const SITE_TAGLINE = "台灣首家意定監護暨遺囑系統"; // 取自 startup.php 主標

// TODO：確認法人關係——connection.php 頁面標示公司名「SCA退休機制LTD.」
// 統編 94062801，與頁尾著作權標示的「詠業商略顧問有限公司」不是同一個名稱，
// 需要用戶確認這是子公司/品牌名，還是網站文案本身尚未統一。
export const BUSINESS_NAME_LEGAL = "SCA退休機制LTD.";
export const BUSINESS_ID = "94062801";

export const CONTACT_EMAIL = "contact@credo.com.tw"; // 與 credo.com.tw 共用聯絡信箱（已確認）
export const CREDO_URL = "https://credo.com.tw/"; // 對稱連回法律顧問品牌站
export const LINE_OFFICIAL_ACCOUNT_NAME = "詠業商略"; // 見服務條款頁（grateful2.php）落款
// TODO：LINE 官方帳號實際加好友連結網址，需確認是否與 credo.com.tw 共用同一個官方帳號
export const LINE_URL = ""; // TODO

// 逐字取自 sca-ret.com 現站頁尾，遷移時不要「修正」成中文慣用格式
export const COPYRIGHT = "COPYRIGHTS 2023 詠業商略顧問有限公司LTD. ALL RIGHTS RESERVED";

// 夥伴品牌（見 startup.php 頁尾三個 logo；名稱已對照使用者提供的 logo 圖檔校正）
// 各品牌識別色（供 Phase 3 設計參考，取自 logo 圖檔）：
// CREDO 是青綠色圓形 C 字標；富盟物業是橘紅色幾何圖標；Zi-Dun 是紫色盾牌圖標＋紫色文字。
export const PARTNERS: { name: string; url?: string }[] = [
  { name: "CREDO 詠業商略·科技法顧", url: CREDO_URL },
  { name: "富盟物業 FULLMAN PROPERTIES CORP" }, // TODO：官網網址未知
  { name: "Zi-Dun 資訊維護網頁設計" }, // TODO：官網網址未知
];

// 主導覽選單（6 項已從截圖確認名稱、順序與對應網址）
export const NAV: { label: string; href: string }[] = [
  { label: "關於SCA", href: "/about/" },
  { label: "啟動退休人生", href: "/program/" },
  { label: "收費方案", href: "/pricing/" },
  // 合作方案對應 retire.php（意定監護「曼陀羅計畫」頁），本階段排除於靜態站範圍外
  // （真實表單邏輯，需另立後端），故無對應 Astro 頁面，先保留導覽項目但連結待補
  { label: "合作方案", href: "/TODO-retire-backend/" }, // TODO：retire.php 尚未建置，需後端規劃完成後才有正式頁面
  { label: "會員專區", href: "/login/" },
  { label: "聯絡我們", href: "/contact/" },
];

// 三種退休模組（名稱取自 login.php 頁面下方的 3 個橙色六角形徽章）
// TODO：確認是否正確對應排除中的 startup2.php／retire.php 實際表單內容，
// 這兩頁本階段排除、暫不遷移，只在此列出名稱供頁面文案引用。
export const RETIREMENT_MODULES: { name: string }[] = [
  { name: "退休不動產管理信託" },
  { name: "資產指定收益交付" },
  { name: "意定監護及防詐機制" },
];

// 認證徽章（about.php 頁尾 6 項；圖檔本身需另外取得授權/來源檔，這裡先列名稱供 alt text 使用）
export const CERTIFICATIONS: string[] = [
  "AICPA SOC",
  "PCI DSS",
  "信託業務專業測驗合格證書",
  "RFC 證書",
  "ISO 27001",
  "Adobe 簽署認證",
];

export function orgSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    alternateName: SITE_BRAND,
    url: "https://sca-ret.com/",
    email: CONTACT_EMAIL,
  };
}
