import bpy, bmesh, math, os, random, json, subprocess
from mathutils import Vector, Quaternion
# revision-05: simple colour-block previs for Seedance. Shapes stay primitive on purpose;
# the point is the camera move, timing and who-is-where.
ROOT=os.path.dirname(os.path.abspath(__file__))
OUT=os.path.join(ROOT,'revision-05'); os.makedirs(os.path.join(OUT,'preview'),exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
scene=bpy.context.scene
FPS=24; END=432
scene.render.engine='BLENDER_WORKBENCH'; scene.render.fps=FPS; scene.frame_start=1; scene.frame_end=END
scene.render.resolution_x=960; scene.render.resolution_y=540; scene.render.resolution_percentage=100
scene.view_settings.view_transform='Standard'
scene.world=bpy.data.worlds.new('Sky'); scene.world.color=(.42,.64,.86)
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
 else: bmesh.ops.create_cone(bm,cap_ends=True,cap_tris=False,segments=16,radius1=1,radius2=1,depth=2)
 bm.to_mesh(me); bm.free(); me.materials.append(None); return me
UNIT={k:unit(k) for k in ['cube','ball','cone','disc']}
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
def frames(t0=0,t1=18,step=1):
 for f in range(max(1,F(t0)),min(END,F(t1))+1,step): yield f,(f-1)/FPS

grass=mat('Grass',(.30,.55,.12)); hillmat=mat('Hill',(.26,.48,.11)); leaf=mat('Trees',(.12,.38,.10)); bark=mat('Trunk',(.30,.17,.07))
rockmat=mat('Rocks',(.45,.47,.45)); mountain=mat('Mountains',(.40,.50,.47)); cloud=mat('Clouds',(.96,.96,.98))
bossmat=mat('Mainframe body',(.14,.15,.18)); eyemat=mat('Mainframe red eye',(1,.04,.04)); riftmat=mat('Sky rift',(.08,.02,.10)); rim=mat('Rift glow',(.95,.25,.65))
bluearm=mat('Blue arm',(.35,.72,1)); pinkarm=mat('Pink arrow',(1,.30,.70)); bolt=mat('Lightning',(1,.97,.6))
mobmat=mat('Mobs',(.45,.28,.13)); mobeye=mat('Mob eyes',(1,.85,.1))
warcol=mat('Warrior',(.88,.42,.14)); steel=mat('Sword',(.88,.90,.95)); dark=mat('Dark',(.04,.05,.06))
robcol=mat('Robot',(.10,.66,.66)); cream=mat('Robot shell',(.85,.82,.66)); rocketmat=mat('Rockets',(.95,.30,.08)); boom=mat('Explosion',(1,.78,.12))
magecol=mat('Mage',(.55,.22,.82)); orb=mat('Magic orb',(.35,.95,1)); skin=mat('Skin',(.85,.62,.45))
monkcol=mat('Monkey',(.40,.20,.08)); capred=mat('Red cap',(.9,.08,.08)); white=mat('White vest',(.95,.95,.9))
bone=mat('Skeleton',(.93,.91,.82)); pink=mat('Pink cap',(.98,.25,.55)); skate=mat('Skateboard',(.10,.40,.95)); teal=mat('Wheels',(.05,.75,.70))

# ---------------- CAMERA PATH (follows the top/side schematic) ----------------
# One continuous cinematic move: slow drift in the sky (0-5 s), easing into a long backward dive (5-7.5 s),
# then constant speed through the field. The route is a soft snake; fights simply pass on alternating sides.
RIFT=Vector((0,85,40))
def speed(t): return .8+9.2*ss(5,7.6,t)-6.4*ss(13.7,15.2,t)
TRAVEL=[0.]  # distance flown since t=5, sampled at 240 Hz
for i in range(1,2401): TRAVEL.append(TRAVEL[-1]+speed(5+i/240)/240)
def travel(t):
 i=min(2399,max(0,int((t-5)*240)));u=(t-5)*240-i
 return TRAVEL[i]+(TRAVEL[i+1]-TRAVEL[i])*u
def flight_pos(t):
 if t<5: return Vector((0,22-.8*t,15.5-.4*t))
 y=18-travel(t)
 snake=3*math.cos(math.pi*(y+7)/14)*ss(6,-4,y)*(1-ss(-50,-60,y))
 x=snake+.3*ss(-50,-60,y)
 z=1.5+.45*math.sin(math.pi*(y+7)/14)**2*(1-ss(-52,-58,y))+.6*ss(-54,-62,y)
 return Vector((x,y,z+12*(1-ss(5,7.4,t))))
PATH2D=[flight_pos(7+i*.05) for i in range(161)]
def path_dist(x,y): return min((Vector((x,y))-p.xy).length for p in PATH2D)
def pass_time(y):
 t=7.
 while flight_pos(t).y>y and t<15: t+=1/96
 return t

# ---------------- FIELD ----------------
box('Ground',(0,-25,-.25),(700,700,.5),grass)
for y in [-14,-28,-42]:
 p=flight_pos(pass_time(y)); part('ball','Low mound under camera',(p.x,p.y,-.4),(9,6,2.0),hillmat)
random.seed(5)
FIGHTS=[Vector((6.6,-7)),Vector((-6.8,-21)),Vector((6.8,-35)),Vector((-6.4,-49))]
def clear(x,y,r): return path_dist(x,y)>r and all((Vector((x,y))-c).length>7 for c in FIGHTS) and (Vector((x,y))-flight_pos(14.4).xy).length>6
n=0
while n<170:
 x,y=random.uniform(-40,40),random.uniform(-85,20)
 if not clear(x,y,5.5): continue
 n+=1;h=random.uniform(3.5,6.5)
 box('Tree trunk',(x,y,h*.3),(.4,.4,h*.6),bark)
 part('cone','Tree crown',(x,y,h*.72),(2.4,2.4,h*.75),leaf)
n=0
while n<220:
 x,y=random.uniform(-30,30),random.uniform(-80,15)
 if not clear(x,y,2.2): continue
 n+=1;s=random.uniform(.3,1.1)
 part('ball','Rock',(x,y,s*.25),(s*1.3,s,s*.9),rockmat,rot=(0,0,random.uniform(0,3)))
for i in range(16):
 a=i/16*2*math.pi;x,y=75*math.sin(a),-25+105*math.cos(a)
 part('cone','Far mountain',(x,y,8),(random.uniform(30,45),random.uniform(30,45),random.uniform(22,34)),mountain)

# ---------------- SKY: clouds, lightning, rift, Mainframe ----------------
for i in range(40):
 x,z=random.uniform(-60,60),random.uniform(30,58);y=random.uniform(92,140)
 part('ball','Cloud',(x,y,z),(random.uniform(10,22),random.uniform(5,9),random.uniform(3,6)),cloud)
# Thick clouds in front of the rift slide apart while the eye shows through.
for i,(x,z) in enumerate([(-6,40),(5,42),(-2,37),(7,38),(-8,44),(1,45)]):
 c=part('ball','Cloud veil',(x,80,z),(14,4,6),cloud)
 for f,t in frames(0,6,6):
  u=ss(2.2,4.5,t);key(c,f,loc=(x+(1 if x>=0 else -1)*u*22,80-u*4,z+u*(z-40)*.8))
for i,(x0,windows) in enumerate([(-14,[(.15,.3),(1.3,1.4),(2.6,2.7)]),(10,[(.55,.65),(1.7,1.82)]),(-3,[(.9,1.02),(2.1,2.2),(3.3,3.4)]),(18,[(.35,.45),(1.95,2.05)]),(-20,[(1.1,1.2),(2.9,3.0)])]):
 pts=[Vector((x0,82,58))]
 for k in range(6): pts.append(pts[-1]+Vector((random.uniform(-2.5,2.5),0,-3.4)))
 segs=[]
 for a,b in zip(pts,pts[1:]):
  d=b-a;segs.append(box('Lightning bolt',(a+b)/2,(.35,.35,d.length),bolt,rot=(0,math.atan2(d.x,d.z),0)))
 for o in segs:
  o.hide_render=True;o.keyframe_insert('hide_render',frame=1)
  for t0,t1 in windows:
   o.hide_render=False;o.keyframe_insert('hide_render',frame=F(t0));o.hide_render=True;o.keyframe_insert('hide_render',frame=F(t1))
rift=part('disc','Sky rift',RIFT,(1,1,.4),riftmat,rot=(math.pi/2,0,0))
glow=part('disc','Rift glow edge',RIFT+Vector((0,.4,0)),(1,1,.4),rim,rot=(math.pi/2,0,0))
boss=empty('MAINFRAME ROOT',(0,92,40))
box('Mainframe head',(0,0,0),(16,10,12),bossmat,boss)
for k in range(10):
 a=k/10*2*math.pi;box('Mainframe halo monitor',(11*math.cos(a),0,11*math.sin(a)),(2.6,2,2),bossmat,boss)
box('Mainframe upper body',(0,1,-9),(20,9,7),bossmat,boss)
arms=[]
for side,ma in [(-1,bluearm),(1,pinkarm)]:
 a=empty('Mainframe arm pivot',(side*9,-1,-6),boss)
 box('Mainframe arm',(side*7,0,2),(14,3,3),bossmat,a)
 part('cone','Mainframe arrow hand',(side*16,0,4),(5,5,6),ma,a,rot=(0,-side*math.pi/2,0))
 arms.append((a,side))
eye=box('Mainframe eye',(0,0,0),(5,.6,2.4),eyemat)
box('Mainframe pupil',(0,-.7,0),(.6,.2,.8),dark,eye)
for f,t in frames(0,6):
 R=2*ss(1.8,3.0,t)+19*ss(3.0,4.6,t)
 key(rift,f,scale=(R,R,.2));key(glow,f,scale=(R*1.07,R*1.07,.2))
 s=max(.05,ss(2.9,4.3,t));y=92-14*ss(4.0,5.3,t)  # grows inside the rift, then pushes out through it
 key(boss,f,loc=(0,y,40),scale=(s,s,s))
 key(eye,f,loc=(0,min(84.6,y-5.4*s),41),scale=[max(.02,ss(1.9,3.0,t))]*3)
 for a,side in arms:
  u=ss(4.1,5.2,t);key(a,f,scale=(max(.02,u),1,1),rot=(0,side*(.35-.45*u),0))
boss.hide_render=True;boss.keyframe_insert('hide_render',frame=1);boss.hide_render=False;boss.keyframe_insert('hide_render',frame=F(2.9))

# ---------------- CHARACTERS ----------------
def mob(name,pos,yaw,phase):
 r=empty(name,(pos.x,pos.y,0));r.rotation_euler.z=yaw
 box('Mob body',(0,0,.7),(.65,.5,.8),mobmat,r);box('Mob head',(0,0,1.32),(.6,.5,.45),mobmat,r)
 for s in [-1,1]:
  box('Mob eye',(s*.14,-.26,1.36),(.12,.04,.12),mobeye,r);box('Mob horn',(s*.22,0,1.7),(.08,.08,.35),bark,r,rot=(0,s*.4,0))
  box('Mob leg',(s*.17,0,.18),(.18,.22,.36),bark,r);box('Mob arm',(s*.42,0,.75),(.16,.18,.55),bark,r)
 return {'root':r,'base':pos,'yaw':yaw,'phase':phase,'hit':None}
def animate_mobs(mobs,move=None):
 for m in mobs:
  for f,t in frames(0,18,2):
   base=move(m,t) if move else m['base']
   p=Vector((base.x,base.y,abs(math.sin(t*7+m['phase']))*.07));rx=.15*math.sin(t*5+m['phase']);rz=m['yaw']
   if m['hit'] and t>=m['hit'][0]:
    th,d,dist,hop=m['hit'];u=t-th
    p+=d*dist*(1-math.exp(-u*4));p.z+=max(0,hop*math.sin(min(u/.6,1)*math.pi));rx=-min(1.5,u*4);rz+=u*3*(hop>0)
   key(m['root'],f,loc=p,rot=(rx,0,rz))
def ring(center,face,n,r0,r1,spread,seed):
 rnd=random.Random(seed);out=[];a0=math.atan2(face.y,face.x)
 for i in range(n):
  a=a0+spread*(i/(n-1)-.5)+rnd.uniform(-.15,.15);r=rnd.uniform(r0,r1)
  p=center+Vector((math.cos(a),math.sin(a)))*r
  if path_dist(p.x,p.y)<2.2: p=center+(p-center)*1.6
  out.append(p)
 return out
heroes=[]
# Fight 1 (right): warrior, overhead sword chop knocks a mob away.
c=FIGHTS[0];face=Vector((.6,-.8));tp=pass_time(c.y)
w=empty('WARRIOR',(c.x,c.y,0));w.rotation_euler.z=yaw_to(face)
box('Warrior torso',(0,0,1.25),(.95,.55,.95),warcol,w);box('Warrior head',(0,0,2.0),(.5,.5,.55),warcol,w);box('Warrior mohawk',(0,0,2.38),(.12,.45,.25),capred,w)
for s in [-1,1]: box('Warrior leg',(s*.25,0,.4),(.32,.38,.8),dark,w);box('Warrior arm',(s*.65,0,1.3),(.32,.36,.8),warcol,w)
sw=empty('Sword pivot',(-.65,-.2,1.5),w);box('Sword blade',(0,0,1.0),(.14,.08,1.7),steel,sw);box('Sword guard',(0,0,.15),(.45,.15,.1),dark,sw)
mobs=[mob('MOB_WARRIOR_%02d'%i,p,yaw_to(c-p),i) for i,p in enumerate(ring(c,face,7,2.0,4.0,3.2,1))]
for j,(t_hit) in enumerate([tp+.3,tp+1.0]):
 m=min(mobs,key=lambda m:(m['base']-(c+face*2)).length if not m['hit'] else 99);m['hit']=(t_hit,(m['base']-c).normalized().to_3d(),4.5,1.3)
for f,t in frames():
 a=.6
 for th in [tp+.3,tp+1.0]:
  if th-.35<t<th+.4: a=.6+.6*ss(th-.35,th-.1,t)-2.6*ss(th-.1,th,t)+1.4*ss(th+.1,th+.4,t)
 key(sw,f,rot=(a,0,0))
animate_mobs(mobs);heroes.append(('WARRIOR',c,tp))
# Fight 2 (left): robot runs toward camera, rockets leave its back and hit the chasing mobs.
c=FIGHTS[1];tp=pass_time(c.y)
def robot_pos(t): return Vector((c.x,c.y+5-5*(t-tp+1),0))
rb=empty('CAT ROBOT')
box('Robot chassis',(0,0,.95),(1.4,.8,.6),cream,rb);box('Robot CRT head',(0,0,1.65),(1.5,.8,.9),robcol,rb);box('Robot screen',(0,-.41,1.65),(1.2,.04,.6),dark,rb)
box('Rocket pod',(0,.55,1.7),(1.0,.5,.8),rocketmat,rb);box('Cat on top',(0,0,2.35),(.45,.4,.5),dark,rb);box('Cat head',(0,-.15,2.7),(.4,.35,.35),dark,rb)
legs=[]
for s in [-1,1]:
 for dy in [-.3,.3]:
  l=empty('Robot leg pivot',(s*.55,dy,.7),rb);box('Robot leg',(0,0,-.35),(.25,.25,.7),cream,l);legs.append((l,s*dy))
for f,t in frames():
 p=robot_pos(t) if t<tp+3 else robot_pos(tp+3);p.z=abs(math.sin(t*14))*.12;key(rb,f,loc=p)
 for l,ph in legs: key(l,f,rot=(.7*math.sin(t*14+(ph>0)*math.pi),0,0))
chase=[]
for i,p in enumerate(ring(Vector((c.x,c.y+4.5)),Vector((0,1)),8,1.0,3.5,2.6,2)):
 m=mob('MOB_ROBOT_%02d'%i,p,0,i);m['off']=p-Vector((c.x,c.y+5));chase.append(m)
def chase_pos(m,t):
 tt=min(t,m['hit'][0]) if m['hit'] else t
 return robot_pos(tt).xy+Vector((0,3.5))+m['off']
for k in range(6):
 t0=tp+.05+k*.16;t1=t0+.7;m=chase[k];m['hit']=(t1,Vector((random.uniform(-.4,.4),1,0)).normalized(),3,1.5)
 target=chase_pos(m,t1).to_3d()+Vector((0,0,.8))
 r=box('Rocket',(0,0,0),(.18,.6,.18),rocketmat);e=part('ball','Rocket explosion',target,(1,1,1),boom)
 for f,t in frames(t0-.1,t1+.6):
  u=ss(t0,t1,t);start=robot_pos(t0)+Vector((0,.6,2.1))
  p=start.lerp(target,u)+Vector((0,0,4*math.sin(u*math.pi)));nxt=start.lerp(target,min(1,u+.05))+Vector((0,0,4*math.sin(min(1,u+.05)*math.pi)))
  d=nxt-p;key(r,f,loc=p,rot=(math.atan2(d.z,d.y) if d.length>1e-4 else 0,0,0))
  s=2.4*math.sin(min(1,max(0,(t-t1)/.45))*math.pi);key(e,f,scale=(s,s,s))
 show_between(r,t0,t1);show_between(e,t1,t1+.45)
animate_mobs(chase,chase_pos);heroes.append(('CAT ROBOT',c,tp))
# Fight 3 (right): mage throws magic orbs into its group.
c=FIGHTS[2];face=Vector((.7,-.7));tp=pass_time(c.y)
mg=empty('MAGE',(c.x,c.y,0));mg.rotation_euler.z=yaw_to(face)
part('cone','Mage robe',(0,0,.95),(1.2,1.2,1.9),magecol,mg);box('Mage head',(0,0,1.95),(.45,.45,.45),skin,mg);part('cone','Mage hat',(0,0,2.55),(.7,.7,.9),magecol,mg)
st=empty('Staff pivot',(-.55,-.1,1.1),mg);box('Mage staff',(0,0,.5),(.08,.08,1.8),bark,st);part('ball','Staff gem',(0,0,1.45),(.3,.3,.3),orb,st)
mobs=[mob('MOB_MAGE_%02d'%i,p,yaw_to(c-p),i) for i,p in enumerate(ring(c,face,8,2.5,4.5,3.4,3))]
casts=[tp+.2,tp+.55,tp+.9]
for f,t in frames(): key(st,f,rot=(-.9*max(ss(th-.25,th,t)*(1-ss(th+.05,th+.3,t)) for th in casts),0,0))
for k,th in enumerate(casts):
 m=sorted(mobs,key=lambda m:(m['base']-(c+face*3)).length)[k];m['hit']=(th+.3,(m['base']-c).normalized().to_3d(),3.5,1.0)
 o=part('ball','Magic orb',(0,0,0),(.6,.6,.6),orb)
 for f,t in frames(th-.05,th+.35): key(o,f,loc=(c.to_3d()+Vector((0,0,2.4))).lerp(m['base'].to_3d()+Vector((0,0,1)),ss(th,th+.3,t)))
 show_between(o,th,th+.32)
animate_mobs(mobs);heroes.append(('MAGE',c,tp))
# Fight 4 (left): monkey punches, mobs fly back.
c=FIGHTS[3];face=Vector((-.7,-.7));tp=pass_time(c.y)
mk=empty('MONKEY',(c.x,c.y,0));mk.rotation_euler.z=yaw_to(face)
box('Monkey body',(0,0,1.15),(1.3,.85,1.3),monkcol,mk);box('Monkey vest',(0,-.44,1.25),(.9,.06,.8),white,mk)
box('Monkey head',(0,-.05,2.1),(.75,.65,.65),monkcol,mk);box('Monkey cap',(0,-.1,2.48),(.8,.8,.15),capred,mk);box('Monkey shorts',(0,0,.55),(1.0,.8,.4),capred,mk)
fists=[]
for s in [-1,1]:
 box('Monkey leg',(s*.33,0,.25),(.42,.55,.5),monkcol,mk)
 a=empty('Monkey shoulder',(s*.85,0,1.65),mk);box('Monkey long arm',(0,0,-.7),(.45,.5,1.4),monkcol,a);fists.append(a)
mobs=[mob('MOB_MONKEY_%02d'%i,p,yaw_to(c-p),i) for i,p in enumerate(ring(c,face,8,2.0,4.2,3.4,4))]
punches=[tp+.25,tp+.6,tp+1.0]
for f,t in frames():
 for k,a in enumerate(fists): key(a,f,rot=(sum(-1.5*ss(th-.15,th,t)*(1-ss(th+.1,th+.3,t)) for j,th in enumerate(punches) if j%2==k),0,0))
for k,th in enumerate(punches):
 m=sorted(mobs,key=lambda m:(m['base']-(c+face*2)).length)[k];m['hit']=(th,(m['base']-c).normalized().to_3d(),5,1.6)
animate_mobs(mobs);heroes.append(('MONKEY',c,tp))

# ---------------- SKELETON (catch + headbutt) ----------------
SK=Vector((1.6,flight_pos(14.4).y-2.0,0))  # reaches the camera's line just as it flies past
def sk_pos(t):
 # Rolls toward the incoming camera, spins around as it passes, then leans in to grab.
 y=SK.y+2.0*(1-math.cos(min(1,max(0,(t-13.4)/1.0))*math.pi/2))-.6*ss(14.4,15.0,t)
 return Vector((SK.x,y,0))
def sk_yaw(t): return math.pi+math.pi*ss(14.3,14.7,t)
def hold_lean(t): return .25*ss(14.6,15.0,t)-.1*ss(15.0,15.6,t)
def sk_lean(t): return hold_lean(t)-.12*ss(15.8,16.15,t)+.40*ss(16.15,16.4,t)-.28*ss(16.45,16.9,t)  # wind-up, headbutt, back
def skull_off(t): return .15*ss(15.8,16.15,t)-.35*ss(16.15,16.4,t)+.2*ss(16.45,16.9,t)
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
def look(d,roll=0):
 return d.to_track_quat('-Z','Y')@Quaternion((0,0,1),roll)
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
 return look(Vector((d.x,d.y,.09)),max(-.04,min(.04,(h1-h0)*.6)))
GRAB=15.0
grab_pos=flight_pos(GRAB);grab_q=flight_quat(GRAB)
def head_world(t):
 return sk_matrix_point(t,(0,-hold_lean(t)*2.1,2.35))
def cam_state(t):
 if t<GRAB:
  p=flight_pos(t)
  if t<5.2: q=look(RIFT+Vector((0,0,1))-p)
  else: q=look(RIFT+Vector((0,0,1))-p).slerp(flight_quat(t),ss(5.2,7.0,t))
  return p,q
 u=t-GRAB;hold=sk_matrix_point(t,(-.1,-1.05-hold_lean(t)*2.1,2.35))
 p=grab_pos.lerp(hold,ss(GRAB+.05,GRAB+.8,t))
 p+=Vector((.05,-.15,.06))*math.exp(-u*9)*math.sin(u*40)  # the snap
 imp=max(0,t-16.4);p+=Vector((0,-.12,.03))*math.exp(-imp*7)*math.sin(min(imp*30,math.pi)) if t>16.4 else Vector()
 p+=Vector((math.sin(t*9)*.012,0,math.sin(t*7.3)*.012))
 q=grab_q.slerp(look(head_world(t)-p,.06*math.sin(t*3)),ss(GRAB,GRAB+.35,t))
 if t>16.4: q=q@Quaternion((1,0,0),.12*math.exp(-imp*6)*math.sin(imp*45))
 return p,q
lastq=None;route=[]
for f,t in frames():
 p,q=cam_state(t)
 if lastq is not None and q.dot(lastq)<0: q.negate()
 lastq=q;cam.location=p;cam.rotation_quaternion=q
 cam.keyframe_insert('location',frame=f);cam.keyframe_insert('rotation_quaternion',frame=f)
 cam.data.lens=32-10*ss(4.5,7.5,t);cam.data.keyframe_insert('lens',frame=f)
 if t<=GRAB: route.append(p)
 # skeleton
 key(sk,f,loc=sk_pos(t),rot=(0,0,sk_yaw(t)));key(body,f,rot=(sk_lean(t),0,0));key(skull,f,loc=(0,skull_off(t),1.85))
 sh=sk_matrix_point(t,(-.45,-sk_lean(t)*1.3,1.75))
 if t<GRAB: target=sh+Vector((0,0,-.75)) if t<14.6 else (sh+Vector((0,0,-.75))).lerp(grab_pos,ss(14.6,GRAB,t))
 else: target=p+q@Vector((.08,-.05,.1))
 d=target-sh;key(hand,f,loc=target);key(arm,f,loc=(sh+target)/2,scale=(.07,.07,max(.05,d.length/2)))
 arm.rotation_mode='QUATERNION';arm.rotation_quaternion=d.to_track_quat('Z','Y') if d.length>1e-4 else Quaternion();arm.keyframe_insert('rotation_quaternion',frame=f)
# Bone fingers wrap the lens edge at the catch; cracks stay on the glass after the headbutt.
for i,(x,y,rz,ln) in enumerate([(.046,.016,.08,.03),(.047,.004,0,.032),(.046,-.008,-.08,.03),(.044,-.019,-.2,.026),(.03,-.027,1.3,.024)]):
 o=box('Bone finger on lens',(0,0,0),(ln*.8,.006,.005),bone,cam,rot=(0,0,rz))
 for f,t in frames(14.9,18): key(o,f,loc=(x+.006+.03*(1-ss(14.92,GRAB,t)),y,-.06))
 show_between(o,14.92,19)
for pts in [[(0,0),(-.012,.006),(-.022,.004),(-.036,.015)],[(0,0),(.009,.007),(.02,.017)],[(0,0),(.011,-.006),(.024,-.008),(.04,-.019)],[(0,0),(-.005,-.011),(-.016,-.02)],[(0,0),(.014,.002),(.03,.006)]]:
 for a,b in zip(pts,pts[1:]):
  a=Vector(a)+Vector((.004,.003));b=Vector(b)+Vector((.004,.003));d=b-a
  o=box('Lens crack',((a.x+b.x)/2,(a.y+b.y)/2,-.05),(d.length,.0007,.0004),dark,cam,rot=(0,0,math.atan2(d.y,d.x)))
  show_between(o,16.4,19)
for t,txt in [(0,'SKY / LIGHTNING'),(2,'EYE'),(3,'RIFT OPENS'),(5,'PULL BACK / ACCELERATE'),(7,'FIGHTS'),(13.4,'SKELETON'),(15,'CATCH'),(16.4,'HEADBUTT / CRACKS')]: scene.timeline_markers.new(txt,frame=F(t))
cu=bpy.data.curves.new('Camera path','CURVE');cu.dimensions='3D';cu.bevel_depth=.25;sp=cu.splines.new('POLY');sp.points.add(len(route)-1)
for pt,p in zip(sp.points,route): pt.co=(*p,1)
routeob=bpy.data.objects.new('Camera path — viewport only',cu);scene.collection.objects.link(routeob);cu.materials.append(skate);routeob.hide_render=True
scene['notes']='revision-05 Seedance previs: colour blocks only. Camera follows the hand-drawn top/side schematic.'

# ---------------- OUTPUT ----------------
scene.frame_set(F(11))
bpy.ops.object.camera_add(location=(0,-8,160));top=bpy.context.object;top.name='Top plan';top.data.type='ORTHO';top.data.ortho_scale=170
scene.render.resolution_x=600;scene.render.resolution_y=1000
routeob.hide_render=False;scene.camera=top;scene.render.filepath=os.path.join(OUT,'layout-top.png');bpy.ops.render.render(write_still=True)
scene.render.resolution_x=960;scene.render.resolution_y=540
bpy.ops.object.camera_add(location=(60,-75,40));side=bpy.context.object;side.name='Overview';side.rotation_euler=(Vector((0,-15,8))-side.location).to_track_quat('-Z','Y').to_euler();side.data.lens=24
scene.camera=side;scene.render.filepath=os.path.join(OUT,'layout-overview.png');bpy.ops.render.render(write_still=True)
routeob.hide_render=True;scene.camera=cam;scene.frame_set(1)
with open(os.path.join(OUT,'scene-metrics.json'),'w') as fh:
 json.dump({'duration_s':18,'fps':FPS,'heroes':[{'name':n,'pos':[round(c.x,2),round(c.y,2)],'camera_passes_at_s':round(tp,2)} for n,c,tp in heroes],
  'skeleton_start':[SK.x,SK.y],'catch_s':GRAB,'headbutt_s':16.4,'rift':list(RIFT),
  'camera_samples':[{'t':t,'pos':[round(v,2) for v in flight_pos(t)]} for t in range(0,16)]},fh,indent=1)
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT,'camera_previs_18s_v5.blend'))
scene.render.image_settings.file_format='PNG';scene.render.filepath=os.path.join(OUT,'preview','frame_')
if os.environ.get('CHECK_FRAMES'):  # quick check: CHECK_FRAMES="1,49,169" renders only these
 for f in map(int,os.environ['CHECK_FRAMES'].split(',')):
  scene.frame_set(f);scene.render.filepath=os.path.join(OUT,'preview','check_%04d.png'%f);bpy.ops.render.render(write_still=True)
else: bpy.ops.render.render(animation=True)
