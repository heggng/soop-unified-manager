// ==UserScript==
// @name         SOOP 즐겨찾기 한눈에 관리
// @namespace    https://www.sooplive.com/
// @version      1.5.1
// @description  즐겨찾기 스트리머를 한 화면에서 확인하고 상태·그룹별로 빠르게 관리합니다.
// @author       Codex
// @homepageURL  https://github.com/heggng/soop-unified-manager
// @supportURL   https://github.com/heggng/soop-unified-manager/issues
// @updateURL    https://raw.githubusercontent.com/heggng/soop-unified-manager/main/soop-favorite-manager.user.js
// @downloadURL  https://raw.githubusercontent.com/heggng/soop-unified-manager/main/soop-favorite-manager.user.js
// @match        https://www.sooplive.com/my/favorite*
// @match        https://sooplive.com/my/favorite*
// @icon         https://www.sooplive.com/favicon.ico
// @grant        none
// @run-at       document-idle
// @license      MIT
// ==/UserScript==

(() => {
  'use strict';

  const PREFIX = 'soop-fm';
  const FAVORITE_API_BASE = 'https://myapi.sooplive.com';
  const FILTERS = [
    { id: 'all', label: '전체' },
    { id: 'live', label: 'LIVE' },
    { id: 'pinned', label: '고정' },
    { id: 'alarm-on', label: '알림' },
  ];

  const state = {
    filter: 'all',
    groupFilter: 'all',
    activeRoot: null,
    scheduled: false,
    groups: [],
    groupMemberships: new Map(),
    groupListStarted: false,
    groupListPromise: null,
    groupMemberPromises: new Map(),
    pendingGroupFilter: '',
  };

  const style = document.createElement('style');
  style.id = `${PREFIX}-style`;
  style.textContent = `
    :root {
      --soop-fm-accent: #0182ff;
      --soop-fm-live: #ff4057;
      --soop-fm-warn: #f4bf03;
      --soop-fm-bg: #ffffff;
      --soop-fm-surface: #f7f8fa;
      --soop-fm-surface-hover: #eef5ff;
      --soop-fm-card: #ffffff;
      --soop-fm-text: #17191c;
      --soop-fm-muted: #757b8a;
      --soop-fm-border: rgba(23, 25, 28, 0.11);
      --soop-fm-shadow: 0 18px 60px rgba(0, 0, 0, 0.24);
    }

    html[dark="true"] {
      --soop-fm-bg: #17191d;
      --soop-fm-surface: #23262c;
      --soop-fm-surface-hover: #253449;
      --soop-fm-card: #1e2126;
      --soop-fm-text: #e8eaf0;
      --soop-fm-muted: #a6abb7;
      --soop-fm-border: rgba(246, 246, 249, 0.11);
      --soop-fm-shadow: 0 18px 70px rgba(0, 0, 0, 0.55);
    }

    #${PREFIX}-fab {
      position: fixed;
      top: 116px;
      right: 28px;
      bottom: auto;
      z-index: 9990;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      min-height: 46px;
      padding: 0 17px;
      border: 1px solid rgba(255, 255, 255, 0.18);
      border-radius: 999px;
      background: linear-gradient(135deg, #087cff 0%, #00b7eb 100%);
      box-shadow: 0 10px 28px rgba(1, 130, 255, 0.34);
      color: #fff;
      font: 700 14px/1 -apple-system, BlinkMacSystemFont, "Segoe UI",
        "Noto Sans KR", sans-serif;
      letter-spacing: -0.2px;
      cursor: pointer;
      transition: transform 0.18s ease, box-shadow 0.18s ease;
    }

    #${PREFIX}-fab:hover {
      transform: translateY(-2px);
      box-shadow: 0 14px 34px rgba(1, 130, 255, 0.44);
    }

    #${PREFIX}-fab[hidden] {
      display: none !important;
    }

    #${PREFIX}-toast {
      position: fixed;
      left: 50%;
      bottom: 30px;
      z-index: 10050;
      max-width: min(520px, calc(100vw - 32px));
      padding: 12px 16px;
      border: 1px solid var(--soop-fm-border);
      border-radius: 10px;
      background: var(--soop-fm-text);
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.28);
      color: var(--soop-fm-bg);
      font: 600 14px/1.45 -apple-system, BlinkMacSystemFont, "Segoe UI",
        "Noto Sans KR", sans-serif;
      text-align: center;
      transform: translate(-50%, 16px);
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.18s ease, transform 0.18s ease;
    }

    #${PREFIX}-toast.is-visible {
      transform: translate(-50%, 0);
      opacity: 1;
    }

    .layer_container.${PREFIX}-root {
      display: flex !important;
      flex-direction: column !important;
      overflow: hidden !important;
      width: min(1680px, calc(100vw - 32px)) !important;
      max-width: none !important;
      height: min(940px, calc(100vh - 32px)) !important;
      max-height: none !important;
      border-radius: 16px !important;
      background: var(--soop-fm-bg) !important;
      box-shadow: var(--soop-fm-shadow) !important;
      color: var(--soop-fm-text) !important;
    }

    .layer_container.${PREFIX}-root > h3 {
      flex: 0 0 auto;
      justify-content: flex-start !important;
      min-height: 68px;
      padding: 20px 72px 12px 28px !important;
      color: var(--soop-fm-text) !important;
      font-size: 22px !important;
      text-align: left !important;
      box-sizing: border-box;
    }

    .layer_container.${PREFIX}-root > h3::before {
      content: "★";
      margin-right: 9px;
      color: var(--soop-fm-warn);
      font-size: 20px;
    }

    .layer_container.${PREFIX}-root > h3 .total_txt {
      color: var(--soop-fm-muted) !important;
      font-size: 14px !important;
    }

    .layer_container.${PREFIX}-root > .btn_close {
      top: 22px !important;
      right: 26px !important;
      width: 32px !important;
      height: 32px !important;
      border-radius: 50%;
    }

    .layer_container.${PREFIX}-root .my_adm_layer {
      display: flex !important;
      flex: 1 1 auto !important;
      flex-direction: column !important;
      overflow: hidden !important;
      width: 100% !important;
      min-height: 0 !important;
      padding-top: 0 !important;
    }

    .layer_container.${PREFIX}-root .my_adm_layer .search_area {
      flex: 0 0 auto;
      width: auto !important;
      padding: 0 28px 10px !important;
    }

    .layer_container.${PREFIX}-root
      .my_adm_layer
      .search_area
      input[type="text"] {
      height: 44px !important;
      border: 1px solid var(--soop-fm-border) !important;
      background: var(--soop-fm-surface) !important;
      color: var(--soop-fm-text) !important;
      font-size: 15px !important;
    }

    .layer_container.${PREFIX}-root
      .my_adm_layer
      .search_area
      input[type="text"]:focus {
      border-color: var(--soop-fm-accent) !important;
      box-shadow: 0 0 0 3px rgba(1, 130, 255, 0.13);
      outline: none;
    }

    .layer_container.${PREFIX}-root .my_adm_layer .strm_area {
      display: flex !important;
      flex: 1 1 auto !important;
      flex-direction: column !important;
      overflow: hidden !important;
      min-height: 0 !important;
    }

    .layer_container.${PREFIX}-root
      .my_adm_layer
      .strm_area
      .total_wrap {
      display: none !important;
    }

    .${PREFIX}-toolbar {
      display: flex;
      flex: 0 0 auto;
      align-items: center;
      gap: 10px;
      min-height: 54px;
      margin: 0 28px 8px;
      padding: 8px 10px;
      border: 1px solid var(--soop-fm-border);
      border-radius: 12px;
      background: var(--soop-fm-surface);
      box-sizing: border-box;
    }

    .${PREFIX}-filters,
    .${PREFIX}-group-filters {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .${PREFIX}-group-filters {
      flex: 1 1 auto;
      overflow-x: auto;
      min-width: 160px;
      padding: 0 8px 2px 12px;
      border-left: 1px solid var(--soop-fm-border);
      scrollbar-width: thin;
    }

    .${PREFIX}-filters button,
    .${PREFIX}-group-filters button {
      display: inline-flex;
      flex: 0 0 auto;
      align-items: center;
      justify-content: center;
      gap: 5px;
      height: 34px;
      padding: 0 12px;
      border: 1px solid transparent;
      border-radius: 999px;
      background: transparent;
      color: var(--soop-fm-muted);
      font: 650 13px/1 -apple-system, BlinkMacSystemFont, "Segoe UI",
        "Noto Sans KR", sans-serif;
      white-space: nowrap;
      cursor: pointer;
    }

    .${PREFIX}-filters button:hover,
    .${PREFIX}-group-filters button:hover {
      border-color: var(--soop-fm-border);
      background: var(--soop-fm-card);
      color: var(--soop-fm-text);
    }

    .${PREFIX}-filters button[aria-pressed="true"],
    .${PREFIX}-group-filters button[aria-pressed="true"] {
      border-color: rgba(1, 130, 255, 0.28);
      background: rgba(1, 130, 255, 0.12);
      color: var(--soop-fm-accent);
    }

    .${PREFIX}-filters button[data-filter="live"][aria-pressed="true"] {
      border-color: rgba(255, 64, 87, 0.25);
      background: rgba(255, 64, 87, 0.11);
      color: var(--soop-fm-live);
    }

    .${PREFIX}-filters button em {
      min-width: 18px;
      padding: 2px 5px;
      border-radius: 999px;
      background: rgba(117, 123, 138, 0.12);
      font-size: 11px;
      font-style: normal;
      text-align: center;
    }

    .${PREFIX}-group-filters button {
      flex: 0 0 auto;
      padding-right: 13px;
      padding-left: 13px;
    }

    .${PREFIX}-group-filters button:disabled {
      opacity: 0.55;
      cursor: wait;
    }

    .${PREFIX}-summary {
      overflow: hidden;
      flex: 0 1 auto;
      margin-left: auto;
      color: var(--soop-fm-muted);
      font: 500 13px/1.35 -apple-system, BlinkMacSystemFont, "Segoe UI",
        "Noto Sans KR", sans-serif;
      white-space: nowrap;
      text-overflow: ellipsis;
    }

    .layer_container.${PREFIX}-root
      .my_adm_layer
      .strm_area
      .strm_list {
      display: grid !important;
      flex: 1 1 auto !important;
      grid-template-columns: repeat(
        auto-fill,
        minmax(min(390px, 100%), 1fr)
      ) !important;
      grid-auto-rows: minmax(94px, auto);
      align-content: start;
      gap: 10px !important;
      overflow: auto !important;
      max-height: none !important;
      min-height: 0 !important;
      margin: 0 !important;
      padding: 4px 28px 26px !important;
      box-sizing: border-box;
      overscroll-behavior: contain;
      scrollbar-gutter: stable;
    }

    .layer_container.${PREFIX}-root
      .my_adm_layer
      .strm_area
      .strm_list
      > li {
      display: grid !important;
      grid-template-areas:
        "thumb nick nick"
        "thumb util quick";
      grid-template-columns: 66px minmax(0, 1fr) auto;
      grid-template-rows: minmax(32px, auto) minmax(44px, auto);
      align-items: center !important;
      overflow: hidden;
      min-height: 94px !important;
      padding: 8px 12px !important;
      border: 1px solid var(--soop-fm-border);
      border-radius: 13px;
      background: var(--soop-fm-card);
      box-sizing: border-box;
      transition: border-color 0.16s ease, background-color 0.16s ease,
        box-shadow 0.16s ease, transform 0.16s ease !important;
    }

    .layer_container.${PREFIX}-root
      .my_adm_layer
      .strm_area
      .strm_list
      > li:hover {
      border-color: rgba(1, 130, 255, 0.32);
      background: var(--soop-fm-surface-hover) !important;
      box-shadow: 0 6px 18px rgba(1, 130, 255, 0.09);
      transform: translateY(-1px);
    }

    .layer_container.${PREFIX}-root
      .my_adm_layer
      .strm_area
      .strm_list
      > li[hidden] {
      display: none !important;
    }

    .layer_container.${PREFIX}-root
      .my_adm_layer
      .strm_area
      .strm_list
      > li
      .thumb {
      grid-area: thumb;
      width: 64px !important;
    }

    .layer_container.${PREFIX}-root
      .my_adm_layer
      .strm_area
      .strm_list
      > li
      .nick_wrap {
      grid-area: nick;
      overflow: hidden;
      min-width: 0;
      margin: 0 6px 0 4px !important;
    }

    .layer_container.${PREFIX}-root
      .my_adm_layer
      .strm_area
      .strm_list
      > li
      .nick_wrap
      .nick {
      display: flex !important;
      align-items: center;
      gap: 6px;
      overflow: hidden;
      min-width: 0;
    }

    .layer_container.${PREFIX}-root
      .my_adm_layer
      .strm_area
      .strm_list
      > li
      .nick_wrap
      .nick
      span:first-child {
      overflow: hidden;
      min-width: 0;
      max-width: none !important;
      white-space: nowrap;
      text-overflow: ellipsis;
    }

    .layer_container.${PREFIX}-root
      .my_adm_layer
      .strm_area
      .strm_list
      > li
      .nick_wrap
      .last_live {
      display: block;
      overflow: hidden;
      margin-top: 3px;
      color: var(--soop-fm-muted) !important;
      white-space: nowrap;
      text-overflow: ellipsis;
    }

    .layer_container.${PREFIX}-root
      .my_adm_layer
      .strm_area
      .strm_list
      > li
      .util_btn_wrap {
      display: flex !important;
      grid-area: util;
      align-items: center;
      gap: 4px;
      margin: 0 !important;
    }

    .layer_container.${PREFIX}-root
      .my_adm_layer
      .strm_area
      .strm_list
      > li
      .util_btn_wrap
      button {
      position: relative;
      width: 64px !important;
      height: 42px !important;
      margin: 0 !important;
      border: 1px solid transparent;
      border-radius: 9px !important;
      background-position: 50% 3px !important;
      background-size: 21px 21px !important;
      color: transparent !important;
      font: 0/0 a !important;
    }

    .layer_container.${PREFIX}-root
      .my_adm_layer
      .strm_area
      .strm_list
      > li
      .util_btn_wrap
      button:hover {
      border-color: var(--soop-fm-border);
      background-color: var(--soop-fm-surface) !important;
    }

    .layer_container.${PREFIX}-root
      .my_adm_layer
      .strm_area
      .strm_list
      > li
      .util_btn_wrap
      button::after {
      position: absolute;
      right: 2px;
      bottom: 4px;
      left: 2px;
      color: var(--soop-fm-muted);
      font: 650 10.5px/1 -apple-system, BlinkMacSystemFont, "Segoe UI",
        "Noto Sans KR", sans-serif;
      text-align: center;
      white-space: nowrap;
    }

    .layer_container.${PREFIX}-root .util_btn_wrap button.alarm_on::after {
      content: "알림 켜짐";
      color: var(--soop-fm-accent);
    }

    .layer_container.${PREFIX}-root .util_btn_wrap button.alarm_off::after {
      content: "알림 꺼짐";
    }

    .layer_container.${PREFIX}-root .util_btn_wrap button.fav_on::after {
      content: "즐겨찾기 해제";
      color: #e45062;
    }

    .layer_container.${PREFIX}-root .util_btn_wrap button.fav_off::after {
      content: "즐겨찾기 추가";
    }

    .layer_container.${PREFIX}-root
      .my_adm_layer
      .strm_area
      .strm_list
      > li
      .select_box_item {
      position: absolute !important;
      overflow: hidden !important;
      width: 1px !important;
      height: 1px !important;
      opacity: 0 !important;
      pointer-events: none !important;
    }

    .${PREFIX}-quick {
      display: flex;
      grid-area: quick;
      align-items: center;
      gap: 4px;
      margin-left: 4px;
    }

    .${PREFIX}-quick button {
      display: inline-flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 2px;
      width: 64px;
      height: 42px;
      padding: 0 3px;
      border: 1px solid transparent;
      border-radius: 9px;
      background: transparent;
      color: var(--soop-fm-muted);
      font: 650 10.5px/1 -apple-system, BlinkMacSystemFont, "Segoe UI",
        "Noto Sans KR", sans-serif;
      cursor: pointer;
    }

    .${PREFIX}-quick button:hover {
      border-color: var(--soop-fm-border);
      background: var(--soop-fm-surface);
      color: var(--soop-fm-text);
    }

    .${PREFIX}-quick button:disabled {
      opacity: 0.55;
      cursor: wait;
    }

    .${PREFIX}-quick button.is-active {
      color: var(--soop-fm-accent);
    }

    .${PREFIX}-quick .${PREFIX}-icon {
      height: 19px;
      font-size: 17px;
      line-height: 19px;
    }

    .${PREFIX}-empty {
      display: none;
      flex: 1 1 auto;
      align-items: center;
      justify-content: center;
      margin: 4px 28px 26px;
      border: 1px dashed var(--soop-fm-border);
      border-radius: 13px;
      color: var(--soop-fm-muted);
      font: 600 14px/1.5 -apple-system, BlinkMacSystemFont, "Segoe UI",
        "Noto Sans KR", sans-serif;
    }

    .${PREFIX}-empty.is-visible {
      display: flex;
    }

    @media (max-width: 680px) {
      #${PREFIX}-fab {
        top: 94px;
        right: 14px;
        min-height: 42px;
        padding: 0 13px;
      }

      .layer_container.${PREFIX}-root {
        width: 100vw !important;
        height: 100vh !important;
        border-width: 0 !important;
        border-radius: 0 !important;
      }

      .layer_container.${PREFIX}-root > h3 {
        min-height: 58px;
        padding: 15px 58px 8px 16px !important;
        font-size: 19px !important;
      }

      .layer_container.${PREFIX}-root > .btn_close {
        top: 13px !important;
        right: 14px !important;
      }

      .layer_container.${PREFIX}-root .my_adm_layer .search_area {
        padding: 0 14px 8px !important;
      }

      .layer_container.${PREFIX}-root
        .my_adm_layer
        .strm_area
        .total_wrap {
        padding: 0 14px 7px !important;
      }

      .${PREFIX}-toolbar {
        gap: 7px;
        margin: 0 14px 7px;
        padding: 7px;
      }

      .${PREFIX}-filters {
        flex: 1 1 100%;
        overflow-x: auto;
      }

      .${PREFIX}-summary {
        display: none;
      }

      .layer_container.${PREFIX}-root
        .my_adm_layer
        .strm_area
        .strm_list {
        padding: 2px 14px 18px !important;
      }
    }
  `;

  function normalize(value) {
    return String(value ?? '').replace(/\s+/g, ' ').trim();
  }

  function normalizeId(value) {
    return normalize(value).toLocaleLowerCase('en-US');
  }

  function setText(element, value) {
    if (element && element.textContent !== value) {
      element.textContent = value;
    }
  }

  function isVisible(element) {
    return Boolean(
      element &&
        (element.offsetWidth ||
          element.offsetHeight ||
          element.getClientRects().length),
    );
  }

  function findNativeManagerButton() {
    return [...document.querySelectorAll('button.fav_manage')].find(
      (button) =>
        isVisible(button) && normalize(button.textContent).includes('스트리머 관리'),
    );
  }

  function ensureFab() {
    const nativeButton = findNativeManagerButton();
    let fab = document.getElementById(`${PREFIX}-fab`);

    if (!nativeButton) {
      fab?.remove();
      return;
    }

    nativeButton.title = '즐겨찾기 스트리머를 한 화면에서 관리합니다.';
    if (fab) {
      return;
    }

    fab = document.createElement('button');
    fab.id = `${PREFIX}-fab`;
    fab.type = 'button';
    fab.innerHTML =
      '<span aria-hidden="true">★</span><span>즐겨찾기 관리</span>';
    fab.setAttribute('aria-label', '즐겨찾기 관리 창 열기');
    fab.addEventListener('click', () => {
      const target = findNativeManagerButton();
      if (!target) {
        showToast(
          'SOOP의 스트리머 관리 버튼을 찾지 못했습니다. 페이지를 새로고침해 주세요.',
        );
        return;
      }
      target.click();
    });
    document.body.append(fab);
  }

  function findManagerRoots() {
    return [...document.querySelectorAll('.layer_container')].filter((root) => {
      const title = root.querySelector(':scope > h3');
      return Boolean(
        normalize(title?.textContent).includes('스트리머 관리') &&
          root.querySelector('.my_adm_layer .strm_area .strm_list') &&
          root.querySelector('input#search-inp'),
      );
    });
  }

  function appendFilterButtons(container) {
    for (const filter of FILTERS) {
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.filter = filter.id;
      button.setAttribute('aria-pressed', String(state.filter === filter.id));

      const label = document.createElement('span');
      label.textContent = filter.label;
      const count = document.createElement('em');
      count.textContent = '0';
      button.append(label, count);
      container.append(button);
    }
  }

  function renderGroupButtons(toolbar) {
    const container = toolbar?.querySelector(`.${PREFIX}-group-filters`);
    if (!container) {
      return;
    }

    const signature = JSON.stringify(
      state.groups.map((group) => [group.id, group.title]),
    );
    if (container.dataset.renderKey === signature) {
      return;
    }

    container.dataset.renderKey = signature;
    container.replaceChildren();
    if (state.groups.length === 0) {
      return;
    }

    const allButton = document.createElement('button');
    allButton.type = 'button';
    allButton.dataset.groupFilter = 'all';
    allButton.textContent = '그룹 전체';
    allButton.setAttribute(
      'aria-pressed',
      String(state.groupFilter === 'all'),
    );
    container.append(allButton);

    for (const group of state.groups) {
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.groupFilter = group.id;
      button.textContent = group.title;
      button.setAttribute(
        'aria-pressed',
        String(state.groupFilter === group.id),
      );
      container.append(button);
    }
  }

  function createToolbar() {
    const toolbar = document.createElement('div');
    toolbar.className = `${PREFIX}-toolbar`;

    const filters = document.createElement('div');
    filters.className = `${PREFIX}-filters`;
    filters.setAttribute('role', 'group');
    filters.setAttribute('aria-label', '스트리머 빠른 필터');
    appendFilterButtons(filters);

    const groupFilters = document.createElement('div');
    groupFilters.className = `${PREFIX}-group-filters`;
    groupFilters.setAttribute('role', 'group');
    groupFilters.setAttribute('aria-label', '즐겨찾기 그룹 필터');

    const summary = document.createElement('div');
    summary.className = `${PREFIX}-summary`;
    summary.setAttribute('aria-live', 'polite');

    toolbar.append(filters, groupFilters, summary);
    renderGroupButtons(toolbar);

    toolbar.addEventListener('click', (event) => {
      const button = event.target.closest('button');
      if (!button) {
        return;
      }

      if (button.dataset.filter) {
        state.filter = button.dataset.filter;
        refreshDashboard(state.activeRoot);
        return;
      }

      if (button.dataset.groupFilter) {
        selectGroup(button.dataset.groupFilter, button);
      }
    });

    return toolbar;
  }

  function createEmptyState() {
    const empty = document.createElement('div');
    empty.className = `${PREFIX}-empty`;
    empty.textContent = '선택한 조건에 맞는 스트리머가 없습니다.';
    return empty;
  }

  function enhanceRoot(root) {
    state.activeRoot = root;
    root.classList.add(`${PREFIX}-root`);
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-label', 'SOOP 즐겨찾기 스트리머 관리');

    const area = root.querySelector('.my_adm_layer .strm_area');
    const list = area?.querySelector(':scope > .strm_list');
    if (!area || !list) {
      return;
    }

    let toolbar = area.querySelector(`:scope > .${PREFIX}-toolbar`);
    if (!toolbar) {
      toolbar = createToolbar();
      area.insertBefore(toolbar, list);
    }

    let empty = area.querySelector(`:scope > .${PREFIX}-empty`);
    if (!empty) {
      empty = createEmptyState();
      list.insertAdjacentElement('afterend', empty);
    }

    for (const row of [...list.children]) {
      if (row.tagName === 'LI') {
        enhanceRow(row);
      }
    }

    refreshDashboard(root);
    loadFavoriteGroups();
  }

  function enhanceRow(row) {
    row.classList.add(`${PREFIX}-card`);

    const alarmButton = row.querySelector(
      '.util_btn_wrap button.alarm_on, .util_btn_wrap button.alarm_off',
    );
    const favoriteButton = row.querySelector(
      '.util_btn_wrap button.fav_on, .util_btn_wrap button.fav_off',
    );

    if (alarmButton) {
      const isOn = alarmButton.classList.contains('alarm_on');
      alarmButton.setAttribute(
        'aria-label',
        isOn ? '방송 알림 끄기' : '방송 알림 켜기',
      );
      alarmButton.title = isOn
        ? '알림 켜짐 — 클릭하여 끄기'
        : '알림 꺼짐 — 클릭하여 켜기';
    }

    if (favoriteButton) {
      const isFavorite = favoriteButton.classList.contains('fav_on');
      favoriteButton.setAttribute(
        'aria-label',
        isFavorite ? '즐겨찾기에서 삭제' : '즐겨찾기에 추가',
      );
      favoriteButton.title = isFavorite
        ? '즐겨찾기 해제'
        : '즐겨찾기에 추가';
    }

    if (!row.dataset.soopFmNativeListener) {
      row.dataset.soopFmNativeListener = 'true';
      row.addEventListener('click', (event) => {
        if (
          event.target.closest(
            `.util_btn_wrap button, .select_box_item button, .${PREFIX}-quick button`,
          )
        ) {
          setTimeout(scheduleEnhance, 80);
          setTimeout(scheduleEnhance, 500);
          setTimeout(scheduleEnhance, 1200);
        }
      });
    }

    let quick = row.querySelector(`:scope > .${PREFIX}-quick`);
    if (!quick) {
      quick = document.createElement('div');
      quick.className = `${PREFIX}-quick`;
      quick.innerHTML = `
        <button type="button" data-action="group">
          <span class="${PREFIX}-icon" aria-hidden="true">▣</span>
          <span>그룹 설정</span>
        </button>
        <button type="button" data-action="pin">
          <span class="${PREFIX}-icon" aria-hidden="true">◆</span>
          <span class="${PREFIX}-pin-label">상단 고정</span>
        </button>
      `;
      quick.addEventListener('click', async (event) => {
        const button = event.target.closest('button[data-action]');
        if (!button || button.disabled) {
          return;
        }

        event.preventDefault();
        event.stopPropagation();
        button.disabled = true;
        try {
          await runNativeMenuAction(row, button.dataset.action);
        } finally {
          setTimeout(() => {
            button.disabled = false;
            scheduleEnhance();
          }, 350);
        }
      });
      row.append(quick);
    }

    const pinButton = quick.querySelector('[data-action="pin"]');
    const pinLabel = pinButton?.querySelector(`.${PREFIX}-pin-label`);
    const isPinned = Boolean(row.querySelector('.thumb > .pin'));
    pinButton?.classList.toggle('is-active', isPinned);
    if (pinButton) {
      pinButton.title = isPinned
        ? '목록 상단 고정 해제'
        : '목록 상단에 고정';
      pinButton.setAttribute(
        'aria-label',
        isPinned ? '목록 상단 고정 해제' : '목록 상단에 고정',
      );
    }
    setText(pinLabel, isPinned ? '고정 해제' : '상단 고정');
  }

  async function fetchJson(path, timeout = 6000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    try {
      const response = await fetch(path, {
        credentials: 'include',
        headers: { Accept: 'application/json' },
        cache: 'no-store',
        signal: controller.signal,
      });
      if (!response.ok) {
        throw new Error(`SOOP 요청 실패 (${response.status})`);
      }
      return await response.json();
    } catch (error) {
      if (error?.name === 'AbortError') {
        throw new Error('SOOP 응답 시간이 초과되었습니다.');
      }
      throw error;
    } finally {
      clearTimeout(timer);
    }
  }

  function findArrayPayload(payload, depth = 0) {
    if (Array.isArray(payload)) {
      return payload.flat(Infinity);
    }
    if (!payload || typeof payload !== 'object' || depth > 4) {
      return [];
    }

    for (const key of ['data', 'result', 'list', 'items', 'favorites']) {
      if (key in payload) {
        const found = findArrayPayload(payload[key], depth + 1);
        if (found.length > 0 || Array.isArray(payload[key])) {
          return found;
        }
      }
    }

    for (const value of Object.values(payload)) {
      const found = findArrayPayload(value, depth + 1);
      if (found.length > 0) {
        return found;
      }
    }
    return [];
  }

  function normalizeGroup(item) {
    if (!item || typeof item !== 'object') {
      return null;
    }
    const id =
      item.idx ??
      item.groupIdx ??
      item.group_idx ??
      item.favoriteGroupIdx ??
      item.id;
    const title = normalize(
      item.title ??
        item.groupTitle ??
        item.group_title ??
        item.groupName ??
        item.name,
    );
    if (id === undefined || id === null || !title || title === '전체') {
      return null;
    }
    return { id: String(id), title };
  }

  function readGroupsFromPage() {
    const selectors = [
      '[data-group-id]',
      '[data-group-idx]',
      '[data-group_idx]',
      'a[href*="groupId="]',
      'a[href*="group_id="]',
    ].join(',');
    const groups = [];

    for (const element of document.querySelectorAll(selectors)) {
      if (element.closest(`.${PREFIX}-root`)) {
        continue;
      }

      let id =
        element.getAttribute('data-group-id') ||
        element.getAttribute('data-group-idx') ||
        element.getAttribute('data-group_idx') ||
        '';
      if (!id && element.matches('a[href]')) {
        try {
          const url = new URL(element.getAttribute('href'), location.origin);
          id =
            url.searchParams.get('groupId') ||
            url.searchParams.get('group_id') ||
            '';
        } catch {
          // 다른 DOM 후보를 확인합니다.
        }
      }

      const title = normalize(element.textContent).replace(/\s+\d+$/u, '');
      if (!id || !title || title === '전체') {
        continue;
      }
      groups.push({ id: String(id), title });
    }
    return groups;
  }

  function uniqueGroups(groups) {
    return groups.filter(
      (group, index, list) =>
        group &&
        list.findIndex((candidate) => candidate?.id === group.id) === index,
    );
  }

  async function loadFavoriteGroups() {
    if (state.groupListStarted) {
      return state.groupListPromise;
    }

    state.groupListStarted = true;
    state.groupListPromise = (async () => {
      let groups = readGroupsFromPage();
      if (groups.length === 0) {
        try {
          const payload = await fetchJson(
            `${FAVORITE_API_BASE}/api/favorite/group/list`,
            5000,
          );
          groups = findArrayPayload(payload)
            .map(normalizeGroup)
            .filter(Boolean);
        } catch {
          // 실패하더라도 관리 화면에는 로딩 또는 오류 문구를 남기지 않습니다.
        }
      }
      state.groups = uniqueGroups(groups);

      for (const toolbar of document.querySelectorAll(
        `.${PREFIX}-toolbar`,
      )) {
        renderGroupButtons(toolbar);
      }
      refreshDashboard(state.activeRoot);
    })();
    return state.groupListPromise;
  }

  function getRowUserId(row) {
    if (row.dataset.soopFmUserId) {
      return row.dataset.soopFmUserId;
    }

    for (const link of row.querySelectorAll(
      '.nick[href], .thumb a[href], a[href*="/station/"]',
    )) {
      try {
        const url = new URL(link.getAttribute('href'), location.origin);
        const candidate = decodeURIComponent(
          url.searchParams.get('bjid') ||
            url.searchParams.get('user_id') ||
            url.searchParams.get('userId') ||
            url.pathname.split('/').filter(Boolean).at(-1) ||
            '',
        );
        if (
          candidate &&
          !['favorite', 'my', 'station'].includes(normalizeId(candidate))
        ) {
          row.dataset.soopFmUserId = candidate;
          return candidate;
        }
      } catch {
        // 다음 링크 후보를 확인합니다.
      }
    }

    const dataId =
      row.dataset.userId ||
      row.getAttribute('data-user-id') ||
      row.querySelector('[data-user-id]')?.getAttribute('data-user-id') ||
      '';
    if (dataId) {
      row.dataset.soopFmUserId = dataId;
    }
    return dataId;
  }

  function getFavoriteId(item) {
    if (!item || typeof item !== 'object') {
      return '';
    }
    return normalize(
      item.userId ??
        item.user_id ??
        item.favoriteId ??
        item.favorite_id ??
        item.bjId ??
        item.bj_id ??
        item.streamerId ??
        item.streamer_id ??
        item.user?.id ??
        item.streamer?.id,
    );
  }

  async function loadGroupMembers(groupId) {
    if (state.groupMemberships.has(groupId)) {
      return state.groupMemberships.get(groupId);
    }
    if (state.groupMemberPromises.has(groupId)) {
      return state.groupMemberPromises.get(groupId);
    }

    const request = (async () => {
      const payload = await fetchJson(
        `${FAVORITE_API_BASE}/api/favorite/${encodeURIComponent(groupId)}`,
        6000,
      );
      const members = new Set(
        findArrayPayload(payload)
          .map(getFavoriteId)
          .map(normalizeId)
          .filter(Boolean),
      );
      state.groupMemberships.set(groupId, members);
      return members;
    })();

    state.groupMemberPromises.set(groupId, request);
    try {
      return await request;
    } finally {
      state.groupMemberPromises.delete(groupId);
    }
  }

  async function selectGroup(groupId, button) {
    if (groupId === 'all' || groupId === state.groupFilter) {
      state.pendingGroupFilter = '';
      state.groupFilter = 'all';
      refreshDashboard(state.activeRoot);
      return;
    }

    state.pendingGroupFilter = groupId;
    button.disabled = true;
    button.setAttribute('aria-busy', 'true');
    try {
      await loadGroupMembers(groupId);
      if (state.pendingGroupFilter === groupId) {
        state.groupFilter = groupId;
        refreshDashboard(state.activeRoot);
      }
    } catch (error) {
      if (state.pendingGroupFilter === groupId) {
        state.pendingGroupFilter = '';
      }
      showToast(
        error?.message || '즐겨찾기 그룹을 불러오지 못했습니다.',
      );
    } finally {
      button.disabled = false;
      button.removeAttribute('aria-busy');
    }
  }

  async function runNativeMenuAction(row, action) {
    const menuButton = row.querySelector('button.more_dot');
    if (!menuButton) {
      showToast(
        '이 스트리머의 설정 메뉴를 찾지 못했습니다. 페이지를 새로고침해 주세요.',
      );
      return;
    }

    menuButton.click();
    const targetLabels =
      action === 'group'
        ? ['즐겨찾기 그룹에 담기']
        : ['고정 해제하기', '고정하기'];

    const actionButton = await waitFor(() => {
      return [...row.querySelectorAll('.select_list button')].find((button) =>
        targetLabels.some((label) =>
          normalize(button.textContent).includes(label),
        ),
      );
    }, 1400);

    if (!actionButton) {
      menuButton.click();
      showToast(
        action === 'group'
          ? '그룹 설정 메뉴를 찾지 못했습니다.'
          : '고정 설정 메뉴를 찾지 못했습니다.',
      );
      return;
    }

    actionButton.click();
  }

  function waitFor(getValue, timeout) {
    const startedAt = Date.now();
    return new Promise((resolve) => {
      const check = () => {
        const value = getValue();
        if (value) {
          resolve(value);
          return;
        }
        if (Date.now() - startedAt >= timeout) {
          resolve(null);
          return;
        }
        requestAnimationFrame(check);
      };
      check();
    });
  }

  function refreshDashboard(root) {
    if (!root?.isConnected) {
      return;
    }

    const list = root.querySelector('.my_adm_layer .strm_list');
    const toolbar = root.querySelector(`.${PREFIX}-toolbar`);
    const empty = root.querySelector(`.${PREFIX}-empty`);
    if (!list || !toolbar || !empty) {
      return;
    }

    renderGroupButtons(toolbar);
    const rows = [...list.children].filter((row) => row.tagName === 'LI');
    const activeMembers =
      state.groupFilter === 'all'
        ? null
        : state.groupMemberships.get(state.groupFilter);
    const counts = {
      all: rows.length,
      live: 0,
      pinned: 0,
      'alarm-on': 0,
    };
    for (const row of rows) {
      const flags = {
        live: row.classList.contains('live'),
        pinned: Boolean(row.querySelector('.thumb > .pin')),
        'alarm-on': Boolean(row.querySelector('.util_btn_wrap .alarm_on')),
      };

      for (const key of Object.keys(flags)) {
        if (flags[key]) {
          counts[key] += 1;
        }
      }

      const statusMatches =
        state.filter === 'all' || Boolean(flags[state.filter]);
      const groupMatches =
        !activeMembers ||
        activeMembers.has(normalizeId(getRowUserId(row)));
      row.hidden = !statusMatches || !groupMatches;
    }

    setText(
      root.querySelector(':scope > h3 .total_txt'),
      `(${rows.length}명)`,
    );

    for (const button of toolbar.querySelectorAll('button[data-filter]')) {
      const id = button.dataset.filter;
      button.setAttribute('aria-pressed', String(state.filter === id));
      setText(button.querySelector('em'), String(counts[id] ?? 0));
    }

    for (const button of toolbar.querySelectorAll(
      'button[data-group-filter]',
    )) {
      button.setAttribute(
        'aria-pressed',
        String(button.dataset.groupFilter === state.groupFilter),
      );
    }

    const visibleCount = rows.filter((row) => !row.hidden).length;
    const selectedGroup = state.groups.find(
      (group) => group.id === state.groupFilter,
    );
    const summaryParts = [
      selectedGroup?.title,
      `표시 ${visibleCount}명`,
      `LIVE ${counts.live}명`,
      `고정 ${counts.pinned}명`,
      `알림 ${counts['alarm-on']}명`,
    ].filter(Boolean);
    setText(
      toolbar.querySelector(`.${PREFIX}-summary`),
      summaryParts.join(' · '),
    );

    const searchInput = root.querySelector('input#search-inp');
    if (searchInput) {
      searchInput.placeholder = '즐겨찾기 스트리머를 검색해 주세요.';
    }

    empty.classList.toggle(
      'is-visible',
      rows.length > 0 && visibleCount === 0,
    );
    list.hidden = rows.length > 0 && visibleCount === 0;
  }

  let toastTimer;
  function showToast(message) {
    let toast = document.getElementById(`${PREFIX}-toast`);
    if (!toast) {
      toast = document.createElement('div');
      toast.id = `${PREFIX}-toast`;
      toast.setAttribute('role', 'status');
      toast.setAttribute('aria-live', 'polite');
      document.body.append(toast);
    }

    setText(toast, message);
    toast.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.classList.remove('is-visible');
    }, 2800);
  }

  function scheduleEnhance() {
    if (state.scheduled) {
      return;
    }

    state.scheduled = true;
    requestAnimationFrame(() => {
      state.scheduled = false;
      ensureFab();

      const roots = findManagerRoots();
      const fab = document.getElementById(`${PREFIX}-fab`);
      if (fab) {
        fab.hidden = roots.length > 0;
      }

      if (roots.length === 0) {
        state.activeRoot = null;
        return;
      }

      for (const root of roots) {
        enhanceRoot(root);
      }
    });
  }

  function start() {
    if (!document.getElementById(style.id)) {
      document.head.append(style);
    }

    scheduleEnhance();
    const observer = new MutationObserver(scheduleEnhance);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
    window.addEventListener('popstate', scheduleEnhance);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
