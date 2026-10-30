# Финал: одна генерация с 7-й секунды до конца (15 с)

Твоя генерация 0–7 с (гроза, глаз, Майнфрейм) + эта генерация 7–22 с = готовое видео на 22 с.

## Настройки
- Seedance 2.0, 16:9, **15 с**, звук включён.
- Поле **Start frame не трогать.** Первый кадр идёт картинкой @Image1 в Image refs. По документации API режим первого кадра и мультимодальный режим нельзя смешивать.

## Загрузить строго в этом порядке

| Тег | Файл |
| --- | --- |
| @Video1 | `previs_7-22_camera.mp4` |
| @Image1 | `01-first-frame-7s.png` (кадр твоей генерации на 7,0 с) |
| @Image2 | `02-meadow.png` |
| @Image3 | `03-warrior.png` |
| @Image4 | `04-monkey.png` |
| @Image5 | `05-glitch.png` |
| @Image6 | **робот с кошкой на тёмном фоне** (сгенерировать по промпту ниже) |
| @Image7 | `07-skeleton-grab.png` (скелет хватает камеру) |
| @Image8 | **твой Майнфрейм целиком** |
| @Image9 | `09-mobs-green-blue-red.png` |

Ровно 9 картинок, это лимит Seedance 2.0.

## Промпт

```
@Image1 is the first frame; the video continues seamlessly from it. One continuous shot with no cuts, no jumps and no scene changes; the camera never teleports. From the very first frame the camera is already flying backwards. Exactly replicate the camera movement from @Video1.
Stylized voxel low-poly game cinematic with pixel textures, bright sunny day. Use @Video1 only for the camera path, framing and where each fight stands; do not copy anything visual from it. The whole shot takes place in one single location, exactly the meadow from @Image1 and @Image2: white daisies, voxel grass, blocky trees, pines and mossy stone ruin pillars. It never changes. Ignore every background in the other images. No mushrooms. Strong atmospheric depth with soft bloom in the distance.
The Mainframe from @Image8 hangs still, high in the sky at the top of the frame, for the whole shot.
Characters look exactly like their images: warrior @Image3, monkey @Image4, Glitch @Image5, cat robot @Image6, skeleton @Image7 (pink cap, glowing blue eyes, checkered skateboard with turquoise wheels). Mobs look exactly like @Image9 (green mossy, blue spiky, red hooded with backpacks), plus purple mage mobs with pointy hats and staffs.
The camera flies backwards at waist height, lens facing the Mainframe, easing slower at each fight and faster between them. The fights are separate and far apart on alternating sides; heroes never appear together. Fights never stop; left behind, they keep going in the haze.
0-1s: the camera glides down to waist height over the daisies.
1-3.5s: right through the warrior's fight on the right: the warrior standing, swinging his silver sword in wide sweeps again and again, green mobs flying back. He never sits or crouches.
3.5-6s: the camera curves left past a separate fight: the monkey punching blue spiky mobs non-stop.
6-8.5s: further on, on the right: Glitch, side-on and slightly from behind, firing his blaster in rapid bursts at the mobs ahead.
8.5-11s: further on, on the left: the camera passes between the cat robot (back to camera, black cat on top) and its targets; its hovering rocket launcher fires rocket after rocket into blue, green and purple mobs; explosions keep going.
11-12.3s: the camera rises once above head height; the skeleton rides his skateboard toward it, notices it, spins around on the board as it flies past, leans in and reaches his bony hand straight at the lens, exactly like @Image7; his fingers enter from the frame edge and grab the camera; the flight stops with a sharp jerk.
12.3-14s: the camera is held in his hand, swaying slightly; his skull close, staring into the lens.
14s: he headbutts the lens, a hard shake, cracks spread across the camera glass and stay.
14-15s: his skull seen through the cracked glass. End.
Sound: wind rush, sword clashes, punches, blaster zaps, rocket whooshes and explosions, skateboard wheels, a hard crack on the headbutt. No voices, no music.
No text, no UI, no dialogue.
```

## Что ещё сгенерировать: робот на тёмном фоне (@Image6)

Загрузить в генератор картинок `cat-robot-close.png` (или свою картинку боя робота) и вставить:

```
Using this image as the exact design reference, create a character reference of this robot on a plain dark grey studio background, full body, three-quarter view: the teal and cream boxy CRT robot with a smiling yellow pixel face screen, two green triangular ears on top, a black cat sitting on its head, four mechanical legs (two broad front legs with clawed feet, two thin rear legs with round pads), and a red-and-white striped rocket launcher hovering next to it. Same stylized voxel low-poly pixel-texture style and lighting. No landscape, no grass, no sky, no text.
```

## Если генерируешь в Seedance 2.5, а не в 2.0
Тот же пак и тот же промпт. Если хочешь, туда можно добавить картинки боёв как реф действия, лимит позволяет. Для этого допиши: «fight images are action references only; ignore their backgrounds».
