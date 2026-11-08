// 관리자 화면이 /admin/api 에서 데이터를 받는다.
// Access 세션이 끝나면 로그인 화면으로 보내는 응답이 오는데, fetch 가 따라가지 않게 해서 알아챈다.
export async function adminFetch<T>(part: 'summary' | 'responses', params: Record<string, string>): Promise<T> {
  const r = await fetch(`/admin/api/${part}?${new URLSearchParams(params)}`, { redirect: 'manual' })
  if (r.type === 'opaqueredirect') throw new Error('로그인이 끝났어요. 다시 불러와 주세요.')
  if (!r.ok) throw new Error(((await r.json().catch(() => ({}))) as { error?: string }).error ?? '응답을 불러오지 못했어요.')
  return (await r.json()) as T
}
