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
```

## Architecture

**TanStack Start** on **Cloudflare Workers**, D1 + Drizzle, 달레 UI. 구성은 `DaleStudy/feedback` 을 따른다.

- `main` 에 push 하면 GitHub Actions(`.github/workflows/deploy.yml`)가 배포한다. 시크릿은 org secret `CLOUDFLARE_API_TOKEN` 하나.
- 익명 설문이다. 로그인이 없고, 응답 1건이 `responses` 1행이다. IP·User-Agent 처럼 응답자를 알아볼 수 있는 값은 저장하지 않는다 — 스키마에 칸을 두지 않는 것으로 지킨다([개인정보 조사](docs/research/2026-10-privacy-law.md)).
- D1 `survey` 는 `apac` 위치 힌트로 만들었지만 국내 저장은 보장되지 않는다. 동의 화면의 국외 보관 안내가 이 때문이다.

## 작업 방식

- 저장소가 비공개인 동안에는 브랜치나 PR 없이 `main` 에 바로 커밋하고 push 한다. 공개로 전환하면 이 규칙을 다시 정한다.

## 문서 규칙

- 논의는 GitHub 이슈에서, 결론은 `docs/` 에 남긴다. 이슈 댓글을 결론으로 읽지 않는다 — 중간에 뒤집힌 의견이 섞여 있다.
- 결정을 내리면 `docs/decisions/NNNN-<slug>.md` 를 추가한다. 맥락 → 결정 → 검토한 대안 → 결과 순으로 쓰고, 논의한 이슈가 있으면 링크한다. 결정을 뒤집을 때는 기존 파일을 지우지 않고 새 ADR 을 만든 뒤 기존 파일에 `Superseded by NNNN` 을 적는다.
- 이미 기각한 대안을 다시 제안하기 전에 `docs/decisions/` 를 먼저 본다.
- 코드나 설정 파일에 있는 정보(의존성 버전, 바인딩 등)는 문서에 옮겨 적지 않는다. 문서에는 이유와 위치만 남긴다.
- 문서는 내용이 생길 때 만든다. 빈 문서를 미리 만들지 않는다.
- `_my/` 는 전역 gitignore 대상이라 다른 세션에서 보이지 않는다. 남겨야 할 내용은 `docs/` 에 둔다.
