// dalestudy.com 의 `</>` 로고 마크와 같다(dalestudy.com src/components/Logo.tsx). teal→violet 그라데이션 스트로크.
export function Logo() {
  return (
    <svg width={34} height={15} viewBox="0 0 46 19" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
      <defs>
        <linearGradient id="surveyLogoGrad" x1="-1" y1="9.5" x2="46" y2="9.5" gradientUnits="userSpaceOnUse">
          <stop stopColor="#24EACA" />
          <stop offset="1" stopColor="#846DE9" />
        </linearGradient>
      </defs>
      <path d="M12 2 4 9.5 12 17" stroke="url(#surveyLogoGrad)" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M26.5 1 19.5 18" stroke="url(#surveyLogoGrad)" strokeWidth="3.4" strokeLinecap="round" />
      <path d="M34 2 42 9.5 34 17" stroke="url(#surveyLogoGrad)" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
