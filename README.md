# SOOP 즐겨찾기 한눈에 관리

SOOP 즐겨찾기 스트리머를 넓은 카드 화면에서 확인하고 관리하는
Tampermonkey 사용자 스크립트입니다. 별도의 웹 대시보드나 외부 서버를
사용하지 않습니다.

## 설치 또는 업데이트

네이버 웨일에 Tampermonkey가 설치되어 있다면 아래 링크를 열고
Tampermonkey의 `설치` 또는 `업데이트`를 누르세요.

- **[SOOP 즐겨찾기 관리 v1.5.0 설치](https://raw.githubusercontent.com/heggng/soop-unified-manager/main/soop-favorite-manager.user.js)**

> `.user.js` 파일을 Windows 탐색기에서 더블클릭하지 마세요. Windows Script
> Host용 파일이 아니므로 `800A03EA` 오류가 발생합니다.

## 주요 기능

- 전체·LIVE·고정·알림 상태 필터
- 즐겨찾기 그룹 버튼과 그룹별 스트리머 필터
- 알림 켜기·끄기, 즐겨찾기 해제, 그룹 설정, 상단 고정·해제
- 넓은 카드형 관리 화면
- SOOP 다크 모드 및 반응형 화면 지원
- 로그인 세션 안에서만 작동하며 외부 서버로 계정 정보 전송 없음

`전체 알림`, `최근 추가`, `고정 숨기기`, 화면 밀도 전환 및 구독 관리
기능은 제거했습니다. 그룹은 별도의 로딩 문구 없이 버튼만 표시합니다.

## 사용 방법

1. `https://www.sooplive.com/my/favorite`를 새로고침합니다.
2. 페이지 오른쪽 상단의 `★ 즐겨찾기 관리`를 누릅니다.
3. 상단 상태 필터 또는 각 스트리머 카드의 설정 버튼을 사용합니다.

## 파일

- `soop-favorite-manager.user.js`: 즐겨찾기 관리 v1.5.0
- `INSTALL.md`: 자세한 설치 및 사용 안내

## 주의

이 프로젝트는 비공식 사용자 프로젝트이며 SOOP Corp.와 제휴 또는 보증
관계가 없습니다. SOOP의 페이지 구조가 변경되면 스크립트 업데이트가 필요할
수 있습니다.

## 라이선스

[MIT](LICENSE)
