# X Left Menu Toggle

X/Twitter 页面右上角的「隐藏侧栏 / 显示侧栏」按钮：一键隐藏左侧导航菜单与右侧边栏（搜索框、相关用户、趋势、页脚），让时间线居中。

- 脚本：[x-menu-toggle.user.js](x-menu-toggle.user.js)
- 安装（GitHub）：<https://raw.githubusercontent.com/yidasanqian/userjs/main/x-menu-toggle.user.js>
- 支持站点：`https://x.com/*`、`https://twitter.com/*`
- 环境：Tampermonkey、Violentmonkey 等支持 `GM_getValue` / `GM_setValue` 的脚本管理器

## 安装

1. 安装用户脚本管理器（Tampermonkey / Violentmonkey）。
2. 打开上面的 raw 安装链接，管理器弹出确认框后点「安装」。
3. 刷新 x.com，页面右上角出现按钮。

## 使用

- 点「隐藏侧栏」：隐藏左侧导航菜单和右侧 `sidebarColumn`（含搜索框、相关用户、有什么新鲜事、页脚），时间线自动居中。
- 点「显示侧栏」：恢复原布局。
- 状态写入 `x_left_menu_hidden`，刷新和 SPA 内路由切换后保持。
- 左侧导航的隐藏带 900px 最小宽度限制；窄屏下 X 本身就是收起布局，脚本不介入。

## 已知限制

- 依赖 X 当前的 DOM：左侧 `header[role="banner"]` 内的 Primary 导航，右侧 `[data-testid="sidebarColumn"]`（兜底 `aside[role="complementary"]`）。X 改版后可能需同步选择器。
- 未在真实页面做自动化回归；页面结构变化时以浏览器里实际 DOM 为准。

## 发版

1. 改脚本并递增头部 `@version`（`x.y.z`）。
2. 提交并推送：已安装用户由 `@updateURL` / `@downloadURL` 指向本仓库 raw 文件，管理器按版本号自动更新。
3. Greasy Fork（可选）：在脚本页开启「从 URL 同步」，源地址填本仓库 raw 链接；同步到 Greasy Fork 后由站点自行追加 `update.greasyfork.org` 更新地址。

## 许可

MIT，见 [LICENSE](LICENSE)。