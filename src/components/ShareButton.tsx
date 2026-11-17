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

// daleui 에 없는 브랜드 아이콘. 경로는 Simple Icons 에서 가져왔다.
const brandPaths = {
  Bluesky:
    'M5.202 2.857C7.954 4.922 10.913 9.11 12 11.358c1.087-2.247 4.046-6.436 6.798-8.501C20.783 1.366 24 .213 24 3.883c0 .732-.42 6.156-.667 7.037-.856 3.061-3.978 3.842-6.755 3.37 4.854.826 6.089 3.562 3.422 6.299-5.065 5.196-7.28-1.304-7.847-2.97-.104-.305-.152-.448-.153-.327 0-.121-.05.022-.153.327-.568 1.666-2.782 8.166-7.847 2.97-2.667-2.737-1.432-5.473 3.422-6.3-2.777.473-5.899-.308-6.755-3.369C.42 10.04 0 4.615 0 3.883c0-3.67 3.217-2.517 5.202-1.026',
  Facebook:
    'M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z',
}

function BrandIcon({ name }: { name: keyof typeof brandPaths }) {
  return (
    <svg viewBox="0 0 24 24" width="1rem" height="1rem" fill="currentColor" aria-hidden="true" style={{ flexShrink: 0 }}>
      <path d={brandPaths[name]} />
    </svg>
  )
}

// 공유 링크에는 유형 이름만 넣는다. 응답 내용은 담지 않는다.
export function ShareButton({ type, edition }: { type: DevType; edition: { id: string; title: string } }) {
  const url = `${SITE_URL}/${edition.id}/type/${type.slug}`
  const title = `나는 '${type.name}' 개발자`
  // 설문을 도와 달라는 부탁보다, 나를 드러내고 상대에게 되묻는 말이 더 잘 퍼진다
  const text = `${edition.title}에 참여했어요. ${title}래요. 당신은 어떤 유형인가요?`
  const { nativeShare, status, copy, share } = useShare(url, title, text)

  const q = encodeURIComponent
  // 마지막 줄 버튼이 넓어지므로, 쓰는 사람이 줄고 있는 Facebook 은 첫 줄에 둔다.
  const targets = [
    { name: 'X', icon: <Icon name="XTwitter" size="sm" />, href: `https://x.com/intent/post?text=${q(text)}&url=${q(url)}` },
    { name: 'Bluesky', icon: <BrandIcon name="Bluesky" />, href: `https://bsky.app/intent/compose?text=${q(`${text}\n${url}`)}` },
    { name: 'Facebook', icon: <BrandIcon name="Facebook" />, href: `https://www.facebook.com/sharer/sharer.php?u=${q(url)}` },
    { name: 'Threads', icon: <Icon name="Threads" size="sm" />, href: `https://www.threads.net/intent/post?text=${q(`${text}\n${url}`)}` },
    { name: 'LinkedIn', icon: <Icon name="LinkedIn" size="sm" />, href: `https://www.linkedin.com/sharing/share-offsite/?url=${q(url)}` },
  ]
  // 한 줄에 nativeShare 면 2개, 아니면 3개. 마지막 줄이 덜 차면 남은 버튼이 줄을 나눠 채운다.
  const perRow = nativeShare ? 2 : 3
  const cell = { ...outline, flex: `1 1 calc((100% - ${perRow - 1} * var(--spacing-8)) / ${perRow})` }

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
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-8)' }}>
        {nativeShare && (
          <button type="button" onClick={copy} style={cell}>
            <Icon name={status === 'copied' ? 'check' : 'copy'} size="sm" />
            {status === 'copied' ? '복사함' : status === 'failed' ? '복사 실패' : '링크 복사'}
          </button>
        )}
        {targets.map((t) => (
          <a key={t.name} href={t.href} target="_blank" rel="noopener noreferrer" aria-label={`${t.name}에 공유`} style={cell}>
            {t.icon}
            {t.name}
          </a>
        ))}
      </div>
    </section>
  )
}
