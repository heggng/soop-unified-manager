const features = [
  {
    icon: "⌕",
    eyebrow: "한눈에 찾기",
    title: "191명이어도 빠르게",
    body: "이름 검색과 LIVE·고정·알림 필터로 원하는 스트리머만 즉시 추려보세요.",
    tone: "cyan",
  },
  {
    icon: "◆",
    eyebrow: "하나의 관리 창",
    title: "즐겨찾기와 구독을 함께",
    body: "페이지를 오갈 필요 없이 같은 화면에서 두 목록과 설정을 전환합니다.",
    tone: "blue",
  },
  {
    icon: "★",
    eyebrow: "바로 설정",
    title: "필요한 기능을 카드에",
    body: "알림, 즐겨찾기, 그룹, 구독 닉네임, 결제 정보, 상단 고정을 바로 실행합니다.",
    tone: "yellow",
  },
];

const steps = [
  {
    number: "01",
    title: "Tampermonkey 준비",
    body: "네이버 웨일에 Tampermonkey 확장 프로그램을 설치하고 활성화합니다.",
  },
  {
    number: "02",
    title: "통합 스크립트 설치",
    body: "아래 설치 버튼을 누른 뒤 Tampermonkey 설치 화면에서 설치를 승인합니다.",
  },
  {
    number: "03",
    title: "SOOP에서 열기",
    body: "즐겨찾기 페이지를 새로고침하고 오른쪽 위의 통합 관리 버튼을 누릅니다.",
  },
];

const faqs = [
  {
    question: "별도의 SOOP 로그인 정보가 필요한가요?",
    answer:
      "아니요. 스크립트는 현재 브라우저에 로그인된 SOOP 세션 안에서만 동작하며 로그인 정보나 목록을 외부 서버로 전송하지 않습니다.",
  },
  {
    question: "기존 구독 관리 스크립트는 지워야 하나요?",
    answer:
      "그대로 두어도 됩니다. 통합 스크립트는 즐겨찾기 페이지를 담당하고, 구독 보조 스크립트는 구독 전용 페이지와 상세 결제 내역 페이지를 개선합니다.",
  },
  {
    question: "웹사이트만으로 스트리머 설정을 바꿀 수 있나요?",
    answer:
      "브라우저 보안 정책 때문에 외부 사이트가 SOOP 계정에 직접 접근할 수는 없습니다. 이 사이트는 안전한 설치와 문서를 제공하고, 실제 설정은 SOOP 페이지 안에서 실행되는 스크립트가 담당합니다.",
  },
  {
    question: "업데이트는 어떻게 하나요?",
    answer:
      "새 버전이 공개되면 이 사이트의 설치 버튼을 다시 눌러 Tampermonkey에서 업데이트할 수 있습니다. 설치 화면에 표시되는 버전을 확인하세요.",
  },
];

function BrandMark() {
  return (
    <span className="brand-mark" aria-hidden="true">
      <span />
      <span />
    </span>
  );
}

