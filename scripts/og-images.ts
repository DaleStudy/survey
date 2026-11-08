// 유형 공유 페이지의 미리보기 이미지. 유형 일러스트에 설문 이름과 유형 이름을 얹는다.
// bun scripts/og-images.ts <임시 폴더>
// 일러스트(public/types/<slug>.jpg)는 유형 카드에도 쓰여서 글자를 넣지 않고, 결과를 public/og/<회차>/<slug>.jpg 에 따로 둔다.
// 폰트는 임시 폴더에 받는다. JPEG 변환은 sips(macOS)로 한다.
import { mkdir } from 'node:fs/promises'
import { Resvg } from '@resvg/resvg-js'
import { $ } from 'bun'
import { EDITIONS } from '@/editions'
import { DEV_TYPES } from '@/lib/devType'

const FONT_URL = 'https://cdn.jsdelivr.net/npm/pretendard@1.3.9/dist/public/static'
const FONTS = ['Pretendard-SemiBold.otf', 'Pretendard-Bold.otf']

const [out] = process.argv.slice(2)
if (!out) throw new Error('usage: bun scripts/og-images.ts <임시 폴더>')
await mkdir(out, { recursive: true })

const fontFiles = await Promise.all(
  FONTS.map(async (name) => {
    const path = `${out}/${name}`
    if (!(await Bun.file(path).exists())) {
      const r = await fetch(`${FONT_URL}/${name}`)
      if (!r.ok) throw new Error(`${name}: ${r.status}`)
      await Bun.write(path, r)
    }
    return path
  }),
)

const escape = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

// 일러스트 배경과 같은 색으로 바탕을 깔고 좌우와 위를 흐려, 배경이 꽉 찬 일러스트도 글자 아래에서 끊겨 보이지 않게 한다
function svg(edition: string, name: string, illustration: string) {
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1200" height="630">
  <defs>
    <linearGradient id="fade">
      <stop offset="0" stop-color="#fff" stop-opacity="0"/>
      <stop offset="0.12" stop-color="#fff"/>
      <stop offset="0.88" stop-color="#fff"/>
      <stop offset="1" stop-color="#fff" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="fadeTop" x2="0" y2="1">
      <stop offset="0" stop-color="#fff" stop-opacity="0"/>
      <stop offset="0.2" stop-color="#fff"/>
    </linearGradient>
    <mask id="sides"><rect x="200" y="210" width="800" height="420" fill="url(#fade)"/></mask>
    <mask id="top"><rect x="200" y="210" width="800" height="420" fill="url(#fadeTop)"/></mask>
  </defs>
  <rect width="1200" height="630" fill="#F6F5FD"/>
  <g mask="url(#top)">
    <image x="200" y="210" width="800" height="420" mask="url(#sides)" xlink:href="data:image/jpeg;base64,${illustration}"/>
  </g>
  <text x="600" y="84" text-anchor="middle" font-family="Pretendard" font-weight="600" font-size="32" fill="#5333E1">${escape(edition)}</text>
  <text x="600" y="178" text-anchor="middle" font-family="Pretendard" font-weight="700" font-size="76" fill="#1A1530">${escape(name)}</text>
</svg>`
}

for (const edition of EDITIONS.filter((e) => e.devTypes)) {
  await mkdir(`public/og/${edition.id}`, { recursive: true })
  for (const type of DEV_TYPES) {
    const illustration = Buffer.from(await Bun.file(`public/types/${type.slug}.jpg`).arrayBuffer()).toString('base64')
    const png = new Resvg(svg(edition.title, type.name, illustration), {
      font: { fontFiles, loadSystemFonts: false, defaultFontFamily: 'Pretendard' },
    })
      .render()
      .asPng()
    const raw = `${out}/${edition.id}-${type.slug}.png`
    await Bun.write(raw, png)
    await $`sips -s format jpeg -s formatOptions 82 ${raw} --out public/og/${edition.id}/${type.slug}.jpg`.quiet()
    console.log(`${edition.id}/${type.slug}: ok`)
  }
}
