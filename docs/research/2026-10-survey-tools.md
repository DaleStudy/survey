# 설문 도구 비교 조사 (2026-10-31)

1회차에 쓸 설문 도구를 비교했다. 조건은 로그인 없는 익명 응답, 2주 준비, 응답 수백~수천 건이다. 가격과 제한은 2026-10-31에 공식 페이지에서 확인한 값이다.

## 결론

- **추천: Tally.** 무료 플랜으로 시작하고, 필요하면 수집 기간에만 Pro($24/월)를 쓴다.
  - 무료로 응답 수가 사실상 무제한이다(공정 사용, 월 약 5만 건이 과다 사용의 예).
  - 로그인 없이 응답받을 수 있고, 무료로 중복 방지(localStorage의 무작위 Respondent ID)와 reCAPTCHA v2를 쓸 수 있다.
  - 제출 데이터와 함께 IP를 저장하지 않는다. IP로 중복을 막을 때도 해시만 저장한다.
  - 조건 분기, 선택지 무작위화, 진행률, "기타" 직접 입력, 브라우저 답 저장, CSV·API 내보내기를 모두 무료로 쓸 수 있다.
  - 오류·마감 같은 기본 문구가 한국어로 나온다.
  - Pro 전용 기능: 브랜딩 제거, 커스텀 도메인, 이탈 분석용 부분 응답 수집.
- **차선: Google Forms.** 무료이고 익숙하지만, 1회 응답 제한과 자동 저장이 Google 로그인을 전제로 한다. 익명으로 받으면 중복을 막을 수단이 사실상 없다. 개인 계정은 저장 리전도 고를 수 없다.
- **직접 구현(Workers + D1)은 1회차에는 하지 않는다.** 2주 안에 분기·셔플·중간 저장·접근성까지 만들어야 하고, 버그가 나면 다시 모을 수 없는 1회차 데이터를 잃는다. 게다가 D1도 국내 저장을 보장하지 않아 국외 이전 문제가 그대로 남는다.

## 개인정보 조사와 맞춰 본 점

[개인정보 조사](2026-10-privacy-law.md)와 함께 봐야 하는 부분이다.

- **국외 이전:** Tally는 Google Cloud **벨기에**에 저장한다. 개인정보 조사 결론은 해외 저장 금지가 아니라 "5개 항목 고지와 별도 동의"이므로 Tally를 쓸 수 있다. 동의 화면과 처리방침에 벨기에, Tally(회사명·연락처), 목적, 기간을 적는다.
- **수탁자:** Tally는 처리 기능을 제공하는 SaaS라 수탁자로 보고 처리방침에 위탁 사실을 적는다.
- **중복 방지 방식:** IP 해시 방식보다 **Respondent ID와 reCAPTCHA** 조합을 쓴다. IP 방식은 회사·행사장 와이파이처럼 같은 네트워크를 쓰는 사람끼리 서로 막을 수 있다고 Tally 도움말이 경고한다. IP를 쓰지 않으면 "IP를 받지 않는다"는 안내와도 맞는다.
- **처리방침에 추가로 적을 것:** Respondent ID와 답 저장은 브라우저 localStorage를 쓰고, reCAPTCHA는 Google로 데이터를 보낸다. 둘 다 처리방침의 "자동 수집 장치" 항목에 적는다. reCAPTCHA가 Google에 보내는 범위는 확인하지 못했다.
- **보유 기간과 파기:** 자동 보존 기간 설정은 Business 전용이라, 원본은 고지한 파기일에 수동으로 지운다. 지운 데이터는 90일 안에 백업에서도 제거된다.
- **공개 데이터:** CSV에는 제출 시각(UTC)이 들어간다. 공개 전에 지운다.

## 비교 표

