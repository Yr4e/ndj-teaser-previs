import React, {useEffect, useState} from "react";
import {flushSync} from "react-dom";
import {ThreeCanvas} from "@remotion/three";
import {useThree} from "@react-three/fiber";
import {AbsoluteFill, cancelRender, continueRender, delayRender, staticFile, useCurrentFrame, useVideoConfig} from "remotion";
import * as THREE from "three";
import {CARD, GAME, ITEMS, TOMES, WEAPONS} from "./data";

export type VoxelPreset = "weapon" | "item" | "card";
const presetDepth: Record<VoxelPreset, number> = {weapon:12,item:3,card:12};

export type VoxelObjectProps = {
  /** Resolved URL, e.g. staticFile("overspam/game/256x256_six_shot.png"). */
  src: string;
  kind?: "voxel" | "card";
  preset?: VoxelPreset;
  /** Overrides preset: weapon 12, item 3, card 12 source pixels. */
  depth?: number;
  /** Longest visible dimension in world units. */
  size?: number;
  /** Source-image pixels per art pixel; omitted = detected from repeated runs. */
  pixelSize?: number;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
};
type Pixels = {image: HTMLImageElement; data: Uint8ClampedArray; width: number; height: number};
type Model = {geometry: THREE.BufferGeometry; material: THREE.Material | THREE.Material[]; pixelSize: number};
const images = new Map<string, Promise<Pixels>>();
const models = new Map<string, Promise<Model>>();
const readyModels = new Map<string, Model>();
const modelKey = (src:string,kind:"voxel"|"card",depth:number,pixelSize?:number) =>
  JSON.stringify([src,kind,depth,3,pixelSize]);

function readPixels(src: string): Promise<Pixels> {
  const existing = images.get(src);
  if (existing) return existing;
  const promise = new Promise<Pixels>((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        const ctx = canvas.getContext("2d", {willReadFrequently: true});
        if (!ctx) throw new Error("Cannot read PNG pixels");
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(image, 0, 0);
        resolve({image, width: canvas.width, height: canvas.height,
          data: ctx.getImageData(0, 0, canvas.width, canvas.height).data});
      } catch (error) {reject(error);}
    };
    image.onerror = () => reject(new Error(`Cannot load voxel PNG: ${src}`));
    image.src = src;
  });
  images.set(src, promise);
  promise.catch(() => images.delete(src));
  return promise;
}

/** Modal opaque-color run across both axes. No repeated grid => preserve source pixels.
 * Handles cropped/offset art and isolated shorter runs at an outline. */
export function detectArtPixelSize({data, width, height}: Pick<Pixels, "data" | "width" | "height">): number {
  const runs = new Map<number, number>();
  const same = (a: number, b: number) => data[a] === data[b] && data[a+1] === data[b+1] && data[a+2] === data[b+2] && data[a+3] === data[b+3];
  for (const vertical of [false, true]) {
    const lines = vertical ? width : height;
    const length = vertical ? height : width;
    for (let line = 0; line < lines; line++) {
      const offset = (n: number) => 4 * (vertical ? n * width + line : line * width + n);
      let start = 0;
      for (let n = 1; n <= length; n++) {
        if (n === length || !same(offset(start), offset(n))) {
          if (data[offset(start)+3] > 128) runs.set(n-start, (runs.get(n-start) ?? 0)+1);
          start = n;
        }
      }
    }
  }
  return [...runs].sort((a,b) => b[1]-a[1] || a[0]-b[0])[0]?.[0] ?? 1;
}

