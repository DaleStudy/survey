import { useEffect, useState } from 'react'

// 링크 복사와 OS 공유 창. 데스크톱의 OS 공유 창은 메시지나 메모 같은 대상만 보여서, 터치 기기에서만 쓴다.
export function useShare(url: string, title: string, text?: string) {
  const [copied, setCopied] = useState(false)
  const [nativeShare, setNativeShare] = useState(false)

  useEffect(() => {
    setNativeShare(typeof navigator.share === 'function' && matchMedia('(pointer: coarse)').matches)
  }, [])

  async function copy() {
    await navigator.clipboard.writeText(url)
    setCopied(true)
  }

  async function share() {
    try {
      await navigator.share({ title, text, url })
    } catch {
      // 사용자가 공유 창을 닫은 경우
    }
  }

  return { nativeShare, copied, copy, share }
}
