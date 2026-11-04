import React, {useEffect, useState} from "react";
import {flushSync} from "react-dom";
import {ThreeCanvas} from "@remotion/three";
import {useThree} from "@react-three/fiber";
import * as THREE from "three";
import {AbsoluteFill, cancelRender, Easing, interpolate, spring, staticFile, useCurrentFrame} from "remotion";
import {PixelText} from "./PixelText";
import {pileTransform, preloadVoxels, usePileSim, VoxelObject, type PileSimData} from "./voxel";

/* ───────────── Билд-куча под трек teaser60c_v2 (16,80–21,80 с) ─────────────
   Клип ставится на 16,80 с трека. Физика предрасчитана (scripts/build-pile-sim.ts → public/overspam/pile_sim.json).
   16,90 удар: падают пушки, слева считается WEAPONS до 33; потом CARDS до 23, потом ITEMS до 85.
   19,1 звон «а-А-а» (период 0,12 с): поток ускоряется, камера вздрагивает в такт.
   20,69 дроп: всё уходит в размытие, бьёт 1 BUILD / NOBODY PLANNED. */
const FPS = 60;
const clamp = {extrapolateLeft: "clamp", extrapolateRight: "clamp"} as const;
const T0 = 16.8;
const at = (s: number) => Math.round((s - T0) * FPS);
const HIT = at(16.9);
const HUM = at(19.1);
const DROP = at(20.69);
const PULSE = 0.12 * FPS;
export const buildPileFrames = DROP + 126; // 1 BUILD держится ~2 с (владелец: на секунду дольше)

const prand = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

/** Камера: медленный облёт по дуге + наезд; удары и пульс дают дрожь */
const Camera: React.FC<{frame: number}> = ({frame}) => {
  const camera = useThree((s) => s.camera);
  const t = interpolate(frame, [0, DROP], [0, 1], clamp);
  const ang = interpolate(t, [0, 1], [-0.28, 0.12]);
  const dist = interpolate(t, [0, 1], [17, 14], {easing: Easing.inOut(Easing.sin)});
  const hgt = interpolate(t, [0, 1], [8.5, 6.2]);
  // дрожь: удар в начале + пульс «а-А-а» после HUM, растёт к дропу
  const k = frame - HIT;
  const hit = k >= 0 && k < 16 ? (1 - k / 16) * 0.35 : 0;
  const rise = interpolate(frame, [HUM, DROP], [0, 1], clamp);
  const ph = frame >= HUM ? Math.max(0, Math.cos(((frame - HUM) / PULSE) * Math.PI * 2)) : 0;
  const amp = hit + rise * ph * 0.12;
  const sx = (prand(frame * 1.3) - 0.5) * 2 * amp;
  const sy = (prand(frame * 2.1 + 7) - 0.5) * 2 * amp;
  camera.position.set(Math.sin(ang) * dist + sx, hgt + sy, Math.cos(ang) * dist);
  camera.lookAt(-2.4 + sx * 0.5, 2.4 + sy * 0.5, 0);
  camera.updateProjectionMatrix();
  return null;
};

