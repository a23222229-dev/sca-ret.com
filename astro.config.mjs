// @ts-check
// sca-ret.com — 草稿 v0.1，部署設定沿用 credo.com.tw 的 GitHub Pages 慣例。
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// 部署設定：預設為 GitHub Pages 專案頁（子路徑）。
// 網域確定後，比照 credo.com.tw 的作法：設 repo 變數 CUSTOM_DOMAIN=sca-ret.com
// （deploy.yml 會自動改帶 BASE_PATH=/ 與 SITE_URL，並寫入 public/CNAME）。
const BASE = process.env.BASE_PATH ?? '/sca-ret.com';
const SITE = process.env.SITE_URL ?? 'https://a23222229-dev.github.io';

// rehype 外掛：把 Markdown 內以 "/" 開頭的內部連結/圖片加上 base 前綴。
// 目前 sca-ret 尚無 content collection（無 insights 類頁面），這段先保留、
// 等未來若新增 Markdown 內容（例如公告/借鏡文）時再啟用，寫法與 credo.com.tw 相同。
function rehypeBasePrefix() {
  const prefix = BASE === '/' ? '' : BASE;
  const fix = (node) => {
    if (prefix && node.type === 'element' && node.properties) {
      for (const attr of ['href', 'src']) {
        const v = node.properties[attr];
        if (typeof v === 'string' && v.startsWith('/') && !v.startsWith('//') && !v.startsWith(prefix + '/')) {
          node.properties[attr] = prefix + v;
        }
      }
    }
    if (node.children) node.children.forEach(fix);
  };
  return (tree) => fix(tree);
}

export default defineConfig({
  site: SITE,
  base: BASE,
  trailingSlash: 'always',
  integrations: [sitemap()],
  markdown: {
    rehypePlugins: [rehypeBasePrefix],
  },
});
