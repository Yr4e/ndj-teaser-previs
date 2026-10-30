# Финал: одна генерация с 7-й секунды до конца (15 с)

Твоя генерация 0–7 с (гроза, глаз, Майнфрейм) + эта генерация 15 с = готовое видео на 22 с.

## Настройки
- Seedance 2.0, 16:9, **15 с**, звук включён.
- **Поле Start frame не трогать.** Первый кадр загружается обычной картинкой @Image1.

## Порядок загрузки (картинка `00-ПОРЯДОК-ЗАГРУЗКИ.png`)

| Тег | Файл |
| --- | --- |
| @Video1 | `previs_7-22_camera.mp4` |
| @Image1 | `01-first-frame.png` (кадр твоей генерации на 7,0 с) |
| @Image2 | `02-meadow.png` |
| @Image3 | `03-warrior.png` |
| @Image4 | `04-monkey.png` |
| @Image5 | `05-glitch.png` |
| @Image6 | **твой робот с кошкой на тёмном фоне** (промпт для генерации внизу) |
| @Image7 | `07-skeleton.png` |
| @Image8 | **твой Майнфрейм целиком** |
| @Image9 | `09-mobs-green-blue-red.png` |

Загружать строго по порядку: номера @Image назначаются в порядке загрузки. Если после загрузки сервис показал другие номера, исправь теги в промпте под них.

## Тайминг (секунды этой генерации → секунды всего ролика)

| Генерация | Ролик | Что происходит |
| --- | --- | --- |
| 0–1 с | 7–8 с | камера опускается к ромашкам, на высоту пояса |
| 1–3,5 с | 8–10,5 с | бой воина справа; на 2,0 с реплика «I could do this all day!» |
| 3,5–6 с | 10,5–13 с | бой обезьяны слева; на 4,4 с реплика «Had enough, splinter-heads?» |
| 6–8,5 с | 13–15,5 с | Глитч справа, очереди из бластера |
| 8,5–11 с | 15,5–18 с | робот слева, залп ракет и взрывы |
| 11–12,3 с | 18–19,3 с | подъём камеры, скелет разворачивается и хватает её |
| 12,3–14 с | 19,3–21 с | камера у него в руке |
| 14 с | 21 с | удар лбом, трещины |
| 14–15 с | 21–22 с | череп за треснувшим стеклом, конец |

## Промпт

```
@Image1 is the first frame; the video continues seamlessly from it. One continuous shot with no cuts, no jumps and no scene changes; the camera never teleports. From the very first frame the camera is already flying backwards. Exactly replicate the camera movement from @Video1.
Stylized voxel low-poly game cinematic with pixel textures, bright sunny day. Use @Video1 only for the camera path, framing and where each fight stands; do not copy anything visual from it. The whole shot takes place in one single location, exactly the meadow from @Image1 and @Image2: white daisies, voxel grass, blocky trees, pines and mossy stone ruin pillars. It never changes. Ignore every background in the other images. No mushrooms. Strong atmospheric depth with soft bloom in the distance.
The Mainframe from @Image8 hangs still, high in the sky at the top of the frame, for the whole shot.
Characters look exactly like their images: warrior @Image3, monkey @Image4, Glitch @Image5, cat robot @Image6, skeleton @Image7 (pink cap, glowing blue eyes, checkered skateboard with turquoise wheels). Mobs look exactly like @Image9 (green mossy, blue spiky, red hooded with backpacks), plus purple mage mobs with pointy hats and staffs.
The camera flies backwards at waist height, lens facing the Mainframe, easing slower at each fight and faster between them. The fights are separate and far apart on alternating sides; heroes never appear together. Fights never stop; left behind, they keep going in the haze. Heroes never stop fighting to talk and never look into the camera.
0-1s: the camera glides down to waist height over the daisies.
1-3.5s: right through the warrior's fight on the right. 1.3s: a wide silver sword sweep sends two green mobs flying. 2.0s: without stopping, mid-swing, the warrior shouts with a confident grin: "I could do this all day!" 3.0s: another sweep knocks a mob flying past the camera. He never sits or crouches.
3.5-6s: the warrior's fight recedes as the camera curves left past a separate fight. 3.9s: the monkey lands a huge uppercut and a blue spiky mob flies up. 4.4s: still punching, the monkey yells with a cheeky grin: "Had enough, splinter-heads?" 5.3s: he slams both fists down and blue mobs bounce away.
6-8.5s: further on, on the right: Glitch, side-on and slightly from behind, firing his blaster in rapid bursts at the mobs ahead; bright shots and hits.
8.5-11s: further on, on the left: the camera passes between the cat robot (back to camera, black cat on top) and its targets. 9.0s: its hovering rocket launcher fires a volley of rockets. 9.6s and 10.3s: explosions among blue, green and purple mobs.
11-12.3s: the camera rises once above head height; the skeleton rides his skateboard toward it, notices it, spins around on the board as it flies past, leans in and reaches his bony hand straight at the lens, exactly like @Image7; his fingers enter from the frame edge and grab the camera; the flight stops with a sharp jerk.
12.3-14s: the camera is held in his hand, swaying slightly; his skull close, staring into the lens.
14s: he headbutts the lens, a hard shake, cracks spread across the camera glass and stay.
14-15s: his skull seen through the cracked glass. End.
Voices: only the two lines above, the warrior's and then the monkey's; nobody else speaks.
Sound: wind rush, sword swooshes and wooden cracks, heavy punches, blaster zaps, rocket whooshes and explosions, skateboard wheels, a hard crack on the headbutt. No music.
No text, no subtitles, no UI.
```

## Робот на тёмном фоне (@Image6)

Загрузить в генератор картинок `06-cat-robot-SOURCE-make-dark-bg.png` и вставить:

```
Using this image as the exact design reference, create a character reference of this robot on a plain dark grey studio background, full body, three-quarter view: the teal and cream boxy CRT robot with a smiling yellow pixel face screen, two green triangular ears on top, a black cat sitting on its head, four mechanical legs (two broad front legs with clawed feet, two thin rear legs with round pads), and a red-and-white striped rocket launcher hovering next to it. Same stylized voxel low-poly pixel-texture style and lighting. No landscape, no grass, no sky, no text.
```

## Варианты реплик (если захочешь поменять)

- **Воин:** «I could do this all day!» / «Next!» / «Is that all you've got?»
- **Обезьяна:** «Had enough, splinter-heads?» / «Timber!» / «Who wants a banana?!»