/* ───── Луна: низкополигональный шар (вершина в y=0, как пол в физике), кратеры, камни, звёзды ───── */
const MOON_R = 110;
const onMoon = (x: number, z: number, lift = 0) => {
  const n = new THREE.Vector3(x, 0, z).add(new THREE.Vector3(0, MOON_R, 0)).normalize();
  return {pos: n.clone().multiplyScalar(MOON_R + lift).add(new THREE.Vector3(0, -MOON_R, 0)), quat: new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), n)};
};
const moonGeo = (() => {
  const g = new THREE.IcosahedronGeometry(MOON_R, 90);
  const p = g.getAttribute("position");
  const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const k = 1 + (prand(Math.round(v.x * 3) * 7.1 + Math.round(v.y * 3) * 3.3 + Math.round(v.z * 3) * 1.7) - 0.5) * 0.004;
    v.multiplyScalar(k);
    p.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals();
  return g;
})();
const CRATERS = Array.from({length: 26}, (_, i) => {
  const a = prand(i * 3.7) * Math.PI * 2;
  const r = 8 + prand(i * 5.1) * 40;
  return {x: Math.cos(a) * r, z: Math.sin(a) * r, s: 1.2 + prand(i * 9.3) * 3.2};
});
const ROCKS = Array.from({length: 26}, (_, i) => {
  const a = prand(i * 4.3 + 1) * Math.PI * 2;
  const r = 7.5 + prand(i * 6.7 + 2) ** 1.5 * 30;
  return {x: Math.cos(a) * r, z: Math.sin(a) * r, s: 0.5 + prand(i * 2.9) ** 2 * 2.6, ry: prand(i) * 6, mossy: i % 5 === 0};
});
const starGeo = (() => {
  const pts: number[] = [];
  for (let i = 0; i < 2500; i++) {
    const u = prand(i * 1.31) * 2 - 1;
    const th = prand(i * 2.77) * Math.PI * 2;
    const r = Math.sqrt(1 - u * u);
    pts.push(Math.cos(th) * r * 160, Math.abs(u) * 160 - 20, Math.sin(th) * r * 160);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
  return g;
})();
const Moon: React.FC = () => (
  <>
    <mesh geometry={moonGeo} position={[0, -MOON_R, 0]} receiveShadow>
      <meshStandardMaterial color="#7a7d92" roughness={1} flatShading />
    </mesh>
    {CRATERS.map((c, i) => {
      const {pos, quat} = onMoon(c.x, c.z, 0.02);
      return (
        <group key={`c${i}`} position={pos} quaternion={quat}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <circleGeometry args={[c.s, 14]} />
            <meshStandardMaterial color="#62657a" roughness={1} flatShading />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
            <ringGeometry args={[c.s, c.s * 1.15, 14]} />
            <meshStandardMaterial color="#8b8ea3" roughness={1} flatShading />
          </mesh>
        </group>
      );
    })}
    {ROCKS.map((r, i) => {
      const {pos, quat} = onMoon(r.x, r.z, r.s * 0.25);
      return (
        <group key={`r${i}`} position={pos} quaternion={quat}>
          <mesh rotation={[0.3, r.ry, 0.2]} scale={[r.s * 1.2, r.s * 0.8, r.s]} castShadow receiveShadow>
            <dodecahedronGeometry args={[1, 0]} />
            <meshStandardMaterial color={r.mossy ? "#46523f" : "#6c6f84"} roughness={1} flatShading />
          </mesh>
        </group>
      );
    })}
    <points geometry={starGeo}>
      <pointsMaterial color="#ffffff" size={2.2} sizeAttenuation={false} fog={false} />
    </points>
  </>
);

const Scene: React.FC<{sim: PileSimData; frame: number}> = ({sim, frame}) => {
  const glow = interpolate(frame, [HIT, HIT + 4, HIT + 40], [0, 26, 12], clamp) + interpolate(frame, [HUM, DROP], [0, 14], clamp);
  return (
    <>
      <Camera frame={frame} />
      <ambientLight intensity={0.6} color="#c8ccff" />
      <directionalLight position={[-6, 12, 9]} color="#fff1e0" intensity={2.0} castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-15} shadow-camera-right={15} shadow-camera-top={15} shadow-camera-bottom={-15} shadow-bias={-0.0001} />
      <directionalLight position={[8, 5, 6]} color="#b7ccff" intensity={1.0} />
      <directionalLight position={[-8, 2, -3]} color="#c3d5ff" intensity={1.6} />
      {/* тёплый жар под кучей */}
      <pointLight position={[0, 1.2, 3]} color="#ff7a30" intensity={glow} distance={16} decay={1.6} />
      {sim.objects.map((obj, i) => {
        const tr = pileTransform(obj, frame);
        return tr ? (
          <group key={i} position={tr.position} quaternion={tr.quaternion}>
            <VoxelObject src={staticFile(obj.src)} preset={obj.preset} size={obj.size} />
          </group>
        ) : null;
      })}
      <Moon />
    </>
  );
};

const ROWS = [
  {preset: "weapon", word: "WEAPONS"},
  {preset: "card", word: "CARDS"},
  {preset: "item", word: "ITEMS"},
] as const;