function buildVoxel(p: Pixels, depth: number, size: number, requestedStep?: number): Model {
  const step = requestedStep ?? detectArtPixelSize(p);
  if (!Number.isInteger(step) || step < 1) throw new Error("pixelSize must be a positive integer");
  let minX=p.width, minY=p.height, maxX=-1, maxY=-1;
  for (let y=0; y<p.height; y++) for (let x=0; x<p.width; x++) {
    if (p.data[(y*p.width+x)*4+3] > 128) {
      minX=Math.min(minX,x); minY=Math.min(minY,y); maxX=Math.max(maxX,x); maxY=Math.max(maxY,y);
    }
  }
  if (maxX<0) throw new Error("Voxel PNG has no pixels with alpha > 128");
  const cols=Math.ceil((maxX-minX+1)/step), rows=Math.ceil((maxY-minY+1)/step);
  const unit=size/Math.max(cols,rows), half=depth*unit/2;
  const cells: (THREE.Color | null)[] = [];
  for (let y=0; y<rows; y++) for (let x=0; x<cols; x++) {
    const sx=Math.min(maxX,minX+x*step+Math.floor(step/2));
    const sy=Math.min(maxY,minY+y*step+Math.floor(step/2));
    const i=(sy*p.width+sx)*4;
    cells.push(p.data[i+3]>128 ? new THREE.Color().setRGB(p.data[i]/255,p.data[i+1]/255,p.data[i+2]/255,THREE.SRGBColorSpace) : null);
  }
  const positions:number[]=[], normals:number[]=[], colors:number[]=[];
  const face=(corners:number[][], normal:number[], c:THREE.Color) => {
    for (const i of [0,1,2,0,2,3]) {positions.push(...corners[i]); normals.push(...normal); colors.push(c.r,c.g,c.b);}
  };
  const occupied=(x:number,y:number) => x>=0 && x<cols && y>=0 && y<rows && cells[y*cols+x] !== null;
  // Judge the PNG's displayed brightness in sRGB, before lighting/linear conversion.
  const brightness=cells.map(c=>{
    if (!c) return 0;
    const s=c.clone().convertLinearToSRGB();
    return 0.2126*s.r+0.7152*s.g+0.0722*s.b;
  });
  const sideColor=(x:number,y:number,inX:number,inY:number):THREE.Color=>{
    let c=cells[y*cols+x]!;
    if (brightness[y*cols+x]<0.2) {
      // Walk opposite this face's outward normal, in native art pixels.
      // Stop at transparency so a separate silhouette cannot donate its color.
      let found=false;
      for (let distance=1;distance<=2;distance++) {
        const nx=x+inX*distance,ny=y+inY*distance;
        if (!occupied(nx,ny)) break;
        if (brightness[ny*cols+nx]>=0.2) {
          c=cells[ny*cols+nx]!; found=true; break;
        }
      }
      if (!found) return c;
    }
    return c.clone().convertLinearToSRGB().multiplyScalar(0.8).convertSRGBToLinear();
  };
  for (let y=0;y<rows;y++) for (let x=0;x<cols;x++) {
    const c=cells[y*cols+x]; if (!c) continue;
    const l=(x-cols/2)*unit,r=l+unit,t=(rows/2-y)*unit,b=t-unit;
    face([[l,b,half],[r,b,half],[r,t,half],[l,t,half]],[0,0,1],c);
    // Same spatial colors on the back read as a mirror when seen from behind.
    face([[r,b,-half],[l,b,-half],[l,t,-half],[r,t,-half]],[0,0,-1],c);
    if(!occupied(x-1,y)) face([[l,b,-half],[l,b,half],[l,t,half],[l,t,-half]],[-1,0,0],sideColor(x,y,1,0));
    if(!occupied(x+1,y)) face([[r,b,half],[r,b,-half],[r,t,-half],[r,t,half]],[1,0,0],sideColor(x,y,-1,0));
    if(!occupied(x,y-1)) face([[l,t,half],[r,t,half],[r,t,-half],[l,t,-half]],[0,1,0],sideColor(x,y,0,1));
    if(!occupied(x,y+1)) face([[l,b,-half],[r,b,-half],[r,b,half],[l,b,half]],[0,-1,0],sideColor(x,y,0,-1));
  }
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute("position",new THREE.Float32BufferAttribute(positions,3));
  geometry.setAttribute("normal",new THREE.Float32BufferAttribute(normals,3));
  geometry.setAttribute("color",new THREE.Float32BufferAttribute(colors,3));
  geometry.computeBoundingSphere();
  geometry.userData={pixelSize:step, voxels:cells.filter(Boolean).length};
  return {geometry, pixelSize:step, material:new THREE.MeshStandardMaterial({vertexColors:true,roughness:1,metalness:0})};
}

