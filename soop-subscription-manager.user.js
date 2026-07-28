// ==UserScript==
// @name         SOOP 구독 한눈에 관리
// @namespace    https://www.sooplive.com/
// @version      1.1.0
// @description  SOOP 구독 스트리머 관리 창과 구독·결제 내역 페이지를 검색 가능한 카드형 대시보드로 개선합니다.
// @author       Codex
// @homepageURL  https://github.com/heggng/soop-unified-manager
// @supportURL   https://github.com/heggng/soop-unified-manager/issues
// @updateURL    https://raw.githubusercontent.com/heggng/soop-unified-manager/main/soop-subscription-manager.user.js
// @downloadURL  https://raw.githubusercontent.com/heggng/soop-unified-manager/main/soop-subscription-manager.user.js
// @match        https://www.sooplive.com/my/subscribe*
// @match        https://sooplive.com/my/subscribe*
// @match        https://point.sooplive.com/Subscription/SubscriptionList.asp*
// @icon         https://www.sooplive.com/favicon.ico
// @grant        none
// @run-at       document-idle
// @license      MIT
// ==/UserScript==

(() => {
  'use strict';

  const PREFIX = 'soop-sub';
  const POINT_PAGE = location.pathname
    .toLowerCase()
    .includes('/subscription/subscriptionlist.asp');

  const style = document.createElement('style');
  style.id = `${PREFIX}-style`;
  style.textContent = `
    :root {
      --ss-accent: #0182ff;
      --ss-cyan: #09b6e8;
      --ss-danger: #ef5367;
      --ss-warning: #f4b400;
      --ss-success: #12a878;
      --ss-bg: #ffffff;
      --ss-surface: #f6f8fb;
      --ss-card: #ffffff;
      --ss-text: #17191c;
      --ss-muted: #737988;
      --ss-border: rgba(23, 25, 28, 0.12);
      --ss-shadow: 0 18px 60px rgba(0, 0, 0, 0.22);
    }

    html[dark="true"] {
      --ss-bg: #17191d;
      --ss-surface: #23262c;
      --ss-card: #1e2126;
      --ss-text: #e8eaf0;
      --ss-muted: #a3a8b4;
      --ss-border: rgba(246, 246, 249, 0.12);
      --ss-shadow: 0 20px 70px rgba(0, 0, 0, 0.55);
    }

    #${PREFIX}-fab {
      position: fixed;
      right: 24px;
      bottom: 24px;
      z-index: 9990;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      min-height: 46px;
      padding: 0 17px;
      border: 1px solid rgba(255, 255, 255, 0.18);
      border-radius: 999px;
      background: linear-gradient(135deg, #087cff, #09b6e8);
      box-shadow: 0 10px 28px rgba(1, 130, 255, 0.35);
      color: #fff;
      font: 700 14px/1 -apple-system, BlinkMacSystemFont, "Segoe UI",
        "Noto Sans KR", sans-serif;
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
      z-index: 10060;
      max-width: min(540px, calc(100vw - 32px));
      padding: 12px 17px;
      border-radius: 10px;
      background: #17191c;
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.3);
      color: #fff;
      font: 650 14px/1.45 -apple-system, BlinkMacSystemFont, "Segoe UI",
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

    /* www.sooplive.com/my/subscribe 관리 창 */
    .layer_container.${PREFIX}-manager {
      display: flex !important;
      flex-direction: column !important;
      overflow: hidden !important;
      width: min(1680px, calc(100vw - 32px)) !important;
      max-width: none !important;
      height: min(940px, calc(100vh - 32px)) !important;
      max-height: none !important;
      border-radius: 16px !important;
      background: var(--ss-bg) !important;
      box-shadow: var(--ss-shadow) !important;
      color: var(--ss-text) !important;
    }

    .layer_container.${PREFIX}-manager > h3 {
      flex: 0 0 auto;
      justify-content: flex-start !important;
      min-height: 68px;
      padding: 20px 72px 12px 28px !important;
      color: var(--ss-text) !important;
      font-size: 22px !important;
      text-align: left !important;
      box-sizing: border-box;
    }

    .layer_container.${PREFIX}-manager > h3::before {
      content: "◆";
      margin-right: 9px;
      color: var(--ss-cyan);
      font-size: 18px;
    }

    .layer_container.${PREFIX}-manager > h3 .total_txt {
      color: var(--ss-muted) !important;
      font-size: 14px !important;
    }

    .layer_container.${PREFIX}-manager > .btn_close {
      top: 22px !important;
      right: 26px !important;
      width: 32px !important;
      height: 32px !important;
      border-radius: 50%;
    }

    .layer_container.${PREFIX}-manager .my_adm_layer {
      display: flex !important;
      flex: 1 1 auto !important;
      flex-direction: column !important;
      overflow: hidden !important;
      width: 100% !important;
      min-height: 0 !important;
      padding-top: 0 !important;
    }

    .layer_container.${PREFIX}-manager .search_area {
      flex: 0 0 auto;
      width: auto !important;
      padding: 0 28px 10px !important;
    }

    .layer_container.${PREFIX}-manager
      .search_area
      input[type="text"] {
      height: 44px !important;
      border: 1px solid var(--ss-border) !important;
      background: var(--ss-surface) !important;
      color: var(--ss-text) !important;
    }

    .layer_container.${PREFIX}-manager .strm_area {
      display: flex !important;
      flex: 1 1 auto !important;
      flex-direction: column !important;
      overflow: hidden !important;
      min-height: 0 !important;
    }

    .layer_container.${PREFIX}-manager .total_wrap {
      flex: 0 0 auto;
      min-height: 38px;
      margin: 0 !important;
      padding: 0 28px 8px !important;
    }

    .${PREFIX}-manager-toolbar {
      display: flex;
      flex: 0 0 auto;
      align-items: center;
      gap: 10px;
      min-height: 54px;
      margin: 0 28px 8px;
      padding: 8px 10px;
      border: 1px solid var(--ss-border);
      border-radius: 12px;
      background: var(--ss-surface);
      box-sizing: border-box;
    }

    .${PREFIX}-manager-filters {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    .${PREFIX}-manager-filters button,
    .${PREFIX}-payment-link {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 5px;
      height: 34px;
      padding: 0 12px;
      border: 1px solid transparent;
      border-radius: 999px;
      background: transparent;
      color: var(--ss-muted);
      font: 650 13px/1 -apple-system, BlinkMacSystemFont, "Segoe UI",
        "Noto Sans KR", sans-serif;
      white-space: nowrap;
      cursor: pointer;
    }

    .${PREFIX}-manager-filters button:hover,
    .${PREFIX}-payment-link:hover {
      border-color: var(--ss-border);
      background: var(--ss-card);
      color: var(--ss-text);
    }

    .${PREFIX}-manager-filters button[aria-pressed="true"] {
      border-color: rgba(1, 130, 255, 0.3);
      background: rgba(1, 130, 255, 0.12);
      color: var(--ss-accent);
    }

    .${PREFIX}-manager-filters em {
      min-width: 18px;
      padding: 2px 5px;
      border-radius: 999px;
      background: rgba(117, 123, 138, 0.13);
      font-size: 11px;
      font-style: normal;
      text-align: center;
    }

    .${PREFIX}-manager-summary {
      overflow: hidden;
      margin-left: auto;
      color: var(--ss-muted);
      font: 500 13px/1.35 -apple-system, BlinkMacSystemFont, "Segoe UI",
        "Noto Sans KR", sans-serif;
      white-space: nowrap;
      text-overflow: ellipsis;
    }

    .${PREFIX}-payment-link {
      flex: 0 0 auto;
      border-color: rgba(1, 130, 255, 0.28);
      background: rgba(1, 130, 255, 0.1);
      color: var(--ss-accent);
    }

    .layer_container.${PREFIX}-manager .strm_list {
      display: grid !important;
      flex: 1 1 auto !important;
      grid-template-columns: repeat(
        auto-fill,
        minmax(min(480px, 100%), 1fr)
      ) !important;
      grid-auto-rows: minmax(126px, auto);
      align-content: start;
      gap: 10px !important;
      overflow: auto !important;
      max-height: none !important;
      min-height: 0 !important;
      margin: 0 !important;
      padding: 4px 28px 26px !important;
      box-sizing: border-box;
      scrollbar-gutter: stable;
    }

    .layer_container.${PREFIX}-manager .strm_list::-webkit-scrollbar {
      width: 11px;
    }

    .layer_container.${PREFIX}-manager
      .strm_list::-webkit-scrollbar-thumb {
      border: 3px solid transparent;
      border-radius: 999px;
      background: rgba(117, 123, 138, 0.52) !important;
      background-clip: padding-box !important;
    }

    .layer_container.${PREFIX}-manager .strm_list > li {
      display: grid !important;
      grid-template-areas:
        "thumb nick nick"
        "thumb util quick";
      grid-template-columns: 68px minmax(0, 1fr) auto;
      grid-template-rows: minmax(70px, auto) 44px;
      align-items: center !important;
      overflow: hidden;
      min-height: 126px !important;
      padding: 9px 12px !important;
      border: 1px solid var(--ss-border);
      border-radius: 13px;
      background: var(--ss-card);
      box-sizing: border-box;
      transition: border-color 0.16s ease, background-color 0.16s ease,
        transform 0.16s ease;
    }

    .layer_container.${PREFIX}-manager .strm_list > li:hover {
      border-color: rgba(1, 130, 255, 0.34);
      background: var(--ss-surface) !important;
      transform: translateY(-1px);
    }

    .layer_container.${PREFIX}-manager .strm_list > li[hidden] {
      display: none !important;
    }

    .layer_container.${PREFIX}-manager .strm_list > li .thumb {
      grid-area: thumb;
      width: 66px !important;
    }

    .layer_container.${PREFIX}-manager .strm_list > li .nick_wrap {
      grid-area: nick;
      overflow: hidden;
      min-width: 0;
      margin: 0 6px 0 4px !important;
    }

    .layer_container.${PREFIX}-manager
      .strm_list
      > li
      .nick_wrap
      .nick
      span:first-child {
      max-width: none !important;
      white-space: nowrap;
    }

    .layer_container.${PREFIX}-manager
      .strm_list
      > li
      .subscribe_tier,
    .layer_container.${PREFIX}-manager
      .strm_list
      > li
      .subscribe_nick,
    .layer_container.${PREFIX}-manager .strm_list > li .last_live {
      overflow: hidden;
      max-width: 100%;
      color: var(--ss-muted) !important;
      white-space: nowrap;
      text-overflow: ellipsis;
    }

    .layer_container.${PREFIX}-manager .strm_list > li .util_btn_wrap {
      display: flex !important;
      grid-area: util;
      align-items: center;
      gap: 4px;
      margin: 0 !important;
    }

    .layer_container.${PREFIX}-manager
      .strm_list
      > li
      .util_btn_wrap
      button {
      position: relative;
      width: 68px !important;
      height: 42px !important;
      margin: 0 !important;
      border: 1px solid transparent;
      border-radius: 9px !important;
      background-position: 50% 3px !important;
      background-size: 21px 21px !important;
      color: transparent !important;
      font: 0/0 a !important;
    }

    .layer_container.${PREFIX}-manager
      .strm_list
      > li
      .util_btn_wrap
      button::after {
      position: absolute;
      right: 2px;
      bottom: 4px;
      left: 2px;
      color: var(--ss-muted);
      font: 650 10.5px/1 -apple-system, BlinkMacSystemFont, "Segoe UI",
        "Noto Sans KR", sans-serif;
      text-align: center;
      white-space: nowrap;
    }

    .layer_container.${PREFIX}-manager
      .util_btn_wrap
      button.fav_on::after {
      content: "즐겨찾기 해제";
      color: var(--ss-danger);
    }

    .layer_container.${PREFIX}-manager
      .util_btn_wrap
      button.fav_off::after {
      content: "즐겨찾기 추가";
      color: var(--ss-accent);
    }

    .layer_container.${PREFIX}-manager .select_box_item {
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
      gap: 3px;
      margin-left: 4px;
    }

    .${PREFIX}-quick button {
      display: inline-flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 2px;
      width: 68px;
      height: 42px;
      padding: 0 2px;
      border: 1px solid transparent;
      border-radius: 9px;
      background: transparent;
      color: var(--ss-muted);
      font: 650 10.5px/1 -apple-system, BlinkMacSystemFont, "Segoe UI",
        "Noto Sans KR", sans-serif;
      cursor: pointer;
    }

    .${PREFIX}-quick button:hover {
      border-color: var(--ss-border);
      background: var(--ss-surface);
      color: var(--ss-text);
    }

    .${PREFIX}-quick button:disabled {
      opacity: 0.55;
      cursor: wait;
    }

    .${PREFIX}-quick button.is-active {
      color: var(--ss-accent);
    }

    .${PREFIX}-quick .${PREFIX}-quick-icon {
      height: 19px;
      font-size: 17px;
      line-height: 19px;
    }

    .${PREFIX}-manager-empty {
      display: none;
      flex: 1 1 auto;
      align-items: center;
      justify-content: center;
      min-height: 180px;
      margin: 4px 28px 26px;
      border: 1px dashed var(--ss-border);
      border-radius: 13px;
      color: var(--ss-muted);
      font: 600 14px/1.5 -apple-system, BlinkMacSystemFont, "Segoe UI",
        "Noto Sans KR", sans-serif;
    }

    .${PREFIX}-manager-empty.is-visible {
      display: flex;
    }

    /* point.sooplive.com 구독·결제 정보 */
    body.${PREFIX}-point-page {
      --ss-bg: #f5f7fa;
      --ss-surface: #eef2f7;
      --ss-card: #ffffff;
      --ss-text: #17191c;
      --ss-muted: #687181;
      --ss-border: rgba(23, 25, 28, 0.12);
      background: #f5f7fa !important;
    }

    .${PREFIX}-dashboard {
      position: relative;
      left: 50%;
      width: min(1460px, calc(100vw - 40px));
      margin: 26px 0 34px;
      padding: 24px;
      border: 1px solid var(--ss-border);
      border-radius: 18px;
      background: var(--ss-bg);
      box-shadow: 0 14px 46px rgba(31, 42, 62, 0.12);
      color: var(--ss-text);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI",
        "Noto Sans KR", sans-serif;
      text-align: left;
      transform: translateX(-50%);
      box-sizing: border-box;
    }

    .${PREFIX}-dashboard *,
    .${PREFIX}-dashboard *::before,
    .${PREFIX}-dashboard *::after {
      box-sizing: border-box;
    }

    .${PREFIX}-dash-head {
      display: flex;
      align-items: flex-start;
      gap: 20px;
      margin-bottom: 18px;
    }

    .${PREFIX}-dash-title {
      min-width: 0;
    }

    .${PREFIX}-dash-title h2 {
      display: flex;
      align-items: center;
      gap: 9px;
      margin: 0 0 7px;
      color: var(--ss-text);
      font-size: 26px;
      font-weight: 800;
      letter-spacing: -0.7px;
    }

    .${PREFIX}-dash-title h2::before {
      content: "◆";
      color: var(--ss-cyan);
      font-size: 20px;
    }

    .${PREFIX}-dash-title p {
      margin: 0;
      color: var(--ss-muted);
      font-size: 13px;
      line-height: 1.5;
    }

    .${PREFIX}-dash-stats {
      display: flex;
      flex-wrap: wrap;
      justify-content: flex-end;
      gap: 8px;
      margin-left: auto;
    }

    .${PREFIX}-stat {
      min-width: 102px;
      padding: 9px 13px;
      border: 1px solid var(--ss-border);
      border-radius: 12px;
      background: var(--ss-card);
      text-align: right;
    }

    .${PREFIX}-stat span {
      display: block;
      margin-bottom: 3px;
      color: var(--ss-muted);
      font-size: 11px;
    }

    .${PREFIX}-stat strong {
      color: var(--ss-text);
      font-size: 18px;
    }

    .${PREFIX}-controls {
      display: grid;
      grid-template-columns: minmax(260px, 1fr) auto;
      gap: 10px 14px;
      margin-bottom: 16px;
      padding: 12px;
      border: 1px solid var(--ss-border);
      border-radius: 14px;
      background: var(--ss-surface);
    }

    .${PREFIX}-search {
      position: relative;
    }

    .${PREFIX}-search::before {
      content: "⌕";
      position: absolute;
      top: 50%;
      left: 14px;
      color: var(--ss-muted);
      font-size: 20px;
      transform: translateY(-52%);
    }

    .${PREFIX}-search input {
      width: 100%;
      height: 42px;
      padding: 0 14px 0 40px;
      border: 1px solid var(--ss-border);
      border-radius: 10px;
      outline: none;
      background: var(--ss-card);
      color: var(--ss-text);
      font-size: 14px;
    }

    .${PREFIX}-search input:focus {
      border-color: var(--ss-accent);
      box-shadow: 0 0 0 3px rgba(1, 130, 255, 0.12);
    }

    .${PREFIX}-sort {
      height: 42px;
      padding: 0 34px 0 12px;
      border: 1px solid var(--ss-border);
      border-radius: 10px;
      outline: none;
      background: var(--ss-card);
      color: var(--ss-text);
      font-size: 13px;
      cursor: pointer;
    }

    .${PREFIX}-point-filters {
      display: flex;
      grid-column: 1 / -1;
      flex-wrap: wrap;
      gap: 7px;
    }

    .${PREFIX}-point-filters button {
      height: 34px;
      padding: 0 12px;
      border: 1px solid transparent;
      border-radius: 999px;
      background: transparent;
      color: var(--ss-muted);
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
    }

    .${PREFIX}-point-filters button:hover {
      border-color: var(--ss-border);
      background: var(--ss-card);
      color: var(--ss-text);
    }

    .${PREFIX}-point-filters button[aria-pressed="true"] {
      border-color: rgba(1, 130, 255, 0.27);
      background: rgba(1, 130, 255, 0.11);
      color: var(--ss-accent);
    }

    .${PREFIX}-point-filters em {
      margin-left: 5px;
      padding: 2px 6px;
      border-radius: 999px;
      background: rgba(117, 123, 138, 0.12);
      font-size: 11px;
      font-style: normal;
    }

    .${PREFIX}-result-line {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin: 0 2px 10px;
      color: var(--ss-muted);
      font-size: 12px;
    }

    .${PREFIX}-cards {
      display: grid;
      grid-template-columns: repeat(
        auto-fill,
        minmax(min(330px, 100%), 1fr)
      );
      gap: 12px;
    }

    .${PREFIX}-card {
      display: flex;
      flex-direction: column;
      min-height: 246px;
      padding: 16px;
      border: 1px solid var(--ss-border);
      border-radius: 15px;
      background: var(--ss-card);
      box-shadow: 0 3px 14px rgba(31, 42, 62, 0.045);
      transition: border-color 0.16s ease, box-shadow 0.16s ease,
        transform 0.16s ease;
    }

    .${PREFIX}-card:hover {
      border-color: rgba(1, 130, 255, 0.32);
      box-shadow: 0 9px 25px rgba(1, 130, 255, 0.09);
      transform: translateY(-2px);
    }

    .${PREFIX}-card-head {
      display: flex;
      align-items: center;
      gap: 11px;
      min-width: 0;
      margin-bottom: 13px;
    }

    .${PREFIX}-avatar {
      display: flex;
      flex: 0 0 auto;
      align-items: center;
      justify-content: center;
      width: 46px;
      height: 46px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--avatar-a), var(--avatar-b));
      color: #fff;
      font-size: 17px;
      font-weight: 800;
      box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.25);
    }

    .${PREFIX}-identity {
      overflow: hidden;
      min-width: 0;
    }

    .${PREFIX}-identity a,
    .${PREFIX}-identity strong {
      display: block;
      overflow: hidden;
      color: var(--ss-text);
      font-size: 16px;
      font-weight: 800;
      line-height: 1.35;
      text-decoration: none;
      white-space: nowrap;
      text-overflow: ellipsis;
    }

    .${PREFIX}-identity a:hover {
      color: var(--ss-accent);
      text-decoration: underline;
    }

    .${PREFIX}-identity small {
      display: block;
      overflow: hidden;
      margin-top: 2px;
      color: var(--ss-muted);
      font-size: 12px;
      white-space: nowrap;
      text-overflow: ellipsis;
    }

    .${PREFIX}-badges {
      display: flex;
      flex-wrap: wrap;
      gap: 5px;
      margin-left: auto;
    }

    .${PREFIX}-badge {
      padding: 4px 7px;
      border-radius: 999px;
      background: rgba(1, 130, 255, 0.1);
      color: var(--ss-accent);
      font-size: 10.5px;
      font-weight: 800;
      white-space: nowrap;
    }

    .${PREFIX}-badge.auto {
      background: rgba(18, 168, 120, 0.11);
      color: var(--ss-success);
    }

    .${PREFIX}-badge.ending {
      background: rgba(239, 83, 103, 0.11);
      color: var(--ss-danger);
    }

    .${PREFIX}-badge.ended {
      background: rgba(117, 123, 138, 0.12);
      color: var(--ss-muted);
    }

    .${PREFIX}-details {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 8px;
      margin: 0;
    }

    .${PREFIX}-details > div {
      min-width: 0;
      padding: 8px 9px;
      border-radius: 9px;
      background: var(--ss-surface);
    }

    .${PREFIX}-details dt {
      margin: 0 0 3px;
      color: var(--ss-muted);
      font-size: 10.5px;
    }

    .${PREFIX}-details dd {
      overflow: hidden;
      margin: 0;
      color: var(--ss-text);
      font-size: 12px;
      font-weight: 700;
      line-height: 1.35;
      white-space: nowrap;
      text-overflow: ellipsis;
    }

    .${PREFIX}-details .wide {
      grid-column: 1 / -1;
    }

    .${PREFIX}-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: auto;
      padding-top: 13px;
    }

    .${PREFIX}-actions button {
      min-height: 32px;
      padding: 0 10px;
      border: 1px solid var(--ss-border);
      border-radius: 8px;
      background: var(--ss-card);
      color: var(--ss-muted);
      font-size: 11.5px;
      font-weight: 750;
      cursor: pointer;
    }

    .${PREFIX}-actions button:hover {
      border-color: rgba(1, 130, 255, 0.35);
      color: var(--ss-accent);
    }

    .${PREFIX}-actions button.primary {
      border-color: rgba(1, 130, 255, 0.28);
      background: rgba(1, 130, 255, 0.1);
      color: var(--ss-accent);
    }

    .${PREFIX}-empty {
      display: none;
      align-items: center;
      justify-content: center;
      min-height: 180px;
      border: 1px dashed var(--ss-border);
      border-radius: 14px;
      color: var(--ss-muted);
      font-size: 14px;
      font-weight: 650;
    }

    .${PREFIX}-empty.is-visible {
      display: flex;
    }

    .${PREFIX}-source-highlight {
      outline: 3px solid rgba(1, 130, 255, 0.28) !important;
      background: rgba(1, 130, 255, 0.08) !important;
    }

    @media (max-width: 980px) {
      .layer_container.${PREFIX}-manager {
        width: calc(100vw - 20px) !important;
        height: calc(100vh - 20px) !important;
      }

      .${PREFIX}-manager-toolbar,
      .${PREFIX}-dash-head {
        flex-wrap: wrap;
      }

      .${PREFIX}-manager-summary {
        order: 3;
        width: 100%;
        margin-left: 4px;
      }

      .${PREFIX}-dash-stats {
        justify-content: flex-start;
        width: 100%;
        margin-left: 0;
      }

      .${PREFIX}-controls {
        grid-template-columns: 1fr;
      }

      .${PREFIX}-sort,
      .${PREFIX}-point-filters {
        grid-column: 1;
      }
    }

    @media (max-width: 680px) {
      #${PREFIX}-fab {
        right: 14px;
        bottom: 14px;
      }

      .layer_container.${PREFIX}-manager {
        width: 100vw !important;
        height: 100vh !important;
        border-radius: 0 !important;
      }

      .layer_container.${PREFIX}-manager > h3 {
        min-height: 58px;
        padding: 15px 58px 8px 16px !important;
        font-size: 19px !important;
      }

      .layer_container.${PREFIX}-manager .search_area,
      .layer_container.${PREFIX}-manager .total_wrap {
        padding-right: 14px !important;
        padding-left: 14px !important;
      }

      .${PREFIX}-manager-toolbar {
        margin-right: 14px;
        margin-left: 14px;
      }

      .layer_container.${PREFIX}-manager .strm_list {
        padding-right: 14px !important;
        padding-left: 14px !important;
      }

      .${PREFIX}-dashboard {
        width: calc(100vw - 20px);
        padding: 15px;
      }

      .${PREFIX}-dash-title h2 {
        font-size: 22px;
      }

      .${PREFIX}-stat {
        min-width: 86px;
      }

      .${PREFIX}-details {
        grid-template-columns: 1fr;
      }

      .${PREFIX}-details .wide {
        grid-column: 1;
      }
    }
  `;

  function normalize(value) {
    return String(value ?? '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function setText(element, value) {
    if (element && element.textContent !== value) {
      element.textContent = value;
    }
  }

  function injectStyle() {
    if (!document.getElementById(style.id)) {
      document.head.append(style);
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

  function waitFor(getValue, timeout = 1400) {
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

  /* ------------------------------------------------------------------ */
  /* 구독 스트리머 관리 팝업                                             */
  /* ------------------------------------------------------------------ */

  const managerState = {
    filter: 'all',
    activeRoot: null,
    scheduled: false,
  };

  const managerFilters = [
    { id: 'all', label: '전체' },
    { id: 'live', label: 'LIVE' },
    { id: 'pinned', label: '고정' },
    { id: 'favorite-on', label: '즐겨찾기' },
    { id: 'favorite-off', label: '미즐겨찾기' },
  ];

  function isVisible(element) {
    return Boolean(
      element &&
        (element.offsetWidth ||
          element.offsetHeight ||
          element.getClientRects().length),
    );
  }

  function findManagerButton() {
    return [...document.querySelectorAll('button.fav_manage')].find(
      (button) =>
        isVisible(button) && normalize(button.textContent).includes('스트리머 관리'),
    );
  }

  function ensureManagerFab() {
    const nativeButton = findManagerButton();
    let fab = document.getElementById(`${PREFIX}-fab`);

    if (!nativeButton) {
      fab?.remove();
      return;
    }

    nativeButton.title = '구독 스트리머를 넓은 화면에서 관리합니다.';
    if (fab) {
      return;
    }

    fab = document.createElement('button');
    fab.id = `${PREFIX}-fab`;
    fab.type = 'button';
    fab.innerHTML = '<span aria-hidden="true">◆</span><span>구독 관리</span>';
    fab.setAttribute('aria-label', '구독 스트리머 관리 창 열기');
    fab.addEventListener('click', () => {
      const target = findManagerButton();
      if (!target) {
        showToast('SOOP의 스트리머 관리 버튼을 찾지 못했습니다.');
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
          root.querySelector('.my_adm_layer .strm_list') &&
          root.querySelector('input#search-inp'),
      );
    });
  }

  function createManagerToolbar() {
    const toolbar = document.createElement('div');
    toolbar.className = `${PREFIX}-manager-toolbar`;

    const filters = document.createElement('div');
    filters.className = `${PREFIX}-manager-filters`;
    filters.setAttribute('role', 'group');
    filters.setAttribute('aria-label', '구독 스트리머 빠른 필터');

    for (const filter of managerFilters) {
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.filter = filter.id;
      button.setAttribute(
        'aria-pressed',
        String(managerState.filter === filter.id),
      );

      const label = document.createElement('span');
      label.textContent = filter.label;
      const count = document.createElement('em');
      count.textContent = '0';
      button.append(label, count);
      filters.append(button);
    }

    const summary = document.createElement('div');
    summary.className = `${PREFIX}-manager-summary`;
    summary.setAttribute('aria-live', 'polite');

    const paymentLink = document.createElement('button');
    paymentLink.type = 'button';
    paymentLink.className = `${PREFIX}-payment-link`;
    paymentLink.textContent = '결제·구독 내역 ↗';
    paymentLink.addEventListener('click', () => {
      window.open(
        'https://point.sooplive.com/Subscription/SubscriptionList.asp',
        '_blank',
        'noopener',
      );
    });

    toolbar.append(filters, summary, paymentLink);
    toolbar.addEventListener('click', (event) => {
      const button = event.target.closest('button[data-filter]');
      if (!button) {
        return;
      }
      managerState.filter = button.dataset.filter;
      refreshManager(managerState.activeRoot);
    });

    return toolbar;
  }

  function enhanceManagerRoot(root) {
    managerState.activeRoot = root;
    root.classList.add(`${PREFIX}-manager`);
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-label', 'SOOP 구독 스트리머 관리');

    const area = root.querySelector('.my_adm_layer .strm_area');
    const list = area?.querySelector(':scope > .strm_list');
    if (!area || !list) {
      return;
    }

    let toolbar = area.querySelector(`:scope > .${PREFIX}-manager-toolbar`);
    if (!toolbar) {
      toolbar = createManagerToolbar();
      area.insertBefore(toolbar, list);
    }

    let empty = area.querySelector(`:scope > .${PREFIX}-manager-empty`);
    if (!empty) {
      empty = document.createElement('div');
      empty.className = `${PREFIX}-manager-empty`;
      empty.textContent = '선택한 조건에 맞는 구독 스트리머가 없습니다.';
      list.insertAdjacentElement('afterend', empty);
    }

    for (const row of [...list.children]) {
      if (row.tagName === 'LI') {
        enhanceManagerRow(row);
      }
    }

    refreshManager(root);
  }

  function enhanceManagerRow(row) {
    const favoriteButton = row.querySelector(
      '.util_btn_wrap button.fav_on, .util_btn_wrap button.fav_off',
    );
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

    if (!row.dataset.soopSubNativeListener) {
      row.dataset.soopSubNativeListener = 'true';
      row.addEventListener('click', (event) => {
        if (
          event.target.closest(
            '.util_btn_wrap button, .select_box_item button, .' +
              `${PREFIX}-quick button`,
          )
        ) {
          setTimeout(scheduleManager, 80);
          setTimeout(scheduleManager, 500);
          setTimeout(scheduleManager, 1200);
        }
      });
    }

    let quick = row.querySelector(`:scope > .${PREFIX}-quick`);
    if (!quick) {
      quick = document.createElement('div');
      quick.className = `${PREFIX}-quick`;
      quick.innerHTML = `
        <button type="button" data-action="nickname">
          <span class="${PREFIX}-quick-icon" aria-hidden="true">✎</span>
          <span>구독 닉네임</span>
        </button>
        <button type="button" data-action="payment">
          <span class="${PREFIX}-quick-icon" aria-hidden="true">▤</span>
          <span>결제 정보</span>
        </button>
        <button type="button" data-action="pin">
          <span class="${PREFIX}-quick-icon" aria-hidden="true">◆</span>
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
          await runManagerMenuAction(row, button.dataset.action);
        } finally {
          setTimeout(() => {
            button.disabled = false;
            scheduleManager();
          }, 350);
        }
      });
      row.append(quick);
    }

    const isPinned = Boolean(row.querySelector('.thumb > .pin'));
    const pinButton = quick.querySelector('[data-action="pin"]');
    pinButton?.classList.toggle('is-active', isPinned);
    pinButton?.setAttribute(
      'aria-label',
      isPinned ? '목록 상단 고정 해제' : '목록 상단에 고정',
    );
    setText(
      pinButton?.querySelector(`.${PREFIX}-pin-label`),
      isPinned ? '고정 해제' : '상단 고정',
    );
  }

  async function runManagerMenuAction(row, action) {
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

    menuButton.click();
    const actionButton = await waitFor(() => {
      return [...row.querySelectorAll('.select_list button')].find((button) =>
        labels.some((label) => normalize(button.textContent).includes(label)),
      );
    });

    if (!actionButton) {
      menuButton.click();
      showToast('요청한 구독 설정 메뉴를 찾지 못했습니다.');
      return;
    }

    actionButton.click();
  }

  function refreshManager(root) {
    if (!root?.isConnected) {
      return;
    }

    const list = root.querySelector('.my_adm_layer .strm_list');
    const toolbar = root.querySelector(`.${PREFIX}-manager-toolbar`);
    const empty = root.querySelector(`.${PREFIX}-manager-empty`);
    if (!list || !toolbar || !empty) {
      return;
    }

    const rows = [...list.children].filter((row) => row.tagName === 'LI');
    const counts = {
      all: rows.length,
      live: 0,
      pinned: 0,
      'favorite-on': 0,
      'favorite-off': 0,
    };

    for (const row of rows) {
      const flags = {
        live: row.classList.contains('live'),
        pinned: Boolean(row.querySelector('.thumb > .pin')),
        'favorite-on': Boolean(row.querySelector('.util_btn_wrap .fav_on')),
        'favorite-off': Boolean(row.querySelector('.util_btn_wrap .fav_off')),
      };

      for (const key of Object.keys(flags)) {
        if (flags[key]) {
          counts[key] += 1;
        }
      }

      row.hidden =
        managerState.filter !== 'all' &&
        !Boolean(flags[managerState.filter]);
    }

    for (const button of toolbar.querySelectorAll('button[data-filter]')) {
      const id = button.dataset.filter;
      button.setAttribute(
        'aria-pressed',
        String(managerState.filter === id),
      );
      setText(button.querySelector('em'), String(counts[id] ?? 0));
    }

    const visibleCount = rows.filter((row) => !row.hidden).length;
    setText(
      toolbar.querySelector(`.${PREFIX}-manager-summary`),
      `표시 ${visibleCount}명 · LIVE ${counts.live}명 · 고정 ${counts.pinned}명 · 즐겨찾기 ${counts['favorite-on']}명`,
    );

    empty.classList.toggle('is-visible', rows.length > 0 && visibleCount === 0);
    list.hidden = rows.length > 0 && visibleCount === 0;
  }

  function scheduleManager() {
    if (managerState.scheduled) {
      return;
    }
    managerState.scheduled = true;
    requestAnimationFrame(() => {
      managerState.scheduled = false;
      ensureManagerFab();

      const roots = findManagerRoots();
      const fab = document.getElementById(`${PREFIX}-fab`);
      if (fab) {
        fab.hidden = roots.length > 0;
      }

      if (roots.length === 0) {
        managerState.activeRoot = null;
        return;
      }

      for (const root of roots) {
        enhanceManagerRoot(root);
      }
    });
  }

  function startManagerPage() {
    injectStyle();
    scheduleManager();
    new MutationObserver(scheduleManager).observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  /* ------------------------------------------------------------------ */
  /* 구독·결제 내역 페이지 대시보드                                      */
  /* ------------------------------------------------------------------ */

  const pointState = {
    filter: 'active',
    query: '',
    sort: 'name',
    items: [],
    totalActive: 0,
  };

  const pointFilters = [
    { id: 'active', label: '현재 구독' },
    { id: 'regular', label: '정기구독' },
    { id: 'auto', label: '자동결제' },
    { id: 'ending', label: '해지 예정' },
    { id: 'ended', label: '종료 이력' },
    { id: 'all', label: '전체' },
  ];

  function getTableHeaders(table) {
    const rows = [...table.querySelectorAll('tr')];
    const headerRow =
      rows.find((row) => row.querySelector('th')) ||
      rows.find((row) => {
        const text = normalize(row.textContent);
        return (
          text.includes('구독 일자') &&
          (text.includes('구독한 스트리머') ||
            text.includes('구독 스트리머'))
        );
      }) ||
      rows[0];

    return headerRow
      ? [...headerRow.cells].map((cell) => normalize(cell.textContent))
      : [];
  }

  function classifyTable(table, headers) {
    const headerText = headers.join(' | ');
    if (
      !headerText.includes('구독') ||
      !headerText.includes('스트리머')
    ) {
      return null;
    }

    if (headerText.includes('구독 기간')) {
      return 'ended';
    }

    if (headerText.includes('구분') && headerText.includes('구독료')) {
      return null;
    }

    if (
      headerText.includes('이용중인 구독권') ||
      headerText.includes('다음 결제일') ||
      headerText.includes('결제예정금액') ||
      headerText.includes('구독 관리')
    ) {
      return headerText.includes('결제예정금액') ? 'auto' : 'regular';
    }

    return null;
  }

  function cellTextWithoutControls(cell) {
    if (!cell) {
      return '';
    }
    const clone = cell.cloneNode(true);
    for (const control of clone.querySelectorAll(
      'button, input, select, textarea',
    )) {
      control.remove();
    }
    return normalize(clone.textContent);
  }

  function findHeaderIndex(headers, keywords, fallback) {
    const index = headers.findIndex((header) =>
      keywords.some((keyword) => header.includes(keyword)),
    );
    return index >= 0 ? index : fallback;
  }

  function parsePointTables() {
    const items = [];
    let sequence = 0;

    for (const table of document.querySelectorAll('table')) {
      const headers = getTableHeaders(table);
      const kind = classifyTable(table, headers);
      if (!kind) {
        continue;
      }

      table.dataset.soopSubSource = kind;

      const dateIndex = findHeaderIndex(headers, ['구독 일자'], 0);
      const streamerIndex = findHeaderIndex(
        headers,
        ['구독한 스트리머', '구독 스트리머'],
        1,
      );
      const productIndex = findHeaderIndex(
        headers,
        ['이용중인 구독권'],
        2,
      );
      const nextPaymentIndex = findHeaderIndex(
        headers,
        ['다음 결제일'],
        3,
      );
      const priceIndex = findHeaderIndex(
        headers,
        ['결제예정금액', '구독료'],
        4,
      );
      const periodIndex = findHeaderIndex(headers, ['구독 기간'], 2);

      for (const row of table.querySelectorAll('tr')) {
        const cells = [...row.cells];
        const rowText = normalize(row.textContent);
        if (
          cells.length < 3 ||
          row.querySelector('th') ||
          rowText.includes('구독 일자') ||
          rowText.includes('구독한 스트리머') ||
          rowText.includes('구독 스트리머') ||
          rowText.includes('내역이 없습니다') ||
          !/\d{4}-\d{2}-\d{2}/.test(rowText)
        ) {
          continue;
        }

        const dateCell = cells[dateIndex] || cells[0];
        const streamerCell = cells[streamerIndex] || cells[1];
        const dateText = normalize(dateCell?.textContent);
        const streamerText = normalize(streamerCell?.textContent);
        if (!streamerText) {
          continue;
        }

        const dates = [
          ...dateText.matchAll(/\d{4}-\d{2}-\d{2}/g),
        ].map((match) => match[0]);
        const idMatch = streamerText.match(/\(([^()]+)\)/);
        const monthsMatch = streamerText.match(/연속\s*(\d+)\s*개월/);
        const nickname =
          normalize(streamerText.split('(')[0]) ||
          normalize(streamerText.replace(/연속\s*\d+\s*개월/g, ''));
        const streamerId = idMatch?.[1] || '';
        const product =
          kind === 'ended'
            ? '구독 종료'
            : cellTextWithoutControls(cells[productIndex]);
        const nextPayment =
          kind === 'ended'
            ? cellTextWithoutControls(cells[periodIndex])
            : cellTextWithoutControls(cells[nextPaymentIndex]);
        const price =
          kind === 'ended' ? '' : cellTextWithoutControls(cells[priceIndex]);
        const ending =
          /해지\s*신청|해지\s*예정|취소\s*신청/i.test(rowText);
        const streamerLink = streamerCell?.querySelector('a[href]');

        const actions = [...row.querySelectorAll(
          'a, button, input[type="button"], input[type="submit"]',
        )].filter((element) => {
          const label = normalize(
            element.value ||
              element.textContent ||
              element.title ||
              element.getAttribute('aria-label'),
          );
          return /구독\s*연장|구독\s*변경|구독\s*관리|해지|취소|결제/i.test(
            label,
          );
        });

        items.push({
          key: `${kind}-${sequence++}`,
          kind,
          ending,
          nickname,
          streamerId,
          months: Number(monthsMatch?.[1] || 0),
          startDate: dates[0] || '',
          expiryDate: dates[1] || '',
          product,
          nextPayment,
          price,
          rowText,
          sourceRow: row,
          sourceActions: actions,
          profileHref: streamerLink?.href || '',
        });
      }
    }

    return items;
  }

  function readTotalActiveCount() {
    const text = normalize(document.body.textContent);
    const match =
      text.match(/(\d+)\s*명을\s*구독\s*중/) ||
      text.match(/구독\s*중인\s*스트리머[^\d]*(\d+)\s*명/);
    return Number(match?.[1] || 0);
  }

  function createPointDashboard() {
    const dashboard = document.createElement('section');
    dashboard.className = `${PREFIX}-dashboard`;
    dashboard.setAttribute('aria-label', 'SOOP 구독 정보 대시보드');

    const head = document.createElement('div');
    head.className = `${PREFIX}-dash-head`;
    head.innerHTML = `
      <div class="${PREFIX}-dash-title">
        <h2>구독 정보 한눈에 보기</h2>
        <p>현재 페이지에 로드된 항목을 카드로 정리합니다. 원본 페이지의 번호를 이동하면 해당 페이지 목록도 자동으로 카드화됩니다.</p>
      </div>
      <div class="${PREFIX}-dash-stats" aria-live="polite">
        <div class="${PREFIX}-stat" data-stat="total">
          <span>전체 구독</span><strong>0명</strong>
        </div>
        <div class="${PREFIX}-stat" data-stat="loaded">
          <span>현재 화면</span><strong>0건</strong>
        </div>
        <div class="${PREFIX}-stat" data-stat="ending">
          <span>해지 예정</span><strong>0건</strong>
        </div>
      </div>
    `;

    const controls = document.createElement('div');
    controls.className = `${PREFIX}-controls`;

    const search = document.createElement('label');
    search.className = `${PREFIX}-search`;
    const input = document.createElement('input');
    input.type = 'search';
    input.placeholder = '스트리머 이름, 아이디, 구독권을 검색하세요.';
    input.setAttribute('aria-label', '구독 정보 검색');
    search.append(input);

    const sort = document.createElement('select');
    sort.className = `${PREFIX}-sort`;
    sort.setAttribute('aria-label', '구독 정보 정렬');
    sort.innerHTML = `
      <option value="name">스트리머 이름순</option>
      <option value="months-desc">연속 구독 개월순</option>
      <option value="start-desc">최근 구독 시작순</option>
      <option value="expiry">가까운 만료·결제일순</option>
    `;

    const filters = document.createElement('div');
    filters.className = `${PREFIX}-point-filters`;
    filters.setAttribute('role', 'group');
    filters.setAttribute('aria-label', '구독 상태 필터');
    for (const filter of pointFilters) {
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.filter = filter.id;
      button.setAttribute(
        'aria-pressed',
        String(pointState.filter === filter.id),
      );
      const label = document.createElement('span');
      label.textContent = filter.label;
      const count = document.createElement('em');
      count.textContent = '0';
      button.append(label, count);
      filters.append(button);
    }

    controls.append(search, sort, filters);

    const resultLine = document.createElement('div');
    resultLine.className = `${PREFIX}-result-line`;
    resultLine.innerHTML = '<span data-result-count>0건 표시</span><span>관리 버튼은 원본 SOOP 기능을 그대로 실행합니다.</span>';

    const cards = document.createElement('div');
    cards.className = `${PREFIX}-cards`;

    const empty = document.createElement('div');
    empty.className = `${PREFIX}-empty`;
    empty.textContent = '선택한 조건에 맞는 구독 정보가 없습니다.';

    dashboard.append(head, controls, resultLine, cards, empty);

    input.addEventListener('input', () => {
      pointState.query = normalize(input.value).toLowerCase();
      renderPointDashboard(dashboard);
    });
    sort.addEventListener('change', () => {
      pointState.sort = sort.value;
      renderPointDashboard(dashboard);
    });
    filters.addEventListener('click', (event) => {
      const button = event.target.closest('button[data-filter]');
      if (!button) {
        return;
      }
      pointState.filter = button.dataset.filter;
      renderPointDashboard(dashboard);
    });

    return dashboard;
  }

  function itemMatchesFilter(item, filter) {
    if (filter === 'all') {
      return true;
    }
    if (filter === 'active') {
      return item.kind !== 'ended';
    }
    if (filter === 'ending') {
      return item.ending;
    }
    if (filter === 'ended') {
      return item.kind === 'ended';
    }
    return item.kind === filter && !item.ending;
  }

  function getPointFilterCounts(items) {
    return {
      all: items.length,
      active: items.filter((item) => item.kind !== 'ended').length,
      regular: items.filter(
        (item) => item.kind === 'regular' && !item.ending,
      ).length,
      auto: items.filter(
        (item) => item.kind === 'auto' && !item.ending,
      ).length,
      ending: items.filter((item) => item.ending).length,
      ended: items.filter((item) => item.kind === 'ended').length,
    };
  }

  function sortPointItems(items) {
    return [...items].sort((a, b) => {
      if (pointState.sort === 'months-desc') {
        return b.months - a.months || a.nickname.localeCompare(b.nickname, 'ko');
      }
      if (pointState.sort === 'start-desc') {
        return (
          String(b.startDate).localeCompare(String(a.startDate)) ||
          a.nickname.localeCompare(b.nickname, 'ko')
        );
      }
      if (pointState.sort === 'expiry') {
        const aDate = a.expiryDate || a.nextPayment.match(/\d{4}-\d{2}-\d{2}/)?.[0] || '9999-99-99';
        const bDate = b.expiryDate || b.nextPayment.match(/\d{4}-\d{2}-\d{2}/)?.[0] || '9999-99-99';
        return aDate.localeCompare(bDate);
      }
      return a.nickname.localeCompare(b.nickname, 'ko');
    });
  }

  function initialsFor(name) {
    return [...normalize(name)].slice(0, 2).join('') || 'SO';
  }

  function avatarColors(value) {
    let hash = 0;
    for (const char of value) {
      hash = (hash * 31 + char.codePointAt(0)) >>> 0;
    }
    const hue = hash % 360;
    return [`hsl(${hue} 72% 48%)`, `hsl(${(hue + 48) % 360} 70% 58%)`];
  }

  function addDetail(details, label, value, wide = false) {
    if (!normalize(value)) {
      return;
    }
    const wrapper = document.createElement('div');
    if (wide) {
      wrapper.className = 'wide';
    }
    const term = document.createElement('dt');
    term.textContent = label;
    const description = document.createElement('dd');
    description.textContent = normalize(value);
    description.title = normalize(value);
    wrapper.append(term, description);
    details.append(wrapper);
  }

  function sourceActionLabel(element) {
    return normalize(
      element.value ||
        element.textContent ||
        element.title ||
        element.getAttribute('aria-label'),
    );
  }

  function revealSourceRow(item) {
    const row = item.sourceRow;
    if (!row?.isConnected) {
      showToast('원본 구독 행을 찾지 못했습니다.');
      return;
    }

    row.scrollIntoView({ behavior: 'smooth', block: 'center' });
    row.classList.add(`${PREFIX}-source-highlight`);
    setTimeout(() => {
      row.classList.remove(`${PREFIX}-source-highlight`);
    }, 2200);
  }

  function createPointCard(item) {
    const card = document.createElement('article');
    card.className = `${PREFIX}-card`;
    card.dataset.kind = item.kind;

    const head = document.createElement('div');
    head.className = `${PREFIX}-card-head`;

    const avatar = document.createElement('div');
    avatar.className = `${PREFIX}-avatar`;
    const [colorA, colorB] = avatarColors(item.streamerId || item.nickname);
    avatar.style.setProperty('--avatar-a', colorA);
    avatar.style.setProperty('--avatar-b', colorB);
    avatar.textContent = initialsFor(item.nickname);
    avatar.setAttribute('aria-hidden', 'true');

    const identity = document.createElement('div');
    identity.className = `${PREFIX}-identity`;
    const nameElement = item.profileHref
      ? document.createElement('a')
      : document.createElement('strong');
    nameElement.textContent = item.nickname;
    if (item.profileHref) {
      nameElement.href = item.profileHref;
      nameElement.target = '_blank';
      nameElement.rel = 'noopener';
    }
    const id = document.createElement('small');
    id.textContent = item.streamerId ? `@${item.streamerId}` : '스트리머';
    identity.append(nameElement, id);

    const badges = document.createElement('div');
    badges.className = `${PREFIX}-badges`;
    const typeBadge = document.createElement('span');
    typeBadge.className = `${PREFIX}-badge ${
      item.kind === 'auto' ? 'auto' : item.kind === 'ended' ? 'ended' : ''
    }`;
    typeBadge.textContent =
      item.kind === 'auto'
        ? '자동결제'
        : item.kind === 'ended'
          ? '종료'
          : '정기구독';
    badges.append(typeBadge);
    if (item.ending) {
      const endingBadge = document.createElement('span');
      endingBadge.className = `${PREFIX}-badge ending`;
      endingBadge.textContent = '해지 예정';
      badges.append(endingBadge);
    }

    head.append(avatar, identity, badges);

    const details = document.createElement('dl');
    details.className = `${PREFIX}-details`;
    addDetail(
      details,
      '연속 구독',
      item.months ? `${item.months}개월` : item.kind === 'ended' ? '종료' : '-',
    );
    addDetail(details, '구독 시작일', item.startDate || '-');
    addDetail(
      details,
      item.kind === 'ended' ? '구독 기간' : '만료일',
      item.kind === 'ended' ? item.nextPayment : item.expiryDate || '-',
    );
    addDetail(
      details,
      item.kind === 'ended' ? '상태' : '다음 결제일',
      item.kind === 'ended' ? '구독 종료' : item.nextPayment || '-',
    );
    addDetail(details, '이용 중인 구독권', item.product || '-', true);
    if (item.price && item.price !== '-') {
      addDetail(details, '결제 예정 금액', item.price, true);
    }

    const actions = document.createElement('div');
    actions.className = `${PREFIX}-actions`;
    for (const sourceAction of item.sourceActions) {
      const label = sourceActionLabel(sourceAction);
      if (!label) {
        continue;
      }
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = label;
      if (/연장|변경|관리/.test(label)) {
        button.classList.add('primary');
      }
      button.addEventListener('click', () => {
        if (!sourceAction.isConnected) {
          showToast('원본 관리 버튼을 찾지 못했습니다.');
          return;
        }
        sourceAction.click();
      });
      actions.append(button);
    }

    const reveal = document.createElement('button');
    reveal.type = 'button';
    reveal.textContent = '원본 표에서 보기';
    reveal.addEventListener('click', () => revealSourceRow(item));
    actions.append(reveal);

    card.append(head, details, actions);
    return card;
  }

  function renderPointDashboard(dashboard) {
    const counts = getPointFilterCounts(pointState.items);
    const query = pointState.query;
    const filtered = sortPointItems(
      pointState.items.filter((item) => {
        const matchesFilter = itemMatchesFilter(item, pointState.filter);
        const matchesQuery =
          !query ||
          [
            item.nickname,
            item.streamerId,
            item.product,
            item.rowText,
          ]
            .join(' ')
            .toLowerCase()
            .includes(query);
        return matchesFilter && matchesQuery;
      }),
    );

    for (const button of dashboard.querySelectorAll(
      `.${PREFIX}-point-filters button[data-filter]`,
    )) {
      const id = button.dataset.filter;
      button.setAttribute(
        'aria-pressed',
        String(pointState.filter === id),
      );
      setText(button.querySelector('em'), String(counts[id] ?? 0));
    }

    setText(
      dashboard.querySelector('[data-stat="total"] strong'),
      pointState.totalActive ? `${pointState.totalActive}명` : `${counts.active}명`,
    );
    setText(
      dashboard.querySelector('[data-stat="loaded"] strong'),
      `${pointState.items.length}건`,
    );
    setText(
      dashboard.querySelector('[data-stat="ending"] strong'),
      `${counts.ending}건`,
    );
    setText(
      dashboard.querySelector('[data-result-count]'),
      `${filtered.length}건 표시`,
    );

    const cards = dashboard.querySelector(`.${PREFIX}-cards`);
    const empty = dashboard.querySelector(`.${PREFIX}-empty`);
    cards.replaceChildren(...filtered.map(createPointCard));
    cards.hidden = filtered.length === 0;
    empty.classList.toggle('is-visible', filtered.length === 0);
  }

  function startPointPage() {
    injectStyle();
    const items = parsePointTables();
    if (items.length === 0) {
      return;
    }

    document.body.classList.add(`${PREFIX}-point-page`);
    pointState.items = items;
    pointState.totalActive = readTotalActiveCount();

    const firstTable = document.querySelector('table[data-soop-sub-source]');
    const parent = firstTable?.parentElement;
    if (!parent) {
      return;
    }

    const dashboard = createPointDashboard();
    parent.insertBefore(dashboard, firstTable);
    renderPointDashboard(dashboard);
  }

  function start() {
    if (POINT_PAGE) {
      startPointPage();
    } else {
      startManagerPage();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
