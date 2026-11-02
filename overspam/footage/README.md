# Записи геймплея для тизера

Пережатые копии (1080p60, H.264 CRF 21), чтобы влезали в GitHub (файл не больше 100 МБ).

| Файл | Что внутри |
|---|---|
| `flyby/forest_1..3.mp4` | 10–12 с каждый: пролёт камеры над Лесом (1-й мир), сквозь кроны к полю. Для начала трейлера. |
| `flyby/abyss_1..5.mp4` | 3–10 с: пролёт в Abyss Dome (5-й мир), колонны купола, песок. |
| `chests/chest_1.mp4` | 5 с, Dead Internet: открытие сундука, карточка CHEST с наградой. |
| `chests/chest_2.mp4` | 8 с, Луна: на самом деле **шрайн** (SHRINE BLESSING, выбор из 3), не сундук. |
| `chests/chest_3.mp4` | 5 с, Лес: открытие сундука, карточка CHEST, потом бой. |
| `events/event_1.mp4` | 11 с, Луна: шрайн, круг активации, SHRINE BLESSING (зелёные карты). |
| `events/event_2.mp4` | 10 с, Лес: GOLDEN SHRINE, золотой круг, выбор из 3 золотых карт. |
| `events/event_3.mp4` | 8,5 с, Abyss Dome: GOLDEN SHRINE с молниями, выбор карты. |
| `cards_reroll.mp4` | 54 с, Dead Internet: экран CHOOSE A CARD, много рероллов, карты разной редкости, выбор с золотым свечением. В конце меню паузы (не брать). Нет кадров боя после выбора. |

Добавить новую запись (из папки `overspam`):

```
ffmpeg -i "путь\к\записи.mp4" -c:v libx264 -preset slow -crf 21 -pix_fmt yuv420p -c:a aac -b:a 160k -movflags +faststart footage\имя.mp4
git add footage && git commit -m "Footage: имя" && git push
```
