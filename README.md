# SOOP 즐겨찾기·구독 통합 관리

SOOP 즐겨찾기와 구독 스트리머를 하나의 넓은 카드형 관리 화면에서
확인하고 설정할 수 있게 해 주는 Tampermonkey 사용자 스크립트와
설치 웹사이트입니다.

## 주요 기능

- 즐겨찾기와 구독 목록을 같은 관리 창에서 전환
- 이름 검색 및 LIVE·고정·알림·즐겨찾기 상태 필터
- 알림, 즐겨찾기, 그룹, 구독 닉네임, 결제 정보, 상단 고정 설정
- 촘촘한 카드와 여유 있는 카드 밀도 전환
- SOOP 다크 모드 및 반응형 화면 지원
- 별도의 외부 서버나 계정 데이터 전송 없이 브라우저 안에서 동작

## 설치

배포된 웹사이트에서 `통합 스크립트 설치`를 누르거나 다음 파일을
Tampermonkey에 설치합니다.

- `public/downloads/soop-favorite-manager.user.js`
- `public/downloads/soop-subscription-manager.user.js` (구독 전용 페이지 보조)

## 개발

Node.js 22 이상과 pnpm이 필요합니다.

```bash
pnpm install
pnpm dev
```

검증 빌드:

```bash
pnpm build
pnpm build:vercel
```

## 프로젝트 구성

- `app/`: 설치 안내 웹사이트
- `public/downloads/`: 배포되는 Tampermonkey 스크립트
- `outputs/`: 로컬 작업용 원본 스크립트와 문서
- `vercel.json`: Vercel 배포 및 사용자 스크립트 응답 헤더 설정

## 주의

이 프로젝트는 비공식 사용자 프로젝트이며 SOOP Corp.와 제휴 또는 보증
관계가 없습니다. SOOP의 페이지 구조가 변경되면 사용자 스크립트 업데이트가
필요할 수 있습니다.

## 라이선스

[MIT](LICENSE)
