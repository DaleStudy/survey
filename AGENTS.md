# AGENTS.md

달레 스터디 개발자 설문조사(DaleStudy Developer Survey) — 달레 스터디가 진행하는 정기 설문조사. 한국 개발자를 대상으로 회차마다 같은 핵심 질문을 하고 결과와 익명 데이터를 공개한다. 경품은 없다. https://survey.dalestudy.com

이름은 오픈 뒤 바꾸지 않는다 — 결과를 해마다 같은 이름으로 인용해야 이어진다. 조사 대상이 드러나도록 "개발자"를 빼지 않는다("달레 스터디 설문조사"는 회원 대상 내부 설문으로 읽힌다).

## Docs

- `src/editions.ts` — 회차 목록. 한 번 열고 닫는 설문 하나가 회차다: `2026`(연례), `2027-h1`(반기), `2027-frontend`(트랙). 일정, 설문·유형 결과 유무, 예시 여부를 여기서 정한다.
- `questions/<회차>.yaml` — 그 회차 설문의 문항 원본. 형식 규칙은 파일 머리말에 있다. 문항 `id` 와 선택지 `code` 는 회차 간 비교의 키라서, `fixed: true` 문항은 문구·선택지·순서를 바꾸지 않는다.
- `docs/data-model.md` — 회차·문항·응답·집계를 잇는 키, `responses` 와 `answers` 의 형태, 브라우저에만 두는 값, 스키마를 바꿀 때 지킬 것.
- `docs/stack.md` — 쓰는 기술과 이유, 생성 파일과 타입 검사 범위.
- `docs/operations.md` — 시크릿 원본, Cloudflare Access·Turnstile 설정, D1 저장 위치, 원본 응답 삭제.
- `docs/research/` — 조사 결과. 파일 이름의 날짜 기준 스냅샷이라 고치지 않는다. 다시 조사하면 새 파일을 만든다.

## Commands

```bash
bun install
bun run cf-typegen          # worker-configuration.d.ts 생성. 처음 받았을 때와 wrangler.jsonc 를 바꾼 뒤
bun run dev                 # Dev server on port 3000
bun run build
bun run test                # 문항 생성 + tsc --noEmit + bun test
bun run db:generate --name <desc>   # 스키마 변경 후 마이그레이션 생성
bun run db:migrate:local    # 로컬 D1 마이그레이션 (운영과 미리보기는 배포 워크플로가 적용한다)
bun run export <회차>       # 운영 D1 원본 응답을 exports/<회차>-responses-<날짜>.csv 로 (git 무시, 공개 금지)
bun scripts/sample-results.ts   # 예시 회차 2025 의 집계(src/results/2025.json)를 다시 만든다
OPENAI_API_KEY=$(op read op://dev/OpenAI-DaleStudy/credential) bun scripts/type-images.ts <임시 폴더> [slug...]   # 유형 일러스트와 대표 이미지 → public/types/<slug>.jpg (1200×630, 유형 카드와 홈·회차 페이지 og:image)
bun scripts/og-images.ts <임시 폴더>   # 유형 공유 페이지 og:image → public/og/<회차>/<slug>.jpg (일러스트 + 설문·유형 이름)
```

## Architecture

**TanStack Start** on **Cloudflare Workers**, D1 + Drizzle, 달레 UI(`docs/stack.md`).

- 화면은 `src/routes/` 의 파일 기반 라우트다. 설문을 여는 버튼("설문 시작하기")은 회차 페이지(`/<회차>`)에만 두고, 홈과 유형 공유 페이지의 참여 버튼은 회차 페이지로 보낸다. 설문 진행 화면을 뺀 모든 화면에 `SiteHeader`·`SiteFooter` 를 둔다(헤더의 "결과" 메뉴는 예시가 아닌 결과가 생기면 저절로 나온다). 응답 완료·이미 응답·마감 화면은 `$edition.survey.tsx` 의 `Finished` 하나로 그린다.
- 마감은 회차의 `closesAt` 으로 정한다. 화면과 서버 함수가 함께 본다. 회차의 `opensAt` 전(`isBeta`)에는 종료 화면에 "다시 답하기"가 나온다.
- 익명 설문이다. 로그인이 없고, 응답자를 알아볼 수 있는 값은 스키마에 칸을 두지 않는 것으로 지킨다. 개발자 유형도 브라우저에서만 계산한다. 서버와 브라우저에 무엇을 두는지는 `docs/data-model.md`.
- 결과 화면은 `src/results/<회차>.json` 만 읽고 원본 응답을 모른다(집계 규칙은 `docs/data-model.md`). TanStack Charts(`src/components/ResultChart.tsx`)로 그리고, 보기 기준은 `?by=` 에 남는다. 차트 색은 dataviz 검증 스크립트를 통과한 값이다.
- 선택지에 `code: other`(기타)가 있는 문항은 "기타"를 고르면 직접 적을 수 있다. 다음 회차 선택지를 고르는 데 쓴다(`docs/research/2026-11-trend-tracking.md`).
- 제출은 Turnstile 로 막는다. 위젯은 마지막 문항 화면에만 띄운다 — 토큰이 5분이면 만료된다. 서버(`submitResponse`)는 저장 전에 `verifyTurnstile`(`src/lib/turnstile.ts`)로 `success`·action `survey_submit`·호스트 이름을 확인하고, 하나라도 어긋나면 거절한다(fail closed). 허용 호스트는 `wrangler.jsonc` 의 `TURNSTILE_HOSTNAMES`(운영에는 localhost 를 넣지 않는다)이고, 점으로 시작하는 항목(`.survey.dalestudy.com`)은 미리보기 주소를 위해 하위 도메인을 모두 받는다.
- 운영진은 `/admin` 에서 회차별 응답 수와 원본 응답을 읽기만 한다. 고치거나 지우는 기능과 SQL 입력창은 두지 않는다. 인증은 직접 만들지 않고 Cloudflare Access 가 `/admin` 을 잠근다. Access 는 잠근 경로로 가는 요청에만 토큰을 붙이므로 데이터는 서버 함수가 아니라 `/admin/api` 가 주고, 요청마다 `verifyAccessToken`(`src/lib/access.ts`)으로 확인해 하나라도 어긋나면 거절한다(fail closed). 로컬에서는 토큰이 없어 늘 거절되므로 미리보기에서 확인한다. 접근 대상은 처리방침과 맞물린다(`docs/operations.md`).

