// ==UserScript==
// @name         X Sidebar Toggle
// @name:zh-CN   X 侧栏显示隐藏
// @namespace    https://github.com/yidasanqian/userjs
// @version      1.5.0
// @description  Show or hide the left navigation menu and the right sidebar on X/Twitter.
// @description:zh-CN 在 X/Twitter 页面右上角添加按钮，一键显示或隐藏左侧菜单与右侧边栏，让时间线更干净。
// @author       yidasanqian
// @license      MIT
// @homepageURL  https://github.com/yidasanqian/userjs
// @supportURL   https://github.com/yidasanqian/userjs/issues
// @downloadURL  https://raw.githubusercontent.com/yidasanqian/userjs/main/x-sidebar-toggle.user.js
// @updateURL    https://raw.githubusercontent.com/yidasanqian/userjs/main/x-sidebar-toggle.user.js
// @match        https://x.com/*
// @match        https://twitter.com/*
// @run-at       document-idle
// @grant        GM_getValue
// @grant        GM_setValue
// @noframes
// ==/UserScript==

(function () {
  'use strict';

  const STORAGE_KEY = 'x_sidebar_hidden';
  const HIDDEN_CLASS = 'x-sidebar-hidden';
  const ROLE_ATTR = 'data-x-toggle-role';
  const WIDGET_ID = 'x-sidebar-toggle-widget';
  const STYLE_ID = 'x-sidebar-toggle-style';
  const REPO_URL = 'https://github.com/yidasanqian/userjs';
  const MIN_DESKTOP_WIDTH = 900;
  const RESOLVE_MIN_INTERVAL = 400;
  const MAX_WALK_DEPTH = 6;

  const ICONS = {
    sidebar:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5.5h16a1.5 1.5 0 0 1 0 3H4a1.5 1.5 0 0 1 0-3Zm0 4.75h10a1.5 1.5 0 0 1 0 3H4a1.5 1.5 0 0 1 0-3Zm0 4.75h16a1.5 1.5 0 0 1 0 3H4a1.5 1.5 0 0 1 0-3Z"/></svg>',
    github:
      '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z"/></svg>',
  };

  // 脚本管理器提供 GM 存储时用它，缺权限或换成原生用户脚本时退回 localStorage，
  // 否则读写都会抛错，点击按钮永远只会在 false/true 之间空转。
  function readHiddenState() {
    try {
      if (typeof GM_getValue === 'function') {
        return Boolean(GM_getValue(STORAGE_KEY, false));
      }
    } catch (_) {
      /* fallthrough */
    }

    try {
      return window.localStorage.getItem(STORAGE_KEY) === '1';
    } catch (_) {
      return false;
    }
  }

  function writeHiddenState(hidden) {
    try {
      if (typeof GM_setValue === 'function') {
        GM_setValue(STORAGE_KEY, Boolean(hidden));
      }
    } catch (_) {
      /* fallthrough */
    }

    try {
      window.localStorage.setItem(STORAGE_KEY, hidden ? '1' : '0');
    } catch (_) {
      return;
    }
  }

  function ensureStyle() {
    if (document.getElementById(STYLE_ID)) {
      return;
    }

    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
body.${HIDDEN_CLASS} [${ROLE_ATTR}="left"],
body.${HIDDEN_CLASS} [${ROLE_ATTR}="right"] {
  display: none !important;
}

@media (min-width: ${MIN_DESKTOP_WIDTH}px) {
  /* 主列到外层行容器逐层放开宽度；X 现在用 grid 定位主列（父容器是 600px 定宽轨道），
     光给 main 加自动外边距不会动，得把轨道折叠成单列再居中 */
  body.${HIDDEN_CLASS} [${ROLE_ATTR}="expand"] {
    width: 100% !important;
    justify-content: center !important;
    justify-items: center !important;
    grid-template-columns: minmax(0, 1fr) !important;
  }

  body.${HIDDEN_CLASS} [${ROLE_ATTR}="primary"] {
    margin-inline: auto !important;
  }
}

#${WIDGET_ID} {
  position: fixed;
  right: max(16px, env(safe-area-inset-right, 0px));
  top: calc(16px + env(safe-area-inset-top, 0px));
  z-index: 2147483647;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px;
  border: 1px solid rgba(15, 20, 25, 0.1);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 4px 16px rgba(15, 20, 25, 0.16);
  backdrop-filter: blur(10px);
}

#${WIDGET_ID} .x-sidebar-toggle-item {
  position: relative;
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  padding: 0;
  border: 0;
  border-radius: 10px;
  background: transparent;
  color: rgb(15, 20, 25);
  cursor: pointer;
  text-decoration: none;
  transition: background-color 120ms ease, color 120ms ease;
}

#${WIDGET_ID} .x-sidebar-toggle-item:hover {
  background: rgba(15, 20, 25, 0.08);
}

