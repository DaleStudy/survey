# AGENTS.md

달레 스터디 개발자 설문조사(DaleStudy Developer Survey) — 달레 스터디가 진행하는 정기 설문조사. 한국 개발자를 대상으로 회차마다 같은 핵심 질문을 하고 결과와 익명 데이터를 공개한다. https://survey.dalestudy.com

## Docs

- `src/editions.ts` — 회차 목록(ADR 0005). 한 번 열고 닫는 설문 하나가 회차다: `2026`(연례), `2027-h1`(반기), `2027-frontend`(트랙). 마감 시각, 설문·유형 결과 유무, 예시 여부를 여기서 정한다.
- `questions/<회차>.yaml` — 그 회차 설문의 문항 원본. 문항 `id` 와 선택지 `code` 는 연도별 비교의 키라서, `fixed: true` 문항은 문구·선택지·순서를 바꾸지 않는다.
- `docs/research/` — 조사 결과. 파일 이름의 날짜 기준 스냅샷이라 고치지 않는다. 다시 조사하면 새 파일을 만든다.
- `docs/decisions/` — 결정 기록(ADR).

## Commands

```bash
bun install
bun run dev                 # Dev server on port 3000
bun run build
bun run test                # 문항 생성 + tsc --noEmit + bun test (push 전에 통과시킨다)
bun run cf-typegen          # wrangler.jsonc 변경 후 worker-configuration.d.ts 재생성
bunx drizzle-kit generate --name <desc>   # 스키마 변경 후 마이그레이션 생성
bun run db:migrate:local    # 로컬 D1 마이그레이션
bun run db:migrate:remote   # 프로덕션 D1 마이그레이션 (배포 워크플로가 배포 전에 자동으로 실행한다)
bun run export <회차>       # 운영 D1 원본 응답을 exports/<회차>-responses-<날짜>.csv 로 (git 무시, 공개 금지)
bun scripts/sample-results.ts   # 예시 회차 2025 의 집계(src/results/2025.json)를 다시 만든다
OPENAI_API_KEY=$(op read op://dev/OpenAI-DaleStudy/credential) bun scripts/type-images.ts <임시 폴더> [slug...]   # 유형 일러스트와 대표 이미지 → public/types/<slug>.jpg (1200×630, og:image 겸용)
```

## Architecture

**TanStack Start** on **Cloudflare Workers**, D1 + Drizzle, 달레 UI. 구성은 `DaleStudy/feedback` 을 따른다.

