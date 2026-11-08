# 설문 배포 채널 조사 (2026-10-31)

달레 스터디 채널만으로는 응답이 주니어·이직 준비생 쪽으로 쏠린다([기존 설문 조사](2026-10-existing-surveys.md) 참고). 시니어·현업 개발자에게 닿는 외부 채널과 11~12월 일정 충돌을 알아봤다. 웹 검색과 각 사이트 원문 확인으로만 조사했고, 어디에도 연락하지 않았다.

## 결론

우선 연락할 채널:

1. **GeekNews** — 현업 개발자가 매일 보는 큐레이션 사이트. Weekly 구독자 약 19,000명. 설문을 금지하는 규정은 없고 State of JS 설문 개시 글이 실린 사례가 있다. 다만 "홍보 채널이 되지 않도록" 운영하고 행사 모집 글은 금지라서, 모집 글은 news@hada.io 에 먼저 문의한다. 12월 결과 공개 글이 이 사이트 성격에 가장 잘 맞는다.
2. **요즘IT (위시켓)** — 월간 방문자 36만 명, 뉴스레터 8만 7천여 명. 26~35세 현직 실무자 위주. 유료 뉴스레터 배너를 사거나, 결과를 기고 콘텐츠로 낸다.
3. **FE News (네이버 FE)** — 구독자 5,000명 이상. State of FE·JS Korea 를 직접 운영한 곳이라 협업 상대로 볼 만하다. 매월 첫 수요일 발행이라 수집 기간에 들어가는 호는 12/2 하나다.
4. **현업 위주 사용자 모임** — AWSKRUG, PyTorch KR, Kotlin·Spring 모임 등. 11월에 오프라인 행사가 몰려 있어 운영진 공지나 현장 QR 안내를 부탁하기 좋은 시기다.
5. **LinkedIn 과 회사 안 공유** — State of JS 2025 는 인플루언서 한 명으로 273명, 직장 동료 공유로 218명이 들어왔다. 시니어·대기업 응답에는 영향력 있는 개인과 기업 기술 조직의 공유가 효과적이다.

OKKY 는 규모가 크지만(월 70만 방문, 자체 발표) 스스로 사용자를 "개발자와 취업 준비생"이라고 소개한다. 주니어 쏠림을 줄이는 데는 효과가 적어 보조 채널로 둔다.

## 채널 표

