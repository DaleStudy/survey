# 운영

코드 밖에 있는 설정(Cloudflare 대시보드, GitHub, 1Password)과 운영진이 손으로 하는 일을 적는다.

## 시크릿

| 무엇 | 쓰는 곳 | 원본 |
|---|---|---|
| `TURNSTILE_SECRET` | Worker 시크릿, 미리보기용 repo secret | 1Password `dev/CF_SURVEY_TURNSTILE` (위젯 대시보드 URL 포함) |
| `CLOUDFLARE_API_TOKEN` | org secret, 배포와 마이그레이션 | 1Password `dev/CF_DALE_STUDY`. DaleStudy 계정 소유 토큰이고 Turnstile 권한도 있다 |
| GitHub OAuth 앱 "DaleStudy Cloudflare Access" | Access 의 GitHub 로그인 수단 | 1Password `dev/GITHUB_DALESTUDY_CF_ACCESS`. DaleStudy 조직 소유 |

로컬 개발에는 `.dev.vars` 에 `TURNSTILE_SECRET` 과 `TURNSTILE_HOSTNAMES=localhost,127.0.0.1` 을 둔다.

## Cloudflare Access

- Zero Trust 팀 도메인은 `dalestudy.cloudflareaccess.com`, 로그인 수단은 위 GitHub OAuth 앱이다.
- 관리자 앱 "달레 스터디 개발자 설문 (관리자)"가 정책 "운영진"으로 `/admin` 을 GitHub `DaleStudy/maintainer` 팀에게만 연다. 미리보기 주소의 `/admin` 도 같은 앱이 잠근다. 앱의 AUD 는 `src/lib/access.ts` 에 있어서, 앱을 다시 만들면 그 값도 바꾼다.
- 접근 대상을 바꾸면 처리방침 8번("운영진만 로그인해서 접근")도 함께 고친다.

## Turnstile

위젯 이름은 `survey`, 모드는 Managed 다. 위젯 도메인 `survey.dalestudy.com` 은 하위 도메인까지 허용하므로 미리보기용 도메인을 따로 넣지 않는다.

## D1 저장 위치

`survey` 는 `apac` 위치 힌트로 만들었고 주 저장소는 홍콩(`HKG`)이다. 동의 화면과 처리방침의 국외 보관 안내(홍콩)가 이 값에 기대므로, 바뀌면 두 곳을 고친다. 확인:

```bash
npx wrangler d1 execute survey --remote --command "select 1" --json   # served_by_colo
```

## 원본 응답 삭제

회차의 `deleteAt` 은 동의 화면과 처리방침에 공개한 원본 삭제일이다. 자동으로 지우는 작업이 없으므로 그날 운영진이 지운다. 집계(`src/results/<회차>.json`)와 공개용 익명 데이터는 남긴다.

```bash
npx wrangler d1 execute survey --remote --command "DELETE FROM responses WHERE edition = '<회차>'"
```