let cardBackTexture: Promise<THREE.CanvasTexture> | undefined;
function createCardBackTexture(): Promise<THREE.CanvasTexture> {
  if (cardBackTexture) return cardBackTexture;
  cardBackTexture=Promise.all([
    readPixels(staticFile("overspam/game/224x304_damage_card.png")),
    readPixels(staticFile("overspam/game/60x14_logo.png")),
  ]).then(([card,logo])=>{
    const canvas=document.createElement("canvas");
    canvas.width=card.width; canvas.height=card.height;
    const ctx=canvas.getContext("2d");
    if (!ctx) throw new Error("Cannot draw card back");
    ctx.imageSmoothingEnabled=false;
    const backgroundOffset=(24*card.width+24)*4;
    ctx.fillStyle=`rgb(${card.data[backgroundOffset]},${card.data[backgroundOffset+1]},${card.data[backgroundOffset+2]})`;
    ctx.fillRect(0,0,card.width,card.height);
    // Copy the original perimeter, including its stepped corners and highlights.
    ctx.drawImage(card.image,0,0);
    const border=12;
    // This clean patch beside the face icon preserves the original brown texture.
    ctx.save();
    ctx.beginPath();
    ctx.rect(border,border,card.width-2*border,card.height-2*border);
    ctx.clip();
    for (let y=border;y<card.height-border;y+=16) {
      for (let x=border;x<card.width-border;x+=16) {
        ctx.drawImage(card.image,24,24,16,16,x,y,16,16);
      }
    }
    ctx.restore();
    const logoWidth=logo.width*3,logoHeight=logo.height*3;
    ctx.drawImage(logo.image,(card.width-logoWidth)/2,(card.height-logoHeight)/2,logoWidth,logoHeight);
    const texture=new THREE.CanvasTexture(canvas);
    texture.colorSpace=THREE.SRGBColorSpace;
    texture.magFilter=THREE.NearestFilter; texture.minFilter=THREE.NearestFilter;
    texture.generateMipmaps=false;
    return texture;
  });
  cardBackTexture.catch(()=>{cardBackTexture=undefined;});
  return cardBackTexture;
}

export const CARD_LABELS:Record<string,string> = {
  projectile_count:"MULTIPLICITY",projectile_size:"MAGNITUDE",xp_gain:"WISDOM",
  pickup_range:"ATTRACTION",luck:"FORTUNE",evasion:"EVASION",gold_gain:"GOLD",
  knockback:"FORCE",crit_chance:"PRECISION",projectile_speed:"VELOCITY",shield:"AEGIS",
  silver_gain:"SILVER",armor:"BULWARK",lifesteal:"BLOODTHIRST",chaos:"CHAOS",
  difficulty:"CURSE",duration:"PERSISTENCE",thorns:"THORNS",max_hp:"VITALITY",
  attack_speed:"FRENZY",damage:"MIGHT",hp_regen:"RENEWAL",move_speed:"HASTE",
};

/** Atlas order and white/outline/depth palette match PixelText.tsx. */
async function createCardFaceTexture(p:Pixels,src:string):Promise<THREE.Texture> {
  const name=decodeURIComponent(src.split("/").pop()??"").replace(/^224x304_/,"").replace(/_card\.png(?:\?.*)?$/,"");
  const label=CARD_LABELS[name];
  if(!label) throw new Error(`Missing card label: ${name}`);
  const atlas=await readPixels(staticFile("overspam/game/160x45_pixelfont.png"));
  const rows=["ABCDEFGHIJKLMNOP","QRSTUVWXYZ012345","6789БГДЖИЙЁЛПУФЦ","ЧШЩЪЫЬЭЮЯ.,:!?+-","×/%'\"()[]·=→←#&@"];
  const glyphs=[...label].map(ch=>{
    const row=rows.findIndex(r=>r.includes(ch));
    if(row<0) throw new Error(`Missing font glyph: ${ch}`);
    const sx=rows[row].indexOf(ch)*10,sy=row*9;
    let left=10,right=-1;
    for(let x=0;x<10;x++) for(let y=0;y<9;y++) {
      if(atlas.data[((sy+y)*atlas.width+sx+x)*4+3]>128){left=Math.min(left,x);right=Math.max(right,x);}
    }
    return {sx:sx+left,sy:sy+1,w:right-left+1};
  });
  const textWidth=glyphs.reduce((n,g)=>n+g.w+1,0)-1;
  const mask=document.createElement("canvas");mask.width=textWidth+2;mask.height=10;
  const mc=mask.getContext("2d")!;mc.imageSmoothingEnabled=false;
  let x=1;
  for(const g of glyphs){mc.drawImage(atlas.image,g.sx,g.sy,g.w,7,x,1,g.w,7);x+=g.w+1;}
  const tint=(color:string)=>{
    const c=document.createElement("canvas");c.width=mask.width;c.height=mask.height;
    const ctx=c.getContext("2d")!;ctx.drawImage(mask,0,0);ctx.globalCompositeOperation="source-in";
    ctx.fillStyle=color;ctx.fillRect(0,0,c.width,c.height);return c;
  };
  const text=document.createElement("canvas");text.width=mask.width;text.height=mask.height;
  const tc=text.getContext("2d")!;tc.imageSmoothingEnabled=false;
  const outline=tint("#090911");
  for(let d=0;d<=1;d++) for(let dx=-1;dx<=1;dx++) for(let dy=-1;dy<=1;dy++) tc.drawImage(outline,dx,dy+d);
  tc.drawImage(tint("#3a3550"),0,1);
  const fill=document.createElement("canvas");fill.width=text.width;fill.height=text.height;
  const fc=fill.getContext("2d")!;
  ["#ffffff","#ffffff","#fffae8","#fffae8","#f6efe1","#f6efe1","#ffecc4"].forEach((c,y)=>{fc.fillStyle=c;fc.fillRect(0,y+1,fill.width,1);});
  fc.globalCompositeOperation="destination-in";fc.drawImage(mask,0,0);tc.drawImage(fill,0,0);
  const canvas=document.createElement("canvas");canvas.width=p.width;canvas.height=p.height;
  const ctx=canvas.getContext("2d")!;ctx.imageSmoothingEnabled=false;ctx.drawImage(p.image,0,0);
  // Widen the old plaque into the gap, leaving both red diamonds intact.
  let available=136;
  if(text.width>available){available=192;ctx.fillStyle="#20192c";ctx.fillRect(16,240,192,40);}
  const scale=Math.max(1,Math.min(2,Math.floor((available-4)/text.width)));
  ctx.fillStyle="#0d0a13";ctx.fillRect((p.width-available)/2,244,available,32);
  ctx.drawImage(text,Math.floor((p.width-text.width*scale)/2),Math.floor(260-text.height*scale/2),text.width*scale,text.height*scale);
  const texture=new THREE.CanvasTexture(canvas);
  texture.colorSpace=THREE.SRGBColorSpace;texture.magFilter=THREE.NearestFilter;texture.minFilter=THREE.NearestFilter;
  texture.generateMipmaps=false;
  texture.userData={label,labelScale:scale,labelWidth:text.width*scale};
  return texture;
}

