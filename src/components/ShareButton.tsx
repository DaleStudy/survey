import { Button, Heading, Icon, Text } from 'daleui'
import { useEffect, useState } from 'react'
import type { DevType } from '@/lib/devType'
import { SITE_URL } from '@/lib/og'

// 테두리 버튼 모양의 링크. 공유 대상은 새 탭에서 열리는 주소라 <a> 로 둔다.
const outline: React.CSSProperties = {
  display: 'inline-flex',
  justifyContent: 'center',
  alignItems: 'center',
  gap: 'var(--spacing-8)',
  minHeight: 44,
  padding: '0 var(--spacing-12)',
  border: '1px solid var(--colors-border-neutral)',
  borderRadius: 'var(--radii-md)',
  background: 'var(--colors-app-bg)',
  color: 'var(--colors-fg-neutral)',
  font: 'inherit',
  fontWeight: 500,
  textDecoration: 'none',
  whiteSpace: 'nowrap',
  cursor: 'pointer',
}

// 공유 링크에는 유형 이름만 넣는다. 응답 내용은 담지 않는다.
// 데스크톱의 OS 공유 창은 메시지나 메모 같은 대상만 보여서, 터치 기기에서만 쓴다.
export function ShareButton({ type, edition }: { type: DevType; edition: { id: string; title: string } }) {
  const [copied, setCopied] = useState(false)
  const [nativeShare, setNativeShare] = useState(false)
  const url = `${SITE_URL}/${edition.id}/type/${type.slug}`
  const title = `나는 '${type.name}' 개발자`
  const text = `${title}래요. ${edition.title}`

  useEffect(() => {
    setNativeShare(typeof navigator.share === 'function' && matchMedia('(pointer: coarse)').matches)
  }, [])

  async function copy() {
    await navigator.clipboard.writeText(`${text}\n${url}`)
    setCopied(true)
  }

  async function share() {
    try {
      await navigator.share({ title, text, url })
    } catch {
      // 사용자가 공유 창을 닫은 경우
    }
  }

  const q = encodeURIComponent
  const targets = [
    { name: 'X', icon: <Icon name="XTwitter" size="sm" />, href: `https://x.com/intent/post?text=${q(text)}&url=${q(url)}` },
    { name: 'LinkedIn', icon: <Icon name="LinkedIn" size="sm" />, href: `https://www.linkedin.com/sharing/share-offsite/?url=${q(url)}` },
    { name: 'Threads', icon: <Icon name="Threads" size="sm" />, href: `https://www.threads.net/intent/post?text=${q(`${text}\n${url}`)}` },
  ]

  return (
    <section aria-labelledby="share" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-16)' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
        <Heading level={2} size={5} id="share">
          주변 개발자에게도 알려 주세요
        </Heading>
        <Text size="sm" muted>
          다양한 분들이 답할수록 결과가 더 의미 있어져요.
        </Text>
      </div>
      <Button tone="brand" size="lg" fullWidth onClick={nativeShare ? share : copy}>
        <Icon name={nativeShare ? 'share2' : 'copy'} size="sm" />
        {nativeShare ? '결과 공유하기' : copied ? '링크를 복사했어요' : '링크 복사하기'}
      </Button>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${nativeShare ? 2 : 3}, minmax(0, 1fr))`, gap: 'var(--spacing-8)' }}>
        {nativeShare && (
          <button type="button" onClick={copy} style={outline}>
            <Icon name="copy" size="sm" />
            {copied ? '복사함' : '링크 복사'}
          </button>
        )}
        {targets.map((t) => (
          <a key={t.name} href={t.href} target="_blank" rel="noopener noreferrer" aria-label={`${t.name}에 공유`} style={outline}>
            {t.icon}
            {t.name}
          </a>
        ))}
      </div>
    </section>
  )
}