#${WIDGET_ID} .x-sidebar-toggle-item:focus-visible {
  outline: 2px solid rgb(29, 155, 240);
  outline-offset: 1px;
}

#${WIDGET_ID} .x-sidebar-toggle-item[aria-pressed="true"] {
  background: rgba(29, 155, 240, 0.14);
  color: rgb(29, 155, 240);
}

#${WIDGET_ID} .x-sidebar-toggle-item svg {
  width: 20px;
  height: 20px;
  fill: currentColor;
  pointer-events: none;
}

/* 悬停提示，深色胶囊样式参照 X 自带 tooltip */
#${WIDGET_ID} .x-sidebar-toggle-item::after {
  content: attr(data-tip);
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  padding: 5px 9px;
  border-radius: 8px;
  background: rgba(24, 24, 27, 0.95);
  color: rgb(250, 250, 252);
  font: 600 12px/1.2 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  white-space: nowrap;
  opacity: 0;
  transform: translateY(-3px);
  transition: opacity 120ms ease, transform 120ms ease;
  pointer-events: none;
}

#${WIDGET_ID} .x-sidebar-toggle-item:hover::after,
#${WIDGET_ID} .x-sidebar-toggle-item:focus-visible::after {
  opacity: 1;
  transform: translateY(0);
}