function loadModel(src:string,kind:"voxel"|"card",depth:number,size:number,pixelSize?:number):Promise<Model> {
  if (!(depth>0) || !Number.isFinite(depth) || !(size>0) || !Number.isFinite(size)) throw new Error("depth and size must be finite and positive");
  const key=JSON.stringify([src,kind,depth,size,pixelSize]);
  const cached=models.get(key); if(cached) return cached;
  const promise=readPixels(src).then(async p => {
    if(kind==="voxel") return buildVoxel(p,depth,size,pixelSize);
    const texture=await createCardFaceTexture(p,src);
    const unit=size/Math.max(p.width,p.height);
    const edge=new THREE.MeshStandardMaterial({color:"#a17b50",roughness:1});
    const back=new THREE.MeshStandardMaterial({map:await createCardBackTexture(),roughness:1,transparent:false,opacity:1});
    const front=new THREE.MeshStandardMaterial({map:texture,roughness:1});
    return {geometry:new THREE.BoxGeometry(p.width*unit,p.height*unit,depth*unit),
      material:[edge,edge,edge,edge,front,back],pixelSize:1};
  });
  models.set(key,promise);
  promise.then(model=>readyModels.set(key,model),()=>models.delete(key));
  return promise;
}

/** One render hold for the entire batch. Rejects on missing/broken assets.
 * Geometry is built at size=3 and shared even when instances use other sizes. */
export async function preloadVoxels(list: {src:string; preset:VoxelPreset}[]):Promise<void> {
  const handle=delayRender(`Preloading ${list.length} voxel models`);
  try {
    await Promise.all(list.map(({src,preset})=>loadModel(src,preset==="card"?"card":"voxel",presetDepth[preset],3)));
  } finally {
    continueRender(handle);
  }
}

/** Place inside ThreeCanvas. Assets/geometries/materials are shared for the browser session.
 * dispose=null prevents R3F from disposing shared resources when an instance unmounts. */
export const VoxelObject:React.FC<VoxelObjectProps> = ({src,preset,kind=preset==="card"?"card":"voxel",depth=presetDepth[preset??(kind==="card"?"card":"item")],size=3,pixelSize,scale=1,...transform}) => {
  if (!(size>0) || !Number.isFinite(size) || !(depth>0) || !Number.isFinite(depth)) throw new Error("depth and size must be finite and positive");
  const model=readyModels.get(modelKey(src,kind,depth,pixelSize));
  // A preloaded instance mounts synchronously: no per-object render hold or redraw.
  if(model) return <mesh {...transform} scale={scale*size/3} geometry={model.geometry} material={model.material} castShadow receiveShadow dispose={null}/>;
  return <AsyncVoxel src={src} kind={kind} depth={depth} size={size} pixelSize={pixelSize} scale={scale} {...transform}/>;
};

