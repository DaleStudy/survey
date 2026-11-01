import { Button } from 'daleui'
import { useState } from 'react'
import type { DevType } from '@/lib/devType'

export const SITE_URL = 'https://survey.dalestudy.com'

// 공유 링크에는 유형 이름만 넣는다. 응답 내용은 담지 않는다.
export function ShareButton({ type, edition }: { type: DevType; edition: { id: string; title: string } }) {
  const [copied, setCopied] = useState(false)
  const url = `${SITE_URL}/${edition.id}/type/${type.slug}`
  const text = `나는 '${type.name}' 개발자래요. ${edition.title}`

  async function share() {
    if (navigator.share) {
      try {
        await navigator.share({ title: edition.title, text, url })
        return
      } catch {
        // 사용자가 공유 창을 닫으면 아무것도 하지 않는다
        return
      }
    }
    await navigator.clipboard.writeText(`${text}\n${url}`)
    setCopied(true)
  }

  return (
    <Button tone="brand" size="lg" onClick={share}>
      {copied ? '링크를 복사했어요' : '결과 공유하기'}
    </Button>
  )
}
