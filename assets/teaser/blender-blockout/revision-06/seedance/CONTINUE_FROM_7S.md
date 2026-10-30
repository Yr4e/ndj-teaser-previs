# Продолжение с 7-й секунды (Seedance 2.0)

Твою 9-секундную генерацию режем на **7,0 с**: дальше там странный воин. Остаток ролика делаем двумя генерациями, каждую начинаем со стартового кадра.

| Генерация | Превиз (@Video1) | Длительность | Start frame | Что внутри |
| --- | --- | --- | --- | --- |
| Продолжение 1 | `previs_cont1_7-16.mp4` | 9 с | `refs/world-frame-7s.png` (кадр твоей генерации на 7,0 с) | спуск, воин, обезьяна, Глитч |
| Продолжение 2 | `previs_cont2_16-23.mp4` | 7 с | последний кадр продолжения 1 | робот, скелет, захват, удар лбом |

Итог: 7 + 9 + 7 = 23 с одним планом. Стыки идут по стартовым кадрам, поэтому склеек быть не должно.

В превизах продолжений нет неба и Майнфрейма, чтобы модель не скопировала кубики. Есть только движение камеры и цветные метки, где стоят бои.

Если сервис не даёт совместить Start frame с Image refs, загрузи стартовый кадр как последнюю картинку и допиши в начало промпта: «The video starts exactly from @ImageN».

---

## Продолжение 1 (9 с)

Загрузить:
- Start frame: `world-frame-7s.png`
- @Video1: `previs_cont1_7-16.mp4`
- @Image1: поляна, вид снизу на небо (`00-world-meadow.png`)
- @Image2: та же поляна без грибов (`00c-world-meadow-alt.png`)
- @Image3: воин на тёмном фоне (`character-refs/warrior-front.png`)
- @Image4: обезьяна на тёмном фоне (`monkey-side.png`)
- @Image5: Глитч на тёмном фоне (`glitch-front.png`)
- @Image6: Майнфрейм целиком

```
One continuous shot with no cuts, no jumps and no scene changes; the camera never teleports. The video continues seamlessly from the start frame. Exactly replicate the camera movement from @Video1.
Stylized voxel low-poly game cinematic with pixel textures, bright sunny day. Use @Video1 only for the camera path, framing and where the fights stand; do not copy anything visual from it. The whole shot takes place in one single location: exactly the meadow from @Image1 and @Image2. It never changes; ignore any background in the other images. No mushrooms anywhere. Characters look exactly like @Image3, @Image4, @Image5. The Mainframe from @Image6 hangs still, high in the sky at the top of the frame for the whole shot. Strong atmospheric depth with soft bloom in the distance.
Mobs: wooden creatures with branch antlers and glowing cross-shaped eyes: round green mossy ones, slim blue spiky ones, bulky red hooded ones.
The camera flies backwards at waist height, lens facing the Mainframe, easing slower at each fight and faster between them. The fights are separate and far apart on alternating sides; heroes never appear together. Fights never stop; left behind, they keep going in the haze.
0-1s: the camera finishes gliding down to waist height over the daisies.
1-3.5s: it flies right through the warrior's fight on the right: the warrior (@Image3) standing, swinging his silver sword in wide sweeps again and again, green mossy mobs flying back. He never sits or crouches.
3.5-6s: the warrior's fight recedes as the camera curves left past a separate fight: the monkey (@Image4) punching blue spiky mobs non-stop.
6-8.5s: further on, on the right: Glitch (@Image5), side-on and slightly from behind, firing his blaster in rapid bursts at the mobs ahead.
8.5-9s: the camera keeps flying backwards across the meadow.
Sound: wind rush, sword clashes, punches, blaster zaps, battle sounds passing by. No voices.
No text, no UI, no dialogue.
```

## Продолжение 2 (7 с)

Загрузить:
- Start frame: последний кадр продолжения 1
- @Video1: `previs_cont2_16-23.mp4`
- @Image1: поляна (`00-world-meadow.png`)
- @Image2: та же поляна без грибов (`00c-world-meadow-alt.png`)
- @Image3: робот с кошкой (лучше на тёмном фоне, если сделаешь)
- @Image4 – @Image6: скелет спереди, сбоку и сзади (`skeleton-front/side/back.png`)
- @Image7: Майнфрейм целиком

```
One continuous shot with no cuts, no jumps and no scene changes; the camera never teleports. The video continues seamlessly from the start frame. Exactly replicate the camera movement from @Video1.
Stylized voxel low-poly game cinematic with pixel textures, bright sunny day. Use @Video1 only for the camera path, framing and where things stand; do not copy anything visual from it. One single location: exactly the meadow from @Image1 and @Image2; it never changes; ignore other backgrounds. No mushrooms anywhere. The Mainframe from @Image7 hangs still high in the sky. Fights keep going in the haze behind.
0-2s: the camera flies backwards between the cat robot (@Image3, back to camera, black cat on top) and its targets on the left; its hovering rocket launcher fires rocket after rocket into blue, green and purple mage mobs, explosions keep going.
2-3.3s: the camera rises once above head height; the skeleton (@Image4, @Image5, @Image6: blue eyes, pink cap, black sneakers, turquoise wheels) rides his skateboard toward it, notices it, spins around on the board as it flies past, leans in and reaches out; bony fingers enter from the frame edge and grab the lens; the flight stops with a sharp jerk.
3.3-5s: the camera is held in his hand, swaying slightly; his skull close, staring into the lens.
5s: he headbutts the lens, hard shake, cracks spread across the camera glass and stay.
5-7s: his skull seen through the cracked glass, fights still going far behind. End.
Sound: rocket whooshes and explosions, skateboard wheels, a hard crack on the headbutt. No voices.
No text, no UI, no dialogue.
```
