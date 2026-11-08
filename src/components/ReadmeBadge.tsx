import { Button, Heading, Icon, Text } from 'daleui'
import { useState } from 'react'
import { SITE_URL } from '@/lib/og'

// GitHub 프로필이나 README 에 다는 참여 배지. 배지는 public/badges/<회차>.svg 정적 파일이라
// 누가 붙였는지 우리는 모른다. 참여 여부만 담고 유형은 넣지 않는다 — README 는 공유 글보다 오래 남는다.
export function ReadmeBadge({ edition }: { edition: { id: string; title: string } }) {
  const [copied, setCopied] = useState(false)
  const src = `/badges/${edition.id}.svg`
  const markdown = `[![${edition.title} 참여](${SITE_URL}${src})](${SITE_URL}/${edition.id})`

  async function copy() {
    await navigator.clipboard.writeText(markdown)
    setCopied(true)
  }

  return (
    <section aria-labelledby="badge" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-12)' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
        <Heading level={2} size={5} id="badge">
          GitHub 프로필에 배지 달기
        </Heading>
        <Text size="sm" muted>
          README 에 붙이면 프로필을 보는 동료도 설문을 알게 돼요.
        </Text>
      </div>
      <img src={src} alt={`${edition.title} 참여 배지`} width={232} height={20} />
      <div>
        <Button tone="neutral" variant="outline" onClick={copy}>
          <Icon name="copy" size="sm" />
          {copied ? '마크다운을 복사했어요' : '마크다운 복사하기'}
        </Button>
      </div>
    </section>
  )
}
