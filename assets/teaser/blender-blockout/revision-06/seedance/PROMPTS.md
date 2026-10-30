# Seedance: 3 генерации по превизу revision-06

Seedance 2.0 генерирует 4–15 с за раз, а видео-референсы в сумме не длиннее 15 с. Поэтому 22 секунды собираются из трёх кусков. Куски превиза нарезаны с перекрытием ~1 с, чтобы стык можно было подобрать при монтаже.

| Генерация | Превиз | Длина | Что внутри |
| --- | --- | --- | --- |
| A | `previs_A.mp4` (0–7,5 с) | 8 с | Небо, глаз, Майнфрейм рвёт небо, отлёт и спуск |
| B | `previs_B.mp4` (6,5–17,5 с) | 11 с | Пролёт через 4 боя |
| C | `previs_C.mp4` (16,5–22 с) | 6 с | Скелет ловит камеру, удар лбом, трещины |

## Правила, чтобы блокаут не испортил генерацию

1. **В каждом промпте одной фразой назначать роль видео:** только камера, тайминг и расстановка. Внешний вид, материалы и цвета из видео не брать.
2. **Внешний вид задают только картинки.** На каждого героя и на Майнфрейм своя картинка-референс плюс одна картинка на стиль мира.
3. **Камеру словами не расписывать подробно**, видео её уже несёт. Достаточно одной строки «камера летит назад…». Если модель игнорирует движение, добавить: `Exactly replicate the camera movement from @Video1`.
4. **В конце промпта:** `One continuous shot, no cuts.`
5. **Промпт 60–150 слов.** Теги @Image/@Video нумеруются в порядке загрузки, поэтому файлы загружать ровно в порядке из списков ниже.

---

## A: небо и Майнфрейм (8 с)

Загрузить: @Video1 = `previs_A.mp4`, @Image1 = арт Майнфрейма в разрыве неба, @Image2 = кадр мира или поляны для стиля.

```
Stylized voxel low-poly game cinematic, bright blue sky, soft painted clouds. Use @Video1 only for camera movement, framing and timing; do not copy its grey-box shapes, materials or colours. The Mainframe looks exactly like @Image1; world style and lighting from @Image2.
0-1s: camera looks up into the sky, lightning flashes between clouds, a huge red eye glows through the haze.
1-3s: the Mainframe tears the sky open and pushes out of the jagged rift: monitor head with the red eye, arc of glowing monitors, red chest core, white spiked arm on the left, pink arrow arm on the right. It stays still in the sky.
3-7s: camera slowly pulls back, then accelerates backwards and glides down to waist height over a green meadow, lens still facing the Mainframe.
One continuous shot, no cuts.
```

## B: пролёт через бои (11 с)

Загрузить: @Video1 = `previs_B.mp4`, @Image1 = воин, @Image2 = обезьяна, @Image3 = Глитч с бластером, @Image4 = робот с кошкой и ракетницей, @Image5 = Майнфрейм.

```
Stylized voxel game battle on a sunny meadow. Use @Video1 only for the camera path, speed changes, framing and where each fight stands; do not copy its grey-box shapes, materials or colours. The camera flies backwards at waist height in one smooth move, easing slower at each fight and faster between them, lens facing the Mainframe from @Image5 hanging still in the sky.
Each fight looks like its reference: warrior @Image1 sweeps his sword and knocks green tree mobs back; monkey @Image2 punches blue spiky mobs; Glitch @Image3, side-on and slightly from behind, fires his blaster at the mobs ahead; cat robot @Image4, back to camera, its hovering launcher fires rockets into blue, green and purple mage mobs.
The camera passes right through each fight, close fighters sweep past the frame edges with motion blur.
One continuous shot, no cuts.
```

## C: скелет (6 с)

Загрузить: @Video1 = `previs_C.mp4`, @Image1–@Image3 = скелет спереди, сбоку и сзади (`character-refs/skeleton-*.png`), @Image4 = кадр мира для стиля.

