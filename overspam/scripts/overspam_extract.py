# Вытаскивает из билда OVERSPAM иконки 256x256, карточки томов, логотип и пиксельный шрифт.
# Запуск: python -I scripts/overspam_extract.py D:/Overspam/Overspam_Data public/overspam/game
import UnityPy, sys, os
src, dst = sys.argv[1], sys.argv[2]
os.makedirs(dst, exist_ok=True)
env = UnityPy.load(os.path.join(src, "resources.assets"))
n=0
for o in env.objects:
    if o.type.name != "Texture2D": continue
    d = o.read()
    w, h = d.m_Width, d.m_Height
    name = d.m_Name
    keep = (w, h) in ((256,256),(224,304),(224,232)) and not name.startswith(("T_","EM_","R_")) or name in ("logo","pixelfont")
    if not keep: continue
    try:
        d.image.save(os.path.join(dst, f"{w}x{h}_{name}.png")); n+=1
    except Exception as e: print("fail", name, e)
print(n)
