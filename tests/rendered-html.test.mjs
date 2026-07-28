import assert from "node:assert/strict";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("renders the SOOP unified manager dashboard", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(
    html,
    /<title>SOOP Unified — 즐겨찾기·구독 웹 관리<\/title>/,
  );
  assert.match(html, /SOOP에 연결해 관리를 시작하세요/);
  assert.match(html, /즐겨찾기 관리/);
  assert.match(html, /즐겨찾기와 구독 목록을 불러옵니다/);
  assert.match(html, /SOOP 연결하고 목록 불러오기/);
  assert.match(html, /GitHub/);
  assert.doesNotMatch(html, /통합 스크립트 설치/);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton/i);
});