const AsyncVoxel:React.FC<VoxelObjectProps> = ({src,kind="voxel",depth=3,size=3,pixelSize,scale=1,...transform}) => {
  const [loaded,setLoaded]=useState<{key:string; model:Model}|null>(null);
  const key=modelKey(src,kind,depth,pixelSize);
  useEffect(()=>{

    let active=true;
    Promise.resolve().then(()=>loadModel(src,kind,depth,3,pixelSize)).then(model=>{
      if(active) setLoaded({key,model});
    }).catch(error=>{if(active) cancelRender(error);});
    return ()=>{active=false;};
  },[key,src,kind,depth,pixelSize]);
  // Hold capture until React commits the mesh; advance the otherwise frozen R3F canvas.
  return <ModelGate ready={loaded?.key===key}>{loaded?.key===key ?
    <mesh {...transform} scale={scale*size/3} geometry={loaded.model.geometry} material={loaded.model.material} castShadow receiveShadow dispose={null}/> : null}</ModelGate>;
};

const ModelGate:React.FC<React.PropsWithChildren<{ready:boolean}>>=({ready,children})=>{
  const advance=useThree(state=>state.advance);
  useEffect(()=>{
    if(ready) {advance(performance.now()); return;}
    const handle=delayRender("Waiting for voxel mesh commit");
    return ()=>continueRender(handle);
  },[ready,advance]);
  return <>{children}</>;
};

// All 30 weapons, 23 cards and 85 items exist locally. The stress count includes
// explicit repeats of the first 3 weapons and first 9 items, not invented assets.
export const VOXEL_STRESS_ASSETS: {src:string; preset:VoxelPreset}[] = [
  ...Array.from({length:33},(_,i)=>({src:staticFile(GAME(WEAPONS[i%WEAPONS.length])),preset:"weapon" as const})),
  ...TOMES.map(t=>({src:staticFile(CARD(`${t}_card`)),preset:"card" as const})),
  ...Array.from({length:94},(_,i)=>({src:staticFile(GAME(ITEMS[i%ITEMS.length])),preset:"item" as const})),
];

// Integer hash: stable on seek, reload, and across concurrent render workers.
const stressRandom=(i:number,salt:number)=>{
  let n=Math.imul(i+1,374761393)^Math.imul(salt+1,668265263);
  n=Math.imul(n^(n>>>13),1274126177);
  return ((n^(n>>>16))>>>0)/4294967296;
};

export const VoxelStress:React.FC=()=>{
  const frame=useCurrentFrame();
  const {width,height}=useVideoConfig();
  const [ready,setReady]=useState(false);
  useEffect(()=>{
    let active=true;
    preloadVoxels(VOXEL_STRESS_ASSETS).then(()=>{
      if(!active) return;
      const triangles=VOXEL_STRESS_ASSETS.reduce((sum,{src,preset})=>{
        const geometry=readyModels.get(modelKey(src,preset==="card"?"card":"voxel",presetDepth[preset]))!.geometry;
        return sum+(geometry.index?.count??geometry.getAttribute("position").count)/3;
      },0);
      console.info(`OS-VoxelStress: 150 objects (33 weapons, 23 cards, 94 items); ${triangles} geometry triangles (including repeated instances, excluding shadow passes)`);
      // Mount ThreeCanvas and its built-in commit hold before the browser can capture.
      flushSync(()=>setReady(true));
    }).catch(error=>cancelRender(error));
    return ()=>{active=false;};
  },[]);
  return <AbsoluteFill style={{backgroundColor:"#06050b"}}>
    {ready && <ThreeCanvas width={width} height={height} camera={{position:[0,24,34.3],fov:45,near:0.1,far:120}} shadows gl={{antialias:false,alpha:false}} dpr={1}>
      <color attach="background" args={["#06050b"]}/>
      <ambientLight intensity={1.1}/>
      <directionalLight position={[-25,-15,35]} color="#ffad64" intensity={2.7} castShadow shadow-mapSize={[2048,2048]} shadow-camera-left={-28} shadow-camera-right={28} shadow-camera-top={24} shadow-camera-bottom={-24} shadow-camera-far={100} shadow-bias={-0.0001}/>
      <directionalLight position={[5,4,5]} color="#b7ccff" intensity={1.1}/>
      <directionalLight position={[-8,2,-3]} color="#c3d5ff" intensity={2.2}/>
      <directionalLight position={[7,1,-5]} color="#ffcf9b" intensity={1.4}/>
      {VOXEL_STRESS_ASSETS.map((asset,i)=>{
        const slot=(i*67)%150;
        return <VoxelObject key={i} {...asset} size={1.8+stressRandom(i,1)*0.45}
          position={[(slot%15-7)*2.65+(stressRandom(i,2)-0.5)*0.8,stressRandom(i,3)*1.7,(Math.floor(slot/15)-4.5)*2.5+(stressRandom(i,4)-0.5)*0.8]}
          rotation={[-0.55+(stressRandom(i,5)-0.5)*0.5,stressRandom(i,6)*Math.PI*2+frame*0.004,(stressRandom(i,7)-0.5)*0.7]}/>;
      })}
    </ThreeCanvas>}
  </AbsoluteFill>;
};

