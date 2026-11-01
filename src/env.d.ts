// Worker 시크릿. wrangler types 는 시크릿을 모르므로 여기서 보강한다.
declare namespace Cloudflare {
  interface Env {
    TURNSTILE_SECRET: string
  }
}
