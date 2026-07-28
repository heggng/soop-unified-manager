# SOOP 즐겨찾기·구독 통합 관리

SOOP 즐겨찾기 페이지 안에서 즐겨찾기와 구독 스트리머를 한 화면으로
관리하는 Tampermonkey 사용자 스크립트입니다. 별도의 웹 대시보드나 외부
서버를 사용하지 않습니다.

## 설치

네이버 웨일에 Tampermonkey가 설치되어 있다면 아래 링크를 열고
Tampermonkey의 `설치` 또는 `업데이트`를 누르세요.

- **[통합 관리 스크립트 설치](https://raw.githubusercontent.com/heggng/soop-unified-manager/main/soop-favorite-manager.user.js)**
- [구독 전용 페이지 보조 스크립트 설치](https://raw.githubusercontent.com/heggng/soop-unified-manager/main/soop-subscription-manager.user.js)

통합 관리 스크립트만으로 즐겨찾기 페이지에서 즐겨찾기와 구독 목록을 함께
관리할 수 있습니다. 구독 전용 보조 스크립트는 `/my/subscribe` 및
구독·결제 내역 페이지도 개선하고 싶을 때만 추가로 설치하면 됩니다.

> `.user.js` 파일을 Windows 탐색기에서 더블클릭하지 마세요. Windows Script
> Host용 파일이 아니므로 `800A03EA` 오류가 발생합니다.

## 주요 기능

- 즐겨찾기와 구독 목록을 같은 관리 창에서 전환
- 이름 검색과 LIVE·고정·알림·즐겨찾기 상태 필터
- 알림, 즐겨찾기, 그룹, 구독 닉네임, 결제 정보, 상단 고정 설정
- 넓은 카드형 화면과 카드 밀도 전환
- SOOP 다크 모드 및 반응형 화면 지원
- SOOP 로그인 세션 안에서만 작동하며 외부 서버로 계정 정보 전송 없음

## 사용 방법

1. `https://www.sooplive.com/my/favorite`를 새로고침합니다.
2. 페이지 오른쪽 상단의 `★ 즐겨찾기·구독 관리`를 누릅니다.
3. 관리 창의 `즐겨찾기`와 `구독` 탭으로 목록을 전환합니다.
4. 각 스트리머 카드의 설정 버튼을 사용합니다.

구독 닉네임과 결제 정보처럼 SOOP의 원본 입력 창이 필요한 설정은 해당 창을
앞으로 표시합니다. 설정 후 `설정을 마치고 통합 관리로 돌아가기`를 누르면
됩니다.

## 파일

- `soop-favorite-manager.user.js`: 즐겨찾기·구독 통합 관리 v1.3.0
- `soop-subscription-manager.user.js`: 구독 페이지 보조 v1.1.0
- `INSTALL.md`: 자세한 설치 및 사용 안내

## 주의

이 프로젝트는 비공식 사용자 프로젝트이며 SOOP Corp.와 제휴 또는 보증
관계가 없습니다. SOOP의 페이지 구조가 변경되면 스크립트 업데이트가 필요할
수 있습니다.

## 라이선스

[MIT](LICENSE)
