// 미리보기 이미지에 쓰는 Pretendard. 임시 폴더에 한 번 받아 두고 다시 쓴다.
const FONT_URL = 'https://cdn.jsdelivr.net/npm/pretendard@1.3.9/dist/public/static'
const FONTS = ['Pretendard-SemiBold.otf', 'Pretendard-Bold.otf']

export async function pretendard(dir: string): Promise<string[]> {
  return Promise.all(
    FONTS.map(async (name) => {
      const path = `${dir}/${name}`
      if (!(await Bun.file(path).exists())) {
        const r = await fetch(`${FONT_URL}/${name}`)
        if (!r.ok) throw new Error(`${name}: ${r.status}`)
        await Bun.write(path, r)
      }
      return path
    }),
  )
}

export const escapeXml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
