# 보람투어 (Boram Tour) — 데모

가족 여행 전문 **보람투어** 및 주얼리 브랜드 **비아젬(VIEAGEM)** 랜딩/예약 플로우의
정적 프로토타입입니다. 빌드 도구 없이 동작하는 **순수 Vanilla JS 멀티페이지 사이트**입니다.

> ⚠️ 비공개 데모입니다. 페이지에 포함된 연락처·예약 정보는 시연용 더미 데이터입니다.

## 페이지

| 파일 | 설명 |
|------|------|
| `index.html` | 보람투어 메인 랜딩 |
| `product-detail.html` | 여행 상품 상세 |
| `checkout-product.html` | 상품 주문/결제 |
| `booking-complete.html` | 예약 완료 |
| `vieagem.html` | 비아젬 주얼리 브랜드 랜딩 |

## 구조

```
boram/
├─ *.html              # 페이지 진입점
├─ css/                # base · tokens · 페이지별 스타일
├─ js/
│  ├─ state.js         # 전역 상태 (사이트 설정·결제 등)
│  ├─ render.js        # 렌더링 로직
│  ├─ storage.js       # localStorage 영속화
│  ├─ types/           # 섹션 컴포넌트(hero, banner, faq, footer …)
│  └─ ui/              # 모달 등 UI
├─ data/               # icons · languages · payment 스키마 · 상품 데이터
└─ images/             # 이미지 에셋
```

## 실행

빌드·설치 과정이 없습니다. 정적 서버로 루트를 서빙하면 됩니다.

```bash
# 예시
python -m http.server 8000
# 또는
npx serve .
```

브라우저에서 `http://localhost:8000/index.html` 접속.

## 참고

- 결제 관련 키(`data/payment.js`, `js/state.js`)는 **입력 폼 스키마/placeholder**이며 실제 키는 포함되어 있지 않습니다.
- 일부 `<meta og:image>` URL은 임시 데모 터널 주소이므로 배포 시 실제 도메인으로 교체하세요.
