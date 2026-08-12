# 命絲 · 사주타로 (saju-tarot)

사주팔자와 타로를 결합한 정적 웹 페이지입니다. 순수 HTML/CSS/JS로 작성되어 별도 빌드 과정 없이 바로 배포할 수 있습니다. 결제 검증만 Netlify Functions(서버리스)로 처리합니다.

## 로컬에서 보기

`index.html` 파일을 브라우저로 열면 됩니다. (단, 결제 연동은 Netlify Functions가 필요해서 로컬에선 `netlify dev`로 실행해야 정상 동작합니다.)

## 배포

Netlify에 연결하면 `main` 브랜치에 push할 때마다 자동 배포됩니다. `netlify.toml`에 publish/functions 경로가 이미 설정되어 있어 별도 빌드 명령 없이 그대로 게시됩니다.

## 프리미엄 리포트 결제 연동 (포트원 V2) — 실 서비스 전 필수 설정

1. **사업자등록**: 한국에서 실제 결제를 받으려면 PG사와 계약하기 위해 사업자등록(개인사업자 가능)이 필요합니다.
2. [portone.io](https://admin.portone.io)에서 상점(store) 생성 → 원하는 PG(토스페이먼츠/카카오페이 등) 채널 연결 → **상점 ID(Store ID)**, **채널 키(Channel Key)**, **V2 API Secret** 발급.
3. `index.html`에서 `PORTONE_STORE_ID`, `PORTONE_CHANNEL_KEY` 상수를 발급받은 실제 값으로 교체.
4. Netlify 대시보드 → Site settings → Environment variables에 `PORTONE_API_SECRET` 등록 (절대 index.html이나 git에 커밋하지 마세요).
5. 재배포하면 "리포트 잠금 해제하기" 버튼이 실제 결제창을 띄우고, `netlify/functions/verify-payment.js`가 서버에서 결제를 재검증한 뒤에만 프리미엄 리포트를 열어줍니다.

위 설정 전까지는 안전한 폴백으로 미리보기용 무료 잠금 해제만 동작합니다.

## 공유 카드 기능

무료 미리보기 영역(오행 균형까지)에 "결과 카드로 공유하기" 버튼이 있습니다. html2canvas로 브랜드 카드 이미지를 만들어 모바일에서는 공유 시트(Web Share API), 그 외에는 PNG 다운로드로 동작합니다. 무료 콘텐츠만 담기 때문에 바이럴 유입 채널로 안전하게 씁니다.

## 프리미엄 콘텐츠 보호

이전에는 프리미엄 리포트(신강신약/십신/대운/세운 등) 텍스트가 CSS 블러로만 가려져 있어 페이지 소스나 텍스트 추출 도구로 결제 없이 전체 내용을 볼 수 있었습니다. 지금은 `renderPremiumReport()`가 결제 검증 성공(`unlockPremiumReport()`) 전에는 절대 호출되지 않아, 잠금 해제 전에는 해당 텍스트가 DOM에 아예 생성되지 않습니다.
