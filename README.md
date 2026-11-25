# X Sidebar Toggle

X/Twitter 页面右上角的「隐藏侧栏 / 显示侧栏」按钮：一键隐藏左侧导航菜单与右侧边栏（搜索框、相关用户、趋势、页脚），让时间线居中。

- 脚本：[x-sidebar-toggle.user.js](x-sidebar-toggle.user.js)
- 安装（GitHub raw）：<https://raw.githubusercontent.com/yidasanqian/userjs/main/x-sidebar-toggle.user.js>
- 安装（jsDelivr 镜像，国内直连可用）：<https://cdn.jsdelivr.net/gh/yidasanqian/userjs@3cc473f/x-sidebar-toggle.user.js>
- 支持站点：`https://x.com/*`、`https://twitter.com/*`
- 环境：Tampermonkey、Violentmonkey 等支持 `GM_getValue` / `GM_setValue` 的脚本管理器

> 实测 `raw.githubusercontent.com` 在国内直连会被重置（本机需代理才能 200）；`cdn.jsdelivr.net` 直连正常。脚本头部的 `@updateURL` / `@downloadURL` 仍指向 raw，镜像链接仅用于首次安装。
>
> 镜像用 **commit SHA 固定**（示例 `@3cc473f`）：raw 的 CDN 缓存约 5 分钟刷新，jsDelivr 的 `@main` 分支缓存可达 12 小时，发版后短时间内拿不到新代码；每次发版把哈希换成新的提交即可立刻生效。

## 安装

1. 安装用户脚本管理器（Tampermonkey / Violentmonkey）。
2. 打开上面的 raw 安装链接，管理器弹出确认框后点「安装」。
3. 刷新 x.com，页面右上角出现按钮。

## 使用

- 页面右上角是一个胶囊形按钮组：左边图标切换侧栏，右边图标跳转 GitHub 源码仓库；悬停显示深色提示（隐藏侧栏 / 显示侧栏 / GitHub 源码）。
- 点左侧图标「隐藏侧栏」：隐藏左侧导航菜单和右侧边栏（含搜索框、相关用户、有什么新鲜事、页脚），时间线自动居中；按下态以蓝色底高亮。
- 再点一次「显示侧栏」：恢复原布局。
- 状态写入 `x_sidebar_hidden`，刷新和 SPA 内路由切换后保持。
- 左侧导航的隐藏带 900px 最小宽度限制；窄屏下 X 本身就是收起布局，脚本不介入。

## 已知限制

- 依赖 X 的 DOM 结构，不依赖混淆类名：右栏取右侧半屏内的 `aside`，左栏取同一 flex 行内包含 `nav` 的那一列，命中后给元素打 `data-x-toggle-role="left|right|row|content|main"` 标记，样式全部作用在标记上。旧版 `[data-testid="sidebarColumn"]` / `header[role="banner"]` 选择器保留兜底。
- X 若再次改动布局，优先用浏览器实际 DOM 校验上面这组结构假设，而不是追加类名选择器。
- 未在真实页面做自动化回归；页面结构变化时以浏览器里实际 DOM 为准。

## 发版

1. 改脚本并递增头部 `@version`（`x.y.z`）。
2. 提交并推送：已安装用户由 `@updateURL` / `@downloadURL` 指向本仓库 raw 文件，管理器按版本号自动更新。
3. Greasy Fork（可选）：在脚本页开启「从 URL 同步」，源地址填本仓库 raw 链接；同步到 Greasy Fork 后由站点自行追加 `update.greasyfork.org` 更新地址。

## 许可

MIT，见 [LICENSE](LICENSE)。