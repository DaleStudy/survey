import { Link, createFileRoute } from '@tanstack/react-router'
import { Heading, Text } from 'daleui'
import { SiteFooter } from '@/components/SiteFooter'
import { SiteHeader } from '@/components/SiteHeader'

export const Route = createFileRoute('/privacy')({
  head: () => ({ meta: [{ title: '개인정보 처리방침 · 2026 한국 개발자 설문' }] }),
  component: Privacy,
})

// 개인정보 보호법 제30조, 시행령 제31조의 기재 사항을 따른다. 근거: docs/research/2026-10-privacy-law.md
// [ ] 로 둔 값은 오픈 전에 채운다.
const SECTIONS: { title: string; body: string[] }[] = [
  {
    title: '1. 처리 목적',
    body: ['한국 개발자 현황을 통계로 정리하고, 결과 리포트와 누군지 알 수 없게 처리한 응답 데이터를 공개하는 데 씁니다.'],
  },
  {
    title: '2. 처리하는 항목',
    body: [
      '설문 응답: 경력, 직무, 나이(구간, 선택), 지역(시·도), 고용 형태, 회사 유형과 규모, 근무 형태와 시간, 연봉 구간(선택), 커리어, 사용 기술, AI 사용 경험, 자유 의견(선택).',
      '설문 링크에 붙은 유입 경로(ref). 어느 채널에서 들어왔는지만 남깁니다.',
      '이름, 이메일, 전화번호, 로그인 정보, IP 주소는 받거나 저장하지 않습니다.',
    ],
  },
  {
    title: '3. 보유 기간과 파기',
    body: [
      '원본 응답은 [파기일]까지 보관한 뒤 지웁니다.',
      '공개용 데이터는 응답자가 적은 집단을 합치거나 가리고, 자유 의견과 제출 시각을 뺀 뒤 공개하며 계속 공개합니다.',
    ],
  },
  {
    title: '4. 처리 위탁과 국외 이전',
    body: [
      '받는 곳: Cloudflare, Inc. ([연락처])',
      '이전하는 항목: 2번의 설문 응답과 유입 경로',
      '이전하는 국가와 시기, 방법: [국가]. 설문을 제출할 때 네트워크로 전송해 저장합니다.',
      '받는 곳의 이용 목적과 기간: 설문 사이트 운영과 응답 저장. 3번의 보유 기간까지.',
      '거부하는 방법과 효과: 설문 첫 화면에서 국외 보관에 동의하지 않으면 됩니다. 이 경우 설문에 참여할 수 없습니다.',
    ],
  },
  {
    title: '5. 자동으로 수집하는 장치',
    body: [
      '제출을 마치면 같은 브라우저에서 다시 답하지 않도록 브라우저 저장소(localStorage)에 “답함” 표시만 남깁니다. 이 표시는 서버로 보내지 않습니다.',
      '자동 입력 방지(Cloudflare Turnstile)를 위해 Cloudflare가 브라우저 정보를 확인할 수 있습니다.',
    ],
  },
  {
    title: '6. 만 14세 미만',
    body: ['만 14세 이상만 참여할 수 있습니다. 첫 화면에서 확인하고, 만 14세 미만이면 응답을 받지 않습니다.'],
  },
  {
    title: '7. 정보주체의 권리',
    body: [
      '개인정보 열람, 정정, 삭제, 처리 정지를 요구할 수 있습니다. 다만 이름이나 연락처를 받지 않아, 응답한 사람을 확인할 수 없는 경우에는 요구에 응하기 어렵습니다.',
    ],
  },
  {
    title: '8. 안전성 확보 조치',
    body: ['원본 응답에는 운영자 1명만 접근할 수 있습니다. 데이터는 암호화된 통신으로만 주고받습니다.'],
  },
  {
    title: '9. 개인정보 보호책임자와 문의',
    body: ['운영: 달레 스터디', '보호책임자: 달레', '문의: [이메일]'],
  },
]

function Privacy() {
  return (
    <>
      <SiteHeader />
      <main style={{ maxWidth: 760, margin: '0 auto', padding: '72px 24px 96px', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-32)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-12)' }}>
          <Link to="/">← 설문으로 돌아가기</Link>
          <Heading level={1} size={2}>
            개인정보 처리방침
          </Heading>
          <Text tone="neutral" muted>
            2026 한국 개발자 설문 · 시행일 2026년 11월 16일
          </Text>
        </div>
        {SECTIONS.map((s) => (
          <section key={s.title} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-8)' }}>
            <Heading level={2} size={5}>
              {s.title}
            </Heading>
            {s.body.map((line) => (
              <Text key={line} as="p" style={{ lineHeight: 1.7 }}>
                {line}
              </Text>
            ))}
          </section>
        ))}
      </main>
      <SiteFooter />
    </>
  )
}