export default function Home() {
  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="SOOP 통합 관리 홈">
          <BrandMark />
          <span className="brand-copy">
            SOOP <b>UNIFIED</b>
          </span>
        </a>
        <nav aria-label="주요 메뉴">
          <a href="#features">기능</a>
          <a href="#install">설치 방법</a>
          <a href="#faq">자주 묻는 질문</a>
        </nav>
        <a
          className="header-github"
          href="https://github.com/heggng/soop-unified-manager"
          target="_blank"
          rel="noreferrer"
        >
          GitHub <span aria-hidden="true">↗</span>
        </a>
      </header>

      <section className="hero section-shell" id="top">
        <div className="hero-copy">
          <div className="release-pill">
            <span className="release-dot" />
            v1.1.0 · Whale & Tampermonkey
          </div>
          <h1>
            흩어진 스트리머 관리,
            <br />
            <span>한 화면이면 충분합니다.</span>
          </h1>
          <p className="hero-description">
            SOOP 즐겨찾기와 구독 목록을 넓고 빠른 카드형 대시보드로.
            검색부터 알림·고정·그룹·결제 정보까지 한곳에서 관리하세요.
          </p>
          <div className="hero-actions">
            <a
              className="button button-primary"
              href="/downloads/soop-favorite-manager.user.js"
            >
              <span aria-hidden="true">↓</span>
              통합 스크립트 설치
            </a>
            <a className="button button-secondary" href="#preview">
              화면 미리보기
              <span aria-hidden="true">↘</span>
            </a>
          </div>
          <div className="trust-row" aria-label="보안 및 지원 정보">
            <span>
              <b aria-hidden="true">✓</b> 외부 데이터 전송 없음
            </span>
            <span>
              <b aria-hidden="true">✓</b> 오픈소스
            </span>
            <span>
              <b aria-hidden="true">✓</b> 다크 모드
            </span>
          </div>
        </div>

        <div className="hero-visual" aria-label="통합 관리 화면 미리보기">
          <div className="orb orb-one" />
          <div className="orb orb-two" />
          <div className="app-window">
            <div className="window-bar">
              <div className="traffic-lights" aria-hidden="true">
                <i />
                <i />
                <i />
              </div>
              <div className="address-pill">sooplive.com/my/favorite</div>
              <span className="window-status">통합 관리 중</span>
            </div>
            <div className="mini-dashboard">
              <div className="mini-title">
                <div>
                  <span className="star">★</span>
                  <b>스트리머 관리</b>
                  <small>191명</small>
                </div>
                <span>×</span>
              </div>
              <div className="mini-tabs">
                <span className="active">★ 즐겨찾기 <em>191</em></span>
                <span>◆ 구독 <em>18</em></span>
              </div>
              <div className="mini-search">⌕ 스트리머를 검색해 주세요.</div>
              <div className="mini-filters">
                <span className="active">전체 191</span>
                <span>LIVE 5</span>
                <span>고정 5</span>
                <span>알림 켜짐 36</span>
              </div>
              <div className="mini-cards">
                {["독고혜지_", "진저에일", "돌돌_", "샌디한"].map(
                  (name, index) => (
                    <article className="mini-card" key={name}>
                      <span className={`mini-avatar avatar-${index + 1}`}>
                        {name.slice(0, 1)}
                      </span>
                      <div>
                        <b>{name}</b>
                        <small>
                          {index < 2 ? "LIVE · " : ""}최근 방송 10:30
                        </small>
                        <span className="mini-actions">
                          <i>♟ 알림</i>
                          <i>★ 즐겨찾기</i>
                          <i>◆ 고정</i>
                        </span>
                      </div>
                    </article>
                  ),
                )}
              </div>
            </div>
          </div>
          <div className="floating-card floating-live">
            <span>●</span>
            <div>
              <small>지금 LIVE</small>
              <b>5명 방송 중</b>
            </div>
          </div>
          <div className="floating-card floating-saved">
            <span>✓</span>
            <div>
              <small>설정 반영</small>
              <b>즉시 완료</b>
            </div>
          </div>
        </div>
      </section>

      <section className="proof-strip" aria-label="주요 장점">
        <div>
          <strong>2</strong>
          <span>즐겨찾기 + 구독</span>
        </div>
        <div>
          <strong>1</strong>
          <span>하나의 관리 창</span>
        </div>
        <div>
          <strong>0</strong>
          <span>외부 데이터 전송</span>
        </div>
        <div>
          <strong>100%</strong>
          <span>브라우저 안에서 동작</span>
        </div>
      </section>

      <section className="features section-shell" id="features">
        <div className="section-heading">
          <span className="eyebrow">BUILT FOR YOUR FAVORITES</span>
          <h2>
            목록은 더 넓게,
            <br />
            설정은 더 가깝게.
          </h2>
          <p>
            SOOP의 원래 기능은 그대로 연결하고, 매일 쓰는 관리 경험만
            깔끔하게 다시 설계했습니다.
          </p>
        </div>
        <div className="feature-grid">
          {features.map((feature) => (
            <article
              className={`feature-card feature-${feature.tone}`}
              key={feature.title}
            >
              <div className="feature-icon" aria-hidden="true">
                {feature.icon}
              </div>
              <span>{feature.eyebrow}</span>
              <h3>{feature.title}</h3>
              <p>{feature.body}</p>
              <i className="feature-line" />
            </article>
          ))}
        </div>
      </section>

      <section className="preview-section section-shell" id="preview">
        <div className="preview-copy">
          <span className="eyebrow">THE REAL VIEW</span>
          <h2>작은 팝업 대신, 제대로 된 대시보드.</h2>
          <p>
            화면 크기를 활용한 카드 레이아웃으로 스트리머 이름과 상태,
            설정 버튼을 한눈에 확인합니다. 촘촘하게 또는 여유 있게, 원하는
            밀도로 바꿀 수도 있습니다.
          </p>
          <ul>
            <li>
              <span>01</span> 즐겨찾기와 구독 인원 자동 집계
            </li>
            <li>
              <span>02</span> LIVE·고정·알림 상태별 즉시 필터
            </li>
            <li>
              <span>03</span> SOOP 원본 설정 기능과 안전하게 연결
            </li>
          </ul>
        </div>
        <figure className="screenshot-frame">
          <div className="screenshot-label">
            <span>SOOP / MY</span>
            <span className="live-label">● LIVE PREVIEW</span>
          </div>
          <img
            src="/images/manager-preview.webp"
            alt="SOOP 즐겨찾기 스트리머 통합 관리 화면"
          />
          <figcaption>
            실제 SOOP 즐겨찾기 페이지에서 실행한 통합 관리 화면
          </figcaption>
        </figure>
      </section>

      <section className="install-section" id="install">
        <div className="section-shell">
          <div className="install-heading">
            <span className="eyebrow">INSTALL IN 3 STEPS</span>
            <h2>설치는 1분이면 끝납니다.</h2>
            <p>
              네이버 웨일과 Tampermonkey만 준비되어 있으면 바로 사용할 수
              있습니다.
            </p>
          </div>
          <div className="steps-grid">
            {steps.map((step) => (
              <article className="step-card" key={step.number}>
                <span className="step-number">{step.number}</span>
                <div className="step-connector" />
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </article>
            ))}
          </div>
          <div className="download-panel">
            <div>
              <span className="script-icon" aria-hidden="true">
                {"</>"}
              </span>
              <div>
                <b>SOOP 즐겨찾기·구독 통합 관리</b>
                <span>v1.1.0 · Tampermonkey UserScript</span>
              </div>
            </div>
            <div className="download-actions">
              <a
                className="button button-primary"
                href="/downloads/soop-favorite-manager.user.js"
              >
                지금 설치하기
                <span aria-hidden="true">↓</span>
              </a>
              <a
                className="text-link"
                href="/downloads/soop-subscription-manager.user.js"
              >
                구독 페이지 보조 스크립트
                <span aria-hidden="true">↗</span>
              </a>
            </div>
          </div>
          <p className="install-note">
            설치 버튼을 눌러도 Windows 프로그램은 실행되지 않습니다.
            Tampermonkey가 스크립트 내용을 확인한 뒤 설치 여부를 묻습니다.
          </p>
        </div>
      </section>

      <section className="privacy section-shell">
        <div className="privacy-badge" aria-hidden="true">
          <span>✓</span>
        </div>
        <div className="privacy-copy">
          <span className="eyebrow">LOCAL-FIRST BY DESIGN</span>
          <h2>내 목록은 내 브라우저 안에만.</h2>
          <p>
            로그인 정보, 즐겨찾기 목록, 구독 정보는 외부 서버로 전송하지
            않습니다. 모든 동작은 현재 로그인된 SOOP 페이지의 공식 버튼과
            메뉴를 통해 실행됩니다.
          </p>
        </div>
        <div className="privacy-list">
          <span>
            <b>01</b> 별도 회원가입 없음
          </span>
          <span>
            <b>02</b> 쿠키 수집 없음
          </span>
          <span>
            <b>03</b> 오픈소스로 코드 공개
          </span>
        </div>
      </section>

      <section className="faq section-shell" id="faq">
        <div className="faq-heading">
          <span className="eyebrow">QUESTIONS, ANSWERED</span>
          <h2>자주 묻는 질문</h2>
        </div>
        <div className="faq-list">
          {faqs.map((faq, index) => (
            <details key={faq.question} open={index === 0}>
              <summary>
                <span>{faq.question}</span>
                <i aria-hidden="true">+</i>
              </summary>
              <p>{faq.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="final-cta">
        <div className="cta-glow" />
        <BrandMark />
        <span>READY WHEN YOU ARE</span>
        <h2>
          오늘부터 스트리머 관리는
          <br />
          한 화면에서 끝내세요.
        </h2>
        <a
          className="button button-primary button-large"
          href="/downloads/soop-favorite-manager.user.js"
        >
          무료로 설치하기
          <span aria-hidden="true">↗</span>
        </a>
      </section>

      <footer>
        <div className="footer-brand">
          <BrandMark />
          <span>
            <b>SOOP UNIFIED</b>
            <small>Favorite & Subscription Manager</small>
          </span>
        </div>
        <div className="footer-links">
          <a
            href="https://github.com/heggng/soop-unified-manager"
            target="_blank"
            rel="noreferrer"
          >
            GitHub
          </a>
          <a href="/downloads/soop-favorite-manager.user.js">통합 스크립트</a>
          <a href="/downloads/soop-subscription-manager.user.js">
            구독 보조 스크립트
          </a>
        </div>
        <p>
          비공식 사용자 프로젝트이며 SOOP Corp.와 제휴 또는 보증 관계가
          없습니다.
        </p>
      </footer>
    </main>
  );
}