```
Use @Video1 only for camera movement, timing and framing; do not copy its grey-box look. The skeleton on a skateboard looks like @Image1, @Image2, @Image3: blue eyes, pink cap, black sneakers, turquoise wheels. World style from @Image4.
0-1s: the camera, flying backwards, rises above head height and reaches the skeleton; he notices it and reaches toward the lens.
1-1.5s: bony fingers enter from the frame edges and grab the camera; the smooth flight stops with a sharp jerk.
1.5-3.3s: the camera is in his hand, swaying slightly; his skull is close, staring into the lens.
3.3-3.7s: he headbutts the lens, hard shake, cracks spread across the camera glass and stay on screen.
3.7-6s: his skull seen through the cracked glass, motion settles.
One continuous shot, no cuts.
```

## Стыки

- **A→B:** в A камера к ~7 с уже на высоте пояса и летит назад, а B начинается с этого же движения. Монтажная склейка на движении назад почти незаметна.
- **B→C:** склейка около 17 с, на подъёме камеры.
- Если сервис разрешает первый кадр вместе с референсами, последний кадр A можно дать первым кадром B, и так же для B→C. Есть сообщения, что режим первого кадра и мультимодальный режим нельзя совмещать в одной генерации, это надо проверить в интерфейсе.
- В Seedance 2.5, по сторонним гайдам, лимит до 30 с и до 10 видео-референсов, то есть 22 с можно попробовать одной генерацией. Но 3 куска дают больше контроля над каждым боем.

---

# MiniMax H3 (Hailuo 3.0)

По сторонним описаниям лимиты у H3 почти как у Seedance 2.0:
- генерация 4–15 с (на Runway 5–15 с);
- до 9 картинок и до 3 видео, всего до 12 референсов;
- видео-референсы 2–15 с, в сумме до 15 с;
- промпт до ~6000 символов.

Значит, тоже нужно резать. Отличия от Seedance:
- **Камера у H3 управляется в первую очередь текстом,** видео только помогает. Поэтому движение камеры описываем подробнее, чем для Seedance.
- **Короткий референс с одним ясным движением переносится лучше длинного.** Поэтому бои лучше дать двумя кусками по ~6 с, а не одним на 11 с:
  - `previs_B1.mp4` (6,5–12,3 с): воин и обезьяна;
  - `previs_B2.mp4` (11,5–17,5 с): Глитч и робот.
- Куски A и C те же, промпты A и C из раздела Seedance подходят. В начало каждого стоит добавить фразу про камеру из шаблона ниже.

Шаблон для B1 (B2 такой же, только Глитч и робот):

```
Stylized voxel low-poly game cinematic on a sunny green meadow. @Video1 is a grey-box layout: follow only its camera path, speed and framing; never copy its blocky shapes, flat colours or materials. Character looks come only from the images.
Camera: one continuous backward flight at waist height (about 1.2 m), lens always facing back toward the giant Mainframe hanging still in the sky (@Image3). It eases down to a slow glide while passing each fight, then speeds up smoothly between fights. The path snakes gently left and right; no cuts, no zooms, no shake.
0-2.5s: the camera flies right through the warrior's fight (@Image1): he sweeps his silver sword in a wide arc and knocks green mossy tree mobs flying back.
2.5-5.8s: the camera curves left past the monkey (@Image2), who punches blue spiky mobs, bananas in his basket.
Close fighters sweep past the frame edges with light motion blur. One continuous shot, no cuts.
```

---

# Seedance 2.5: одной генерацией

По сторонним гайдам у 2.5:
- генерация 4–30 с;
- до 30 картинок и до 10 видео-референсов, видео в сумме до 30 с.

Значит, 22 с можно попробовать целиком. Загрузить: @Video1 = `../camera_previs_22s_v6.mp4`, затем картинки из `refs/` строго по номерам:
- @Image1 `01-mainframe-through-clouds.webp` (лучше заменить артом Майнфрейма в разорванном небе);
- @Image2 `02-warrior-fight.webp`;
- @Image3 `03-monkey-fight.webp`;
- @Image4 `04-glitch-fight.webp`;
- @Image5 `05-cat-robot-fight.webp`;
- @Image6–8 `06/07/08-skeleton-*.png`.

