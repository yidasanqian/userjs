// ==UserScript==
// @name         X Left Menu Toggle
// @name:zh-CN   X 左侧菜单显示隐藏
// @namespace    https://github.com/yidasanqian/userjs
// @version      1.1.0
// @description  Show or hide the left navigation menu and the right sidebar on X/Twitter.
// @description:zh-CN 在 X/Twitter 页面右上角添加按钮，一键显示或隐藏左侧菜单与右侧边栏，让时间线更干净。
// @author       yidasanqian
// @license      MIT
// @homepageURL  https://github.com/yidasanqian/userjs
// @supportURL   https://github.com/yidasanqian/userjs/issues
// @downloadURL  https://raw.githubusercontent.com/yidasanqian/userjs/main/x-menu-toggle.user.js
// @updateURL    https://raw.githubusercontent.com/yidasanqian/userjs/main/x-menu-toggle.user.js
// @match        https://x.com/*
// @match        https://twitter.com/*
// @run-at       document-idle
// @grant        GM_getValue
// @grant        GM_setValue
// @noframes
// ==/UserScript==

(function () {
  'use strict';

  const STORAGE_KEY = 'x_left_menu_hidden';
  const HIDDEN_CLASS = 'x-left-menu-hidden';
  const TARGET_ATTR = 'data-x-left-menu-target';
  const BUTTON_ID = 'x-left-menu-toggle-button';
  const STYLE_ID = 'x-left-menu-toggle-style';
  const MIN_DESKTOP_WIDTH = 900;

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
body.${HIDDEN_CLASS} [${TARGET_ATTR}="true"] {
  display: none !important;
}

/* 右侧边栏：搜索框、相关用户、趋势、页脚 */
body.${HIDDEN_CLASS} [data-testid="sidebarColumn"],
body.${HIDDEN_CLASS} aside[role="complementary"] {
  display: none !important;
}

@media (min-width: ${MIN_DESKTOP_WIDTH}px) {
  body.${HIDDEN_CLASS} main[role="main"] {
    display: flex !important;
    justify-content: center !important;
  }

  body.${HIDDEN_CLASS} [data-testid="primaryColumn"] {
    width: min(680px, calc(100vw - 32px)) !important;
    max-width: min(680px, calc(100vw - 32px)) !important;
    margin-inline: auto !important;
  }
}

#${BUTTON_ID} {
  position: fixed;
  right: max(16px, env(safe-area-inset-right, 0px));
  top: calc(16px + env(safe-area-inset-top, 0px));
  z-index: 2147483647;
  box-sizing: border-box;
  min-width: 72px;
  min-height: 40px;
  padding: 8px 10px;
  border: 1px solid rgba(15, 20, 25, 0.18);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.92);
  color: rgb(15, 20, 25);
  box-shadow: 0 4px 16px rgba(15, 20, 25, 0.18);
  cursor: pointer;
  font: 600 13px/1.2 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  text-align: center;
  user-select: none;
}

#${BUTTON_ID}:hover {
  background: rgb(247, 249, 249);
}

#${BUTTON_ID}:focus-visible {
  outline: 2px solid rgb(29, 155, 240);
  outline-offset: 2px;
}

@media (prefers-color-scheme: dark) {
  #${BUTTON_ID} {
    border-color: rgba(239, 243, 244, 0.22);
    background: rgba(22, 24, 28, 0.92);
    color: rgb(239, 243, 244);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.35);
  }

  #${BUTTON_ID}:hover {
    background: rgb(32, 35, 39);
  }
}
`;

    document.head.appendChild(style);
  }

  function getPrimaryColumn() {
    return document.querySelector('[data-testid="primaryColumn"], main[role="main"]');
  }

  function getSidebarColumn() {
    return document.querySelector('[data-testid="sidebarColumn"]');
  }

  function looksLikeLeftNavigation(root) {
    if (!root) {
      return false;
    }

    const tabLinks = root.querySelectorAll('[data-testid^="AppTabBar_"]');
    const composeButton = root.querySelector(
      '[data-testid="SideNav_NewTweet_Button"], a[href="/compose/post"]'
    );

    return tabLinks.length >= 2 || Boolean(composeButton);
  }

  function isSafeLeftCandidate(element) {
    if (!element || window.innerWidth < MIN_DESKTOP_WIDTH) {
      return false;
    }

    const primaryColumn = getPrimaryColumn();
    const sidebarColumn = getSidebarColumn();

    if (primaryColumn && (primaryColumn === element || primaryColumn.contains(element))) {
      return false;
    }

    if (sidebarColumn && (sidebarColumn === element || sidebarColumn.contains(element))) {
      return false;
    }

    if (element.closest('[data-testid="primaryColumn"], [data-testid="sidebarColumn"], main[role="main"]')) {
      return false;
    }

    const rect = element.getBoundingClientRect();
    return rect.width > 0 && rect.left < window.innerWidth / 2;
  }

  function findLeftNavigationTarget() {
    const existing = document.querySelector(`[${TARGET_ATTR}="true"]`);
    if (existing && document.documentElement.contains(existing)) {
      return existing;
    }

    const selectors = [
      'header[role="banner"] nav[aria-label="Primary"]',
      'header[role="banner"] [role="navigation"][aria-label="Primary"]',
      'header[role="banner"] [data-testid^="AppTabBar_"]',
      'header[role="banner"] [data-testid="SideNav_NewTweet_Button"]',
      '[data-testid="AppTabBar_Home_Link"]',
    ];

    for (const selector of selectors) {
      const signal = document.querySelector(selector);
      if (!signal) {
        continue;
      }

      const candidate = signal.closest('header[role="banner"]') || signal.closest('[role="navigation"]');
      if (candidate && looksLikeLeftNavigation(candidate) && isSafeLeftCandidate(candidate)) {
        candidate.setAttribute(TARGET_ATTR, 'true');
        return candidate;
      }
    }

    return null;
  }

  function updateButton(button, hidden) {
    const label = hidden
      ? '显示 X 左侧菜单与右侧边栏'
      : '隐藏 X 左侧菜单与右侧边栏';

    button.textContent = hidden ? '显示侧栏' : '隐藏侧栏';
    button.title = label;
    button.setAttribute('aria-label', label);
    button.setAttribute('aria-pressed', String(hidden));
  }

  function ensureToggleButton() {
    let button = document.getElementById(BUTTON_ID);
    if (button) {
      updateButton(button, readHiddenState());
      return button;
    }

    button = document.createElement('button');
    button.id = BUTTON_ID;
    button.type = 'button';
    button.addEventListener('click', () => {
      const nextHidden = !readHiddenState();
      writeHiddenState(nextHidden);
      applyState();
    });

    updateButton(button, readHiddenState());
    document.body.appendChild(button);
    return button;
  }

  function applyState() {
    if (!document.body || !document.head) {
      return;
    }

    ensureStyle();
    findLeftNavigationTarget();

    const hidden = readHiddenState();
    document.body.classList.toggle(HIDDEN_CLASS, hidden);

    const button = ensureToggleButton();
    updateButton(button, hidden);
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
