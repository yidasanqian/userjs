# X Sidebar Toggle

X/Twitter 页面右上角的「隐藏侧栏 / 显示侧栏」按钮：一键隐藏左侧导航菜单与右侧边栏（搜索框、相关用户、趋势、页脚），让时间线居中。

- 脚本：[x-sidebar-toggle.user.js](x-sidebar-toggle.user.js)
- 安装（GitHub raw）：<https://raw.githubusercontent.com/yidasanqian/userjs/main/x-sidebar-toggle.user.js>
- 安装（jsDelivr 镜像，国内直连可用）：<https://cdn.jsdelivr.net/gh/yidasanqian/userjs@18ddc7a/x-sidebar-toggle.user.js>
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
- 状态写入 `x_sidebar_hidden`（`GM_setValue`，不可用时退回 `localStorage`），刷新和 SPA 内路由切换后保持。
- 左侧导航的隐藏带 900px 最小宽度限制；窄屏下 X 本身就是收起布局，脚本不介入。

## 已知限制

- X 的 Web 客户端已换代（`x-web`）：`primaryColumn` / `sidebarColumn` / `SearchBox_Search_Input` / `header[role="banner"]` 这组 testid 与语义节点在部分账号上已不存在（实测整页 `[data-testid]` 为空），v1.5.0 起不再依赖它们。定位方式改为：取 `main` 主列，沿祖先逐层按几何位置找列 —— 右边缘贴着主列左侧的兄弟元素是左栏，左边缘贴着主列右侧的兄弟元素是右栏；老布局若仍有 `header[role="banner"]` / `[data-testid="sidebarColumn"]`，优先采信。
- X 用 `grid` 定宽轨道摆放主列（实测 `600px 680px`），只加 `margin-inline: auto` 不会动。隐藏时脚本把主列祖先逐层放开为 `width: 100%`，并把轨道折叠成 `minmax(0, 1fr)` 后居中，否则右栏留下的空轨道会把主列顶在左侧。
- 隐藏状态下被隐藏的列量出来是 0×0，重新解析会误判成「没有侧栏」并清掉标记。脚本在解析期间临时摘掉隐藏类、同一任务内再挂回去（不产生中间帧），所以隐藏状态里切路由、重渲染不会让侧栏自己冒出来。
- 右栏常晚于时间线渲染，未命中时按 400ms 节流重试，不缓存半成品布局；只有左右两栏都定位到时才改容器宽度。
- 控制台执行 `__xSidebarToggle.debug()` 可查看当前定位结果（`main` / `left` / `right` / 已标记元素）；页面再变结构时先看这个输出。
- 验证范围：x.com 的 `x-web` 页面（未登录、1400px 桌面宽）与合成夹具（老 `testid` 布局）上跑过隐藏、居中、复原；登录态主页没有自动化回归，结构再变以浏览器实际 DOM 为准。

## 发版

1. 改脚本并递增头部 `@version`（`x.y.z`）。
2. 提交并推送：已安装用户由 `@updateURL` / `@downloadURL` 指向本仓库 raw 文件，管理器按版本号自动更新。
3. Greasy Fork（可选）：在脚本页开启「从 URL 同步」，源地址填本仓库 raw 链接；同步到 Greasy Fork 后由站点自行追加 `update.greasyfork.org` 更新地址。

## 许可

MIT，见 [LICENSE](LICENSE)。