export const VoxelTest:React.FC=()=>{
  const frame=useCurrentFrame();
  const {width,height,durationInFrames}=useVideoConfig();
  const turn=(frame/durationInFrames)*Math.PI*2;
  return <AbsoluteFill
    style={{
      backgroundColor: "#06050b",
      color: "#ffffff"
    }}
  >
    <ThreeCanvas width={width} height={height} orthographic camera={{position:[0,0,16],zoom:145,near:0.1,far:60}} shadows gl={{antialias:false,alpha:false}} dpr={1}>
      <color attach="background" args={["#06050b"]}/>
      <ambientLight intensity={1.1}/>
      <directionalLight position={[-5,-3,7]} color="#ffad64" intensity={2.7} castShadow shadow-mapSize={[2048,2048]} shadow-camera-left={-9} shadow-camera-right={9} shadow-camera-top={6} shadow-camera-bottom={-6} shadow-bias={-0.0001}/>
      <directionalLight position={[5,4,5]} color="#b7ccff" intensity={1.1}/>
      <directionalLight position={[-8,2,-3]} color="#c3d5ff" intensity={2.2}/>
      <directionalLight position={[7,1,-5]} color="#ffcf9b" intensity={1.4}/>
      <VoxelObject src={staticFile("overspam/game/256x256_six_shot.png")} preset="weapon" position={[-4.25,0,0]} rotation={[-0.12,turn,0]} size={3.35}/>
      <VoxelObject src={staticFile("overspam/game/256x256_energy_drink.png")} preset="item" position={[0,0,0]} rotation={[-0.12,turn,0]} size={3.35}/>
      <VoxelObject src={staticFile("overspam/game/224x304_damage_card.png")} preset="card" position={[4.25,0,0]} rotation={[-0.12,turn,0]} size={3.7}/>
    </ThreeCanvas>
  </AbsoluteFill>;
};

