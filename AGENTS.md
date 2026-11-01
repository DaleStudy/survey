# AGENTS.md

한국 개발자 설문(Korea Developer Survey) — 달레 스터디가 운영하는 연례 설문. 한국 개발자를 대상으로 매년 같은 질문을 하고 결과와 익명 데이터를 공개한다. https://survey.dalestudy.com

## Docs

- `questions/<연도>.yaml` — 그해 설문의 문항 원본. 문항 `id` 와 선택지 `code` 는 연도별 비교의 키라서, `fixed: true` 문항은 문구·선택지·순서를 바꾸지 않는다.
- `docs/research/` — 조사 결과. 파일 이름의 날짜 기준 스냅샷이라 고치지 않는다. 다시 조사하면 새 파일을 만든다.
- `docs/decisions/` — 결정 기록(ADR).

## Commands

```bash
bun install
bun run dev                 # Dev server on port 3000
bun run build
bun run test                # tsc --noEmit
bun run cf-typegen          # wrangler.jsonc 변경 후 worker-configuration.d.ts 재생성
bunx drizzle-kit generate --name <desc>   # 스키마 변경 후 마이그레이션 생성
bun run db:migrate:local    # 로컬 D1 마이그레이션
bun run db:migrate:remote   # 프로덕션 D1 마이그레이션 (배포 전에 먼저)
bun run export              # 운영 D1 원본 응답을 exports/<연도>-responses-<날짜>.csv 로 (git 무시, 공개 금지)
```

## Architecture

**TanStack Start** on **Cloudflare Workers**, D1 + Drizzle, 달레 UI. 구성은 `DaleStudy/feedback` 을 따른다.

- 화면: `/` 소개(랜딩), `/survey` 응답(시작 → 동의 → 문항 → 완료), `/privacy` 처리방침. 공유 링크의 `?ref=` 는 랜딩에서 `/survey` 로 넘겨 `responses.ref` 에 남긴다.
- 마감은 `src/lib/schedule.ts` 의 `CLOSES_AT` 하나로 정한다. 화면과 서버 함수가 함께 본다.
- 원본 응답 내보내기는 웹 관리자 화면 없이 `bun run export` 로 한다 — 로그인이 없는 사이트라 관리자 인증을 새로 만들지 않고, DaleStudy Cloudflare 계정 접근 권한으로 갈음한다.
- `main` 에 push 하면 GitHub Actions(`.github/workflows/deploy.yml`)가 배포한다. 시크릿은 org secret `CLOUDFLARE_API_TOKEN` 하나.
- 익명 설문이다. 로그인이 없고, 응답 1건이 `responses` 1행이다. IP·User-Agent 처럼 응답자를 알아볼 수 있는 값은 저장하지 않는다 — 스키마에 칸을 두지 않는 것으로 지킨다([개인정보 조사](docs/research/2026-10-privacy-law.md)).
- 제출은 Turnstile(위젯 `survey`, Managed)로 막는다. 위젯은 마지막 문항 화면에만 띄운다 — 토큰이 5분이면 만료된다. 서버(`submitResponse`)는 저장 전에 `verifyTurnstile`(`src/lib/turnstile.ts`)로 `success`·action `survey_submit`·호스트 이름을 확인하고, 하나라도 어긋나면 거절한다(fail closed). 허용 호스트는 `wrangler.jsonc` 의 `TURNSTILE_HOSTNAMES`(운영에는 localhost 를 넣지 않는다), 로컬은 `.dev.vars` 가 덮는다.
- 시크릿: Worker 시크릿 `TURNSTILE_SECRET`. 원본은 1Password `dev/CF_SURVEY_TURNSTILE`(위젯 대시보드 URL 포함). 배포 토큰 `CLOUDFLARE_API_TOKEN` 의 원본은 1Password `dev/CF_DALE_STUDY` — DaleStudy 계정 소유 토큰이고 Turnstile 권한도 있다. 로컬 개발을 하려면 `.dev.vars` 에 `TURNSTILE_SECRET`, `TURNSTILE_HOSTNAMES=localhost,127.0.0.1` 을 둔다.
- D1 `survey` 는 `apac` 위치 힌트로 만들었지만 국내 저장은 보장되지 않는다. 동의 화면의 국외 보관 안내가 이 때문이다.

## 베타와 오픈

- 지금은 운영진 베타 중이다. `survey.dalestudy.com` 전체를 Cloudflare Access 앱 "한국 개발자 설문 (베타)"로 잠가 GitHub `DaleStudy/maintainer` 팀만 들어온다. 로그인은 Zero Trust(`dalestudy.cloudflareaccess.com`)의 GitHub 로그인 수단 — DaleStudy 조직 소유 OAuth 앱 "DaleStudy Cloudflare Access", 시크릿 원본은 1Password `dev/GITHUB_DALESTUDY_CF_ACCESS`.
- 베타 응답은 `?ref=beta` 링크로 받아 운영 D1 에 함께 쌓는다.
- 오픈(11월 16일) 직전에 할 일:
  1. 베타 응답 지우기 (`DELETE FROM responses` — 확인 후 `bun run export` 로 먼저 받아 둘지 정한다)
  2. Access 앱 "한국 개발자 설문 (베타)" 끄기 또는 삭제
  3. `src/routes/__root.tsx` 의 `noindex` 빼기
  4. 링크 미리보기(og 태그)가 공유 채널에서 제대로 뜨는지 확인

## 작업 방식

- 혼자 개발하는 동안에는 브랜치나 PR 없이 `main` 에 바로 커밋하고 push 한다. push 하면 곧 배포되므로 `bun run test` 를 먼저 통과시킨다. 다른 기여자가 생기면 `feedback` 처럼 PR 과 미리보기 방식으로 바꾼다.

## 문서 규칙

- 논의는 GitHub 이슈에서, 결론은 `docs/` 에 남긴다. 이슈 댓글을 결론으로 읽지 않는다 — 중간에 뒤집힌 의견이 섞여 있다.
- 결정을 내리면 `docs/decisions/NNNN-<slug>.md` 를 추가한다. 맥락 → 결정 → 검토한 대안 → 결과 순으로 쓰고, 논의한 이슈가 있으면 링크한다. 결정을 뒤집을 때는 기존 파일을 지우지 않고 새 ADR 을 만든 뒤 기존 파일에 `Superseded by NNNN` 을 적는다.
- 이미 기각한 대안을 다시 제안하기 전에 `docs/decisions/` 를 먼저 본다.
- 코드나 설정 파일에 있는 정보(의존성 버전, 바인딩 등)는 문서에 옮겨 적지 않는다. 문서에는 이유와 위치만 남긴다.
- 문서는 내용이 생길 때 만든다. 빈 문서를 미리 만들지 않는다.
- `_my/` 는 전역 gitignore 대상이라 다른 세션에서 보이지 않는다. 남겨야 할 내용은 `docs/` 에 둔다.
