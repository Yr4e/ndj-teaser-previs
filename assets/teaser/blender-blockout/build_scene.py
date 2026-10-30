import bpy, bmesh, math, os, random, json
from mathutils import Vector, Quaternion
# revision-06: 22 s colour-block previs for Seedance. Shapes stay primitive on purpose;
# the point is the camera move, timing and who-is-where.
ROOT=os.path.dirname(os.path.abspath(__file__))
OUT=os.path.join(ROOT,'revision-06'); os.makedirs(os.path.join(OUT,'preview'),exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
scene=bpy.context.scene
FPS=24; DUR=22; END=DUR*FPS
scene.render.engine='BLENDER_WORKBENCH'; scene.render.fps=FPS; scene.frame_start=1; scene.frame_end=END
scene.render.resolution_x=960; scene.render.resolution_y=540; scene.render.resolution_percentage=100
scene.view_settings.view_transform='Standard'
scene.world=bpy.data.worlds.new('Sky'); scene.world.color=(.36,.60,.90)
shade=scene.display.shading; shade.light='STUDIO'; shade.color_type='MATERIAL'; shade.show_shadows=True; shade.shadow_intensity=.35
scene.display.light_direction=(.45,-.35,.82)
def F(t): return round(t*FPS)+1
def ss(a,b,x):
 u=max(0.,min(1.,(x-a)/(b-a))); return u*u*(3-2*u)
def mat(name,c):
 m=bpy.data.materials.new(name); m.diffuse_color=(*c,1); return m
# Shared unit meshes (size 2), colour assigned per object.
def unit(kind):
 me=bpy.data.meshes.new('unit '+kind); bm=bmesh.new()
 if kind=='cube': bmesh.ops.create_cube(bm,size=2)
 elif kind=='ball': bmesh.ops.create_icosphere(bm,subdivisions=1,radius=1)
 elif kind=='cone': bmesh.ops.create_cone(bm,cap_ends=True,cap_tris=False,segments=6,radius1=1,radius2=0,depth=2)
 elif kind=='disc': bmesh.ops.create_cone(bm,cap_ends=True,cap_tris=False,segments=16,radius1=1,radius2=1,depth=2)
 else:  # torn sky hole: jagged flat polygon in the XZ plane, facing -Y
  rnd=random.Random(7);vs=[]
  for i in range(44):
   a=i/44*2*math.pi;r=(1.0 if i%2 else .82)*rnd.uniform(.92,1.08);vs.append(bm.verts.new((r*math.cos(a),0,r*math.sin(a))))
  bm.faces.new(vs)
 bm.to_mesh(me); bm.free(); me.materials.append(None); return me
UNIT={k:unit(k) for k in ['cube','ball','cone','disc','jag']}
def part(kind,name,loc,dims,ma,parent=None,rot=(0,0,0)):
 o=bpy.data.objects.new(name,UNIT[kind]); scene.collection.objects.link(o)
 o.material_slots[0].link='OBJECT'; o.material_slots[0].material=ma
 o.parent=parent; o.location=loc; o.rotation_euler=rot; o.scale=[d/2 for d in dims]; return o
def box(*a,**k): return part('cube',*a,**k)
def empty(name,loc=(0,0,0),parent=None):
 o=bpy.data.objects.new(name,None); scene.collection.objects.link(o); o.parent=parent; o.location=loc; return o
def key(o,f,loc=None,rot=None,scale=None):
 if loc is not None: o.location=loc; o.keyframe_insert('location',frame=f)
 if rot is not None: o.rotation_euler=rot; o.keyframe_insert('rotation_euler',frame=f)
 if scale is not None: o.scale=scale; o.keyframe_insert('scale',frame=f)
def show_between(o,t0,t1):
 for f,h in [(1,True),(F(t0),False),(F(t1),True)]:
  o.hide_render=h; o.keyframe_insert('hide_render',frame=f)
def yaw_to(d): return math.atan2(d.x,-d.y)  # characters are built facing -Y
def frames(t0=0,t1=DUR,step=1):
 for f in range(max(1,F(t0)),min(END,F(t1))+1,step): yield f,(f-1)/FPS

grass=mat('Grass',(.30,.58,.12)); leaf=mat('Trees',(.12,.40,.10)); bark=mat('Wood',(.32,.18,.07))
rockmat=mat('Rocks',(.47,.49,.47)); mountain=mat('Mountains',(.40,.52,.47)); cloud=mat('Clouds',(.96,.97,1))
bossmat=mat('Mainframe dark body',(.10,.11,.14)); olive=mat('Mainframe olive plates',(.52,.50,.26)); screenred=mat('Mainframe screen',(.30,.04,.05))
eyemat=mat('Red eye / core',(1,.12,.06)); white=mat('White',(.95,.95,.92)); cyan=mat('Cyan glow',(.15,.85,1))
riftmat=mat('Torn sky hole',(.12,.26,.72)); rim=mat('Rift electric edge',(.85,.95,1)); pinkarm=mat('Pink arrow',(1,.25,.75)); bolt=mat('Lightning',(.9,.95,1))
mossy=mat('Green mob',(.32,.50,.14)); bluemob=mat('Blue mob',(.15,.55,.90)); redmob=mat('Red mob',(.85,.15,.10)); purplemob=mat('Purple mage mob',(.55,.20,.75))
eyeY=mat('Mob cross eyes',(1,.95,.4))
warcol=mat('Warrior skin',(.88,.52,.30)); steel=mat('Sword',(.90,.92,.97)); dark=mat('Dark',(.04,.05,.06)); capred=mat('Red',(.9,.08,.08)); orange=mat('Ginger hair',(.85,.32,.05))
monkcol=mat('Monkey fur',(.40,.20,.08)); yellow=mat('Bananas',(1,.85,.1))
cream=mat('Cream shell',(.86,.80,.62)); glitchface=mat('Glitch CRT face',(.35,.85,1))
robcol=mat('Cat robot teal',(.12,.68,.60)); rocketmat=mat('Rockets',(.95,.20,.12)); boom=mat('Explosion',(1,.78,.12))
bone=mat('Skeleton',(.93,.91,.82)); pink=mat('Pink cap',(.98,.25,.55)); skate=mat('Skateboard',(.10,.40,.95)); teal=mat('Wheels',(.05,.75,.70))

# ---------------- TIMELINE ----------------
# 0-1 lightning + eye | 1-3 Mainframe tears the sky | 3-5 slow pull back | 5-7 accelerate back, descend to waist height
# 7-9.5 warrior | 9.5-12 monkey | 12-14.5 Glitch | 14.5-17 cat robot | 17-17.8 one rise to the skeleton
# 18.3 catch | 20.0 headbutt + cracks | to 22 hold
PASS=[7.6,10.1,12.6,15.1]  # camera is slowest here, with the hero close in frame
GRAB=18.3; HB=20.0; SKPASS=GRAB-.6
# ---------------- CAMERA PATH ----------------
# One continuous move with easing: it slows gently at every fight and speeds up between them.
RIFT=Vector((0,85,40))
def herm(d,v0,v1,T,u): return (u**3-2*u*u+u)*T*v0+(-2*u**3+3*u*u)*d+(u**3-u*u)*T*v1
def pre5(t): return .2*t+.15*max(0,t-3)**2  # almost still, then starts drifting back
X0,Y0=-4.8,22-pre5(5)
# Route drawn over the top view: the camera goes right through each fight (marked *).
WAY=[(X0,Y0),(-1.5,17.6),(2.4,14.6),(5.0,11.2),(6.2,7.5),(6.6,3.3),(3.6,-1.8),(-.5,-5.9),(-4.6,-10),(-6.6,-14.6),(-5.8,-20.3),
     (-2.5,-24.4),(3.4,-27.6),(5.3,-33),(4.8,-40.3),(1.6,-43.2),(-2.6,-48),(-5.6,-53.1),(-6.3,-57.2),(-4.5,-59.6),(-.75,-62.9),(2.5,-65.5)]
PASSWAY=[4,8,12,16];ENDWAY=20  # warrior*, monkey*, Glitch*, robot*, catch
def cr(p0,p1,p2,p3,u): return .5*((2*p1)+(-p0+p2)*u+(2*p0-5*p1+4*p2-p3)*u*u+(-p0+3*p1-3*p2+p3)*u**3)
W=[Vector(p) for p in WAY];W=[W[0]*2-W[1]]+W+[W[-1]*2-W[-2]]
SAMPLES=[];WAYLEN=[];L=0.;prev=None
for i in range(1,len(W)-2):
 for k in range(60):
  p=cr(W[i-1],W[i],W[i+1],W[i+2],k/60)
  if prev is not None: L+=(p-prev).length
  if k==0: WAYLEN.append(L)
  SAMPLES.append((L,p));prev=p
def at_len(s):
 lo,hi=0,len(SAMPLES)-1
 while hi-lo>1:
  mid=(lo+hi)//2
  if SAMPLES[mid][0]<s: lo=mid
  else: hi=mid
 (l0,p0),(l1,p1)=SAMPLES[lo],SAMPLES[hi];return p0.lerp(p1,max(0,min(1,(s-l0)/max(1e-6,l1-l0))))
VS=3.0  # m/s while a fight is in frame
SPASS=[WAYLEN[i]+3.0 for i in PASSWAY]  # slowest a few metres after going through, when the hero is well in frame
SEND=WAYLEN[ENDWAY]
def dist(t):
 # One continuous move with easing: it slows gently at every fight and speeds up between them.
 if t<PASS[0]: T=PASS[0]-5;return herm(SPASS[0],.8,VS,T,(t-5)/T)
 for i in range(3):
  if t<PASS[i+1]:
   T=PASS[i+1]-PASS[i];u=(t-PASS[i])/T;D=SPASS[i+1]-SPASS[i];k=1-VS*T/D
   return SPASS[i]+D*(u-k*math.sin(2*math.pi*u)/(2*math.pi))
 T=GRAB-PASS[3];u=min(1,(t-PASS[3])/T)
 return SPASS[3]+herm(SEND-SPASS[3],VS,1.5,T,u)
def flight_pos(t):
 if t<5: return Vector((X0,22-pre5(t),13.5+.25*(5-t)))
 p=at_len(dist(t))
 z=1.2+.06*math.sin(p.y*.4)+12.3*(1-ss(5,7.2,t))+1.6*ss(16.9,17.6,t)-.55*ss(17.6,GRAB,t)
 return Vector((p.x,p.y,z))
PATH2D=[p for _,p in SAMPLES[::3]]
def path_dist(x,y): return min((Vector((x,y))-p).length for p in PATH2D)

# ---------------- FIELD ----------------
random.seed(5)
box('Ground',(0,-25,-.25),(700,700,.5),grass)
# Fight centres and the skeleton spot follow the circles and dots drawn over the top view.
HEROPOS=[Vector((8.8,9.8)),Vector((-7.4,-5.6)),Vector((6.9,-27.8)),Vector((-.6,-52.2))]
SKP=flight_pos(SKPASS).xy;SKD=(flight_pos(SKPASS+.05)-flight_pos(SKPASS-.05)).xy.normalized();SKN=Vector((-SKD.y,SKD.x))
SK=(SKP+SKN*1.3).to_3d()  # rolls up beside the camera's line just as it flies past
def clear(x,y,r): return path_dist(x,y)>r and all((Vector((x,y))-c).length>9 for c in HEROPOS) and (Vector((x,y))-SK.xy).length>6
n=0
while n<190:
 x,y=random.uniform(-42,42),random.uniform(-95,25)
 if not clear(x,y,6): continue
 n+=1;h=random.uniform(3.5,6.5)
 box('Tree trunk',(x,y,h*.3),(.45,.45,h*.6),bark)
 part('ball' if n%3 else 'cone','Tree crown',(x,y,h*.75),(2.8,2.8,h*.6),leaf)
n=0
while n<200:
 x,y=random.uniform(-30,30),random.uniform(-85,20)
 if not clear(x,y,2.5): continue
 n+=1;s=random.uniform(.3,1.0)
 part('ball','Rock',(x,y,s*.25),(s*1.3,s,s*.9),rockmat,rot=(0,0,random.uniform(0,3)))
for i in range(16):
 a=i/16*2*math.pi;x,y=80*math.sin(a),-25+110*math.cos(a)
 part('cone','Far hill',(x,y,6),(random.uniform(35,50),random.uniform(35,50),random.uniform(16,26)),mountain)

# ---------------- SKY: clouds, lightning, torn sky, Mainframe ----------------
for i in range(40):
 x,z=random.uniform(-60,60),random.uniform(28,58);y=random.uniform(92,140)
 part('ball','Cloud streak',(x,y,z),(random.uniform(14,26),random.uniform(4,7),random.uniform(2.5,4.5)),cloud)
for i,(x,z) in enumerate([(-6,40),(5,42),(-2,37),(7,38),(-8,44),(1,45),(0,40)]):
 c=part('ball','Cloud veil',(x,80,z),(15,4,6),cloud)
 for f,t in frames(0,4,3):
  u=ss(.25,1.8,t);key(c,f,loc=(x+(1 if x>=0 else -1)*(u*24+2*u*(x==0)),80-u*4,z+u*(z-40)*.8))
for x0,windows in [(-14,[(.05,.15),(.7,.8)]),(10,[(.25,.35),(1.15,1.25)]),(-3,[(.45,.55),(1.5,1.6)]),(18,[(.12,.2),(.95,1.05)]),(-20,[(.6,.68),(1.8,1.9)])]:
 pts=[Vector((x0,82,60))]
 for k in range(6): pts.append(pts[-1]+Vector((random.uniform(-2.5,2.5),0,-3.6)))
 for a,b in zip(pts,pts[1:]):
  d=b-a;o=box('Lightning bolt',(a+b)/2,(.4,.4,d.length),bolt,rot=(0,math.atan2(d.x,d.z),0))
  o.hide_render=True;o.keyframe_insert('hide_render',frame=1)
  for t0,t1 in windows:
   o.hide_render=False;o.keyframe_insert('hide_render',frame=F(t0));o.hide_render=True;o.keyframe_insert('hide_render',frame=F(t1))
rift=part('jag','Torn sky',RIFT,(1,1,1),riftmat)
edge=part('jag','Torn sky electric edge',RIFT+Vector((0,.3,0)),(1,1,1),rim)
boss=empty('MAINFRAME ROOT',(0,92,40))
box('Monitor head',(0,0,1),(14,9,11),olive,boss);box('Monitor screen',(0,-4.6,1),(11,.2,8),screenred,boss)
box('Eye white',(0,-4.8,1),(4.2,.2,4.2),white,boss,rot=(0,math.pi/4,0));part('ball','Eye iris',(0,-5.0,1),(2.6,.6,2.6),eyemat,boss)
for k in range(7):
 a=math.pi*k/6;p=Vector((11*math.cos(a),0,4+8*math.sin(a)))
 box('Halo monitor',p,(3.4,3,3),bossmat,boss);box('Halo screen',p+Vector((0,-1.55,0)),(2.2,.1,2),cyan,boss)
 if k<6:
  q=Vector((11*math.cos(a+math.pi/6),0,4+8*math.sin(a+math.pi/6)));d=q-p
  box('Halo cyan link',(p+q)/2,(.5,.5,d.length*.6),cyan,boss,rot=(0,math.atan2(d.x,d.z),0))
box('Tower body',(0,1,-12),(16,9,15),bossmat,boss);part('disc','Core ring',(0,-3.6,-10),(5.4,.6,5.4),rockmat,boss,rot=(math.pi/2,0,0))
part('ball','Chest core',(0,-4.0,-10),(4,1.2,4),eyemat,boss)
arms=[]
for side in [-1,1]:
 box('Olive shoulder',(side*9.5,0,-4.5),(5,6,5),olive,boss)
 a=empty('Arm pivot',(side*10,-1,-5.5),boss);box('Arm',(side*8,0,0),(16,3.2,3.2),bossmat,a);box('Arm band',(side*11,0,0),(1,3.5,3.5),cyan if side<0 else capred,a)
 if side<0:  # screen-left: white spiky hand
  for k,(dz,dy) in enumerate([(0,0),(1.6,0),(-1.6,0),(0,1.6),(0,-1.6)]): part('cone','White spike',(-17.5,dy,dz),(2.4,2.4,5),white,a,rot=(0,math.pi/2,0))
 else:  # screen-right: pink arrowhead
  part('cone','Pink arrowhead',(18,0,0),(7,2,7),pinkarm,a,rot=(0,-math.pi/2,0))
 arms.append((a,side))
early_eye=part('ball','Early red eye',(0,84.4,41),(1,1,1),eyemat)
for f,t in frames(0,4.5):
 R=4*ss(.8,1.4,t)+22*ss(1.2,2.6,t)
 key(rift,f,scale=(max(.01,R),1,max(.01,R)));key(edge,f,scale=(max(.01,R*1.07),1,max(.01,R*1.07)))
 s=max(.03,ss(1.1,2.3,t));y=92-15*ss(1.9,3.0,t)  # grows inside the hole, then pushes out through it
 key(boss,f,loc=(0,y,40),scale=(s,s,s))
 e=4.0*ss(.1,.8,t);key(early_eye,f,scale=(max(.01,e),.3,max(.01,e)))
 for a,side in arms:
  u=ss(2.1,3.0,t);key(a,f,scale=(max(.02,u),1,1),rot=(0,side*(.3-.35*u),0))
show_between(early_eye,0,1.5)
boss.hide_render=True;boss.keyframe_insert('hide_render',frame=1);boss.hide_render=False;boss.keyframe_insert('hide_render',frame=F(1.1))

# ---------------- CHARACTERS ----------------
def mob(kind,name,pos,yaw,phase):
 r=empty(name,(pos.x,pos.y,0));r.rotation_euler.z=yaw
 if kind=='green':  # round mossy body, antlers
  part('ball','Mossy body',(0,0,.85),(1.0,.85,1.0),mossy,r);fz,fy=.95,-.43
  for s in [-1,1]: box('Antler',(s*.22,0,1.5),(.08,.08,.55),bark,r,rot=(0,s*.5,0));box('Antler tip',(s*.42,0,1.7),(.07,.07,.28),bark,r,rot=(0,-s*.7,0))
 elif kind=='blue':  # slim wooden body, spiky blue head
  box('Slim body',(0,0,.75),(.35,.3,.7),bark,r);part('ball','Spiky blue head',(0,0,1.4),(.65,.55,.6),bluemob,r);fz,fy=1.4,-.28
  for k in range(5): a=(k-2)*.5;part('cone','Head spike',(math.sin(a)*.3,0,1.75+math.cos(a)*.05),(.18,.18,.5),bluemob,r,rot=(0,a,0))
 elif kind=='red':  # bulky red hood with a backpack
  part('cone','Red hood',(0,0,.95),(1.2,1.0,1.9),redmob,r);box('Backpack',(0,.5,1.1),(.75,.4,.75),bark,r);fz,fy=1.15,-.33
  for s in [-1,1]: box('Antler',(s*.2,0,1.9),(.08,.08,.4),bark,r,rot=(0,s*.5,0))
 else:  # purple mage mob: robe, pointy hat, staff
  part('cone','Purple robe',(0,0,.8),(.9,.9,1.6),purplemob,r);box('Mage face',(0,0,1.35),(.45,.4,.4),bark,r);part('cone','Pointy hat',(0,0,1.85),(.65,.65,.75),purplemob,r);fz,fy=1.35,-.21
  box('Staff',(-.5,0,1.0),(.07,.07,1.6),bark,r);part('ball','Staff gem',(-.5,0,1.85),(.22,.22,.22),white,r)
 for s in [-1,1]:
  box('Cross eye',(s*.14,fy,fz),(.13,.04,.04),eyeY,r);box('Cross eye',(s*.14,fy,fz),(.04,.04,.13),eyeY,r)
  box('Mob arm',(s*.5,0,.75),(.18,.22,.5),bark,r);box('Mob leg',(s*.2,0,.18),(.18,.22,.36),bark,r)
 return {'root':r,'base':pos,'yaw':yaw,'phase':phase,'hits':[]}
def pose_mobs(mobs,hit=()):
 # Static: mobs stand in a fighting crouch; the ones in `hit` are caught mid-knockback.
 for i,m in enumerate(mobs):
  r=m['root'];r.location=(m['base'].x,m['base'].y,0);r.rotation_euler=(.2,0,m['yaw'])
  if i in hit: r.location.z=.5;r.rotation_euler=(-.9,.3,m['yaw'])
def keep_off_path(p,center):
 # The camera flies through the fight: leave a 1.6 m corridor around its line.
 while path_dist(p.x,p.y)<1.6: p=p+(p-center).normalized()*.4 if (p-center).length>.1 else p+Vector((.4,0))
 return p
def crowd(points,kinds,look_at,seed):
 return [mob(kinds[i%len(kinds)],'MOB_%d'%seed,keep_off_path(Vector(p),look_at),yaw_to(look_at-keep_off_path(Vector(p),look_at)),i) for i,p in enumerate(points)]
def ring_pts(center,n,r0,r1,seed):
 rnd=random.Random(seed);return [center+Vector((math.cos(a),math.sin(a)))*rnd.uniform(r0,r1) for a in [i/n*2*math.pi+rnd.uniform(-.2,.2) for i in range(n)]]
heroes=[]
# Fight 1: warrior mid wide sword sweep, green mobs around him on both sides of the camera line.
c=HEROPOS[0];face=Vector((-.45,-.9)).normalized()
w=empty('WARRIOR',(c.x,c.y,0));w.rotation_euler.z=yaw_to(face)
box('Torso',(0,0,1.3),(1.0,.6,1.0),warcol,w);box('Head',(0,0,2.05),(.5,.5,.55),warcol,w);box('Mohawk',(0,0,2.42),(.12,.45,.25),orange,w)
box('Beard',(0,-.27,1.9),(.42,.12,.35),orange,w);box('Silver shoulder',(.6,0,1.78),(.45,.65,.25),steel,w);box('Red belt cloth',(0,-.31,.85),(.35,.05,.6),capred,w)
for s_ in [-1,1]: box('Leg',(s_*.3,0,.4),(.35,.4,.8),dark,w,rot=(0,s_*.2,0));box('Arm',(s_*.68,0,1.3),(.34,.38,.8),warcol,w)
sw=empty('Sword pivot',(-.7,-.3,1.25),w);sw.rotation_euler.z=.5;box('Blade',(0,-.95,0),(.14,1.7,.05),steel,sw);box('Guard',(0,-.08,0),(.45,.12,.12),yellow,sw)
pose_mobs(crowd(ring_pts(c,9,2.2,4.5,1),['green'],c,1),hit=(4,5));heroes.append(('WARRIOR',c,PASS[0]))
# Fight 2: monkey throwing a punch into blue mobs.
c=HEROPOS[1];face=Vector((.35,-.94)).normalized()
mk=empty('MONKEY',(c.x,c.y,0));mk.rotation_euler.z=yaw_to(face)
box('Gorilla body',(0,0,1.15),(1.3,.85,1.3),monkcol,mk);box('White vest',(0,-.44,1.25),(.9,.06,.8),white,mk);box('Banana emblem',(0,-.48,1.3),(.3,.03,.12),yellow,mk)
box('Head',(0,-.05,2.1),(.75,.65,.65),monkcol,mk);box('Red cap',(0,-.1,2.48),(.8,.8,.15),capred,mk);box('Red shorts',(0,0,.55),(1.0,.8,.4),capred,mk)
box('Banana basket',(0,.55,1.5),(.8,.45,.7),bark,mk);box('Bananas',(0,.55,1.95),(.6,.35,.25),yellow,mk)
for s_,swing in [(-1,-1.5),(1,.2)]:
 box('Leg',(s_*.33,0,.25),(.42,.55,.5),monkcol,mk)
 a=empty('Shoulder',(s_*.85,0,1.65),mk);a.rotation_euler.x=swing;box('Long arm',(0,0,-.7),(.45,.5,1.4),monkcol,a)
pose_mobs(crowd(ring_pts(c,9,1.9,4.2,2),['blue'],c,2),hit=(6,));heroes.append(('MONKEY',c,PASS[1]))
# Fight 3: Glitch side-on, slightly from behind, blaster aimed at the mobs ahead of him.
c=HEROPOS[2];aim_at=Vector((8.6,-22.5));face=(aim_at-c).normalized();yaw=yaw_to(face)
gl=empty('GLITCH',(c.x,c.y,0));gl.rotation_euler.z=yaw
box('Slim torso',(0,0,1.25),(.5,.36,.8),cream,gl);box('CRT head',(0,0,2.0),(.85,.55,.6),cream,gl);box('Blue CRT face',(0,-.29,2.0),(.7,.03,.45),glitchface,gl)
for s_ in [-1,1]: box('Antenna',(s_*.25,0,2.55),(.04,.04,.5),cream,gl);box('Leg',(s_*.15,0,.45),(.15,.18,.9),cream,gl)
box('Left arm',(.36,0,1.25),(.13,.17,.8),cream,gl);box('Blaster arm',(-.36,-.35,1.4),(.13,.7,.15),cream,gl);box('Blaster',(-.36,-.8,1.42),(.22,.45,.25),dark,gl)
pts=[(5.7,-21.3),(8.2,-20.8),(9.1,-21.6),(8.3,-22.8),(6.7,-23.5),(8.4,-23.8),(10.7,-23.1),(10.4,-24.8)]
pose_mobs(crowd(pts,['green','blue','red'],c,3),hit=(4,));heroes.append(('GLITCH',c,PASS[2]))
# Fight 4: cat robot with its back to the camera, hovering rocket launcher aimed at blue, green and purple mobs across the camera line.
c=HEROPOS[3];pts=[(-9.2,-44.3),(-5.2,-44.8),(-6.3,-46.2),(-3.4,-46.7),(-8.1,-47.4),(-8.7,-49.4),(-7.2,-49.0)]
target=sum((Vector(p) for p in pts),Vector((0,0)))/len(pts);face=(target-c).normalized();yaw=yaw_to(face)
rb=empty('CAT ROBOT',(c.x,c.y,0));rb.rotation_euler.z=yaw
box('Chassis',(0,0,1.0),(1.5,.9,.6),cream,rb);box('Teal CRT body',(0,0,1.75),(1.6,.9,1.0),robcol,rb);box('Cream back panel',(0,.47,1.7),(.8,.05,.6),cream,rb)
box('Cat body',(0,0,2.5),(.5,.45,.5),dark,rb);box('Cat head',(0,-.2,2.85),(.42,.36,.36),dark,rb)
for s_ in [-1,1]:
 box('Cat ear',(s_*.13,-.2,3.1),(.1,.1,.15),dark,rb);box('Front broad leg',(s_*.6,-.3,.4),(.4,.4,.8),cream,rb);box('Rear thin leg',(s_*.6,.35,.4),(.14,.14,.8),robcol,rb)
launcher=empty('Hovering rocket launcher',c.to_3d()+Quaternion((0,0,1),yaw)@Vector((-1.4,0,2.8)))
for args in [('Launcher tube',(0,0,0),(.55,.55,1.6),rocketmat),('Launcher white band',(0,0,-.3),(.6,.6,.3),white),('Launcher back cap',(0,0,-.82),(.45,.45,.06),dark)]: part('disc',*args,launcher)
aim=(target.to_3d()-launcher.location+Vector((0,0,1.5))).normalized()
launcher.rotation_mode='QUATERNION';launcher.rotation_quaternion=Vector((0,0,1)).rotation_difference(aim)
pose_mobs(crowd(pts,['blue','green','purple'],c,4));heroes.append(('CAT ROBOT',c,PASS[3]))

# ---------------- SKELETON (catch + headbutt) ----------------
def sk_pos(t):
 # Rolls toward the incoming camera, spins around as it passes, then leans in to grab.
 e=1-math.cos(min(1,max(0,(t-SKPASS+1)/1.0))*math.pi/2)
 return SK+(SKD*(2.0*(1-e)+.6*ss(SKPASS,GRAB,t))).to_3d()
def sk_yaw(t): return yaw_to(-SKD)+math.pi*ss(SKPASS-.1,SKPASS+.3,t)
def hold_lean(t): return .25*ss(SKPASS+.2,GRAB,t)-.1*ss(GRAB,GRAB+.6,t)
def sk_lean(t): return hold_lean(t)-.12*ss(HB-.6,HB-.25,t)+.30*ss(HB-.25,HB,t)-.18*ss(HB+.05,HB+.5,t)  # wind-up, headbutt, back
def skull_off(t): return .15*ss(HB-.6,HB-.25,t)-.2*ss(HB-.25,HB,t)+.05*ss(HB+.05,HB+.5,t)
sk=empty('SKELETON');body=empty('Skeleton lean',(0,0,.25),sk)
box('Skateboard deck',(0,0,.12),(.7,1.4,.1),skate,sk)
for dx in [-.25,.25]:
 for dy in [-.45,.45]: box('Skate wheel',(dx,dy,.05),(.12,.15,.15),teal,sk)
for s in [-1,1]: box('Skeleton leg',(s*.2,0,.55),(.14,.16,.85),bone,body);box('Black sneaker',(s*.2,-.08,.12),(.24,.42,.2),dark,body)
box('Skeleton pelvis',(0,0,1.0),(.55,.3,.2),bone,body);box('Skeleton ribcage',(0,0,1.45),(.65,.35,.7),bone,body)
for k in range(3): box('Rib gap',(0,-.18,1.3+k*.15),(.5,.02,.05),dark,body)
box('Skeleton left arm',(.45,0,1.25),(.13,.13,.8),bone,body)
skull=empty('Skull',(0,0,1.85),body)
box('Skull',(0,0,.3),(.6,.55,.6),bone,skull);box('Pink cap',(0,0,.65),(.66,.6,.14),pink,skull);box('Cap brim',(0,-.38,.6),(.6,.3,.05),pink,skull)
for s in [-1,1]: box('Eye socket',(s*.14,-.28,.38),(.14,.04,.14),dark,skull);box('Blue pupil',(s*.14,-.3,.38),(.06,.03,.06),skate,skull)
box('Teeth',(0,-.28,.14),(.3,.03,.06),dark,skull)
arm=box('Skeleton reaching arm',(0,0,0),(.14,.14,1),bone);hand=box('Skeleton hand',(0,0,0),(.22,.12,.22),bone)
def sk_matrix_point(t,local): return sk_pos(t)+Quaternion((0,0,1),sk_yaw(t))@Vector(local)

# ---------------- CAMERA ----------------
bpy.ops.object.camera_add();cam=bpy.context.object;cam.name='Camera';scene.camera=cam
cam.data.clip_start=.01;cam.data.clip_end=400;cam.rotation_mode='QUATERNION'
def look(d,roll=0): return d.to_track_quat('-Z','Y')@Quaternion((0,0,1),roll)
def look_dir(t):
 # Looks back toward the Mainframe; heading is the route direction averaged over a second, so it never snaps.
 acc=Vector((0,0))
 for k in range(-6,7):
  tt=t+k*.08;v=(flight_pos(tt+.04)-flight_pos(tt-.04))/.08
  if v.xy.length>.5: acc+=Vector((-v.x,-v.y)).normalized()
 back=acc.normalized() if acc.length>.1 else Vector((0,1))
 return back.lerp(Vector((0,1)),.6).normalized()
def flight_quat(t):
 d=look_dir(t);h0=math.atan2(d.x,d.y);d2=look_dir(t+.1);h1=math.atan2(d2.x,d2.y)
 return look(Vector((d.x,d.y,.1)),max(-.04,min(.04,(h1-h0)*.6)))
grab_pos=flight_pos(GRAB);grab_q=flight_quat(GRAB)
def head_world(t): return sk_matrix_point(t,(0,-hold_lean(t)*2.1,2.35))
def cam_state(t):
 if t<GRAB:
  p=flight_pos(t);sky=look(RIFT+Vector((0,0,1))-p)
  return p,sky.slerp(flight_quat(t),ss(5.0,7.2,t)) if t>5 else sky
 u=t-GRAB;hold=sk_matrix_point(t,(-.1,-1.05-hold_lean(t)*2.1,2.35))
 p=grab_pos.lerp(hold,ss(GRAB+.05,GRAB+.8,t))
 p+=Vector((.05,-.15,.06))*math.exp(-u*9)*math.sin(u*40)  # the snap of the catch
 imp=max(0,t-HB)
 if t>HB: p+=Vector((0,-.12,.03))*math.exp(-imp*7)*math.sin(min(imp*30,math.pi))
 p+=Vector((math.sin(t*9)*.012,0,math.sin(t*7.3)*.012))*math.exp(-max(0,t-HB-.8)*1.5)  # hand sway, settles at the end
 q=grab_q.slerp(look(head_world(t)-p,.06*math.sin(t*3)*math.exp(-max(0,t-HB-.8))),ss(GRAB,GRAB+.35,t))
 if t>HB: q=q@Quaternion((1,0,0),.12*math.exp(-imp*6)*math.sin(imp*45))
 return p,q
lastq=None;route=[]
for f,t in frames():
 p,q=cam_state(t)
 if lastq is not None and q.dot(lastq)<0: q.negate()
 lastq=q;cam.location=p;cam.rotation_quaternion=q
 cam.keyframe_insert('location',frame=f);cam.keyframe_insert('rotation_quaternion',frame=f)
 cam.data.lens=30-6*ss(4.5,7.5,t);cam.data.keyframe_insert('lens',frame=f)
 if t<=GRAB: route.append(p)
 key(sk,f,loc=sk_pos(t),rot=(0,0,sk_yaw(t)));key(body,f,rot=(sk_lean(t),0,0));key(skull,f,loc=(0,skull_off(t),1.85))
 sh=sk_matrix_point(t,(-.45,-sk_lean(t)*1.3,1.75));rest=sh+Vector((0,0,-.75))
 target=(rest.lerp(grab_pos+grab_q@Vector((.08,-.05,.1)),ss(SKPASS+.2,GRAB,t))) if t<GRAB else p+q@Vector((.08,-.05,.1))
 d=target-sh;key(hand,f,loc=target);key(arm,f,loc=(sh+target)/2,scale=(.07,.07,max(.05,d.length/2)))
 arm.rotation_mode='QUATERNION';arm.rotation_quaternion=d.to_track_quat('Z','Y') if d.length>1e-4 else Quaternion();arm.keyframe_insert('rotation_quaternion',frame=f)
# Bone fingers wrap the lens edge at the catch; cracks stay on the glass after the headbutt.
for x,y,rz,ln in [(.046,.016,.08,.03),(.047,.004,0,.032),(.046,-.008,-.08,.03),(.044,-.019,-.2,.026),(.03,-.027,1.3,.024)]:
 o=box('Bone finger on lens',(0,0,0),(ln*.8,.006,.005),bone,cam,rot=(0,0,rz))
 for f,t in frames(GRAB-.15,DUR): key(o,f,loc=(x+.006+.03*(1-ss(GRAB-.1,GRAB,t)),y,-.06))
 show_between(o,GRAB-.1,DUR+1)
for pts in [[(0,0),(-.012,.006),(-.022,.004),(-.036,.015)],[(0,0),(.009,.007),(.02,.017)],[(0,0),(.011,-.006),(.024,-.008),(.04,-.019)],[(0,0),(-.005,-.011),(-.016,-.02)],[(0,0),(.014,.002),(.03,.006)]]:
 for a,b in zip(pts,pts[1:]):
  a=Vector(a)+Vector((.004,.003));b=Vector(b)+Vector((.004,.003));d=b-a
  o=box('Lens crack',((a.x+b.x)/2,(a.y+b.y)/2,-.05),(d.length,.0007,.0004),dark,cam,rot=(0,0,math.atan2(d.y,d.x)))
  show_between(o,HB,DUR+1)
for t,txt in [(0,'LIGHTNING / EYE'),(1,'SKY TEARS'),(3,'PULL BACK'),(5,'ACCELERATE / DESCEND'),(7,'WARRIOR'),(9.5,'MONKEY'),(12,'GLITCH'),(14.5,'CAT ROBOT'),(17,'RISE TO SKELETON'),(GRAB,'CATCH'),(HB,'HEADBUTT / CRACKS')]: scene.timeline_markers.new(txt,frame=F(t))
cu=bpy.data.curves.new('Camera path','CURVE');cu.dimensions='3D';cu.bevel_depth=.25;sp=cu.splines.new('POLY');sp.points.add(len(route)-1)
for pt,p in zip(sp.points,route): pt.co=(*p,1)
routeob=bpy.data.objects.new('Camera path — viewport only',cu);scene.collection.objects.link(routeob);cu.materials.append(skate);routeob.hide_render=True
scene['notes']='revision-06 Seedance previs, 22 s: colour blocks only. One eased camera move; it slows at each fight.'

# ---------------- OUTPUT ----------------
scene.frame_set(F(12))
bpy.ops.object.camera_add(location=(0,-10,160));top=bpy.context.object;top.name='Top plan';top.data.type='ORTHO';top.data.ortho_scale=170
scene.render.resolution_x=600;scene.render.resolution_y=1000
routeob.hide_render=False;scene.camera=top;scene.render.filepath=os.path.join(OUT,'layout-top.png');bpy.ops.render.render(write_still=True)
scene.render.resolution_x=960;scene.render.resolution_y=540
bpy.ops.object.camera_add(location=(60,-85,40));side=bpy.context.object;side.name='Overview';side.rotation_euler=(Vector((0,-20,8))-side.location).to_track_quat('-Z','Y').to_euler();side.data.lens=24
scene.camera=side;scene.render.filepath=os.path.join(OUT,'layout-overview.png');bpy.ops.render.render(write_still=True)
routeob.hide_render=True;scene.camera=cam;scene.frame_set(1)
with open(os.path.join(OUT,'scene-metrics.json'),'w') as fh:
 json.dump({'duration_s':DUR,'fps':FPS,'heroes':[{'name':n,'pos':[round(c.x,2),round(c.y,2)],'camera_slowest_at_s':tp} for n,c,tp in heroes],
  'skeleton_start':[SK.x,round(SK.y,2)],'catch_s':GRAB,'headbutt_s':HB,'rift':list(RIFT),
  'camera_samples':[{'t':t,'pos':[round(v,2) for v in flight_pos(t)]} for t in range(0,19)]},fh,indent=1)
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT,'camera_previs_22s_v6.blend'))
scene.render.image_settings.file_format='PNG';scene.render.filepath=os.path.join(OUT,'preview','frame_')
if os.environ.get('CHECK_FRAMES'):  # quick check: CHECK_FRAMES="1,49,169" renders only these
 for f in map(int,os.environ['CHECK_FRAMES'].split(',')):
  scene.frame_set(f);scene.render.filepath=os.path.join(OUT,'preview','check_%04d.png'%f);bpy.ops.render.render(write_still=True)
else: bpy.ops.render.render(animation=True)
