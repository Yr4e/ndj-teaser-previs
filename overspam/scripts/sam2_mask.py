"""Вырезка персонажа из клипа через SAM 2.1 (официальный, facebookresearch/sam2).

Запуск (venv ComfyUI, там torch с CUDA):
  E:/AI/ComfyUI/venv/Scripts/python.exe scripts/sam2_mask.py <папка_кадров_jpg> <выход_png> x,y [x,y ...] [--neg x,y ...]
Кадры: ffmpeg -i clip.mp4 -q:v 2 -start_number 0 <папка>/%05d.jpg
Точки — пиксели на кадре 0 (1920×1080). На выходе PNG-маски 00000.png… (белый = персонаж).
"""
import os
import sys

import numpy as np
import torch
from PIL import Image
from sam2.build_sam import build_sam2_video_predictor

CKPT = "D:/AI/models/sam2/sam2.1_hiera_large.pt"
CFG = "configs/sam2.1/sam2.1_hiera_l.yaml"


def parse(args):
    pos, neg, cur = [], [], None
    for a in args:
        if a == "--neg":
            cur = neg
            continue
        x, y = map(float, a.split(","))
        (cur if cur is not None else pos).append((x, y))
    return pos, neg


def main():
    frames, out = sys.argv[1], sys.argv[2]
    pos, neg = parse(sys.argv[3:])
    os.makedirs(out, exist_ok=True)
    predictor = build_sam2_video_predictor(CFG, CKPT, device="cuda")
    with torch.inference_mode(), torch.autocast("cuda", dtype=torch.bfloat16):
        state = predictor.init_state(video_path=frames)
        pts = np.array(pos + neg, dtype=np.float32)
        lbl = np.array([1] * len(pos) + [0] * len(neg), dtype=np.int32)
        predictor.add_new_points_or_box(state, frame_idx=0, obj_id=1, points=pts, labels=lbl)
        for idx, _, logits in predictor.propagate_in_video(state):
            m = (logits[0, 0] > 0).cpu().numpy().astype(np.uint8) * 255
            Image.fromarray(m).save(os.path.join(out, f"{idx:05d}.png"))
    print("masks:", len(os.listdir(out)))


if __name__ == "__main__":
    main()
