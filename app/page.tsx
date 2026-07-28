"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";

const BRIDGE_CHANNEL = "soop-unified-manager-bridge";
const BRIDGE_URL =
  "https://www.sooplive.com/my/favorite?soop_unified_bridge=1";
const SOOP_ORIGINS = new Set([
  "https://www.sooplive.com",
  "https://sooplive.com",
]);

type ConnectionState = "disconnected" | "connecting" | "connected" | "error";
type View = "favorite" | "subscription";
type FavoriteFilter = "all" | "live" | "pinned" | "alarm-on" | "alarm-off";
type SubscriptionFilter =
  | "all"
  | "live"
  | "pinned"
  | "favorite-on"
  | "favorite-off";

type FavoriteItem = {
  key: string;
  nickname: string;
  href: string;
  avatar: string;
  lastLive: string;
  live: boolean;
  pinned: boolean;
  alarm: boolean;
  favorite: boolean;
};

type SubscriptionItem = {
  key: string;
  nickname: string;
  href: string;
  userId: string;
  avatar: string;
  tier: string;
  subscriptionNickname: string;
  lastLive: string;
  live: boolean;
  pinned: boolean;
  favorite: boolean;
};

type Snapshot = {
  version: string;
  generatedAt: string;
  favorites: FavoriteItem[];
  subscriptions: SubscriptionItem[];
  favoriteCount: number;
  subscriptionCount: number;
  subscriptionError: string;
};

type BridgeMessage = {
  channel?: string;
  type?: string;
  requestId?: string;
  version?: string;
  message?: string;
  payload?: Snapshot | { interactionRequired?: boolean; snapshot?: Snapshot };
};

const favoriteFilters: { id: FavoriteFilter; label: string }[] = [
  { id: "all", label: "전체" },
  { id: "live", label: "LIVE" },
  { id: "pinned", label: "상단 고정" },
  { id: "alarm-on", label: "알림 켜짐" },
  { id: "alarm-off", label: "알림 꺼짐" },
];

const subscriptionFilters: { id: SubscriptionFilter; label: string }[] = [
  { id: "all", label: "전체" },
  { id: "live", label: "LIVE" },
  { id: "pinned", label: "상단 고정" },
  { id: "favorite-on", label: "즐겨찾기" },
  { id: "favorite-off", label: "미즐겨찾기" },
];

function createRequestId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function directImageLoader({ src }: { src: string }) {
  return src;
}

function BrandMark() {
  return (
    <span className="brand-mark" aria-hidden="true">
      <i />
      <i />
    </span>
  );
}

function Avatar({
  avatar,
  nickname,
  live,
}: {
  avatar: string;
  nickname: string;
  live: boolean;
}) {
  const [failed, setFailed] = useState(false);
  return (
    <span className={`avatar ${live ? "is-live" : ""}`}>
      {avatar && !failed ? (
        <Image
          loader={directImageLoader}
          unoptimized
          src={avatar}
          alt=""
          width={56}
          height={56}
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
        />
      ) : (
        <b>{nickname.trim().slice(0, 1) || "S"}</b>
      )}
      {live && <i aria-label="방송 중">LIVE</i>}
    </span>
  );
}

function ActionButton({
  icon,
  label,
  active,
  danger,
  busy,
  onClick,
}: {
  icon: string;
  label: string;
  active?: boolean;
  danger?: boolean;
  busy?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={`action-button ${active ? "is-active" : ""} ${
        danger ? "is-danger" : ""
      }`}
      type="button"
      onClick={onClick}
      disabled={busy}
      aria-busy={busy}
    >
      <span aria-hidden="true">{busy ? "· · ·" : icon}</span>
      {busy ? "처리 중" : label}
    </button>
  );
}

function EmptyList({ query }: { query: string }) {
  return (
    <div className="list-empty">
      <span aria-hidden="true">⌕</span>
      <h3>조건에 맞는 스트리머가 없습니다</h3>
      <p>
        {query
          ? "검색어를 바꾸거나 필터를 초기화해 보세요."
          : "다른 상태 필터를 선택해 보세요."}
      </p>
    </div>
  );
}

