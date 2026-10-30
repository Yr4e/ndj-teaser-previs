# MiniMax H3: 2 генерации

H3 делает до 15 с за раз, поэтому 22 с — это две генерации со склейкой около 12 с. Куски перекрываются примерно на 0,8 с: в первом 0–12,3 с, во втором 11,5–22 с. Это запас, чтобы подобрать стык при монтаже.

Файлы загружать строго в указанном порядке: номера @Image и @Video назначаются по порядку загрузки.

## Генерация 1: 0–12 с (длительность 12 с)

Загрузить по порядку:
- @Video1 `h3_part1_previs.mp4`
- @Image1 `refs/01-mainframe-through-clouds.webp`
- @Image2 `refs/02-warrior-fight.webp`
- @Image3 `refs/03-monkey-fight.webp`

```
Stylized voxel low-poly game cinematic with pixel textures, bright sunny day. @Video1 is a grey-box layout: follow only its camera path, speed, framing and where things stand; never copy its blocky shapes, flat colours or materials. Looks come only from the images; world and lighting style from @Image2 and @Image3. All effects (lightning, sky tear, sparks, sword trails) are in the same voxel pixel style.
World: wide open green meadow, tall pixel grass and flowers, blocky trees and pines, grey rocks, mossy ruined pillars, giant colourful mushrooms, soft hills. Strong atmospheric depth: the further away, the hazier, with a soft bloom glow on distant fights and the sky.
Mainframe (@Image1): colossal blocky computer boss, monitor head with a single red eye, arc of glowing cyan monitors, red glowing chest core, white spiked arm on the left, pink arrow arm on the right. Slow, heavy, massive movement.
0-1s: camera looks up into the sky; heavy voxel lightning strikes between clouds; a huge red eye slowly glows through the haze.
1-3s: the Mainframe slowly and heavily tears the sky open, the jagged rift crackles with electric edges, it pushes out and then stays still in the sky.
3-7s: camera slowly pulls back, then accelerates backwards and glides down to waist height, lens always facing the Mainframe.
7-9.5s: camera flies backwards right through the warrior's fight (@Image2): he swings his silver sword again and again in wide sweeps, green mossy tree mobs fly back.
9.5-12s: camera curves past the monkey (@Image3) in a constant brawl, punching blue spiky mobs.
The camera eases slower at each fight and faster between them. Fights never stop; when the camera leaves, they keep going in the background, fading into haze and bloom. Each fight shows only that hero and their mobs.
Sound: rising deep rumble and thunder, heavy metallic groan as the Mainframe breaks through, wind rush, battle sounds passing by.
No text, no UI, no extra characters. One continuous shot, no cuts.
```

## Генерация 2: 12–22 с (длительность 11 с)

Загрузить по порядку:
- @Video1 `h3_part2_previs.mp4`
- @Image1 `refs/04-glitch-fight.webp`
- @Image2 `refs/05-cat-robot-fight.webp`
- @Image3 `refs/06-skeleton-front.png`
- @Image4 `refs/07-skeleton-side.png`
- @Image5 `refs/08-skeleton-back.png`
- @Image6 `refs/01-mainframe-through-clouds.webp`

```
Stylized voxel low-poly game cinematic with pixel textures, bright sunny day. @Video1 is a grey-box layout: follow only its camera path, speed, framing and where things stand; never copy its blocky shapes, flat colours or materials. Looks come only from the images; world and lighting style from @Image1 and @Image2. All effects (blaster shots, rockets, explosions) are in the same voxel pixel style.
World: wide open green meadow, tall pixel grass, blocky trees, grey rocks, mossy ruins. Strong atmospheric depth with soft bloom on distant fights. The giant Mainframe (@Image6) hangs still in the sky in the background.
The camera keeps flying backwards at waist height, lens facing the Mainframe, easing slower at each fight and faster between them.
0-0.5s: continuous backward flight across the meadow.
0.5-3s: past Glitch (@Image1), slim cream robot with a CRT head, side-on and slightly from behind, firing his blaster in rapid bursts at the mobs ahead.
3-5.5s: camera passes between the cat robot (@Image2, back to camera, black cat on top) and its targets; its hovering launcher fires rocket after rocket into blue, green and purple mage mobs, explosions keep going.
5.5-6.8s: camera rises once above head height; the skeleton (@Image3, @Image4, @Image5: blue eyes, pink cap, black sneakers, turquoise wheels) rides his skateboard toward it, notices it, spins around on the board as it flies past, leans in and reaches out; bony fingers enter from the frame edge and grab the lens, the flight stops with a sharp jerk.
6.8-8.5s: camera held in his hand, swaying slightly; his skull close, staring into the lens.
8.5s: he headbutts the lens, hard shake, cracks spread across the camera glass and stay.
8.5-10.5s: skull seen through the cracked glass, fights still going far behind in the haze. End.
Fights never stop. Sound: blaster zaps, rocket whooshes and explosions, skateboard wheels, a hard crack on the headbutt.
No text, no UI, no extra characters. One continuous shot, no cuts.
```

## Если не получается

- **Камера не повторяет путь:** добавить в начало «Exactly replicate the camera movement from @Video1». Если не помогло, резать на 4 куска (`../seedance/previs_A/B1/B2/C.mp4`).
- **Проступают кубики из блокаута:** нужна серая версия превиза, попроси, я сделаю.
- **Майнфрейм:** лучше заменить @Image1 артом Майнфрейма в разорванном небе, если перешлёшь файл.
