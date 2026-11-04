/** Offline only: npx tsx scripts/build-pile-sim.ts */
import {readFileSync,writeFileSync,mkdirSync} from "node:fs";
import {fileURLToPath} from "node:url";
import path from "node:path";
import {createHash} from "node:crypto";
import {performance} from "node:perf_hooks";
import {PNG} from "pngjs";
import * as C from "cannon-es";
import {CARD,GAME,ITEMS,TOMES,WEAPONS} from "../src/overspam/data";
import {detectArtPixelSize} from "../src/overspam/voxel";

type Preset="weapon"|"item"|"card";
type Transform=[number,number,number,number,number,number,number];
type Entry={src:string;preset:Preset;size:number;spawn:number;land:number;tr:(Transform|null)[]};
const start=performance.now();
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const FPS=60,FRAMES=300,REST=233,SEED=7331;
const MOON_R=110;
const surfaceY=(x:number,z:number)=>Math.sqrt(Math.max(0,MOON_R*MOON_R-x*x-z*z))-MOON_R;
let seed=SEED;
const random=()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;};
const round=(n:number)=>Math.round(n*1000)/1000;
const entries:Entry[]=[];
const add=(src:string,preset:Preset,spawn:number)=>entries.push({src,preset,size:round(preset==="weapon"?1.9:preset==="card"?1.7:1.6+random()*0.3),spawn,land:-1,tr:[]});
for(let i=0;i<33;i++) add(GAME(WEAPONS[i%WEAPONS.length]),"weapon",i<4?6:Math.round(9+(i-4)*44/28));
TOMES.forEach((name,i)=>add(CARD(`${name}_card`),"card",54+Math.round(i*47/22)));
// Sparse first 12 items, then rising arrival rate from frame 138 onward.
// Steadily accelerating stream (gaps shrink from ~12 frames to <1) instead of a dump at the end.
ITEMS.forEach((name,i)=>add(GAME(name),"item",102+Math.round(108*Math.pow(i/(ITEMS.length-1),0.72))));
function dimensions(entry:Entry):C.Vec3 {
 const png=PNG.sync.read(readFileSync(path.join(ROOT,"public",entry.src)));
 if(entry.preset==="card") return new C.Vec3(entry.size*png.width/png.height,entry.size,entry.size*12/png.height);
 const data=new Uint8ClampedArray(png.data);
 const step=detectArtPixelSize({data,width:png.width,height:png.height});
 let x0=png.width,y0=png.height,x1=-1,y1=-1;
 for(let y=0;y<png.height;y++)for(let x=0;x<png.width;x++) if(data[(y*png.width+x)*4+3]>128){x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);}
 if(x1<0)throw new Error(`Empty asset: ${entry.src}`);
 const cols=Math.ceil((x1-x0+1)/step),rows=Math.ceil((y1-y0+1)/step),unit=entry.size/Math.max(cols,rows);
 return new C.Vec3(cols*unit,rows*unit,(entry.preset==="weapon"?12:3)*unit);
}
const normal=()=>Math.sqrt(-2*Math.log(Math.max(random(),1e-9)))*Math.cos(2*Math.PI*random());
const retryCounts=entries.map(()=>0);
function simulate(){
for(const entry of entries){entry.land=-1;entry.tr=[];}
const solver=new C.GSSolver();solver.iterations=45;solver.tolerance=1e-8;
const world=new C.World({gravity:new C.Vec3(0,-48,0),allowSleep:true,solver});
world.broadphase=new C.SAPBroadphase(world);
world.defaultContactMaterial.friction=1.8;
world.defaultContactMaterial.restitution=0.12;
world.defaultContactMaterial.contactEquationStiffness=1e8;
world.defaultContactMaterial.contactEquationRelaxation=4;
// Ground is the moon: a big sphere whose top is at y=0 (BuildPile renders the same sphere).
const floor=new C.Body({mass:0,shape:new C.Sphere(MOON_R)});floor.position.set(0,-MOON_R,0);world.addBody(floor);
// Low, outward-flared invisible retaining bowl: holds only the bottom perimeter.
const supports=[floor];
for(let j=0;j<0;j++){ // bowl removed: owner wants fly-offs
 const angle=j*Math.PI/3;
 const wall=new C.Body({mass:0,shape:new C.Box(new C.Vec3(3.05,0.8,0.3))});
 wall.position.set(Math.sin(angle)*5.0,0.55,Math.cos(angle)*5.0);
 const yaw=new C.Quaternion();yaw.setFromAxisAngle(new C.Vec3(0,1,0),angle);
 const slope=new C.Quaternion();slope.setFromAxisAngle(new C.Vec3(1,0,0),0.35);
 yaw.mult(slope,wall.quaternion);world.addBody(wall);supports.push(wall);
}
const bodies=entries.map((entry,i)=>{
 const d=dimensions(entry);
 const body=new C.Body({mass:entry.preset==="weapon"?2:entry.preset==="card"?0.28:1,
  shape:new C.Box(new C.Vec3(d.x/2,d.y/2,d.z/2)),linearDamping:0.65,angularDamping:entry.preset==="card"?0.95:0.8,
  allowSleep:true,sleepSpeedLimit:0.45,sleepTimeLimit:0.12});
 // Each object's RNG is independent, including deterministic retry positions.
 seed=(SEED^Math.imul(i+1,0x45d9f3b)^Math.imul(retryCounts[i],0x27d4eb2d))>>>0;
 const shrink=1/(1+retryCounts[i]*0.3);
 body.position.set(Math.max(-3.6,Math.min(3.6,normal()*1.5*shrink)),11.5+random()*1.4,Math.max(-2.5,Math.min(2.5,normal()*1.3*shrink)));
 const tilt=entry.preset==="card"?25*Math.PI/180:80*Math.PI/180; // items/weapons tumble so their faces read while falling
 const flat=new C.Quaternion();flat.setFromEuler(-Math.PI/2+(random()*2-1)*tilt,0,(random()*2-1)*tilt);
 const yaw=new C.Quaternion();yaw.setFromAxisAngle(new C.Vec3(0,1,0),random()*Math.PI*2);
 yaw.mult(flat,body.quaternion);
 body.velocity.set((random()-0.5)*0.6,-(entry.preset==="card"?18:26),(random()-0.5)*0.5);
 if(entry.preset==="card")body.angularFactor.set(0.18,0.18,0.18);
 const spin=entry.preset==="card"?0.5:7;
 body.angularVelocity.set((random()-0.5)*spin,(random()-0.5)*spin,(random()-0.5)*spin);
 return body;
});
const bodyToEntry=new Map(bodies.map((b,i)=>[b.id,entries[i]]));
const touched=new Set<number>(supports.map(b=>b.id));
let maxPenetration=0,maxResidualSpeed=0,maxResidualSpin=0;
const kicked=new Map<number,number>();
for(let frame=0;frame<FRAMES;frame++) {
 for(let i=0;i<entries.length;i++) if(entries[i].spawn===frame){
  const incoming=bodies[i];incoming.updateAABB();
  // Never insert overlapping colliders: dense late arrivals start slightly higher.
  for(let attempt=0;attempt<60;attempt++){
   const overlaps=world.bodies.some(b=>b!==floor&&b.position.y>6&&(b.updateAABB(),incoming.aabb.overlaps(b.aabb)));
   if(!overlaps)break;
   incoming.position.y+=0.45;incoming.updateAABB();
  }
  world.addBody(incoming);
 }
 if(frame<FRAMES){ // physics keeps running through the drop: the pile stays alive under the blur
  // Fixed microsteps prevent fast thin cards tunnelling. The final 21 frames
  // advance physics 6x faster to compress settling before the music drop.
  const substeps=16;
  // after the drop the pile keeps moving but eases out over ~0.75 s instead of freezing
  if(frame>=REST){const k=Math.min(1,(frame-REST)/45);for(const b of bodies){b.linearDamping=0.65+0.3*k;b.angularDamping=0.8+0.17*k;}}
  for(let sub=0;sub<substeps;sub++){
   for(let i=0;i<entries.length;i++){
    const e=entries[i],b=bodies[i];
    if(e.preset==="card"&&e.spawn<=frame&&e.land<0){
     // Deterministic light lateral glide, removed on first supported contact.
     b.force.x+=Math.sin((frame+sub/substeps)*0.16+i)*0.7;
     b.force.z+=Math.cos((frame+sub/substeps)*0.13+i)*0.5;
    }
   }
   world.step(1/960);
   // Contact-only rolling resistance and short rebound cap prevent thin boxes
   // from injecting a large lateral kick into lightweight neighbours.
   const supported=new Set<C.Body>();
   for(const contact of world.contacts){
    if(contact.ni.y < -0.2)supported.add(contact.bi);
    if(contact.ni.y > 0.2)supported.add(contact.bj);
   }
   for(const body of supported){
    if(body.type!==C.Body.DYNAMIC)continue;
    body.velocity.y=Math.min(body.velocity.y,9);
    const horizontal=Math.hypot(body.velocity.x,body.velocity.z);
    const kickedAt=kicked.get(body.id)??-99;const limit=frame-kickedAt<24?10:2.6;
    const factor=horizontal>limit?limit/horizontal:0.999;
    body.velocity.x*=factor;body.velocity.z*=factor;
    body.angularVelocity.scale(frame-kickedAt<24?0.999:0.985,body.angularVelocity);
    const entry=bodyToEntry.get(body.id)!;
    // Only fix an already slow, supported body during the settling tail.
    if(false&&entry.land>=0&&frame>=220&&frame>=entry.land+10&&body.velocity.length()<0.45&&body.angularVelocity.length()<0.5&&(body.updateAABB(),body.aabb.lowerBound.y>=surfaceY(body.position.x,body.position.z)-0.005)){
     body.sleep();body.mass=0;body.type=C.Body.STATIC;body.updateMassProperties();
    }
   }
   // Contact propagation excludes collisions between two free-falling bodies.
   let changed=true;
   while(changed){changed=false;
    for(const c of world.contacts){
     if(!c.enabled)continue;
     if(touched.has(c.bi.id)!==touched.has(c.bj.id)){
      const id=touched.has(c.bi.id)?c.bj.id:c.bi.id;
      touched.add(id);const e=bodyToEntry.get(id);if(e&&e.land<0){e.land=frame;
       // Live pile: some objects ricochet off the pile and skid outward (only early enough to settle by the drop).
       const k=entries.indexOf(e),b=bodies[k],h=Math.abs(Math.sin(k*91.7+3.1));
       if(e.preset!=="card"&&h>0.78){const a=Math.atan2(b.position.z,b.position.x)+(h-0.9)*3;const sp=5+h*4;
        b.velocity.set(Math.cos(a)*sp,5+h*4,Math.sin(a)*sp*0.6);kicked.set(b.id,frame);b.angularVelocity.set((h-0.9)*30,(h-0.85)*20,(h-0.95)*30);}}
      changed=true;
     }
    }
   }
  }
 } else if(frame===REST){
  for(let i=0;i<bodies.length;i++){
   if(entries[i].land<0)throw new Error(`Object never landed: ${entries[i].src}`);
   maxResidualSpeed=Math.max(maxResidualSpeed,bodies[i].velocity.length());
   maxResidualSpin=Math.max(maxResidualSpin,bodies[i].angularVelocity.length());
   bodies[i].sleep();
  }
 }
 for(let i=0;i<entries.length;i++){
  const e=entries[i],b=bodies[i];
  e.tr.push(frame<e.spawn?null:[b.position.x,b.position.y,b.position.z,b.quaternion.x,b.quaternion.y,b.quaternion.z,b.quaternion.w].map(round) as Transform);
 }
}
for(const c of world.contacts){
 const a=c.bi.position.vadd(c.ri),b=c.bj.position.vadd(c.rj);
 maxPenetration=Math.max(maxPenetration,-b.vsub(a).dot(c.ni));
}
for(const b of bodies)b.updateAABB();
for(const entry of entries){
 entry.size=round(entry.size);
 if(entry.tr.length!==FRAMES||entry.land<0)throw new Error(`Invalid timeline ${entry.src}`);
}
const minX=Math.min(...bodies.map(b=>b.aabb.lowerBound.x)),maxX=Math.max(...bodies.map(b=>b.aabb.upperBound.x));
const minZ=Math.min(...bodies.map(b=>b.aabb.lowerBound.z)),maxZ=Math.max(...bodies.map(b=>b.aabb.upperBound.z));
const maxY=Math.max(...bodies.map(b=>b.aabb.upperBound.y));
const escaped=bodies.flatMap((b,i)=>Math.hypot(b.position.x,b.position.z)>11||b.position.distanceTo(floor.position)<MOON_R-0.05?[i]:[]);
const cards=bodies.filter((_,i)=>entries[i].preset==="card");
const faceUp=cards.filter(b=>b.quaternion.vmult(new C.Vec3(0,0,1)).y>0).length;
console.log(`Simulation pass: escaped=${escaped.length}, faceUp=${faceUp}/${cards.length}, height=${round(maxY)}, width=${round(maxX-minX)}, speed=${round(maxResidualSpeed)}`);
return {escaped,maxResidualSpeed:round(maxResidualSpeed),maxResidualSpin:round(maxResidualSpin),bounds:{minX:round(minX),maxX:round(maxX),width:round(maxX-minX),depth:round(maxZ-minZ),height:round(maxY)},faceUp,cards:cards.length,maxContactPenetration:round(maxPenetration)};
}
let report=simulate();
for(let pass=0;report.escaped.length&&pass<8;pass++){
 for(const index of report.escaped)retryCounts[index]++;
 report=simulate();
}
if(report.escaped.length)throw new Error(`Escaped objects after retries: ${report.escaped}`);
if(report.faceUp/report.cards<0.8)throw new Error("Fewer than 80% of cards face up");
if(report.maxResidualSpeed>0.3||report.maxResidualSpin>0.4)console.warn("note: some objects still moving at the drop (frozen under blur)");
if(report.maxContactPenetration>0.025)throw new Error("Excessive final collider overlap");
const result={fps:FPS,frames:FRAMES,seed:SEED,restFrame:REST,objects:entries};
const json=JSON.stringify(result);
const output=path.join(ROOT,"public/overspam/pile_sim.json");mkdirSync(path.dirname(output),{recursive:true});writeFileSync(output,json+"\n");
console.log(JSON.stringify({output,objects:entries.length,frames:FRAMES,bytes:Buffer.byteLength(json+"\n"),seconds:round((performance.now()-start)/1000),sha256:createHash("sha256").update(json+"\n").digest("hex"),lastLand:Math.max(...entries.map(e=>e.land)),...report,faceUpPercent:round(report.faceUp/report.cards*100),restartedObjects:retryCounts.filter(n=>n>0).length,restartAttempts:retryCounts.reduce((a,b)=>a+b,0)},null,2));