## 작업 방식

- 변경은 브랜치를 만들어 PR 로 올린다. `main` 에 직접 push 하지 않는다.
- PR 마다 `preview.yml` 이 테스트를 돌리고, 같은 저장소 브랜치면 `pr-<번호>.survey.dalestudy.com` 에 미리보기를 띄운다. 미리보기는 운영 바인딩을 물려받지 않아서 `wrangler.jsonc` 의 `previews` 블록에 따로 적는다(D1 은 미리보기끼리 함께 쓰는 `survey-preview`).
- `main` 에 병합하면 `deploy.yml` 이 운영 D1 마이그레이션을 먼저 적용한 뒤 배포한다. 미리보기도 배포 직전에 마이그레이션을 적용하므로, 마이그레이션은 이전 코드가 그대로 돌아가는 변경이어야 한다(칸을 지우는 순서는 `docs/data-model.md`).

## 2026 회차 오픈 (11월 16일)

오픈을 마치면 이 섹션을 지운다.

- 그 전까지는 베타다. Access 앱 "한국 개발자 설문 (베타)"(정책 "베타 테스터", GitHub `DaleStudy` 조직 멤버)가 응답과 결과 경로(`/survey`, `/2026/survey`, `/_serverFn`, `/results`, `/2025`, `/2026/results`)만 잠근다. 랜딩, 유형 공유, 처리방침, `/types/` 이미지는 링크 미리보기가 뜨도록 공개해 두었다(`noindex` 는 유지). 베타 응답도 운영 D1 에 쌓이고 따로 표시하지 않는다.
- 오픈 직전에 할 일:
  1. 베타 응답 지우기 (`DELETE FROM responses` — `bun run export` 로 먼저 받아 둘지 정한다)
  2. 베타 Access 앱 끄기 또는 삭제. `/admin` 을 잠그는 관리자 앱은 남긴다
  3. `src/routes/__root.tsx` 의 `noindex` 빼기
  4. 링크 미리보기 캐시 새로 고치기: 카카오 공유 디버거, LinkedIn Post Inspector, Facebook Sharing Debugger(Threads 포함). X, Slack, Discord 는 `?v=1` 같은 쿼리를 붙인 주소로 공유한다. 오픈 전에는 주소를 소셜에 공유하지 않는다
  5. 예시 회차 `2025` 지우기: `src/editions.ts` 의 항목, `src/results/2025.json`, `src/results/index.ts` 의 줄, `scripts/sample-results.ts`
  6. D1 주 저장소가 아직 홍콩인지 확인 (`docs/operations.md`)

## 문서 규칙

- 문서에는 지금 결정된 상태만 둔다. 결정은 그것이 적용되는 곳(`docs/`, 코드 주석, 이 파일)에 적고, 다시 물을 만한 결정이면 이유나 기각한 대안을 한두 문장 덧붙인다. 결정 과정은 PR 과 이슈에 남은 것으로 충분하고 따로 옮겨 적지 않는다.
- 결정이 바뀌면 그 자리의 문장을 고친다. 지난 내용을 취소선이나 줄 단위 표시로 남기지 않는다 — 이력은 git, 이슈, PR 이 갖고 있다.
- 이슈 댓글을 결론으로 읽지 않는다 — 중간에 뒤집힌 의견이 섞여 있다. 이슈 본문도 논의를 시작할 때 상태일 수 있으니, 지금 상태는 코드와 문서로 확인한다.
- 날짜가 지나면 틀리는 내용(오픈 체크리스트 등)은 끝나는 시점을 함께 적고, 끝나면 지운다.
- 코드나 설정 파일에 있는 정보(의존성 버전, 바인딩 등)는 문서에 옮겨 적지 않는다. 문서에는 이유와 위치만 남긴다.
- 문서는 내용이 생길 때 만든다. 빈 문서를 미리 만들지 않는다.
- `_my/` 는 전역 gitignore 대상이라 다른 세션에서 보이지 않는다. 남겨야 할 내용은 `docs/` 에 둔다.
