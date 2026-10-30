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
