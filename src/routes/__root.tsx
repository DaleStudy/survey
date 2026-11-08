import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'
import appCss from 'daleui/styles.css?url'
import { ogImage } from '@/lib/og'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: '달레 스터디 개발자 설문조사' },
      ...ogImage('/types/default.jpg', '여러 세대의 한국 개발자들이 함께 서 있는 그림'),
      // 오픈 전이라 검색에 나오지 않게 한다
      { name: 'robots', content: 'noindex' },
    ],
    links: [{ rel: 'stylesheet', href: appCss }],
  }),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <HeadContent />
      </head>
      <body style={{ wordBreak: 'keep-all' }}>
        {children}
        <Scripts />
      </body>
    </html>
  )
}
