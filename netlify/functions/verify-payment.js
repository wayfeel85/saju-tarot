// 결제 서버 검증 함수
// 클라이언트(브라우저)가 "결제 성공했어요"라고 보내는 값은 개발자도구로 얼마든지 위조할 수 있으므로,
// 반드시 포트원 서버 API로 paymentId를 재조회해서 실제 결제 상태·금액을 확인한 뒤에만 프리미엄 콘텐츠를 열어줘야 합니다.
//
// 사전 준비:
// 1. https://admin.portone.io 에서 상점 생성 후 V2 API Secret 발급
// 2. Netlify 대시보드 > Site settings > Environment variables 에 PORTONE_API_SECRET 등록
// 3. 재배포하면 이 함수가 자동으로 https://<사이트>/.netlify/functions/verify-payment 로 노출됩니다.

const PORTONE_API_SECRET = process.env.PORTONE_API_SECRET;
const EXPECTED_AMOUNT = 4900;
const EXPECTED_CURRENCY = "KRW";

exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ ok: false, error: "Method not allowed" }) };
  }

  if (!PORTONE_API_SECRET) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        ok: false,
        error: "PORTONE_API_SECRET 환경변수가 설정되지 않았어요. Netlify 대시보드 > Site settings > Environment variables에서 추가해주세요.",
      }),
    };
  }

  let paymentId;
  try {
    const body = JSON.parse(event.body || "{}");
    paymentId = body.paymentId;
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ ok: false, error: "잘못된 요청이에요." }) };
  }
  if (!paymentId) {
    return { statusCode: 400, body: JSON.stringify({ ok: false, error: "paymentId가 없어요." }) };
  }

  try {
    const res = await fetch(`https://api.portone.io/payments/${encodeURIComponent(paymentId)}`, {
      headers: { Authorization: `PortOne ${PORTONE_API_SECRET}` },
    });

    if (!res.ok) {
      const errText = await res.text();
      return {
        statusCode: 502,
        body: JSON.stringify({ ok: false, error: "포트원 결제 조회에 실패했어요.", detail: errText }),
      };
    }

    const payment = await res.json();
    const isPaid = payment.status === "PAID";
    const amountOk = payment.amount && payment.amount.total === EXPECTED_AMOUNT;
    const currencyOk = payment.currency === EXPECTED_CURRENCY;

    if (isPaid && amountOk && currencyOk) {
      return { statusCode: 200, body: JSON.stringify({ ok: true, paymentId, amount: payment.amount.total }) };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        ok: false,
        error: "결제 상태 또는 금액이 일치하지 않아요.",
        status: payment.status,
      }),
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ ok: false, error: "서버 오류", detail: String(err) }) };
  }
};