export default function Home() {
  const [connection, setConnection] =
    useState<ConnectionState>("disconnected");
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [view, setView] = useState<View>("favorite");
  const [query, setQuery] = useState("");
  const [favoriteFilter, setFavoriteFilter] =
    useState<FavoriteFilter>("all");
  const [subscriptionFilter, setSubscriptionFilter] =
    useState<SubscriptionFilter>("all");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busyKeys, setBusyKeys] = useState<Set<string>>(() => new Set());

  const popupRef = useRef<Window | null>(null);
  const snapshotRef = useRef<Snapshot | null>(null);
  const originRef = useRef("*");
  const connectIntervalRef = useRef<number | null>(null);
  const connectTimeoutRef = useRef<number | null>(null);
  const pendingRef = useRef(new Map<string, string>());
  const noticeTimeoutRef = useRef<number | null>(null);

  const clearConnectTimers = useCallback(() => {
    if (connectIntervalRef.current) {
      clearInterval(connectIntervalRef.current);
      connectIntervalRef.current = null;
    }
    if (connectTimeoutRef.current) {
      clearTimeout(connectTimeoutRef.current);
      connectTimeoutRef.current = null;
    }
  }, []);

  const stopConnectPings = useCallback(() => {
    if (connectIntervalRef.current) {
      clearInterval(connectIntervalRef.current);
      connectIntervalRef.current = null;
    }
  }, []);

  const showNotice = useCallback((message: string) => {
    setNotice(message);
    if (noticeTimeoutRef.current) {
      clearTimeout(noticeTimeoutRef.current);
    }
    noticeTimeoutRef.current = window.setTimeout(() => setNotice(""), 3600);
  }, []);

  const postToBridge = useCallback(
    (
      type: "connect" | "snapshot" | "action",
      payload?: { scope: View; key: string; action: string },
      busyKey?: string,
    ) => {
      const popup = popupRef.current;
      if (!popup || popup.closed) {
        setConnection("disconnected");
        setError("SOOP 연결 창이 닫혔습니다. 다시 연결해 주세요.");
        return "";
      }
      const requestId = createRequestId();
      if (busyKey) {
        pendingRef.current.set(requestId, busyKey);
        setBusyKeys((current) => new Set(current).add(busyKey));
      }
      popup.postMessage(
        { channel: BRIDGE_CHANNEL, type, requestId, payload },
        originRef.current,
      );
      return requestId;
    },
    [],
  );

  const finishRequest = useCallback((requestId?: string) => {
    if (!requestId) return;
    const busyKey = pendingRef.current.get(requestId);
    if (!busyKey) return;
    pendingRef.current.delete(requestId);
    setBusyKeys((current) => {
      const next = new Set(current);
      next.delete(busyKey);
      return next;
    });
  }, []);

  useEffect(() => {
    const handleMessage = (event: MessageEvent<BridgeMessage>) => {
      if (
        event.source !== popupRef.current ||
        !SOOP_ORIGINS.has(event.origin) ||
        event.data?.channel !== BRIDGE_CHANNEL
      ) {
        return;
      }

      originRef.current = event.origin;

      if (event.data.type === "ready") {
        postToBridge("snapshot");
        return;
      }

      if (event.data.type === "bridge-ack") {
        stopConnectPings();
        return;
      }

      if (event.data.type === "snapshot") {
        const next = event.data.payload as Snapshot;
        if (!next?.favorites || !next?.subscriptions) return;
        clearConnectTimers();
        finishRequest(event.data.requestId);
        snapshotRef.current = next;
        setSnapshot(next);
        setConnection("connected");
        setError("");
        showNotice("SOOP의 최신 목록을 불러왔습니다.");
        return;
      }

      if (event.data.type === "action-result") {
        const result = event.data.payload as {
          interactionRequired?: boolean;
          snapshot?: Snapshot;
        };
        finishRequest(event.data.requestId);
        if (result?.snapshot) {
          snapshotRef.current = result.snapshot;
          setSnapshot(result.snapshot);
        }
        setConnection("connected");
        setError("");
        showNotice(
          result?.interactionRequired
            ? "SOOP 보조 창에서 설정을 마무리해 주세요."
            : "설정이 반영되었습니다.",
        );
        if (result?.interactionRequired) popupRef.current?.focus();
        return;
      }

      if (event.data.type === "bridge-error") {
        finishRequest(event.data.requestId);
        setConnection(snapshotRef.current ? "connected" : "error");
        setError(event.data.message || "SOOP 설정을 처리하지 못했습니다.");
      }
    };

    window.addEventListener("message", handleMessage);
    const closedCheck = window.setInterval(() => {
      if (popupRef.current?.closed) {
        popupRef.current = null;
        originRef.current = "*";
        clearConnectTimers();
        setConnection("disconnected");
      }
    }, 1000);

    return () => {
      window.removeEventListener("message", handleMessage);
      window.clearInterval(closedCheck);
      clearConnectTimers();
      if (noticeTimeoutRef.current) clearTimeout(noticeTimeoutRef.current);
    };
  }, [
    clearConnectTimers,
    finishRequest,
    postToBridge,
    showNotice,
    stopConnectPings,
  ]);

  const connect = useCallback(() => {
    clearConnectTimers();
    setConnection("connecting");
    setError("");
    originRef.current = "*";

    const existing = popupRef.current;
    const popup =
      existing && !existing.closed
        ? existing
        : window.open(
            BRIDGE_URL,
            "soopUnifiedManagerBridge",
            "popup=yes,width=620,height=860,resizable=yes,scrollbars=yes",
          );

    if (!popup) {
      setConnection("error");
      setError(
        "팝업이 차단되었습니다. 주소창 오른쪽의 팝업 허용 후 다시 연결해 주세요.",
      );
      return;
    }

    popupRef.current = popup;
    popup.focus();
    const ping = () => postToBridge("connect");
    window.setTimeout(ping, 500);
    connectIntervalRef.current = window.setInterval(ping, 700);
    connectTimeoutRef.current = window.setTimeout(() => {
      clearConnectTimers();
      setConnection("error");
      setError(
        "SOOP과 연결되지 않았습니다. 로그인 상태와 로컬 브리지 v1.2.0 활성화를 확인해 주세요.",
      );
    }, 18000);
  }, [clearConnectTimers, postToBridge]);

  const refresh = useCallback(() => {
    setError("");
    postToBridge("snapshot");
  }, [postToBridge]);

  const runAction = useCallback(
    (scope: View, key: string, action: string) => {
      if (connection !== "connected") {
        setError("먼저 SOOP에 연결해 주세요.");
        return;
      }
      const busyKey = `${scope}:${key}:${action}`;
      postToBridge("action", { scope, key, action }, busyKey);
    },
    [connection, postToBridge],
  );

  const filteredFavorites = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("ko");
    return (snapshot?.favorites ?? []).filter((item) => {
      const matchesQuery =
        !normalizedQuery ||
        item.nickname.toLocaleLowerCase("ko").includes(normalizedQuery);
      const matchesFilter =
        favoriteFilter === "all" ||
        (favoriteFilter === "live" && item.live) ||
        (favoriteFilter === "pinned" && item.pinned) ||
        (favoriteFilter === "alarm-on" && item.alarm) ||
        (favoriteFilter === "alarm-off" && !item.alarm);
      return matchesQuery && matchesFilter;
    });
  }, [favoriteFilter, query, snapshot]);

  const filteredSubscriptions = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("ko");
    return (snapshot?.subscriptions ?? []).filter((item) => {
      const searchable =
        `${item.nickname} ${item.userId} ${item.subscriptionNickname}`.toLocaleLowerCase(
          "ko",
        );
      const matchesQuery = !normalizedQuery || searchable.includes(normalizedQuery);
      const matchesFilter =
        subscriptionFilter === "all" ||
        (subscriptionFilter === "live" && item.live) ||
        (subscriptionFilter === "pinned" && item.pinned) ||
        (subscriptionFilter === "favorite-on" && item.favorite) ||
        (subscriptionFilter === "favorite-off" && !item.favorite);
      return matchesQuery && matchesFilter;
    });
  }, [query, snapshot, subscriptionFilter]);

  const isConnected = connection === "connected";
  const visibleItems =
    view === "favorite" ? filteredFavorites : filteredSubscriptions;
  const filters =
    view === "favorite" ? favoriteFilters : subscriptionFilters;
  const selectedFilter =
    view === "favorite" ? favoriteFilter : subscriptionFilter;

  const selectFilter = (filter: string) => {
    if (view === "favorite") {
      setFavoriteFilter(filter as FavoriteFilter);
    } else {
      setSubscriptionFilter(filter as SubscriptionFilter);
    }
  };

  return (
    <main className="dashboard-shell">
      <header className="app-header">
        <div className="brand">
          <BrandMark />
          <span>
            <b>SOOP UNIFIED</b>
            <small>STREAMER CONTROL CENTER</small>
          </span>
        </div>
        <div className="header-actions">
          <span className={`connection-badge is-${connection}`}>
            <i />
            {connection === "connected"
              ? "SOOP 연결됨"
              : connection === "connecting"
                ? "연결 중"
                : connection === "error"
                  ? "연결 확인 필요"
                  : "연결 안 됨"}
          </span>
          {isConnected ? (
            <>
              <button className="icon-button" type="button" onClick={refresh}>
                <span aria-hidden="true">↻</span>
                새로고침
              </button>
              <button
                className="connect-button secondary"
                type="button"
                onClick={() => popupRef.current?.focus()}
              >
                SOOP 창 보기
              </button>
            </>
          ) : (
            <button
              className="connect-button"
              type="button"
              onClick={connect}
              disabled={connection === "connecting"}
            >
              <span aria-hidden="true">↗</span>
              {connection === "connecting" ? "SOOP 연결 중…" : "SOOP 연결"}
            </button>
          )}
        </div>
      </header>

      <section className="workspace">
        <aside className="sidebar">
          <div className="account-block">
            <span className="account-avatar">MY</span>
            <div>
              <b>내 스트리머</b>
              <small>{isConnected ? "실시간 동기화 중" : "SOOP 연결 필요"}</small>
            </div>
          </div>

          <nav aria-label="관리 목록">
            <button
              type="button"
              className={view === "favorite" ? "active" : ""}
              onClick={() => {
                setView("favorite");
                setQuery("");
              }}
            >
              <span aria-hidden="true">★</span>
              즐겨찾기
              <em>{snapshot?.favoriteCount ?? "—"}</em>
            </button>
            <button
              type="button"
              className={view === "subscription" ? "active" : ""}
              onClick={() => {
                setView("subscription");
                setQuery("");
              }}
            >
              <span aria-hidden="true">◆</span>
              구독
              <em>{snapshot?.subscriptionCount ?? "—"}</em>
            </button>
          </nav>

          <div className="security-note">
            <span aria-hidden="true">⌾</span>
            <div>
              <b>브라우저 안에서만 동작</b>
              <p>
                목록과 설정 정보는 Vercel 서버에 저장하거나 전송하지 않습니다.
              </p>
            </div>
          </div>

          <a
            className="github-link"
            href="https://github.com/heggng/soop-unified-manager"
            target="_blank"
            rel="noreferrer"
          >
            GitHub 소스 보기 <span aria-hidden="true">↗</span>
          </a>
        </aside>

        <div className="content">
          <div className="content-heading">
            <div>
              <span className="section-kicker">
                {view === "favorite" ? "FAVORITES" : "SUBSCRIPTIONS"}
              </span>
              <h1>
                {view === "favorite" ? "즐겨찾기 관리" : "구독 스트리머 관리"}
              </h1>
              <p>
                {view === "favorite"
                  ? "알림, 즐겨찾기, 그룹, 상단 고정을 카드에서 바로 설정합니다."
                  : "즐겨찾기, 구독 닉네임, 결제 정보와 상단 고정을 한곳에서 관리합니다."}
              </p>
            </div>
            {snapshot && (
              <div className="sync-time">
                <span>마지막 동기화</span>
                <b>
                  {new Intl.DateTimeFormat("ko-KR", {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  }).format(new Date(snapshot.generatedAt))}
                </b>
              </div>
            )}
          </div>

          {!snapshot ? (
            <section className="connect-empty">
              <div className="connect-visual" aria-hidden="true">
                <BrandMark />
                <span className="bridge-line" />
                <span className="soop-node">S</span>
              </div>
              <span className="section-kicker">LOCAL SECURE BRIDGE</span>
              <h2>SOOP에 연결해 관리를 시작하세요</h2>
              <p>
                로그인된 SOOP 보조 창을 열어 즐겨찾기와 구독 목록을 불러옵니다.
                설정은 이 화면에서 실행되며 계정 정보는 서버에 남지 않습니다.
              </p>
              <button
                className="connect-button large"
                type="button"
                onClick={connect}
                disabled={connection === "connecting"}
              >
                <span aria-hidden="true">↗</span>
                {connection === "connecting"
                  ? "SOOP 응답을 기다리는 중…"
                  : "SOOP 연결하고 목록 불러오기"}
              </button>
              <small>
                처음 한 번은 Tampermonkey의 로컬 브리지 v1.2.0이 필요합니다.{" "}
                <a href="/downloads/soop-favorite-manager.user.js">
                  브리지 업데이트
                </a>
              </small>
            </section>
          ) : (
            <>
              <section className="toolbar">
                <label className="search-box">
                  <span aria-hidden="true">⌕</span>
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="스트리머 이름 또는 아이디 검색"
                    aria-label="스트리머 검색"
                  />
                  {query && (
                    <button type="button" onClick={() => setQuery("")}>
                      ×
                    </button>
                  )}
                </label>
                <div className="result-summary">
                  <b>{visibleItems.length}</b>
                  <span>명 표시</span>
                </div>
              </section>

              <div className="filter-row" aria-label="상태 필터">
                {filters.map((filter) => (
                  <button
                    type="button"
                    key={filter.id}
                    className={selectedFilter === filter.id ? "active" : ""}
                    onClick={() => selectFilter(filter.id)}
                  >
                    {filter.label}
                    {filter.id === "all" && (
                      <em>
                        {view === "favorite"
                          ? snapshot.favoriteCount
                          : snapshot.subscriptionCount}
                      </em>
                    )}
                  </button>
                ))}
              </div>

              {view === "subscription" && snapshot.subscriptionError && (
                <div className="inline-alert">
                  <span aria-hidden="true">!</span>
                  구독 목록 일부를 불러오지 못했습니다:{" "}
                  {snapshot.subscriptionError}
                </div>
              )}

              {visibleItems.length === 0 ? (
                <EmptyList query={query} />
              ) : view === "favorite" ? (
                <section className="streamer-grid">
                  {filteredFavorites.map((item) => {
                    const prefix = `favorite:${item.key}:`;
                    return (
                      <article className="streamer-card" key={item.key}>
                        <div className="streamer-main">
                          <Avatar
                            avatar={item.avatar}
                            nickname={item.nickname}
                            live={item.live}
                          />
                          <div className="streamer-copy">
                            <a
                              href={item.href || undefined}
                              target="_blank"
                              rel="noreferrer"
                            >
                              {item.nickname}
                              <span aria-hidden="true">↗</span>
                            </a>
                            <small>
                              {item.live
                                ? "현재 방송 중"
                                : item.lastLive || "최근 방송 정보 없음"}
                            </small>
                            <div className="state-tags">
                              {item.pinned && <span>상단 고정</span>}
                              {item.alarm && <span>알림 켜짐</span>}
                            </div>
                          </div>
                        </div>
                        <div className="card-actions">
                          <ActionButton
                            icon={item.alarm ? "●" : "○"}
                            label={item.alarm ? "알림 켜짐" : "알림 꺼짐"}
                            active={item.alarm}
                            busy={busyKeys.has(`${prefix}alarm`)}
                            onClick={() =>
                              runAction("favorite", item.key, "alarm")
                            }
                          />
                          <ActionButton
                            icon="★"
                            label={item.favorite ? "즐겨찾기 해제" : "즐겨찾기"}
                            active={item.favorite}
                            danger={item.favorite}
                            busy={busyKeys.has(`${prefix}favorite`)}
                            onClick={() =>
                              runAction("favorite", item.key, "favorite")
                            }
                          />
                          <ActionButton
                            icon="▦"
                            label="그룹 설정"
                            busy={busyKeys.has(`${prefix}group`)}
                            onClick={() =>
                              runAction("favorite", item.key, "group")
                            }
                          />
                          <ActionButton
                            icon="◆"
                            label={item.pinned ? "고정 해제" : "상단 고정"}
                            active={item.pinned}
                            busy={busyKeys.has(`${prefix}pin`)}
                            onClick={() =>
                              runAction("favorite", item.key, "pin")
                            }
                          />
                        </div>
                      </article>
                    );
                  })}
                </section>
              ) : (
                <section className="streamer-grid">
                  {filteredSubscriptions.map((item) => {
                    const prefix = `subscription:${item.key}:`;
                    return (
                      <article className="streamer-card" key={item.key}>
                        <div className="streamer-main">
                          <Avatar
                            avatar={item.avatar}
                            nickname={item.nickname}
                            live={item.live}
                          />
                          <div className="streamer-copy">
                            <a
                              href={item.href || undefined}
                              target="_blank"
                              rel="noreferrer"
                            >
                              {item.nickname}
                              <span aria-hidden="true">↗</span>
                            </a>
                            <small>
                              {item.userId
                                ? `${item.userId} · ${item.lastLive || "최근 방송 정보 없음"}`
                                : item.lastLive || "최근 방송 정보 없음"}
                            </small>
                            <div className="state-tags">
                              {item.tier && <span>{item.tier}</span>}
                              {item.subscriptionNickname && (
                                <span>{item.subscriptionNickname}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="card-actions">
                          <ActionButton
                            icon="★"
                            label={item.favorite ? "즐겨찾기 해제" : "즐겨찾기"}
                            active={item.favorite}
                            busy={busyKeys.has(`${prefix}favorite`)}
                            onClick={() =>
                              runAction("subscription", item.key, "favorite")
                            }
                          />
                          <ActionButton
                            icon="Aa"
                            label="구독 닉네임"
                            busy={busyKeys.has(`${prefix}nickname`)}
                            onClick={() =>
                              runAction("subscription", item.key, "nickname")
                            }
                          />
                          <ActionButton
                            icon="₩"
                            label="결제 정보"
                            busy={busyKeys.has(`${prefix}payment`)}
                            onClick={() =>
                              runAction("subscription", item.key, "payment")
                            }
                          />
                          <ActionButton
                            icon="◆"
                            label={item.pinned ? "고정 해제" : "상단 고정"}
                            active={item.pinned}
                            busy={busyKeys.has(`${prefix}pin`)}
                            onClick={() =>
                              runAction("subscription", item.key, "pin")
                            }
                          />
                        </div>
                      </article>
                    );
                  })}
                </section>
              )}
            </>
          )}
        </div>
      </section>

      {error && (
        <div className="error-banner" role="alert">
          <span aria-hidden="true">!</span>
          <p>{error}</p>
          <button type="button" onClick={() => setError("")}>
            ×
          </button>
        </div>
      )}
      {notice && (
        <div className="toast" role="status">
          <span aria-hidden="true">✓</span>
          {notice}
        </div>
      )}
    </main>
  );
}