/** Interactive inspection only; independent of the animation timeline. */
export const VoxelInspector:React.FC=()=>{
  const {width,height}=useVideoConfig();
  const [preset,setPreset]=useState<VoxelPreset>("weapon");
  const [selected,setSelected]=useState("six_shot");
  const [angle,setAngle]=useState(0);
  const [tilt,setTilt]=useState(0);
  const [query,setQuery]=useState("");
  const names=preset==="weapon"?WEAPONS:preset==="card"?TOMES:ITEMS;
  const visible=names.filter(name=>name.includes(query.toLowerCase().replaceAll(" ","_")));
  const src=staticFile(preset==="card"?CARD(`${selected}_card`):GAME(selected));
  const turn=(delta:number)=>setAngle(a=>(a+delta+360)%360);
  const changeType=(type:VoxelPreset)=>{
    setPreset(type);setSelected(type==="weapon"?"six_shot":type==="item"?"energy_drink":"damage");setQuery("");
  };
  const next=(delta:number)=>setSelected(names[(names.indexOf(selected)+delta+names.length)%names.length]);
  const button:React.CSSProperties={background:"#252534",border:"1px solid #454558",borderRadius:12,color:"#f4ead6",padding:"18px 12px",fontSize:30,cursor:"pointer"};
  return <AbsoluteFill style={{background:"#06050b",color:"#f4ead6",fontFamily:"sans-serif"}}>
    <ThreeCanvas width={width-560} height={height} orthographic camera={{position:[0,0,16],zoom:185,near:0.1,far:60}} shadows gl={{antialias:false,alpha:false}} dpr={1}>
      <color attach="background" args={["#06050b"]}/>
      <ambientLight intensity={1.1}/>
      <directionalLight position={[-5,-3,7]} color="#ffad64" intensity={2.7}/>
      <directionalLight position={[5,4,5]} color="#b7ccff" intensity={1.1}/>
      <directionalLight position={[-8,2,-3]} color="#c3d5ff" intensity={2.2}/>
      <directionalLight position={[7,1,-5]} color="#ffcf9b" intensity={1.4}/>
      <VoxelObject key={`${preset}:${selected}`} src={src} preset={preset} size={3.7} rotation={[tilt*Math.PI/180,angle*Math.PI/180,0]}/>
      <InspectorRedraw value={`${preset}:${selected}:${angle}:${tilt}`}/>
    </ThreeCanvas>
    <div style={{position:"absolute",left:40,bottom:36,fontSize:30,color:"#aca8b7"}}>{selected.replaceAll("_"," ").toUpperCase()} · {angle}°</div>
    <aside style={{position:"absolute",right:0,top:0,bottom:0,width:560,boxSizing:"border-box",padding:28,background:"#12121c",display:"flex",flexDirection:"column",gap:18,borderLeft:"2px solid #292938"}}>
      <div style={{fontSize:34,fontWeight:700,color:"#ffc547"}}>ПРОСМОТР МОДЕЛЕЙ</div>
      <div style={{display:"flex",gap:8}}>{([['weapon','Пушки'],['item','Предметы'],['card','Карты']] as const).map(([type,label])=><button key={type} onClick={()=>changeType(type)} style={{...button,flex:1,fontSize:26,background:preset===type?"#715020":button.background}}>{label}</button>)}</div>
      <input aria-label="Поиск модели" placeholder="Найти модель…" value={query} onChange={e=>setQuery(e.target.value)} style={{...button,textAlign:"left",cursor:"text"}}/>
      <select aria-label="Модель" value={selected} onChange={e=>setSelected(e.target.value)} style={{...button,width:"100%"}}>
        {!visible.includes(selected)&&<option value={selected}>{selected}</option>}
        {visible.map(name=><option key={name} value={name}>{name.replaceAll("_"," ")}</option>)}
      </select>
      <div style={{display:"flex",gap:12}}><button style={{...button,flex:1}} onClick={()=>next(-1)}>← Пред.</button><button style={{...button,flex:1}} onClick={()=>next(1)}>След. →</button></div>
      <button onClick={()=>turn(180)} style={{...button,background:"#ffc547",color:"#201507",fontWeight:800,fontSize:38,padding:24}}>Развернуть на 180°</button>
      <div style={{display:"flex",gap:12}}><button style={{...button,flex:1}} onClick={()=>turn(-90)}>−90°</button><button style={{...button,flex:1}} onClick={()=>turn(90)}>+90°</button></div>
      <div style={{display:"flex",gap:12}}><button style={{...button,flex:1}} onClick={()=>setAngle(0)}>Лицо</button><button style={{...button,flex:1}} onClick={()=>setAngle(180)}>Оборот</button></div>
      <label style={{fontSize:28}}>Поворот: {angle}°<input aria-label="Поворот" type="range" min={0} max={359} value={angle} onChange={e=>setAngle(Number(e.target.value))} style={{width:"100%",height:42,accentColor:"#ffc547"}}/></label>
      <label style={{fontSize:28}}>Наклон: {tilt}°<input aria-label="Наклон" type="range" min={-75} max={75} value={tilt} onChange={e=>setTilt(Number(e.target.value))} style={{width:"100%",height:42,accentColor:"#ffc547"}}/></label>
      <div style={{fontSize:24,color:"#a8a3b3",marginTop:"auto"}}>{names.length} моделей · ракурс сохраняется при переключении</div>
    </aside>
  </AbsoluteFill>;
};
const InspectorRedraw:React.FC<{value:string}>=({value})=>{
  const advance=useThree(state=>state.advance);
  useEffect(()=>{advance(performance.now());},[value,advance]);
  return null;
};


export const VoxelCardLabels:React.FC=()=>{
  const {width,height}=useVideoConfig();
  return <AbsoluteFill style={{background:"#06050b"}}>
    <ThreeCanvas width={width} height={height} orthographic camera={{position:[0,0,16],zoom:160,near:0.1,far:60}} gl={{antialias:false,alpha:false}} dpr={1}>
      <color attach="background" args={["#06050b"]}/>
      <ambientLight intensity={1.1}/>
      <directionalLight position={[-5,-3,7]} color="#ffad64" intensity={2.7}/>
      <directionalLight position={[5,4,5]} color="#b7ccff" intensity={1.1}/>
      {['projectile_count','damage','duration'].map((name,i)=><VoxelObject key={name} src={staticFile(CARD(`${name}_card`))} preset="card" position={[(i-1)*3.8,0,0]} size={4.3}/>)}
    </ThreeCanvas>
  </AbsoluteFill>;
};

