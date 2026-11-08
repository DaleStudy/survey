// 개발자 유형 일러스트와 대표 이미지를 만든다. 공유 미리보기(og:image)와 유형 카드에 쓴다.
// OPENAI_API_KEY=$(op read op://dev/OpenAI-DaleStudy/credential) bun scripts/type-images.ts <출력 폴더> [slug...]
// 가로 1536×1024 로 받아 가운데를 1200×630 으로 잘라 public/types/<slug>.jpg 에 둔다(sips, macOS).
import { mkdir } from 'node:fs/promises'
import { $ } from 'bun'

const STYLE =
  'Flat vector illustration in a consistent series style. Friendly, soft rounded shapes, gentle shading, simple friendly faces. ' +
  'Color palette: deep violet #5333E1, mint teal #24EACA, soft lavender background #F7F8FF, white, a little warm yellow accent. ' +
  'Wide landscape composition. Keep the whole subject inside the central horizontal band, with empty background above and below, ' +
  'because the top and bottom will be cropped. Clean background. ' +
  'Absolutely no text, no letters, no numbers, no logos, no code on screens (use abstract shapes instead).'

const SCENES: Record<string, string> = {
  'ai-explorer':
    'A Korean woman developer in her twenties with a ponytail and a backpack, exploring a stylized outdoor landscape of purple rocks and teal plants with a small cute robot companion. Her right hand raises a glowing compass. The robot holds an open map with both of its own hands, and her left hand reaches across to touch the map with one finger. Show exactly two human hands, anatomically correct. Sparkles around them, curious and excited mood.',
  'ai-pragmatist':
    'A Korean man developer in his thirties, relaxed at a tidy desk while a small cute robot assistant hands over a finished checklist, a wall clock and a bag ready to go home, efficient and satisfied mood.',
  'careful-experimenter':
    'A Korean woman developer in her thirties with short hair and round glasses, wearing safety goggles on her head, carefully looking at a small cute robot inside a glass flask on a lab table, with a notebook, cautious curious smile.',
  'balanced-realist':
    'A Korean man developer in his thirties, calm, balancing a laptop on one side and a coffee cup with a small plant on the other side of a simple seesaw, peaceful and steady mood.',
  'handcraft-artisan':
    'A Korean man developer in his twenties as a craftsman with rolled-up sleeves and an apron at a wooden workbench typing on a mechanical keyboard, handcraft tools neatly arranged, focused and proud, no robots.',
  'steady-veteran':
    'A Korean woman developer in her late forties with shoulder-length hair and a few gray streaks, holding a warm mug and standing calmly beside a sturdy server rack shaped like a small mountain, reliable and composed, no robots.',
  home:
    'A cozy developer community meetup: about eight Korean developers of different ages and genders (women and men, twenties to fifties) sitting around a long shared table with laptops covered in small stickers, coffee mugs and snacks, chatting and smiling. On the wall behind them, a large whiteboard where colorful sticky notes are stacked into a friendly bar chart, and one person is adding a sticky note to it. Warm, collaborative study-group mood.',
  default:
    'Six diverse Korean developers of different ages and genders (women and men, from twenties to fifties) standing together in a friendly row, some with laptops, one with a small cute robot, a few speech-bubble shapes with check marks above them, welcoming mood.',
}

const [out, ...only] = process.argv.slice(2)
if (!out) throw new Error('usage: bun scripts/type-images.ts <출력 폴더> [slug...]')
const key = process.env.OPENAI_API_KEY
if (!key) throw new Error('OPENAI_API_KEY is not set')
await mkdir(out, { recursive: true })
await mkdir('public/types', { recursive: true })

await Promise.all(
  Object.entries(SCENES)
    .filter(([slug]) => only.length === 0 || only.includes(slug))
    .map(async ([slug, scene]) => {
      const r = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'gpt-image-2', prompt: `${STYLE}\n\nScene: ${scene}`, size: '1536x1024', quality: 'medium', output_format: 'png' }),
      })
      const body = (await r.json()) as { data?: { b64_json: string }[]; error?: { message: string } }
      if (!r.ok || !body.data) return console.log(`${slug}: FAILED ${r.status} ${body.error?.message ?? ''}`)
      const raw = `${out}/${slug}.png`
      await Bun.write(raw, Buffer.from(body.data[0].b64_json, 'base64'))
      await $`sips --cropToHeightWidth 806 1536 ${raw} --out ${out}/${slug}-crop.png`.quiet()
      await $`sips -z 630 1200 -s format jpeg -s formatOptions 82 ${out}/${slug}-crop.png --out public/types/${slug}.jpg`.quiet()
      console.log(`${slug}: ok`)
    }),
)