| 채널 | 주 사용자층 | 규모 근거 | 게시 정책 | 연락 | 출처 |
|---|---|---|---|---|---|
| GeekNews | 현업 (연차 구성 수치는 없음) | Weekly 약 19,000명 (381호 기준) | 설문 규정 없음. 홍보성·행사 모집 글 제한 | news@hada.io | [about](https://news.hada.io/about), [guidelines](https://news.hada.io/guidelines), [State of JS 2023 글](https://news.hada.io/topic?id=12089) |
| 요즘IT | 26~35세 현직 실무자 | 월 36만 방문, 뉴스레터 8.7만 명 | 광고 상품(배너, 브랜디드 콘텐츠), 콘텐츠 제안 메뉴 | yozm@wishket.com | [채용공고](https://www.wanted.co.kr/wd/394415) |
| FE News | 프론트엔드 현업 | Substack 5,000명 이상 | 제보 절차 명시 없음 | GitHub 운영진 | [GitHub](https://github.com/naver/fe-news), [Substack](https://fenews.substack.com/about) |
| OKKY | 현업·프리랜서·취준생 | 월 70만 방문 (자체 발표, 시점 미표기) | 홍보·광고 게시판에 설문 글이 실제로 있음 | ad@okky.kr | [광고문의](https://okky.kr/supports/advertisement) |
| 커리어리 | 확인 안 됨 | 10만+ 개발자 (앱스토어, 시점 미상) | 확인 안 됨 | careerly.co.kr/advertising | — |
| 디스콰이엇 | 메이커·스타트업 | 누적 33만 명 (2023-02) | 확인 안 됨 | 확인 안 됨 | [요즘IT 기사](https://yozm.wishket.com/magazine/detail/1975/) |
| AWSKRUG | 클라우드·인프라 현업 | 1만 2천여 명 (연도 불명) | 확인 안 됨 | slack.awskr.org | [AWS 블로그](https://aws.amazon.com/ko/blogs/korea/2-years-cloud-evangelism-in-korea) |
| Python Korea, PyTorch KR, KSUG 등 | 언어·프레임워크 현업 | 확인 안 됨 | 확인 안 됨 | 각 모임 | [PyTorch KR 공지](https://discuss.pytorch.kr/c/announce/13) |
| velog | 주니어·학습자 비중이 높아 보임 (추측) | 월 240~270만 방문 (Semrush 추정) | 개인 블로그라 제한 없음. 확산력은 약함 | — | [Semrush](https://cw.semrush.com/website/velog.io/overview) |

## 배포 전략에 대한 근거

- **State of JS 2025 (13,002명):** 가장 큰 유입은 자체 채널 5,554명(약 43%)이다. 지난 응답자 메일링 리스트, 프레임워크 프로젝트의 공식 공유, 영향력 있는 개인이 뒤를 잇는다. ([about](https://2025.stateofjs.com/en-US/about/), [metadata](https://2025.stateofjs.com/en-US/metadata/))
- **Stack Overflow, JetBrains:** 둘 다 자사 채널로 모집해 생기는 편향을 스스로 인정한다. JetBrains 는 광고·추천으로 들어온 응답과 자사 채널 응답을 나눠 다룬 적이 있다. ([SO methodology](https://survey.stackoverflow.co/2024/methodology/), [JetBrains 원자료 공개 글](https://blog.jetbrains.com/ko/blog/2020/10/19/deveco-2020-raw-data-ready/))
- **실무 적용:** 채널마다 `?ref=` 같은 파라미터를 달아 응답의 출처를 기록하면, 결과를 채널별로 나눠 보고 편향을 점검할 수 있다.
- **결과 공개가 다음 해 홍보다:** 12월 결과 글은 GeekNews·요즘IT에 콘텐츠로 실리기 쉽다.

## 11~12월 일정

| 항목 | 일정 | 영향 |
|---|---|---|
| State of JS 2026 | 페이지에는 10/1~11/1 로 적혀 있지만 상태는 preview (2026-10-31 확인). 지난 일정은 2022년 11/1~12/1, 2023년 11/22~12/12, 2024년 11/13~12/10 | 실제 일정이 불확실하다. 겹치면 프론트엔드 응답을 두고 경쟁한다 |
| State of HTML 2026 | 10/1~11/1 | 겹치지 않음 |
| Stack Overflow 2026 | 6/23~8/5 수집, 10/6 결과 공개 | 겹치지 않음 |
| JetBrains DevEco 2026 | 5월 시작, 마감일은 확인 안 됨 | 이미 끝났을 것으로 추정 |
| 오프라인 행사 | PyTorch Day Korea 11/21, AWS Community Day Seoul(11월, 날짜 확인 안 됨), GDG DevFest(~11/28), .NET Conf Seoul(~11/25), DDD Seoul 12/4 | 응답 경쟁보다는 현장 홍보 기회 |
| FE News | 11/4, 12/2 발행 | 12/2 호에만 실을 수 있다 |

출처: [devographics](https://devographics.com/), [State of JS 2026 설문 페이지](https://survey.devographics.com/en-US/survey/state-of-js/2026), [SO 2026 결과](https://stackoverflow.blog/2026/10/06/the-results-of-the-2026-developer-survey-are-here/), [Dev-Event](https://github.com/brave-people/Dev-Event)

## 추가로 찾은 설문

- **State of Dev in South Korea 2026 (Dev Korea):** 영어 설문이고 응답자는 166명이다. 한국 국적 거주자 25명, 한국에 사는 외국인 106명, 해외 거주자 35명이다. 대상이 한국에서 일하는 외국인 개발자 중심이라 이 프로젝트와 겹치지 않는다. Tally 로 운영했다. ([결과](https://oskgbyulltihalitrjhl.supabase.co/storage/v1/object/public/state-of-dev/2026/results.md), [설문](https://tally.so/r/QKkzgG))

## 결정이 필요한 것

- **결과 알림용 이메일:** State of JS 는 2년 차부터 지난 응답자 메일링 리스트가 가장 큰 채널이 됐다. 하지만 이메일을 받으면 식별자 없는 익명 설문이 아니게 된다. 응답과 분리해 받는 방식이 가능한지는 개인정보 조사 결과를 보고 정한다.

## 한계

- GeekNews 에 설문 모집 글을 올려도 되는지는 규정에 없다. 운영자 판단이 필요하다.
- 시니어 비율 같은 사용자층 수치는 대부분 근거가 없다.
- Facebook 그룹과 Slack 의 회원 수는 로그인이 필요해 확인하지 못했다.
- 프로그래머스와 FE News 설문이 어떤 채널로 배포됐는지는 확인하지 못했다.