export type PileTransformTuple=[number,number,number,number,number,number,number];
export type PileSimObject={src:string;preset:VoxelPreset;size:number;spawn?:number;land:number;tr:(PileTransformTuple|null)[]};
export type PileSimData={fps:number;frames:number;objects:PileSimObject[];seed?:number;restFrame?:number};
let pileSimPromise:Promise<PileSimData>|undefined;
/** Offline transforms only: this hook never runs physics. */
export function usePileSim():PileSimData|null {
  const [data,setData]=useState<PileSimData|null>(null);
  useEffect(()=>{
    let active=true;
    const handle=delayRender("Loading precomputed pile transforms");
    if(!pileSimPromise){
      pileSimPromise=fetch(staticFile("overspam/pile_sim.json")).then(async response=>{
        if(!response.ok)throw new Error(`pile_sim.json: HTTP ${response.status}`);
        const result=await response.json() as PileSimData;
        if(result.fps!==60||result.frames!==300||!Array.isArray(result.objects)||result.objects.length!==141)throw new Error("Invalid pile simulation metadata");
        for(const obj of result.objects){
          if(obj.tr.length!==result.frames||obj.land<0||obj.land>=result.frames)throw new Error(`Invalid pile timeline: ${obj.src}`);
          for(const tr of obj.tr)if(tr!==null&&(tr.length!==7||!tr.every(Number.isFinite)))throw new Error(`Invalid pile transform: ${obj.src}`);
        }
        return result;
      });
      pileSimPromise.catch(()=>{pileSimPromise=undefined;});
    }
    pileSimPromise.then(result=>{if(active)flushSync(()=>setData(result));}).catch(error=>{if(active)cancelRender(error);}).finally(()=>continueRender(handle));
    return ()=>{active=false;continueRender(handle);};
  },[]);
  return data;
}
/** Null before spawn. Frame lookups work in any order; rounded quaternions are normalized. */
export function pileTransform(obj:PileSimObject,frame:number):{position:[number,number,number];quaternion:[number,number,number,number]}|null {
  if(!Number.isFinite(frame)||frame<0||(obj.spawn!==undefined&&frame<obj.spawn))return null;
  const tr=obj.tr[Math.min(Math.floor(frame),obj.tr.length-1)];
  if(!tr)return null;
  const length=Math.hypot(tr[3],tr[4],tr[5],tr[6]);
  if(length===0)throw new Error(`Zero quaternion for ${obj.src}`);
  return {position:[tr[0],tr[1],tr[2]],quaternion:[tr[3]/length,tr[4]/length,tr[5]/length,tr[6]/length]};
}
const PileTestCamera:React.FC=()=>{
  const camera=useThree(state=>state.camera);
  useEffect(()=>{camera.lookAt(0,2.5,0);camera.updateProjectionMatrix();},[camera]);
  return null;
};
export const PileSimTest:React.FC=()=>{
  const sim=usePileSim();
  const frame=useCurrentFrame();
  const {width,height}=useVideoConfig();
  const [ready,setReady]=useState(false);
  useEffect(()=>{
    if(!sim)return;
    let active=true;
    preloadVoxels(sim.objects.map(obj=>({src:staticFile(obj.src),preset:obj.preset}))).then(()=>{if(active)flushSync(()=>setReady(true));}).catch(error=>cancelRender(error));
    return ()=>{active=false;};
  },[sim]);
  return <AbsoluteFill style={{backgroundColor:"#06050b"}}>
    {ready&&sim&&<ThreeCanvas width={width} height={height} camera={{position:[0,13.5,19],fov:45,near:0.1,far:100}} shadows gl={{antialias:false,alpha:false}} dpr={1}>
      <PileTestCamera/>
      <color attach="background" args={["#06050b"]}/>
      <ambientLight intensity={1.1}/>
      <directionalLight position={[-5,8,7]} color="#ffad64" intensity={2.7} castShadow shadow-mapSize={[2048,2048]} shadow-camera-left={-15} shadow-camera-right={15} shadow-camera-top={15} shadow-camera-bottom={-15} shadow-bias={-0.0001}/>
      <directionalLight position={[5,4,5]} color="#b7ccff" intensity={1.1}/>
      <directionalLight position={[-8,2,-3]} color="#c3d5ff" intensity={2.2}/>
      <directionalLight position={[7,1,-5]} color="#ffcf9b" intensity={1.4}/>
      {sim.objects.map((obj,i)=>{
        const transform=pileTransform(obj,frame);
        return transform?<group key={i} {...transform}><VoxelObject src={staticFile(obj.src)} preset={obj.preset} size={obj.size}/></group>:null;
      })}
      <mesh rotation={[-Math.PI/2,0,0]} receiveShadow><planeGeometry args={[200,200]}/><meshStandardMaterial color="#080711" roughness={1}/></mesh>
    </ThreeCanvas>}
  </AbsoluteFill>;
};
