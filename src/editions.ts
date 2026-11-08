// 회차 목록. 회차와 키 규칙: docs/data-model.md
export interface Edition {
  // 주소와 DB 에 쓰는 ID: 2026(연례), 2027-h1(반기), 2027-frontend(트랙)
  id: string
  title: string
  // 응답을 받는 회차인지. 문항 파일 questions/<id>.yaml 이 있어야 한다.
  survey: boolean
  // 날짜는 ISO 8601, 한국 시간. 회차 페이지와 설문 화면의 안내 문구가 이 값을 쓴다.
  opensAt?: string
  // 응답 마감. 이 시각부터 화면과 서버가 응답을 막는다.
  closesAt?: string
  resultsAt?: string
  // 원본 응답을 지우는 날. 동의 화면과 처리방침에 공개한 약속이다.
  deleteAt?: string
  // 완료 화면에서 개발자 유형을 보여 주는지
  devTypes: boolean
  // 결과 화면을 시험하려고 만든 예시 데이터. 실제 설문이 아니다. 오픈 전에 지운다.
  sample?: boolean
}

export const EDITIONS: Edition[] = [
  {
    id: '2026',
    title: '2026 달레 스터디 개발자 설문조사',
    survey: true,
    opensAt: '2026-11-16',
    closesAt: '2026-12-06T23:59:59+09:00',
    resultsAt: '2026-12-21',
    deleteAt: '2027-12-31',
    devTypes: true,
  },
  {
    id: '2025',
    title: '2025 달레 스터디 개발자 설문조사',
    survey: false,
    devTypes: false,
    sample: true,
  },
]

export function findEdition(id: string): Edition | undefined {
  return EDITIONS.find((e) => e.id === id)
}

export function isClosed(edition: Edition, now: Date = new Date()): boolean {
  return edition.closesAt !== undefined && now.getTime() >= new Date(edition.closesAt).getTime()
}

// 시작일 전에 받는 응답은 베타다. 베타 동안에는 같은 브라우저에서 다시 답할 수 있게 하고,
// 설문으로 들어가는 링크는 페이지를 새로 불러 Cloudflare Access 가 로그인을 먼저 받게 한다.
export function isBeta(edition: Edition, now: Date = new Date()): boolean {
  return edition.opensAt !== undefined && now.getTime() < new Date(`${edition.opensAt}T00:00:00+09:00`).getTime()
}

// 지금 응답을 받는 회차들. /survey 짧은 주소가 본다.
export function openEditions(now: Date = new Date()): Edition[] {
  return EDITIONS.filter((e) => e.survey && !isClosed(e, now))
}
