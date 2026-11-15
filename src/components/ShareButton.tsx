import { Button, Heading, Icon, Text } from 'daleui'
import { CopyStatus } from '@/components/CopyStatus'
import type { DevType } from '@/lib/devType'
import { SITE_URL } from '@/lib/og'
import { useShare } from '@/lib/useShare'

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
export function ShareButton({ type, edition }: { type: DevType; edition: { id: string; title: string } }) {
  const url = `${SITE_URL}/${edition.id}/type/${type.slug}`
  const title = `나는 '${type.name}' 개발자`
  // 설문을 도와 달라는 부탁보다, 나를 드러내고 상대에게 되묻는 말이 더 잘 퍼진다
  const text = `${edition.title}에 참여했어요. ${title}래요. 당신은 어떤 유형인가요?`
  const { nativeShare, status, copy, share } = useShare(url, title, text)

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
          내 유형 공유하기
        </Heading>
        <Text size="sm" muted>
          동료와 친구는 어떤 유형일까요? 링크로 들어온 사람도 10분이면 자기 유형을 알 수 있어요.
        </Text>
      </div>
      <Button tone="brand" size="lg" fullWidth onClick={nativeShare ? share : copy}>
        <Icon name={nativeShare ? 'share2' : status === 'copied' ? 'check' : 'copy'} size="sm" />
        {nativeShare ? '결과 공유하기' : status === 'copied' ? '링크를 복사했어요' : status === 'failed' ? '복사하지 못했어요' : '링크 복사하기'}
      </Button>
      <CopyStatus status={status} copied="링크를 복사했어요." />
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${nativeShare ? 2 : 3}, minmax(0, 1fr))`, gap: 'var(--spacing-8)' }}>
        {nativeShare && (
          <button type="button" onClick={copy} style={outline}>
            <Icon name={status === 'copied' ? 'check' : 'copy'} size="sm" />
            {status === 'copied' ? '복사함' : status === 'failed' ? '복사 실패' : '링크 복사'}
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