Отдельной картинки стиля нет: стиль мира берётся из картинок боёв.

```
Stylized voxel low-poly game cinematic with pixel textures, bright sunny day. Use @Video1 only for the complete camera path, framing changes, subject positions and timing. Do not copy the blockout materials, shapes, colours or character appearance; looks come only from the images. World and lighting style from @Image2-@Image5. All effects (lightning, sky tear, sparks, sword trails, blaster shots, rockets, explosions) are in the same voxel pixel style.
World: a wide open green meadow with tall pixel-textured grass and small flowers, blocky trees and pines, grey rocks, mossy ruined stone pillars, giant colourful mushrooms, a small stream, soft rolling hills. Bright blue sky with soft white clouds. Strong atmospheric depth: the further away, the hazier and softer, with a gentle bloom glow on distant fights and the sky.
Mobs: wooden creatures with branch antlers and glowing cross-shaped eyes: round green mossy ones, slim blue spiky ones, bulky red hooded ones with backpacks, purple mage ones with pointy hats and staffs.
Mainframe (@Image1): a colossal blocky computer boss, monitor head with a single red eye, an arc of glowing cyan monitors, a red glowing core in its chest, a white spiked arm on the left and a pink arrow arm on the right. Its movement is slow, heavy and massive.
Heroes: warrior (@Image2) with red mohawk and silver sword; monkey (@Image3) in red cap and shorts with a banana basket; Glitch (@Image4), slim cream robot with a CRT head and blaster; cat robot (@Image5), teal-cream four-legged robot with a black cat on top and a hovering rocket launcher; skeleton (@Image6-@Image8) with blue eyes, pink cap and a skateboard.
Fights are continuous: every hero keeps fighting non-stop the whole time, attack after attack, mobs keep charging and getting knocked back. When the camera leaves a fight it keeps going in the background, fading into haze and bloom. Each fight shows only that hero and their mobs, nothing extra.
0-1s: camera looks up into the sky; heavy voxel lightning strikes between the clouds; a huge red eye slowly glows through the haze.
1-3s: the Mainframe slowly and heavily tears the sky open, the jagged rift crackles with electric edges, and it pushes out through it, then stays still in the sky.
3-7s: camera slowly pulls back, then accelerates backwards and glides down to waist height, lens facing the Mainframe.
7-9.5s: camera flies right through the warrior's fight: he swings his sword again and again in wide sweeps, green tree mobs fly back.
9.5-12s: past the monkey punching blue spiky mobs in a constant brawl.
12-14.5s: past Glitch, side-on and slightly from behind, firing his blaster in rapid bursts at the mobs ahead.
14.5-17s: between the cat robot (back to camera) and its targets; its hovering launcher fires rocket after rocket into blue, green and purple mage mobs, explosions keep going.
The camera slows gently at each fight and speeds up between them.
17-18.3s: camera rises once above head height; the skeleton rides his skateboard toward it, notices the camera, spins around on the board as it flies past, leans in and reaches out; bony fingers enter from the frame edge and grab the lens, the flight stops with a sharp jerk.
18.3-20s: camera held in his hand, swaying; his skull close, staring in.
20s: he headbutts the lens, hard shake, cracks spread across the camera glass and stay.
20-22s: skull seen through the cracked glass, fights still going far behind in the haze. End.
Sound: rising deep rumble and thunder in the sky, heavy metallic groan as the Mainframe breaks through, wind rush during the flight, battle sounds passing by, a hard crack on the headbutt.
No text, no UI, no extra characters. One continuous shot, no cuts.
```

Если результат «плывёт» во второй половине, нужно вернуться к трём кускам, A/B/C из раздела Seedance 2.0.