@media (prefers-color-scheme: dark) {
  #${WIDGET_ID} {
    border-color: rgba(239, 243, 244, 0.16);
    background: rgba(22, 24, 28, 0.92);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
  }

  #${WIDGET_ID} .x-sidebar-toggle-item {
    color: rgb(239, 243, 244);
  }

  #${WIDGET_ID} .x-sidebar-toggle-item:hover {
    background: rgba(239, 243, 244, 0.1);
  }

  #${WIDGET_ID} .x-sidebar-toggle-item[aria-pressed="true"] {
    background: rgba(29, 155, 240, 0.22);
    color: rgb(120, 192, 247);
  }
}
`;

    document.head.appendChild(style);
  }

  // 新版 X（x-web 客户端）已经删掉 primaryColumn / sidebarColumn / SearchBox_Search_Input
  // 这组 testid，只剩下 main 与 aside 的列结构，所以左栏、右栏一律按几何位置在 main 的
  // 兄弟元素里找：左边缘贴着 main 左侧的是左栏，右边缘贴着 main 右侧的是右栏。
  // 旧布局若还留着语义化节点，优先采信 testid / header[role="banner"]。
  function isShown(element) {
    if (!element || !element.isConnected) {
      return false;
    }

    const rect = element.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  function findMain() {
    return document.querySelector('main[role="main"]') || document.querySelector('main');
  }

  function findLayout() {
    const main = findMain();
    if (!main || !isShown(main)) {
      return null;
    }

    const mainRect = main.getBoundingClientRect();
    if (mainRect.width < 160) {
      return null;
    }

    let left = null;
    let right = null;

    const banner = document.querySelector('header[role="banner"]');
    if (banner && isShown(banner) && !banner.contains(main) && banner.getBoundingClientRect().right <= mainRect.left + 2) {
      left = banner;
    }

    const sidebar = document.querySelector('[data-testid="sidebarColumn"]');
    if (sidebar && isShown(sidebar) && !sidebar.contains(main) && sidebar.getBoundingClientRect().left >= mainRect.right - 2) {
      right = sidebar;
    }

    const expand = [];
    let node = main.parentElement;

    for (let depth = 0; node && node !== document.body && depth < MAX_WALK_DEPTH; depth += 1) {
      expand.push(node);

      const siblings = [...node.children].filter(
        (element) =>
          element !== main &&
          !element.contains(main) &&
          isShown(element) &&
          window.getComputedStyle(element).position !== 'fixed',
      );

      if (!right) {
        right = siblings.find((element) => element.getBoundingClientRect().left >= mainRect.right - 2) || null;
      }

      if (!left) {
        left = siblings.find((element) => element.getBoundingClientRect().right <= mainRect.left + 2) || null;
      }

      if (left && right) {
        break;
      }

      node = node.parentElement;
    }

    return { main, left, right, expand };
  }

  function mark(element, role) {
    if (!element) {
      return null;
    }

    if (element.getAttribute(ROLE_ATTR) !== role) {
      element.setAttribute(ROLE_ATTR, role);
    }

    return element;
  }

  function clearStaleRoles(keep) {
    for (const element of document.querySelectorAll(`[${ROLE_ATTR}]`)) {
      if (!keep.includes(element)) {
        element.removeAttribute(ROLE_ATTR);
      }
    }
  }

  let layout = null;
  let layoutRoles = [];
  let lastResolveAt = 0;
  let warnedMissing = false;

  function applyRoles(next) {
    const roles = [];
    const assign = (element, role) => {
      if (element && element.isConnected) {
        mark(element, role);
        roles.push(element);
      }
    };

    assign(next.left, 'left');
    assign(next.right, 'right');
    assign(next.main, 'primary');

    // 只有左右两栏都定位到时才动容器宽度：否则被收紧的轨道会把仍在显示的
    // 右栏挤到主列下面。
    if (next.left && next.right) {
      for (const element of next.expand) {
        if (element.isConnected) {
          mark(element, 'expand');
          roles.push(element);
        }
      }
    }

    clearStaleRoles(roles);
    layoutRoles = roles;
    layout = next;
  }

  function layoutComplete() {
    return Boolean(layout && layout.left && layout.right && layoutRoles.length && layoutRoles.every((element) => element.isConnected));
  }

  // 隐藏中的列量出来是 0x0，直接解析会把 left/right 判成不存在并清掉标记，
  // 于是「隐藏状态下再解析一次」会让侧栏重新冒出来。解析期间先摘掉隐藏类，
  // 同一个任务里再挂回去，不会产生中间帧。
  function measureVisible(fn) {
    const body = document.body;
    const wasHidden = body.classList.contains(HIDDEN_CLASS);
    if (wasHidden) {
      body.classList.remove(HIDDEN_CLASS);
    }

    try {
      return fn();
    } finally {
      if (wasHidden) {
        body.classList.add(HIDDEN_CLASS);
      }
    }
  }

  function resolveLayout(force) {
    if (!document.body) {
      return;
    }

    if (!force && layoutComplete()) {
      return;
    }

    const now = Date.now();
    if (!force && now - lastResolveAt < RESOLVE_MIN_INTERVAL) {
      return;
    }
    lastResolveAt = now;

    const next = measureVisible(findLayout);
    if (!next) {
      layout = null;
      layoutRoles = [];
      if (!warnedMissing && document.readyState === 'complete') {
        warnedMissing = true;
        console.warn('[X Sidebar Toggle] 未找到 main 列，页面结构可能又变了；可在控制台执行 __xSidebarToggle.debug() 查看定位结果。');
      }
      return;
    }

    applyRoles(next);
  }

  function updateToggle(toggle, hidden) {
    const label = hidden
      ? '显示侧栏：左侧菜单与右侧边栏'
      : '隐藏侧栏：左侧菜单与右侧边栏';

    toggle.setAttribute('aria-label', label);
    toggle.setAttribute('aria-pressed', String(hidden));
    toggle.dataset.tip = hidden ? '显示侧栏' : '隐藏侧栏';
  }

  function ensureWidget() {
    let widget = document.getElementById(WIDGET_ID);
    if (widget) {
      return widget;
    }

    widget = document.createElement('div');
    widget.id = WIDGET_ID;

    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'x-sidebar-toggle-item x-sidebar-toggle-button';
    toggle.innerHTML = ICONS.sidebar;
    toggle.addEventListener('click', () => {
      writeHiddenState(!readHiddenState());
      applyState();
    });

    const repo = document.createElement('a');
    repo.className = 'x-sidebar-toggle-item';
    repo.href = REPO_URL;
    repo.target = '_blank';
    repo.rel = 'noopener noreferrer';
    repo.innerHTML = ICONS.github;
    repo.setAttribute('aria-label', 'GitHub 源码');
    repo.dataset.tip = 'GitHub 源码';

    widget.append(toggle, repo);
    document.body.appendChild(widget);
    return widget;
  }

  function applyState() {
    if (!document.body || !document.head) {
      return;
    }

    ensureStyle();
    resolveLayout(false);

    const hidden = readHiddenState();
    document.body.classList.toggle(HIDDEN_CLASS, hidden);

    const widget = ensureWidget();
    const toggle = widget.querySelector('.x-sidebar-toggle-button');
    if (toggle) {
      updateToggle(toggle, hidden);
    }
  }

  let scheduled = false;

  function scheduleApply() {
    if (scheduled) {
      return;
    }

    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      applyState();
    });
  }

  function patchHistory() {
    if (history.__xLeftMenuTogglePatched) {
      return;
    }

    history.__xLeftMenuTogglePatched = true;

    for (const methodName of ['pushState', 'replaceState']) {
      const original = history[methodName];
      history[methodName] = function (...args) {
        const result = original.apply(this, args);
        resolveLayout(true);
        scheduleApply();
        return result;
      };
    }

    window.addEventListener('popstate', () => {
      resolveLayout(true);
      scheduleApply();
    });
  }

  function startObserver() {
    const root = document.documentElement;
    if (!root || root.__xLeftMenuToggleObserved) {
      return;
    }

    root.__xLeftMenuToggleObserved = true;

    // 路由切换、右栏延迟挂载都靠这层观察兜底；resolveLayout 自带 400ms 节流。
    new MutationObserver(scheduleApply).observe(root, {
      childList: true,
      subtree: true,
    });
  }

  function debug() {
    const main = findMain();
    const next = findLayout();
    const describe = (element) => {
      if (!element) {
        return null;
      }
      const rect = element.getBoundingClientRect();
      return {
        tag: element.tagName.toLowerCase(),
        testid: element.getAttribute('data-testid'),
        role: element.getAttribute('role'),
        width: Math.round(rect.width),
        left: Math.round(rect.left),
      };
    };

    return {
      url: location.href,
      hidden: readHiddenState(),
      viewportWidth: window.innerWidth,
      main: describe(main),
      left: describe(next && next.left),
      right: describe(next && next.right),
      expandDepth: next ? next.expand.length : 0,
      roles: [...document.querySelectorAll(`[${ROLE_ATTR}]`)].map((element) => `${element.tagName.toLowerCase()}:${element.getAttribute(ROLE_ATTR)}`),
    };
  }

  window.__xSidebarToggle = {
    apply: applyState,
    resolve: () => resolveLayout(true),
    debug,
  };

  function init() {
    patchHistory();
    startObserver();
    scheduleApply();
  }

  let initAttempts = 0;
  let initTimer = null;

  function tryInit() {
    initAttempts += 1;

    if (!document.body || !document.head) {
      if (initAttempts >= 100 && initTimer) {
        clearInterval(initTimer);
      }
      return;
    }

    if (initTimer) {
      clearInterval(initTimer);
      initTimer = null;
    }

    init();
  }

  document.addEventListener('DOMContentLoaded', tryInit, { once: true });
  initTimer = setInterval(tryInit, 100);
  tryInit();
})();