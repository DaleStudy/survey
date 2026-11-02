import { Link } from '@tanstack/react-router'
import { Button, Checkbox, Heading, Icon, Text } from 'daleui'
import { useState } from 'react'

const ITEMS = [
  { term: '어디에 쓰나요', desc: '한국 개발자 현황을 통계로 정리하고, 결과와 응답 데이터를 공개하는 데 써요.' },
  { term: '무엇을 받나요', desc: '경력, 직무, 회사, 지역(시·도), 연봉 구간, 기술, AI 사용 경험이에요. 이름, 이메일, IP는 받지 않아요.' },
  { term: '언제까지 두나요', desc: '원본은 2027년 6월 30일까지만 두고 지워요.' },
  { term: '동의하지 않으면요', desc: '설문에 참여할 수 없을 뿐, 그 밖의 불이익은 없어요.' },
]

export function ConsentStep({ onAgree }: { onAgree: () => void }) {
  const [agree, setAgree] = useState({ age: false, collect: false, abroad: false })
  const [error, setError] = useState(false)
  const set = (key: keyof typeof agree) => (checked: boolean) => {
    setAgree({ ...agree, [key]: checked })
    setError(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-24)' }}>
      <Heading level={2} size={3}>
        시작하기 전에 확인해 주세요
      </Heading>
      <dl
        style={{
          margin: 0,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 'var(--spacing-12) var(--spacing-24)',
          padding: 'var(--spacing-16) var(--spacing-20)',
          borderRadius: 'var(--radii-md)',
          background: 'var(--colors-app-bg)',
          fontSize: '0.875rem',
          lineHeight: 1.5,
        }}
      >
        {ITEMS.map((item) => (
          <div key={item.term}>
            <dt style={{ fontWeight: 600 }}>{item.term}</dt>
            <dd style={{ margin: 0 }}>{item.desc}</dd>
          </div>
        ))}
      </dl>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-12)' }}>
        <Checkbox tone="brand" label="만 14세 이상이에요" required checked={agree.age} onChange={set('age')} />
        <Checkbox tone="brand" label="개인정보 수집·이용에 동의해요" required checked={agree.collect} onChange={set('collect')} />
        <Checkbox
          tone="brand"
          label="응답을 국외 서버에 보관하는 데 동의해요"
          required
          checked={agree.abroad}
          onChange={set('abroad')}
          helperText="Cloudflare, Inc.(미국)의 홍콩 데이터 센터에 보관해요."
        />
      </div>
      {error && (
        <div role="alert" style={{ display: 'flex', gap: 'var(--spacing-8)', alignItems: 'center' }}>
          <Icon name="circleAlert" size="sm" tone="danger" />
          <Text size="sm" tone="danger">
            세 가지 모두 동의해야 시작할 수 있어요.
          </Text>
        </div>
      )}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-16)', alignItems: 'center' }}>
        <Button
          tone="brand"
          size="lg"
          onClick={() => (agree.age && agree.collect && agree.abroad ? onAgree() : setError(true))}
        >
          동의하고 시작하기 <Icon name="chevronRight" size="sm" />
        </Button>
        <Link to="/privacy">개인정보 처리방침</Link>
      </div>
    </div>
  )
}
