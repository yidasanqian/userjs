// ==UserScript==
// @name         X Sidebar Toggle
// @name:zh-CN   X 侧栏显示隐藏
// @namespace    https://github.com/yidasanqian/userjs
// @version      1.3.0
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

  const ICONS = {
    sidebar:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5.5h16a1.5 1.5 0 0 1 0 3H4a1.5 1.5 0 0 1 0-3Zm0 4.75h10a1.5 1.5 0 0 1 0 3H4a1.5 1.5 0 0 1 0-3Zm0 4.75h16a1.5 1.5 0 0 1 0 3H4a1.5 1.5 0 0 1 0-3Z"/></svg>',
    github:
      '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z"/></svg>',
  };

  function readHiddenState() {
    try {
      return Boolean(GM_getValue(STORAGE_KEY, false));
    } catch (_) {
      return false;
    }
  }

  function writeHiddenState(hidden) {
    try {
      GM_setValue(STORAGE_KEY, Boolean(hidden));
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
  body.${HIDDEN_CLASS} [${ROLE_ATTR}="row"] {
    display: flex !important;
    width: 100% !important;
    justify-content: center !important;
  }

  body.${HIDDEN_CLASS} [${ROLE_ATTR}="content"] {
    display: flex !important;
    justify-content: center !important;
    width: auto !important;
    max-width: min(680px, calc(100vw - 32px)) !important;
  }

  body.${HIDDEN_CLASS} [${ROLE_ATTR}="main"] {
    width: 100% !important;
    max-width: min(680px, calc(100vw - 32px)) !important;
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

  function findRightSidebar() {
    const marked = document.querySelector(`[${ROLE_ATTR}="right"]`);
    if (marked && marked.isConnected) {
      return marked;
    }

    const legacy = document.querySelector('[data-testid="sidebarColumn"], aside[role="complementary"]');
    if (legacy) {
      return legacy;
    }

    // 新版 X 去掉了 data-testid，右栏是语义化 aside，按位置识别
    const aside = [...document.querySelectorAll('aside')].find((el) => {
      const rect = el.getBoundingClientRect();
      return rect.width > 0 && rect.left > window.innerWidth / 2;
    });

    return aside || null;
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

  let layoutElements = [];

  function resolveLayout() {
    if (layoutElements.length && layoutElements.every((el) => el.isConnected)) {
      return;
    }

    const right = findRightSidebar();
    if (right) {
      const content = right.parentElement;
      const row = content && content.parentElement;
      const main = content && content.querySelector('main');
      const left = row && [...row.children].find((el) => el !== content && el.querySelector('nav'));

      if (left && row && content && main) {
        layoutElements = [
          mark(left, 'left'),
          mark(right, 'right'),
          mark(row, 'row'),
          mark(content, 'content'),
          mark(main, 'main'),
        ].filter(Boolean);
        return;
      }
    }

    // 旧版 X（data-testid 时代）兜底
    const banner = document.querySelector('header[role="banner"]');
    const primary = document.querySelector('[data-testid="primaryColumn"]');
    const mainRole = document.querySelector('main[role="main"]');

    layoutElements = [
      mark(banner, 'left'),
      mark(right, 'right'),
      mark(mainRole, 'row'),
      mark(primary, 'main'),
    ].filter(Boolean);
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
    resolveLayout();

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
        scheduleApply();
        return result;
      };
    }

    window.addEventListener('popstate', scheduleApply);
  }

  function startObserver() {
    const root = document.documentElement;
    if (!root || root.__xLeftMenuToggleObserved) {
      return;
    }

    root.__xLeftMenuToggleObserved = true;

    new MutationObserver(scheduleApply).observe(root, {
      childList: true,
      subtree: true,
    });
  }

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