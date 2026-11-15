import type { CopyStatus as Status } from '@/lib/useCopy'

// 화면에는 보이지 않고 스크린 리더만 읽는 글자
const srOnly: React.CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  overflow: 'hidden',
  clipPath: 'inset(50%)',
  whiteSpace: 'nowrap',
}

// 복사 결과 알림. 버튼 안의 글자나 aria-label 이 바뀌어도 스크린 리더는 잘 알리지 않아서, 버튼 밖에 늘 있는 role="status" 에 적는다.
export function CopyStatus({ status, copied, failed = '복사하지 못했어요. 직접 복사해 주세요.' }: { status: Status; copied: string; failed?: string }) {
  return (
    <span role="status" style={srOnly}>
      {status === 'copied' ? copied : status === 'failed' ? failed : ''}
    </span>
  )
}