- 화면: `/` 회차와 상관없는 소개(열린 회차로 가는 버튼, 회차 목록), `/<회차>` 회차 페이지(일정, 주제, 설문 시작이나 결과로 가는 버튼. 날짜는 `editions.ts` 의 `opensAt`, `closesAt`, `resultsAt`, `deleteAt` 에서 읽는다), `/survey` → 열린 회차 설문(여럿이면 고르는 화면), `/results` 결과 아카이브(모든 회차를 최근 것부터, `src/components/EditionList.tsx`), `/privacy`. 회차별로 `/<회차>/survey`(시작 → 동의 → 문항 → 완료와 개발자 유형), `/<회차>/type/<유형>`(공유용, ADR 0004), `/<회차>/results`(집계만 읽는 결과 화면). 운영자 화면 `/admin`(응답 확인, 아래 참고)은 따로 둔다. 유형은 브라우저에서만 계산하고 저장하지 않는다. 설문을 여는 버튼("설문 시작하기")은 회차 페이지에만 두고, 홈과 유형 공유 페이지의 참여 버튼은 회차 페이지로 보낸다. 설문 진행 화면을 뺀 모든 화면에 공통 헤더(`SiteHeader`: 로고, Discord, GitHub. "결과" 메뉴는 예시가 아닌 결과가 생기면 저절로 나온다)와 하단(`SiteFooter`)을 둔다. 응답 완료·이미 응답·마감 화면은 `$edition.survey.tsx` 의 `Finished` 하나로 그린다.
- 마감은 회차의 `closesAt` 으로 정한다. 화면과 서버 함수가 함께 본다.
- 결과는 응답 → 집계(`src/results/aggregate.ts`, 응답자 30명 미만 문항은 숨김) → 화면으로 나눈다. 집계는 `BREAKDOWNS`(경력별, 현업 여부별)에 따라 집단별 결과도 미리 계산하고, 집단별 칸에도 같은 30명 규칙을 적용한다. 한 번에 한 기준으로만 나눈다. 결과 화면은 TanStack Charts(`src/components/ResultChart.tsx`)로 그리고, 보기 기준은 `?by=` 에 남는다. 차트 색은 dataviz 검증 스크립트를 통과한 값이다. 결과 화면은 `src/results/<회차>.json` 만 읽고 원본 응답을 모른다. 회차끼리 비교할 수 있게 같은 문항 `id` 는 모든 회차에서 같은 선택지 `code` 를 쓴다.
- 선택지에 `code: other`(기타)가 있는 문항은 "기타"를 고르면 직접 적을 수 있다(선택, 100자). 답에는 `<문항 id>_other` 키로 저장하고(`src/questions/logic.ts`), 집계와 결과 화면에는 쓰지 않으며 원본 CSV 에만 `<id>_other` 열로 나온다. 다음 회차 선택지를 고르는 데 쓴다(`docs/research/2026-11-trend-tracking.md`).
- 운영진은 `/admin` 에서 회차별 응답 수(날짜별, `ref`별)와 원본 응답을 읽기만 한다(ADR 0008, #10). 관리자 인증은 새로 만들지 않고, Cloudflare Access 앱 "달레 스터디 개발자 설문 (관리자)"(정책 "운영진")가 `/admin` 을 GitHub `DaleStudy/maintainer` 팀에게만 연다. 처리방침 8번("운영진만 로그인해서 접근")과 맞물리므로, 접근 대상을 바꾸면 처리방침도 함께 고친다. 미리보기 주소의 `/admin` 도 같은 앱이 잠그고 `survey-preview` 를 읽는다. Access 는 잠근 경로로 가는 요청에만 토큰을 붙이므로 데이터는 서버 함수가 아니라 `/admin/api` 가 주고, 요청마다 `verifyAccessToken`(`src/lib/access.ts`)으로 서명·팀 도메인·AUD·유효 기간을 확인해 하나라도 어긋나면 거절한다(fail closed). 로컬에서는 토큰이 없어 늘 거절된다. 원본 CSV 는 계속 `bun run export` 로 받는다.
- `main` 에 push 하면 GitHub Actions(`.github/workflows/deploy.yml`)가 운영 D1 마이그레이션을 먼저 적용한 뒤 배포한다. 시크릿은 org secret `CLOUDFLARE_API_TOKEN` 하나.
- 미리보기와 운영 모두 배포 직전에 마이그레이션을 자동으로 적용하므로, 마이그레이션은 이전 코드가 그대로 돌아가는 변경이어야 한다. 칸이나 테이블을 지울 때는 먼저 그것을 쓰지 않게 바꾸는 PR 을 병합해 배포하고, 삭제 마이그레이션은 다음 PR 로 올린다 — 한 PR 에 넣으면 운영에서는 배포 직전, 미리보기에서는 함께 쓰는 `survey-preview` 를 읽는 다른 PR 의 미리보기에서 이전 코드가 깨진다.
- 변경은 PR 로 올린다. PR 마다 `preview.yml` 이 테스트를 돌리고, 같은 저장소 브랜치면 `pr-<번호>.survey.dalestudy.com` 에 미리보기를 띄운다(운영 도메인 라우트에 `previews_enabled`)(GitHub `preview` 환경, 오래된 미리보기는 Cloudflare 가 정리한다). 미리보기는 운영 바인딩을 물려받지 않아서 `wrangler.jsonc` 의 `previews` 블록에 따로 적는다: D1 은 미리보기끼리 함께 쓰는 `survey-preview`, Turnstile 시크릿은 repo secret `TURNSTILE_SECRET` 를 `--secrets-file` 로 넘긴다.
- 익명 설문이다. 로그인이 없고, 응답 1건이 `responses` 1행이다. IP·User-Agent 처럼 응답자를 알아볼 수 있는 값은 저장하지 않는다 — 스키마에 칸을 두지 않는 것으로 지킨다([개인정보 조사](docs/research/2026-10-privacy-law.md)).
- 진행 중인 답은 새로고침에 대비해 그 탭의 `sessionStorage` 에만 둔다(`src/questions/progress.ts`). 서버에 중간 저장하지 않는 건 제출하지 않은 답을 보관하지 않으려는 것이고, `localStorage` 를 쓰지 않는 건 공용 PC에 민감한 답이 남지 않게 하려는 것이다(#9).
- 제출은 Turnstile(위젯 `survey`, Managed)로 막는다. 위젯은 마지막 문항 화면에만 띄운다 — 토큰이 5분이면 만료된다. 서버(`submitResponse`)는 저장 전에 `verifyTurnstile`(`src/lib/turnstile.ts`)로 `success`·action `survey_submit`·호스트 이름을 확인하고, 하나라도 어긋나면 거절한다(fail closed). 허용 호스트는 `wrangler.jsonc` 의 `TURNSTILE_HOSTNAMES`(운영에는 localhost 를 넣지 않는다), 로컬은 `.dev.vars` 가 덮는다. 점으로 시작하는 항목(`.survey.dalestudy.com`)은 하위 도메인을 모두 받는다 — 미리보기 주소가 PR 마다 달라서다. 위젯 도메인 `survey.dalestudy.com` 은 하위 도메인까지 허용하므로 미리보기용으로 따로 넣지 않는다.
- 시크릿: Worker 시크릿 `TURNSTILE_SECRET`. 원본은 1Password `dev/CF_SURVEY_TURNSTILE`(위젯 대시보드 URL 포함). 배포 토큰 `CLOUDFLARE_API_TOKEN` 의 원본은 1Password `dev/CF_DALE_STUDY` — DaleStudy 계정 소유 토큰이고 Turnstile 권한도 있다. 로컬 개발을 하려면 `.dev.vars` 에 `TURNSTILE_SECRET`, `TURNSTILE_HOSTNAMES=localhost,127.0.0.1` 을 둔다.
- 2026 회차 원본 응답은 2027년 12월 31일에 지운다(동의 화면과 처리방침에 공개한 약속). 공개용 익명 데이터와 집계는 남긴다.
- D1 `survey` 는 `apac` 위치 힌트로 만들었고, 주 저장소는 홍콩(`HKG`)이다. 동의 화면과 처리방침의 국외 보관 안내(홍콩)가 이 때문이다. 위치는 `npx wrangler d1 execute survey --remote --command "select 1" --json` 결과의 `served_by_colo` 로 확인한다.

## 베타와 오픈

- 지금은 베타 중이다. Cloudflare Access 앱 "한국 개발자 설문 (베타)"가 응답과 결과 경로(`/survey`, `/2026/survey`, `/_serverFn`, `/results`, `/2025`, `/2026/results`)만 잠근다. 랜딩, 유형 공유, 처리방침, `/types/` 이미지는 링크 미리보기가 뜨도록 공개해 두었다(`noindex` 는 유지). 잠긴 경로는 정책 "베타 테스터"에 따라 GitHub `DaleStudy` 조직 멤버만 들어온다. 로그인은 Zero Trust(`dalestudy.cloudflareaccess.com`)의 GitHub 로그인 수단 — DaleStudy 조직 소유 OAuth 앱 "DaleStudy Cloudflare Access", 시크릿 원본은 1Password `dev/GITHUB_DALESTUDY_CF_ACCESS`.
- 베타 응답도 운영 D1 에 쌓인다. 잠겨 있는 동안 들어온 응답은 모두 베타 응답이라 따로 표시하지 않고, 오픈 직전에 전부 지운다.
- 회차의 `opensAt` 전(`isBeta`)에는 종료 화면에 "다시 답하기"가 나와 같은 브라우저에서 다시 응답할 수 있다. 오픈 날부터 저절로 사라진다.
- 오픈(11월 16일) 직전에 할 일:
  1. 베타 응답 지우기 (`DELETE FROM responses` — 확인 후 `bun run export` 로 먼저 받아 둘지 정한다)
  2. Access 앱 "한국 개발자 설문 (베타)" 끄기 또는 삭제. `/admin` 을 잠그는 관리자 앱은 남긴다
  3. `src/routes/__root.tsx` 의 `noindex` 빼기
  4. 링크 미리보기(og 태그)가 공유 채널에서 제대로 뜨는지 확인. 잠겨 있는 동안 공유한 주소는 Cloudflare 로그인 화면으로 캐시되어 있으니 새로 고친다: 카카오 공유 디버거(캐시 초기화), LinkedIn Post Inspector, Facebook Sharing Debugger(Threads 포함). X, Slack, Discord 는 도구가 없어 `?v=1` 같은 쿼리를 붙인 주소로 공유한다. 오픈 전에는 주소를 소셜에 공유하지 않는다.
  5. 예시 회차 `2025` 지우기: `src/editions.ts` 의 항목, `src/results/2025.json`, `src/results/index.ts` 의 줄, `scripts/sample-results.ts`
  6. D1 주 저장소가 아직 홍콩인지 확인 (바뀌었으면 동의 화면과 처리방침을 고친다)

## 작업 방식

- 혼자 개발하는 동안에는 브랜치나 PR 없이 `main` 에 바로 커밋하고 push 한다. push 하면 곧 배포되므로 `bun run test` 를 먼저 통과시킨다. 다른 기여자가 생기면 `feedback` 처럼 PR 과 미리보기 방식으로 바꾼다.

## 문서 규칙

- 논의는 GitHub 이슈에서 한다. 이슈 댓글을 결론으로 읽지 않는다 — 중간에 뒤집힌 의견이 섞여 있다. 결론과 근거, 검토한 대안은 이슈 본문에 정리해 둔다.
- 앞으로의 작업을 계속 제약하는 결정(오래 유지되고, 되돌리기 어렵고, 같은 질문이 반복될 결정)만 `docs/decisions/NNNN-<slug>.md` 에 ADR 로 남긴다. 맥락 → 결정 → 검토한 대안 → 결과 순으로 쓰고, 논의한 이슈가 있으면 링크한다. 범위가 좁고 되돌리기 쉬운 결정은 이슈와 PR 로 충분하다.
- 결정을 통째로 뒤집을 때는 새 ADR 을 만들고, 기존 파일은 지우지 않되 상태를 `Superseded by NNNN` 으로 바꾼다. 결정의 일부만 바뀌면 기존 문서를 지금 상태에 맞게 고치고, 바뀐 이유는 이슈나 새 ADR 에 남긴다.
- 문서에는 항상 지금 맞는 내용만 둔다. 지난 내용을 취소선이나 줄 단위 표시로 남기지 않는다 — 이력은 git, 이슈, PR 이 갖고 있다.
- 이미 기각한 대안을 다시 제안하기 전에 `docs/decisions/` 와 관련 이슈를 먼저 본다.
- 코드나 설정 파일에 있는 정보(의존성 버전, 바인딩 등)는 문서에 옮겨 적지 않는다. 문서에는 이유와 위치만 남긴다.
- 문서는 내용이 생길 때 만든다. 빈 문서를 미리 만들지 않는다.
- `_my/` 는 전역 gitignore 대상이라 다른 세션에서 보이지 않는다. 남겨야 할 내용은 `docs/` 에 둔다.
