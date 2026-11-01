# Записи геймплея для тизера

Пережатые копии (1080p60, H.264 CRF 21), чтобы влезали в GitHub (файл не больше 100 МБ).

| Файл | Что внутри |
|---|---|
| `cards_reroll.mp4` | 54 с, Dead Internet: экран CHOOSE A CARD, много рероллов, карты разной редкости, выбор с золотым свечением. В конце меню паузы (не брать). Нет кадров боя после выбора. |

Добавить новую запись (из папки `overspam`):

```
ffmpeg -i "путь\к\записи.mp4" -c:v libx264 -preset slow -crf 21 -pix_fmt yuv420p -c:a aac -b:a 160k -movflags +faststart footage\имя.mp4
git add footage && git commit -m "Footage: имя" && git push
```
