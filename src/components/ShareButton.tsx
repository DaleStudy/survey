import { Button, Link as DaleLink } from 'daleui'
import { useEffect, useState } from 'react'
import type { DevType } from '@/lib/devType'

export const SITE_URL = 'https://survey.dalestudy.com'

// 공유 링크에는 유형 이름만 넣는다. 응답 내용은 담지 않는다.
// 데스크톱의 OS 공유 창은 메시지·메모 같은 대상만 보여서, 터치 기기에서만 쓴다.
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
    { name: 'X', href: `https://x.com/intent/post?text=${q(text)}&url=${q(url)}` },
    { name: 'LinkedIn', href: `https://www.linkedin.com/sharing/share-offsite/?url=${q(url)}` },
    { name: 'Threads', href: `https://www.threads.net/intent/post?text=${q(`${text}\n${url}`)}` },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-16)', alignItems: 'flex-start' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-12)' }}>
        {nativeShare && (
          <Button tone="brand" size="lg" onClick={share}>
            결과 공유하기
          </Button>
        )}
        <Button tone="brand" size="lg" variant={nativeShare ? 'outline' : 'solid'} onClick={copy}>
          {copied ? '링크를 복사했어요' : '링크 복사하기'}
        </Button>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-24)' }}>
        {targets.map((t) => (
          <DaleLink key={t.name} href={t.href} external>
            {t.name}에 공유
          </DaleLink>
        ))}
      </div>
    </div>
  )
}