| 도구 | 비용 | 익명·중복 방지 | 한국어 | 저장 위치 |
|---|---|---|---|---|
| **Tally** | 무료(공정 사용). Pro $24/월 | 로그인 불필요. Respondent ID·IP 해시 중복 방지, reCAPTCHA v2 무료. IP 미저장 | 기본 문구 한국어 지원 | Google Cloud 벨기에 |
| Google Forms | 무료 | 1회 제한은 Google 로그인 필수. CAPTCHA 설정 못 찾음 | 한국어 UI | 개인 계정은 리전 선택 불가 |
| Formbricks Cloud | 무료 월 250 응답. Pro $74~89/월 | IP는 켤 때만 저장. 스팸 방지는 유료이고 EU Cloud에서 불가 | 기본 문구에 한국어 없음 | 프랑크푸르트 |
| LimeSurvey Cloud | Basic 23€/월(월 1,000 응답)부터 | 익명 응답, IP 저장 끄기, 쿠키 1회 제한, CAPTCHA | 지원 | 7개 리전 중 선택, 한국 없음 |
| LimeSurvey CE (셀프호스팅) | 무료 | 위와 같음 | 지원 | 직접 운영, 국내 가능 |
| Typeform | 무료 월 10 응답 | 확인 못 함 | 확인 못 함 | US/EU는 Enterprise만 |
| SurveyMonkey | 무료는 설문당 10문항 | 확인 못 함 | 확인 못 함 | 기본 미국 |
| 네이버 폼 | 무료(기사 기준) | 확인 못 함 | 한국어 | 확인 못 함 (국내일 가능성, 추정) |
| Workers + D1 직접 구현 | 무료~$5/월 | 직접 설계 (Turnstile, IP 미저장) | 직접 | `apac` 힌트만, 보장 안 됨 |

## 2회차 이후 자체 플랫폼으로 옮길 때

- **문항 정의를 도구 밖에 원본으로 둔다.** 문항 ID, 선택지 코드, 문구를 YAML 같은 파일로 관리하고 Tally에는 옮겨 적기만 한다. Stack Overflow도 YAML 원본을 설문 도구용으로 변환해 쓴다.
- **선택지 코드는 고정한다.** 바뀌면 새 코드를 발급하고 문구 변경 이력을 남긴다. 연도별 비교의 기반이다.
- **CSV 정규화 스크립트를 1회차부터 만든다.** 열을 안정적인 코드로 매핑하고, 복수 선택을 펼칠 방식과 "기타" 입력 열을 정한다.
- **공개용 익명화는 원본과 분리된 과정으로 만든다.**
- 참고: Devographics의 설문 코드(MIT)는 익명 로그인(쿠키 userId)과 다국어 구조를 볼 만하다. ([Monorepo](https://github.com/Devographics/Monorepo))

## 한계

- Tally의 접근성 수준, CSV에 무작위화 순서가 남는지, CSV 열 이름 규칙은 확인하지 못했다.
- reCAPTCHA가 Google로 보내는 데이터 범위는 확인하지 못했다.
- Google Forms의 IP 처리, 네이버 폼의 비로그인 응답·중복 방지·저장 위치는 공식 문서를 찾지 못했다.
- LimeSurvey의 리전 목록은 공식 문서끼리 다르다(싱가포르 또는 스웨덴).

## 출처

- Tally: [pricing](https://tally.so/pricing), [fair use](https://tally.so/help/fair-use-policy), [중복 방지](https://tally.so/help/prevent-duplicate-submissions), [reCAPTCHA](https://tally.so/help/recaptcha), [GDPR·저장 위치](https://tally.so/help/gdpr), [지원 언어](https://tally.so/help/supported-languages), [부분 응답](https://tally.so/help/partial-submissions), [커스텀 도메인](https://tally.so/help/custom-domains), [API](https://developers.tally.so/api-reference/introduction.md)
- Google Forms: [설정](https://support.google.com/docs/answer/2839588?hl=en), [데이터 리전](https://knowledge.workspace.google.com/admin/compliance/choose-a-geographic-location-for-your-data?hl=en)
- Formbricks: [pricing](https://formbricks.com/pricing?type=cloud), [스팸 방지](https://formbricks.com/docs/surveys/general-features/spam-protection.md), [license](https://formbricks.com/docs/self-hosting/advanced/license.md)
- LimeSurvey: [pricing](https://www.limesurvey.org/pricing), [저장 위치](https://help.limesurvey.org/portal/en/kb/articles/where-and-how-is-my-survey-data-hosted-stored), [공개·접근 설정](https://www.limesurvey.org/manual/Publication_%26_access)
- Typeform: [pricing](https://www.typeform.com/pricing) · SurveyMonkey: [데이터센터](https://www.surveymonkey.com/mp/legal/international-data-center-overview/)
- Cloudflare: [D1 위치](https://developers.cloudflare.com/d1/configuration/data-location/), [D1 가격](https://developers.cloudflare.com/d1/platform/pricing/), [Turnstile](https://developers.cloudflare.com/turnstile/plans/)
- [Stack Overflow 설문 저장소](https://github.com/StackExchange/Survey)