/** Слева вверху: строка появляется с первым упавшим объектом своего типа, число = сколько уже упало */
const Counters: React.FC<{sim: PileSimData; frame: number; fade: number}> = ({sim, frame, fade}) => (
  <div style={{position: "absolute", left: 110, top: 100, display: "flex", flexDirection: "column", gap: 34, opacity: fade}}>
    {ROWS.map(({preset, word}) => {
      // тик счётчика: приземление, но не позже чем через 14 кадров после вброса — к дропу все числа полные
      const lands = sim.objects.filter((o) => o.preset === preset).map((o) => Math.min(o.land, (o.spawn ?? o.land) + 14));
      const n = lands.filter((l) => l <= frame).length;
      if (n === 0) return null;
      const first = Math.min(...lands);
      const lastTick = Math.max(...lands.filter((l) => l <= frame));
      const pop = interpolate(frame - lastTick, [0, 5], [1.08, 1], clamp);
      const inS = spring({frame: frame - first, fps: FPS, config: {damping: 16, stiffness: 300, mass: 0.6}, durationInFrames: 14});
      return (
        <div key={preset} style={{display: "flex", alignItems: "flex-end", gap: 30, opacity: inS, transform: `translateX(${(1 - inS) * -40}px)`}}>
          <div style={{width: 230, display: "flex", justifyContent: "flex-end", transform: `scale(${pop})`, transformOrigin: "100% 100%"}}>
            <PixelText text={String(n)} scale={12} style="logo" />
          </div>
          <PixelText text={word} scale={6} style="white" />
        </div>
      );
    })}
  </div>
);

export const BuildPile: React.FC = () => {
  const frame = useCurrentFrame();
  const sim = usePileSim();
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!sim) return;
    let active = true;
    preloadVoxels(sim.objects.map((o) => ({src: staticFile(o.src), preset: o.preset})))
      .then(() => {
        if (active) flushSync(() => setReady(true));
      })
      .catch((e) => cancelRender(e));
    return () => {
      active = false;
    };
  }, [sim]);
  // физика JSON заканчивается на кадре 299; после — держим последний
  const simFrame = Math.min(frame, 299);
  // дроп: размытие и затемнение сцены, счётчики гаснут
  const blur = interpolate(frame, [DROP - 6, DROP + 2], [0, 22], {...clamp, easing: Easing.in(Easing.quad)});
  const dim = interpolate(frame, [DROP - 6, DROP + 4], [1, 0.45], clamp);
  const post = frame - DROP;
  const big = post >= 0 ? spring({frame: post, fps: FPS, config: {damping: 13, stiffness: 300, mass: 0.6}, durationInFrames: 18}) : 0;
  const sub = post >= 8 ? spring({frame: post - 8, fps: FPS, config: {damping: 14, stiffness: 240, mass: 0.6}, durationInFrames: 16}) : 0;
  const postShake = post >= 0 && post < 14 ? Math.round(Math.sin(post * 3.1) * (1 - post / 14) * 3) * 5 : 0;
  return (
    <AbsoluteFill style={{background: "radial-gradient(60% 45% at 18% 20%, rgba(120,40,170,0.35), transparent 70%), radial-gradient(50% 40% at 85% 10%, rgba(40,60,160,0.3), transparent 70%), #04030a", overflow: "hidden"}}>
      <AbsoluteFill style={{filter: blur > 0.2 ? `blur(${blur}px) brightness(${dim})` : undefined, transform: `scale(${1 + blur * 0.004})`}}>
        {ready && sim && frame >= HIT && (
          <ThreeCanvas width={1920} height={1080} camera={{position: [0, 11, 22], fov: 42, near: 0.1, far: 400}} shadows gl={{antialias: false, alpha: true}} dpr={1}>
            <Scene sim={sim} frame={simFrame} />
          </ThreeCanvas>
        )}
      </AbsoluteFill>
      {sim && <Counters sim={sim} frame={frame} fade={interpolate(frame, [DROP - 6, DROP], [1, 0], clamp)} />}
      {post >= 0 && (
        <AbsoluteFill style={{alignItems: "center", justifyContent: "center", gap: 40, transform: `translate(${postShake}px, ${postShake * 0.6}px)`}}>
          <div style={{transform: `scale(${1.5 - 0.5 * big})`, opacity: Math.min(1, post / 2), display: "flex", gap: 60, alignItems: "flex-end"}}>
            <PixelText text="1" scale={28} style="logo" />
            <PixelText text="BUILD" scale={28} style="logo" />
          </div>
          <div style={{transform: `translateY(${(1 - sub) * 40}px)`, opacity: sub}}>
            <PixelText text="NOBODY PLANNED" scale={10} style="white" />
          </div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
