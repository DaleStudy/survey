import { useEffect, useRef, useState } from 'react'

export type CopyStatus = 'copied' | 'failed' | null

// 복사 결과를 보여 주는 시간. 지나면 처음 상태로 되돌려서 오래된 "복사했어요"가 남지 않게 한다.
const RESET_MS = 2500

// 클립보드 복사. 브라우저가 클립보드 권한을 막으면 실패하므로 실패도 상태로 돌려준다.
export function useCopy(text: string) {
  const [status, setStatus] = useState<CopyStatus>(null)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  useEffect(() => () => clearTimeout(timer.current), [])

  async function copy() {
    clearTimeout(timer.current)
    setStatus(null)
    try {
      await navigator.clipboard.writeText(text)
      setStatus('copied')
    } catch {
      setStatus('failed')
    }
    timer.current = setTimeout(() => setStatus(null), RESET_MS)
  }

  return { status, copy }
}
