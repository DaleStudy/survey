// 한국 시간 기준 날짜 표기. 예: 12월 6일, 2027년 12월 31일
export function koDate(iso: string, withYear = false): string {
  const day = iso.length === 10 ? `${iso}T00:00:00+09:00` : iso
  return new Intl.DateTimeFormat('ko-KR', {
    year: withYear ? 'numeric' : undefined,
    month: 'long',
    day: 'numeric',
    timeZone: 'Asia/Seoul',
  }).format(new Date(day))
}
