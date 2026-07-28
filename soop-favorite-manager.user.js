// ==UserScript==
// @name         SOOP 즐겨찾기·구독 통합 관리
// @namespace    https://www.sooplive.com/
// @version      1.3.0
// @description  즐겨찾기 페이지에서 즐겨찾기와 구독 스트리머를 한 화면으로 관리하고 각종 설정을 바로 사용할 수 있게 합니다.
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
  const STORAGE_KEY = `${PREFIX}:density`;
  const FILTERS = [
    { id: 'all', label: '전체' },
    { id: 'live', label: 'LIVE' },
    { id: 'pinned', label: '고정' },
    { id: 'alarm-on', label: '알림 켜짐' },
    { id: 'alarm-off', label: '알림 꺼짐' },
  ];
  const SUBSCRIPTION_FILTERS = [
    { id: 'all', label: '전체' },
    { id: 'live', label: 'LIVE' },
    { id: 'pinned', label: '고정' },
    { id: 'favorite-on', label: '즐겨찾기' },
    { id: 'favorite-off', label: '미즐겨찾기' },
  ];

  const state = {
    view: 'favorite',
    filter: 'all',
    subscriptionFilter: 'all',
    density: readDensity(),
    activeRoot: null,
    scheduled: false,
    subscriptions: [],
    subscriptionLoading: false,
    subscriptionLoaded: false,
    subscriptionError: '',
    subscriptionIframe: null,
    subscriptionList: null,
    subscriptionObserver: null,
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
      transition: transform 0.18s ease, box-shadow 0.18s ease,
        opacity 0.18s ease;
    }

    #${PREFIX}-fab:hover {
      transform: translateY(-2px);
      box-shadow: 0 14px 34px rgba(1, 130, 255, 0.44);
    }

    #${PREFIX}-fab:active {
      transform: translateY(0);
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

    #${PREFIX}-sub-source {
      display: none;
    }

    #${PREFIX}-sub-source.is-interacting {
      position: fixed;
      inset: 0;
      z-index: 10060;
      display: block;
      width: 100vw;
      height: 100vh;
      border: 0;
      background: var(--soop-fm-bg);
    }

    #${PREFIX}-source-close {
      position: fixed;
      top: 14px;
      left: 50%;
      z-index: 10070;
      display: none;
      min-height: 40px;
      padding: 0 16px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 999px;
      background: #087cff;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
      color: #fff;
      font: 700 13px/1 -apple-system, BlinkMacSystemFont, "Segoe UI",
        "Noto Sans KR", sans-serif;
      transform: translateX(-50%);
      cursor: pointer;
    }

    #${PREFIX}-source-close.is-visible {
      display: inline-flex;
      align-items: center;
      justify-content: center;
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

    .${PREFIX}-modebar {
      display: flex;
      flex: 0 0 auto;
      align-items: center;
      justify-content: space-between;
      gap: 14px;
      margin: 0 28px 10px;
      padding-bottom: 10px;
      border-bottom: 1px solid var(--soop-fm-border);
    }

    .${PREFIX}-modes {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px;
      border-radius: 12px;
      background: var(--soop-fm-surface);
    }

    .${PREFIX}-modes button {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      height: 38px;
      padding: 0 16px;
      border: 1px solid transparent;
      border-radius: 9px;
      background: transparent;
      color: var(--soop-fm-muted);
      font: 700 14px/1 -apple-system, BlinkMacSystemFont, "Segoe UI",
        "Noto Sans KR", sans-serif;
      cursor: pointer;
    }

    .${PREFIX}-modes button:hover {
      color: var(--soop-fm-text);
    }

    .${PREFIX}-modes button[aria-pressed="true"] {
      border-color: rgba(1, 130, 255, 0.3);
      background: var(--soop-fm-card);
      box-shadow: 0 2px 9px rgba(1, 130, 255, 0.11);
      color: var(--soop-fm-accent);
    }

    .${PREFIX}-modes em {
      min-width: 22px;
      padding: 3px 6px;
      border-radius: 999px;
      background: rgba(117, 123, 138, 0.13);
      font-size: 11px;
      font-style: normal;
      text-align: center;
    }

    .${PREFIX}-history-link {
      display: inline-flex;
      align-items: center;
      min-height: 36px;
      padding: 0 12px;
      border: 1px solid var(--soop-fm-border);
      border-radius: 9px;
      background: var(--soop-fm-card);
      color: var(--soop-fm-muted);
      font: 650 12px/1 -apple-system, BlinkMacSystemFont, "Segoe UI",
        "Noto Sans KR", sans-serif;
      text-decoration: none;
      white-space: nowrap;
    }

    .${PREFIX}-history-link:hover {
      border-color: rgba(1, 130, 255, 0.32);
      color: var(--soop-fm-accent);
    }

    .layer_container.${PREFIX}-root > .btn_close {
      top: 22px !important;
      right: 26px !important;
      width: 32px !important;
      height: 32px !important;
      border-radius: 50%;
      transition: background-color 0.18s ease;
    }

    .layer_container.${PREFIX}-root > .btn_close:hover {
      background-color: var(--soop-fm-surface) !important;
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
      .form
      input[type="text"] {
      height: 44px !important;
      border: 1px solid var(--soop-fm-border) !important;
      background: var(--soop-fm-surface) !important;
      color: var(--soop-fm-text) !important;
      font-size: 15px !important;
      transition: border-color 0.18s ease, box-shadow 0.18s ease;
    }

    .layer_container.${PREFIX}-root
      .my_adm_layer
      .search_area
      .form
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
      flex: 0 0 auto;
      min-height: 38px;
      margin: 0 !important;
      padding: 0 28px 8px !important;
    }

    .${PREFIX}-toolbar {
      display: flex;
      flex: 0 0 auto;
      align-items: center;
      gap: 12px;
      min-height: 54px;
      margin: 0 28px 8px;
      padding: 8px 10px;
      border: 1px solid var(--soop-fm-border);
      border-radius: 12px;
      background: var(--soop-fm-surface);
      box-sizing: border-box;
    }

    .${PREFIX}-filters,
    .${PREFIX}-sub-filters {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 6px;
    }

    .${PREFIX}-filters button,
    .${PREFIX}-sub-filters button,
    .${PREFIX}-density {
      display: inline-flex;
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
      transition: border-color 0.16s ease, background-color 0.16s ease,
        color 0.16s ease;
    }

    .${PREFIX}-filters button:hover,
    .${PREFIX}-sub-filters button:hover,
    .${PREFIX}-density:hover {
      border-color: var(--soop-fm-border);
      background: var(--soop-fm-card);
      color: var(--soop-fm-text);
    }

    .${PREFIX}-filters button[aria-pressed="true"],
    .${PREFIX}-sub-filters button[aria-pressed="true"] {
      border-color: rgba(1, 130, 255, 0.28);
      background: rgba(1, 130, 255, 0.12);
      color: var(--soop-fm-accent);
    }

    .${PREFIX}-filters button[data-filter="live"][aria-pressed="true"] {
      border-color: rgba(255, 64, 87, 0.25);
      background: rgba(255, 64, 87, 0.11);
      color: var(--soop-fm-live);
    }

    .${PREFIX}-sub-filters button[data-sub-filter="live"][aria-pressed="true"] {
      border-color: rgba(255, 64, 87, 0.25);
      background: rgba(255, 64, 87, 0.11);
      color: var(--soop-fm-live);
    }

    .${PREFIX}-filters button em,
    .${PREFIX}-sub-filters button em {
      min-width: 18px;
      padding: 2px 5px;
      border-radius: 999px;
      background: rgba(117, 123, 138, 0.12);
      font-size: 11px;
      font-style: normal;
      text-align: center;
    }

    .${PREFIX}-sub-filters {
      display: none;
    }

    .layer_container.${PREFIX}-root.${PREFIX}-view-subscription
      .${PREFIX}-filters {
      display: none;
    }

    .layer_container.${PREFIX}-root.${PREFIX}-view-subscription
      .${PREFIX}-sub-filters {
      display: flex;
    }

    .${PREFIX}-summary {
      overflow: hidden;
      margin-left: auto;
      color: var(--soop-fm-muted);
      font: 500 13px/1.35 -apple-system, BlinkMacSystemFont, "Segoe UI",
        "Noto Sans KR", sans-serif;
      white-space: nowrap;
      text-overflow: ellipsis;
    }

    .${PREFIX}-density {
      flex: 0 0 auto;
      border-color: var(--soop-fm-border);
      background: var(--soop-fm-card);
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
      .strm_list::-webkit-scrollbar {
      width: 11px;
    }

    .layer_container.${PREFIX}-root
      .my_adm_layer
      .strm_area
      .strm_list::-webkit-scrollbar-thumb {
      border: 3px solid transparent;
      border-radius: 999px;
      background: rgba(117, 123, 138, 0.52) !important;
      background-clip: padding-box !important;
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
      .nick
      span:first-child {
      max-width: none !important;
      white-space: nowrap;
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

    .layer_container.${PREFIX}-root
      .my_adm_layer
      .strm_area
      .strm_list
      > li
      .util_btn_wrap
      button.alarm_on::after {
      content: "알림 켜짐";
      color: var(--soop-fm-accent);
    }

    .layer_container.${PREFIX}-root
      .my_adm_layer
      .strm_area
      .strm_list
      > li
      .util_btn_wrap
      button.alarm_off::after {
      content: "알림 꺼짐";
    }

    .layer_container.${PREFIX}-root
      .my_adm_layer
      .strm_area
      .strm_list
      > li
      .util_btn_wrap
      button.fav_on::after {
      content: "즐겨찾기 해제";
      color: #e45062;
    }

    .layer_container.${PREFIX}-root
      .my_adm_layer
      .strm_area
      .strm_list
      > li
      .util_btn_wrap
      button.fav_off::after {
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
      transition: border-color 0.16s ease, background-color 0.16s ease,
        color 0.16s ease;
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

    .${PREFIX}-sub-panel {
      display: none;
      flex: 1 1 auto;
      overflow: auto;
      min-height: 0;
      padding: 4px 28px 26px;
      box-sizing: border-box;
      overscroll-behavior: contain;
      scrollbar-gutter: stable;
    }

    .layer_container.${PREFIX}-root.${PREFIX}-view-subscription
      .${PREFIX}-sub-panel {
      display: block;
    }

    .layer_container.${PREFIX}-root.${PREFIX}-view-subscription
      .my_adm_layer
      .strm_area
      > .total_wrap,
    .layer_container.${PREFIX}-root.${PREFIX}-view-subscription
      .my_adm_layer
      .strm_area
      > .strm_list,
    .layer_container.${PREFIX}-root.${PREFIX}-view-subscription
      .my_adm_layer
      .strm_area
      > .${PREFIX}-empty {
      display: none !important;
    }

    .${PREFIX}-sub-panel::-webkit-scrollbar {
      width: 11px;
    }

    .${PREFIX}-sub-panel::-webkit-scrollbar-thumb {
      border: 3px solid transparent;
      border-radius: 999px;
      background: rgba(117, 123, 138, 0.52);
      background-clip: padding-box;
    }

    .${PREFIX}-sub-status {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 220px;
      padding: 28px;
      border: 1px dashed var(--soop-fm-border);
      border-radius: 13px;
      color: var(--soop-fm-muted);
      font: 600 14px/1.6 -apple-system, BlinkMacSystemFont, "Segoe UI",
        "Noto Sans KR", sans-serif;
      text-align: center;
    }

    .${PREFIX}-sub-status a {
      color: var(--soop-fm-accent);
    }

    .${PREFIX}-sub-grid {
      display: grid;
      grid-template-columns: repeat(
        auto-fill,
        minmax(min(430px, 100%), 1fr)
      );
      align-content: start;
      gap: 10px;
    }

    .${PREFIX}-sub-card {
      display: grid;
      grid-template-areas:
        "avatar info"
        "avatar actions";
      grid-template-columns: 66px minmax(0, 1fr);
      grid-template-rows: minmax(38px, auto) minmax(44px, auto);
      align-items: center;
      overflow: hidden;
      min-height: 94px;
      padding: 8px 11px;
      border: 1px solid var(--soop-fm-border);
      border-radius: 13px;
      background: var(--soop-fm-card);
      box-sizing: border-box;
      transition: border-color 0.16s ease, background-color 0.16s ease,
        box-shadow 0.16s ease, transform 0.16s ease;
    }

    .${PREFIX}-sub-card:hover {
      border-color: rgba(1, 130, 255, 0.32);
      background: var(--soop-fm-surface-hover);
      box-shadow: 0 6px 18px rgba(1, 130, 255, 0.09);
      transform: translateY(-1px);
    }

    .${PREFIX}-sub-avatar {
      position: relative;
      display: flex;
      grid-area: avatar;
      align-items: center;
      justify-content: center;
      align-self: center;
      width: 58px;
      height: 58px;
      border-radius: 50%;
      background: var(--soop-fm-surface);
      color: var(--soop-fm-muted);
      font: 750 16px/1 -apple-system, BlinkMacSystemFont, "Segoe UI",
        "Noto Sans KR", sans-serif;
      object-fit: cover;
    }

    .${PREFIX}-sub-avatar.is-live {
      padding: 2px;
      border: 2px solid var(--soop-fm-live);
      background: var(--soop-fm-card);
    }

    .${PREFIX}-sub-info {
      grid-area: info;
      overflow: hidden;
      min-width: 0;
      padding: 0 4px;
    }

    .${PREFIX}-sub-name-line {
      display: flex;
      align-items: center;
      gap: 6px;
      overflow: hidden;
    }

    .${PREFIX}-sub-name {
      overflow: hidden;
      color: var(--soop-fm-text);
      font: 750 14px/1.3 -apple-system, BlinkMacSystemFont, "Segoe UI",
        "Noto Sans KR", sans-serif;
      text-decoration: none;
      white-space: nowrap;
      text-overflow: ellipsis;
    }

    .${PREFIX}-sub-badge {
      flex: 0 0 auto;
      padding: 2px 5px;
      border-radius: 5px;
      background: rgba(1, 130, 255, 0.13);
      color: var(--soop-fm-accent);
      font: 700 10px/1.2 -apple-system, BlinkMacSystemFont, "Segoe UI",
        "Noto Sans KR", sans-serif;
    }

    .${PREFIX}-sub-detail {
      display: block;
      overflow: hidden;
      margin-top: 4px;
      color: var(--soop-fm-muted);
      font: 500 12px/1.25 -apple-system, BlinkMacSystemFont, "Segoe UI",
        "Noto Sans KR", sans-serif;
      white-space: nowrap;
      text-overflow: ellipsis;
    }

    .${PREFIX}-sub-actions {
      display: grid;
      grid-area: actions;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 4px;
      min-width: 0;
    }

    .${PREFIX}-sub-actions button {
      display: inline-flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 2px;
      overflow: hidden;
      height: 42px;
      padding: 0 2px;
      border: 1px solid transparent;
      border-radius: 9px;
      background: transparent;
      color: var(--soop-fm-muted);
      font: 650 10.5px/1 -apple-system, BlinkMacSystemFont, "Segoe UI",
        "Noto Sans KR", sans-serif;
      white-space: nowrap;
      cursor: pointer;
    }

    .${PREFIX}-sub-actions button:hover {
      border-color: var(--soop-fm-border);
      background: var(--soop-fm-surface);
      color: var(--soop-fm-text);
    }

    .${PREFIX}-sub-actions button:disabled {
      opacity: 0.5;
      cursor: wait;
    }

    .${PREFIX}-sub-actions button.is-active {
      color: var(--soop-fm-accent);
    }

    .${PREFIX}-sub-actions button.is-favorite {
      color: #e45062;
    }

    .${PREFIX}-sub-action-icon {
      height: 19px;
      font-size: 17px;
      line-height: 19px;
    }

    .${PREFIX}-empty {
      display: none;
      flex: 1 1 auto;
      align-items: center;
      justify-content: center;
      min-height: 180px;
      margin: 4px 28px 26px;
      border: 1px dashed var(--soop-fm-border);
      border-radius: 13px;
      color: var(--soop-fm-muted);
      font: 600 14px/1.5 -apple-system, BlinkMacSystemFont, "Segoe UI",
        "Noto Sans KR", sans-serif;
      text-align: center;
    }

    .${PREFIX}-empty.is-visible {
      display: flex;
    }

    .layer_container.${PREFIX}-root.${PREFIX}-compact
      .my_adm_layer
      .strm_area
      .strm_list {
      grid-auto-rows: minmax(80px, auto);
      gap: 7px !important;
    }

    .layer_container.${PREFIX}-root.${PREFIX}-compact
      .my_adm_layer
      .strm_area
      .strm_list
      > li {
      min-height: 80px !important;
      padding-top: 4px !important;
      padding-bottom: 4px !important;
    }

    .layer_container.${PREFIX}-root.${PREFIX}-compact
      .my_adm_layer
      .strm_area
      .strm_list
      > li
      .thumb
      a {
      width: 52px !important;
      height: 52px !important;
    }

    .layer_container.${PREFIX}-root.${PREFIX}-compact
      .my_adm_layer
      .strm_area
      .strm_list
      > li
      .thumb
      a
      img {
      width: 48px !important;
      height: 48px !important;
    }

    .layer_container.${PREFIX}-root.${PREFIX}-compact
      .${PREFIX}-sub-grid {
      gap: 7px;
    }

    .layer_container.${PREFIX}-root.${PREFIX}-compact
      .${PREFIX}-sub-card {
      min-height: 80px;
      padding-top: 4px;
      padding-bottom: 4px;
    }

    .layer_container.${PREFIX}-root.${PREFIX}-compact
      .${PREFIX}-sub-avatar {
      width: 50px;
      height: 50px;
    }

    @media (max-width: 980px) {
      .layer_container.${PREFIX}-root {
        width: calc(100vw - 20px) !important;
        height: calc(100vh - 20px) !important;
      }

      .${PREFIX}-toolbar {
        align-items: flex-start;
        flex-wrap: wrap;
      }

      .${PREFIX}-summary {
        order: 3;
        width: 100%;
        margin-left: 4px;
      }
    }

    @media (max-width: 680px) {
      #${PREFIX}-fab {
        top: 94px;
        right: 14px;
        bottom: auto;
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

      .${PREFIX}-modebar {
        align-items: flex-start;
        margin: 0 14px 8px;
        padding-bottom: 8px;
      }

      .${PREFIX}-modes {
        overflow-x: auto;
        max-width: 100%;
      }

      .${PREFIX}-modes button {
        flex: 0 0 auto;
        height: 36px;
        padding: 0 12px;
      }

      .${PREFIX}-history-link {
        display: none;
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

      .${PREFIX}-filters,
      .${PREFIX}-sub-filters {
        flex: 1 1 100%;
        flex-wrap: nowrap;
        overflow-x: auto;
        padding-bottom: 2px;
      }

      .${PREFIX}-filters button,
      .${PREFIX}-sub-filters button {
        flex: 0 0 auto;
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

      .${PREFIX}-sub-panel {
        padding: 2px 14px 18px;
      }

      .${PREFIX}-sub-actions {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      .${PREFIX}-sub-card {
        grid-template-rows: minmax(38px, auto) minmax(84px, auto);
      }
    }
  `;

  function readDensity() {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'comfortable'
        ? 'comfortable'
        : 'compact';
    } catch {
      return 'compact';
    }
  }

  function writeDensity(value) {
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {
      // 저장소가 차단되어도 현재 세션에서는 정상 동작합니다.
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
        isVisible(button) && button.textContent.trim().includes('스트리머 관리'),
    );
  }

  function ensureFab() {
    const nativeButton = findNativeManagerButton();
    let fab = document.getElementById(`${PREFIX}-fab`);

    if (!nativeButton) {
      fab?.remove();
      return;
    }

    nativeButton.title = '즐겨찾기와 구독 스트리머를 한 화면에서 관리합니다.';

    if (fab) {
      return;
    }

    fab = document.createElement('button');
    fab.id = `${PREFIX}-fab`;
    fab.type = 'button';
    fab.innerHTML =
      '<span aria-hidden="true">★</span><span>즐겨찾기·구독 관리</span>';
    fab.setAttribute('aria-label', '즐겨찾기와 구독 통합 관리 창 열기');
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
        title?.textContent.includes('스트리머 관리') &&
          root.querySelector('.my_adm_layer .strm_area .strm_list') &&
          root.querySelector('input#search-inp'),
      );
    });
  }

  function createModebar() {
    const modebar = document.createElement('div');
    modebar.className = `${PREFIX}-modebar`;

    const modes = document.createElement('div');
    modes.className = `${PREFIX}-modes`;
    modes.setAttribute('role', 'tablist');
    modes.setAttribute('aria-label', '관리할 스트리머 종류');

    for (const view of [
      { id: 'favorite', icon: '★', label: '즐겨찾기' },
      { id: 'subscription', icon: '◆', label: '구독' },
    ]) {
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.view = view.id;
      button.setAttribute('role', 'tab');
      button.setAttribute('aria-pressed', String(state.view === view.id));
      button.innerHTML = `
        <span aria-hidden="true">${view.icon}</span>
        <span>${view.label}</span>
        <em>0</em>
      `;
      modes.append(button);
    }

    const history = document.createElement('a');
    history.className = `${PREFIX}-history-link`;
    history.href =
      'https://point.sooplive.com/Subscription/SubscriptionList.asp';
    history.target = '_blank';
    history.rel = 'noopener';
    history.textContent = '구독·결제 내역 ↗';

    modebar.append(modes, history);
    modebar.addEventListener('click', (event) => {
      const button = event.target.closest('button[data-view]');
      if (!button || button.dataset.view === state.view) {
        return;
      }

      state.view = button.dataset.view;
      refreshDashboard(state.activeRoot);

      if (state.view === 'subscription') {
        loadSubscriptions();
      }
    });

    return modebar;
  }

  function appendFilterButtons(container, filters, dataKey, activeFilter) {
    for (const filter of filters) {
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset[dataKey] = filter.id;
      button.setAttribute('aria-pressed', String(activeFilter === filter.id));

      const label = document.createElement('span');
      label.textContent = filter.label;
      const count = document.createElement('em');
      count.textContent = '0';

      button.append(label, count);
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

    appendFilterButtons(filters, FILTERS, 'filter', state.filter);

    const subscriptionFilters = document.createElement('div');
    subscriptionFilters.className = `${PREFIX}-sub-filters`;
    subscriptionFilters.setAttribute('role', 'group');
    subscriptionFilters.setAttribute('aria-label', '구독 스트리머 빠른 필터');
    appendFilterButtons(
      subscriptionFilters,
      SUBSCRIPTION_FILTERS,
      'subFilter',
      state.subscriptionFilter,
    );

    const summary = document.createElement('div');
    summary.className = `${PREFIX}-summary`;
    summary.setAttribute('aria-live', 'polite');

    const density = document.createElement('button');
    density.type = 'button';
    density.className = `${PREFIX}-density`;
    density.dataset.action = 'density';

    toolbar.append(filters, subscriptionFilters, summary, density);
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

      if (button.dataset.subFilter) {
        state.subscriptionFilter = button.dataset.subFilter;
        refreshDashboard(state.activeRoot);
        return;
      }

      if (button.dataset.action === 'density') {
        state.density =
          state.density === 'compact' ? 'comfortable' : 'compact';
        writeDensity(state.density);
        refreshDashboard(state.activeRoot);
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
    root.setAttribute('aria-label', 'SOOP 즐겨찾기와 구독 스트리머 통합 관리');

    let modebar = root.querySelector(`:scope > .${PREFIX}-modebar`);
    if (!modebar) {
      modebar = createModebar();
      root.querySelector(':scope > h3')?.insertAdjacentElement(
        'afterend',
        modebar,
      );
    }

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

    let subscriptionPanel = area.querySelector(
      `:scope > .${PREFIX}-sub-panel`,
    );
    if (!subscriptionPanel) {
      subscriptionPanel = document.createElement('div');
      subscriptionPanel.className = `${PREFIX}-sub-panel`;
      subscriptionPanel.setAttribute('role', 'tabpanel');
      subscriptionPanel.setAttribute('aria-label', '구독 스트리머');
      area.append(subscriptionPanel);
    }

    const searchInput = root.querySelector('input#search-inp');
    if (searchInput && !searchInput.dataset.soopFmUnifiedListener) {
      searchInput.dataset.soopFmUnifiedListener = 'true';
      searchInput.addEventListener('input', () => {
        if (state.view === 'subscription') {
          renderSubscriptions(root);
        }
      });
    }

    for (const row of [...list.children]) {
      if (row.tagName === 'LI') {
        enhanceRow(row);
      }
    }

    refreshDashboard(root);
    loadSubscriptions();
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
      alarmButton.title = isOn ? '알림 켜짐 — 클릭하여 끄기' : '알림 꺼짐 — 클릭하여 켜기';
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
            '.util_btn_wrap button, .select_box_item button, .' +
              `${PREFIX}-quick button`,
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

  function getSubscriptionSourceUrl() {
    const override =
      document.documentElement.dataset.soopFmSubscribeUrl?.trim();
    return new URL(override || '/my/subscribe', location.origin).href;
  }

  function findSubscriptionSourceList(sourceDocument) {
    return [...sourceDocument.querySelectorAll('.layer_container')]
      .filter((root) =>
        normalize(root.querySelector(':scope > h3')?.textContent).includes(
          '스트리머 관리',
        ),
      )
      .map((root) =>
        root.querySelector('.my_adm_layer .strm_area > .strm_list'),
      )
      .find(Boolean);
  }

  function loadSubscriptions() {
    if (
      state.subscriptionLoading ||
      state.subscriptionLoaded ||
      state.subscriptionIframe
    ) {
      return;
    }

    state.subscriptionLoading = true;
    state.subscriptionError = '';
    refreshDashboard(state.activeRoot);

    const iframe = document.createElement('iframe');
    iframe.id = `${PREFIX}-sub-source`;
    iframe.title = 'SOOP 구독 관리 원본 기능';
    iframe.setAttribute('aria-hidden', 'true');
    state.subscriptionIframe = iframe;

    iframe.addEventListener(
      'load',
      () => {
        initializeSubscriptionSource(iframe);
      },
      { once: true },
    );
    iframe.src = getSubscriptionSourceUrl();
    document.body.append(iframe);
  }

  async function initializeSubscriptionSource(iframe) {
    try {
      const sourceDocument = iframe.contentDocument;
      if (!sourceDocument) {
        throw new Error('구독 페이지 문서에 접근할 수 없습니다.');
      }

      let list = findSubscriptionSourceList(sourceDocument);
      if (!list) {
        const managerButton = await waitFor(
          () => sourceDocument.querySelector('button.fav_manage'),
          15000,
        );
        if (!managerButton) {
          throw new Error(
            '구독 페이지의 스트리머 관리 버튼을 찾지 못했습니다.',
          );
        }
        managerButton.click();
        list = await waitFor(
          () => findSubscriptionSourceList(sourceDocument),
          15000,
        );
      }

      if (!list) {
        throw new Error('구독 스트리머 목록을 불러오지 못했습니다.');
      }

      state.subscriptionList = list;
      state.subscriptionLoading = false;
      state.subscriptionLoaded = true;
      state.subscriptionError = '';
      syncSubscriptions();

      state.subscriptionObserver?.disconnect();
      state.subscriptionObserver = new iframe.contentWindow.MutationObserver(
        scheduleSubscriptionSync,
      );
      state.subscriptionObserver.observe(sourceDocument.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class', 'src'],
      });
    } catch (error) {
      state.subscriptionLoading = false;
      state.subscriptionLoaded = false;
      state.subscriptionError =
        error?.message || '구독 정보를 불러오지 못했습니다.';
      refreshDashboard(state.activeRoot);
    }
  }

  function scheduleSubscriptionSync() {
    clearTimeout(state.subscriptionSyncTimer);
    state.subscriptionSyncTimer = setTimeout(syncSubscriptions, 160);
  }

  function readSubscriptions(list) {
    return [...list.children]
      .filter((row) => row.tagName === 'LI')
      .map((row, index) => {
        const nickLink = row.querySelector('.nick');
        const nickname =
          normalize(
            row.querySelector('.nick span:first-child')?.textContent,
          ) ||
          normalize(nickLink?.textContent) ||
          `구독 스트리머 ${index + 1}`;
        const href = nickLink?.href || nickLink?.getAttribute('href') || '';
        const userId = (() => {
          try {
            const url = new URL(href, location.origin);
            return (
              url.searchParams.get('bjid') ||
              url.pathname.split('/').filter(Boolean).at(-1) ||
              ''
            );
          } catch {
            return '';
          }
        })();
        const avatarNode = row.querySelector('.thumb img');
        const tier =
          normalize(
            row.querySelector('.subscribe_tier .months')?.textContent,
          ) ||
          normalize(
            row.querySelector('.subscribe_tier')?.textContent,
          );
        const subscriptionNickname = (
          normalize(
            row.querySelector('.subscribe_nick em')?.textContent,
          ) ||
          normalize(
            row.querySelector('.subscribe_nick')?.textContent,
          )
        ).replace(/^구독\s*닉네임\s*:?\s*/u, '');
        const lastLive = normalize(
          row.querySelector('.last_live')?.textContent,
        );

        return {
          key: href || `${nickname}:${index}`,
          nickname,
          href,
          userId,
          avatar: avatarNode?.currentSrc || avatarNode?.src || '',
          tier,
          subscriptionNickname,
          lastLive,
          live: row.classList.contains('live'),
          pinned: Boolean(row.querySelector('.thumb > .pin')),
          favorite: Boolean(row.querySelector('.util_btn_wrap .fav_on')),
          sourceRow: row,
        };
      });
  }

  function syncSubscriptions() {
    try {
      const sourceDocument = state.subscriptionIframe?.contentDocument;
      const list =
        (sourceDocument && findSubscriptionSourceList(sourceDocument)) ||
        state.subscriptionList;
      if (!list) {
        return;
      }

      state.subscriptionList = list;
      state.subscriptions = readSubscriptions(list);
      state.subscriptionLoaded = true;
      state.subscriptionLoading = false;
      state.subscriptionError = '';
      refreshDashboard(state.activeRoot);
    } catch {
      state.subscriptionError =
        '구독 페이지 연결이 끊어졌습니다. 구독 페이지를 직접 열어 확인해 주세요.';
      refreshDashboard(state.activeRoot);
    }
  }

  function getSubscriptionFlags(item) {
    return {
      live: item.live,
      pinned: item.pinned,
      'favorite-on': item.favorite,
      'favorite-off': !item.favorite,
    };
  }

  function createSubscriptionCard(item) {
    const card = document.createElement('article');
    card.className = `${PREFIX}-sub-card`;

    let avatar;
    if (item.avatar) {
      avatar = document.createElement('img');
      avatar.src = item.avatar;
      avatar.alt = '';
      avatar.loading = 'lazy';
    } else {
      avatar = document.createElement('span');
      avatar.textContent = item.nickname.slice(0, 2);
      avatar.setAttribute('aria-hidden', 'true');
    }
    avatar.className = `${PREFIX}-sub-avatar${item.live ? ' is-live' : ''}`;

    const info = document.createElement('div');
    info.className = `${PREFIX}-sub-info`;
    const nameLine = document.createElement('div');
    nameLine.className = `${PREFIX}-sub-name-line`;
    const name = document.createElement(item.href ? 'a' : 'span');
    name.className = `${PREFIX}-sub-name`;
    name.textContent = item.nickname;
    if (item.href) {
      name.href = item.href;
      name.target = '_blank';
      name.rel = 'noopener';
    }
    nameLine.append(name);

    const badge = document.createElement('span');
    badge.className = `${PREFIX}-sub-badge`;
    badge.textContent = item.live ? 'LIVE' : item.tier || '구독 중';
    nameLine.append(badge);

    const detail = document.createElement('span');
    detail.className = `${PREFIX}-sub-detail`;
    detail.textContent =
      [
        item.subscriptionNickname &&
          `구독 닉네임 ${item.subscriptionNickname}`,
        item.tier,
        item.lastLive,
      ]
        .filter(Boolean)
        .join(' · ') || (item.userId ? `ID ${item.userId}` : '구독 중');
    info.append(nameLine, detail);

    const actions = document.createElement('div');
    actions.className = `${PREFIX}-sub-actions`;
    const actionSpecs = [
      {
        id: 'favorite',
        icon: item.favorite ? '★' : '☆',
        label: item.favorite ? '즐겨찾기 해제' : '즐겨찾기 추가',
        className: item.favorite ? 'is-favorite' : '',
      },
      { id: 'nickname', icon: '✎', label: '구독 닉네임' },
      { id: 'payment', icon: '▤', label: '결제 정보' },
      {
        id: 'pin',
        icon: '◆',
        label: item.pinned ? '고정 해제' : '상단 고정',
        className: item.pinned ? 'is-active' : '',
      },
    ];

    for (const spec of actionSpecs) {
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.action = spec.id;
      button.className = spec.className;
      button.setAttribute('aria-label', `${item.nickname} ${spec.label}`);
      button.innerHTML = `
        <span class="${PREFIX}-sub-action-icon" aria-hidden="true">${spec.icon}</span>
        <span>${spec.label}</span>
      `;
      button.addEventListener('click', async () => {
        if (button.disabled) {
          return;
        }
        button.disabled = true;
        try {
          await runSubscriptionAction(item, spec.id);
        } finally {
          setTimeout(() => {
            button.disabled = false;
            scheduleSubscriptionSync();
          }, 350);
        }
      });
      actions.append(button);
    }

    card.append(avatar, info, actions);
    return card;
  }

  function renderSubscriptions(root) {
    const panel = root?.querySelector(`.${PREFIX}-sub-panel`);
    if (!panel) {
      return;
    }

    const query = normalize(
      root.querySelector('input#search-inp')?.value,
    ).toLocaleLowerCase('ko');
    const signature = JSON.stringify({
      loading: state.subscriptionLoading,
      loaded: state.subscriptionLoaded,
      error: state.subscriptionError,
      filter: state.subscriptionFilter,
      query,
      items: state.subscriptions.map((item) => [
        item.key,
        item.nickname,
        item.avatar,
        item.tier,
        item.subscriptionNickname,
        item.lastLive,
        item.live,
        item.pinned,
        item.favorite,
      ]),
    });
    if (panel.dataset.renderKey === signature) {
      return;
    }
    panel.dataset.renderKey = signature;
    panel.replaceChildren();

    if (state.subscriptionLoading) {
      const status = document.createElement('div');
      status.className = `${PREFIX}-sub-status`;
      status.textContent = '구독 스트리머 정보를 불러오는 중입니다…';
      panel.append(status);
      return;
    }

    if (state.subscriptionError) {
      const status = document.createElement('div');
      status.className = `${PREFIX}-sub-status`;
      const message = document.createElement('span');
      message.textContent = `${state.subscriptionError} `;
      const link = document.createElement('a');
      link.href = 'https://www.sooplive.com/my/subscribe';
      link.target = '_blank';
      link.rel = 'noopener';
      link.textContent = '구독 페이지 열기 ↗';
      status.append(message, link);
      panel.append(status);
      return;
    }

    const visibleItems = state.subscriptions.filter((item) => {
      const flags = getSubscriptionFlags(item);
      const filterMatches =
        state.subscriptionFilter === 'all' ||
        Boolean(flags[state.subscriptionFilter]);
      const searchable = [
        item.nickname,
        item.userId,
        item.tier,
        item.subscriptionNickname,
      ]
        .join(' ')
        .toLocaleLowerCase('ko');
      return filterMatches && (!query || searchable.includes(query));
    });

    if (visibleItems.length === 0) {
      const status = document.createElement('div');
      status.className = `${PREFIX}-sub-status`;
      status.textContent = state.subscriptions.length
        ? '검색 또는 선택한 조건에 맞는 구독 스트리머가 없습니다.'
        : '현재 구독 중인 스트리머가 없습니다.';
      panel.append(status);
      return;
    }

    const grid = document.createElement('div');
    grid.className = `${PREFIX}-sub-grid`;
    for (const item of visibleItems) {
      grid.append(createSubscriptionCard(item));
    }
    panel.append(grid);
  }

  function ensureSourceCloseButton() {
    let close = document.getElementById(`${PREFIX}-source-close`);
    if (close) {
      return close;
    }
    close = document.createElement('button');
    close.id = `${PREFIX}-source-close`;
    close.type = 'button';
    close.textContent = '← 설정을 마치고 통합 관리로 돌아가기';
    close.addEventListener('click', hideSubscriptionSource);
    document.body.append(close);
    return close;
  }

  function showSubscriptionSource() {
    const iframe = state.subscriptionIframe;
    if (!iframe) {
      return;
    }
    iframe.classList.add('is-interacting');
    iframe.setAttribute('aria-hidden', 'false');
    ensureSourceCloseButton().classList.add('is-visible');
  }

  function hideSubscriptionSource() {
    state.subscriptionIframe?.classList.remove('is-interacting');
    state.subscriptionIframe?.setAttribute('aria-hidden', 'true');
    document
      .getElementById(`${PREFIX}-source-close`)
      ?.classList.remove('is-visible');
    scheduleSubscriptionSync();
  }

  async function runSubscriptionAction(item, action) {
    const row = item.sourceRow;
    if (!row?.isConnected) {
      showToast('구독 정보가 갱신되었습니다. 잠시 후 다시 시도해 주세요.');
      syncSubscriptions();
      return;
    }

    if (action === 'favorite') {
      const favoriteButton = row.querySelector(
        '.util_btn_wrap button.fav_on, .util_btn_wrap button.fav_off',
      );
      if (!favoriteButton) {
        showToast('즐겨찾기 설정 버튼을 찾지 못했습니다.');
        return;
      }
      favoriteButton.click();
      showToast(
        item.favorite
          ? `${item.nickname} 즐겨찾기를 해제했습니다.`
          : `${item.nickname}을(를) 즐겨찾기에 추가했습니다.`,
      );
      return;
    }

    await runSubscriptionMenuAction(row, action);
  }

  async function runSubscriptionMenuAction(row, action) {
    const menuButton = row.querySelector('button.more_dot');
    if (!menuButton) {
      showToast('이 스트리머의 구독 설정 메뉴를 찾지 못했습니다.');
      return;
    }

    const labels = {
      nickname: ['구독 닉네임 변경'],
      payment: ['구독 결제정보'],
      pin: ['고정 해제하기', '고정하기'],
    }[action];
    const needsVisibleSource = action === 'nickname' || action === 'payment';
    if (needsVisibleSource) {
      showSubscriptionSource();
      row.scrollIntoView({ block: 'center' });
    }

    menuButton.click();
    const actionButton = await waitFor(() => {
      return [...row.querySelectorAll('.select_list button')].find((button) =>
        labels.some((label) =>
          normalize(button.textContent).includes(label),
        ),
      );
    }, 1600);

    if (!actionButton) {
      menuButton.click();
      if (needsVisibleSource) {
        hideSubscriptionSource();
      }
      showToast('요청한 구독 설정 메뉴를 찾지 못했습니다.');
      return;
    }

    actionButton.click();
    if (action === 'pin') {
      showToast('구독 스트리머 고정 설정을 변경했습니다.');
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
          button.textContent.replace(/\s+/g, ' ').trim().includes(label),
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

    const isSubscriptionView = state.view === 'subscription';
    root.classList.toggle(
      `${PREFIX}-compact`,
      state.density === 'compact',
    );
    root.classList.toggle(
      `${PREFIX}-view-subscription`,
      isSubscriptionView,
    );

    const list = root.querySelector('.my_adm_layer .strm_list');
    const toolbar = root.querySelector(`.${PREFIX}-toolbar`);
    const empty = root.querySelector(`.${PREFIX}-empty`);
    if (!list || !toolbar || !empty) {
      return;
    }

    const rows = [...list.children].filter((row) => row.tagName === 'LI');
    const counts = {
      all: rows.length,
      live: 0,
      pinned: 0,
      'alarm-on': 0,
      'alarm-off': 0,
    };

    for (const row of rows) {
      const flags = {
        live: row.classList.contains('live'),
        pinned: Boolean(row.querySelector('.thumb > .pin')),
        'alarm-on': Boolean(row.querySelector('.util_btn_wrap .alarm_on')),
        'alarm-off': Boolean(row.querySelector('.util_btn_wrap .alarm_off')),
      };

      for (const key of Object.keys(flags)) {
        if (flags[key]) {
          counts[key] += 1;
        }
      }

      row.hidden =
        state.filter !== 'all' && !Boolean(flags[state.filter]);
    }

    const modebar = root.querySelector(`.${PREFIX}-modebar`);
    for (const button of modebar?.querySelectorAll('button[data-view]') || []) {
      const isActive = button.dataset.view === state.view;
      button.setAttribute('aria-pressed', String(isActive));
      button.setAttribute('aria-selected', String(isActive));
      const count =
        button.dataset.view === 'favorite'
          ? rows.length
          : state.subscriptionLoading && !state.subscriptionLoaded
            ? '…'
            : state.subscriptions.length;
      setText(button.querySelector('em'), String(count));
    }

    setText(
      root.querySelector(':scope > h3 .total_txt'),
      isSubscriptionView
        ? state.subscriptionLoading && !state.subscriptionLoaded
          ? '(구독 불러오는 중)'
          : `(구독 ${state.subscriptions.length}명)`
        : `(${rows.length}명)`,
    );

    for (const button of toolbar.querySelectorAll('button[data-filter]')) {
      const id = button.dataset.filter;
      button.setAttribute('aria-pressed', String(state.filter === id));
      setText(button.querySelector('em'), String(counts[id] ?? 0));
    }

    const subscriptionCounts = {
      all: state.subscriptions.length,
      live: 0,
      pinned: 0,
      'favorite-on': 0,
      'favorite-off': 0,
    };
    for (const item of state.subscriptions) {
      const flags = getSubscriptionFlags(item);
      for (const key of Object.keys(flags)) {
        if (flags[key]) {
          subscriptionCounts[key] += 1;
        }
      }
    }
    for (const button of toolbar.querySelectorAll(
      'button[data-sub-filter]',
    )) {
      const id = button.dataset.subFilter;
      button.setAttribute(
        'aria-pressed',
        String(state.subscriptionFilter === id),
      );
      setText(button.querySelector('em'), String(subscriptionCounts[id] ?? 0));
    }

    const favoriteVisibleCount = rows.filter((row) => !row.hidden).length;
    const query = normalize(
      root.querySelector('input#search-inp')?.value,
    ).toLocaleLowerCase('ko');
    const subscriptionVisibleCount = state.subscriptions.filter((item) => {
      const flags = getSubscriptionFlags(item);
      const filterMatches =
        state.subscriptionFilter === 'all' ||
        Boolean(flags[state.subscriptionFilter]);
      const searchable = [
        item.nickname,
        item.userId,
        item.tier,
        item.subscriptionNickname,
      ]
        .join(' ')
        .toLocaleLowerCase('ko');
      return filterMatches && (!query || searchable.includes(query));
    }).length;

    const summary = toolbar.querySelector(`.${PREFIX}-summary`);
    const summaryText = isSubscriptionView
      ? state.subscriptionLoading
        ? '구독 정보를 불러오는 중…'
        : [
            `표시 ${subscriptionVisibleCount}명`,
            `LIVE ${subscriptionCounts.live}명`,
            `고정 ${subscriptionCounts.pinned}명`,
            `즐겨찾기 ${subscriptionCounts['favorite-on']}명`,
          ].join(' · ')
      : [
          `표시 ${favoriteVisibleCount}명`,
          `LIVE ${counts.live}명`,
          `고정 ${counts.pinned}명`,
          `알림 ${counts['alarm-on']}명`,
        ].join(' · ');
    setText(summary, summaryText);

    const densityButton = toolbar.querySelector('[data-action="density"]');
    setText(
      densityButton,
      state.density === 'compact' ? '↔ 여유 있게' : '↔ 촘촘하게',
    );
    densityButton?.setAttribute(
      'aria-label',
      state.density === 'compact'
        ? '카드 간격을 여유 있게 변경'
        : '카드 간격을 촘촘하게 변경',
    );

    const searchInput = root.querySelector('input#search-inp');
    if (searchInput) {
      searchInput.placeholder = isSubscriptionView
        ? '구독 스트리머를 검색해 주세요.'
        : '즐겨찾기 스트리머를 검색해 주세요.';
    }

    empty.classList.toggle(
      'is-visible',
      !isSubscriptionView &&
        rows.length > 0 &&
        favoriteVisibleCount === 0,
    );
    list.hidden =
      !isSubscriptionView &&
      rows.length > 0 &&
      favoriteVisibleCount === 0;

    if (isSubscriptionView) {
      renderSubscriptions(root);
    }
  }

  function normalize(value) {
    return String(value ?? '').replace(/\s+/g, ' ').trim();
  }

  function setText(element, value) {
    if (element && element.textContent !== value) {
      element.textContent = value;
    }
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
