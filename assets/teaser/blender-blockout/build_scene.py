import bpy, math, os
from mathutils import Vector
ROOT=os.path.dirname(os.path.abspath(__file__))
OUT=os.path.join(ROOT,'revision-04'); os.makedirs(OUT,exist_ok=True)
bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
scene=bpy.context.scene
scene.render.engine='BLENDER_WORKBENCH'
scene.render.resolution_x=960; scene.render.resolution_y=540; scene.render.resolution_percentage=100
scene.render.fps=24; scene.frame_start=1; scene.frame_end=432
scene.world.color=(.22,.40,.58)
shade=scene.display.shading
shade.light='STUDIO'; shade.color_type='MATERIAL'; shade.show_shadows=True; shade.show_cavity=True
shade.background_type='WORLD'
def mat(name,c):
 m=bpy.data.materials.new(name); m.diffuse_color=(*c,1); return m
ground=mat('Ground',(.26,.52,.075)); blue=mat('Camera route',(.08,.4,.9)); mobmat=mat('Enemies',(.35,.43,.35))
red=mat('Mainframe eye',(.95,.04,.05)); bossmat=mat('Mainframe static',(.16,.22,.26)); bone=mat('Skeleton',(.85,.8,.65))
def cube(name,loc,scale,ma):
 bpy.ops.mesh.primitive_cube_add(size=1,location=loc); o=bpy.context.object; o.name=name; o.dimensions=scale; bpy.ops.object.transform_apply(location=False,rotation=False,scale=True); o.data.materials.append(ma); return o
def label(txt,loc,size=.42):
 bpy.ops.object.text_add(location=loc,rotation=(math.pi/2,0,0)); o=bpy.context.object; o.name=txt; o.data.body=txt; o.data.size=size; o.data.align_x='CENTER'; o.data.materials.append(bone); o.hide_render=True
cube('Ground',(0,-16,-.2),(52,104,.4),ground)
boss=cube('MAINFRAME — STATIC',(0,25,21),(10,3,10),bossmat)
cube('Red eye',(0,23.42,23),(3,.12,1.2),red)
for x in [-7,7]: cube('Static arm',(x,25,21),(3,3,8),bossmat)
label('MAINFRAME / STATIC',(0,23,28),.9)
# Readable primitive silhouettes, original identity colors only.
cream=mat('Cream shell',(.78,.76,.61)); teal=mat('Turquoise',(.05,.55,.55)); dark=mat('Screen / shoes',(.025,.04,.06)); pink=mat('Pink cap',(.95,.15,.4)); white=mat('White vest',(.9,.9,.82)); brown=mat('Gorilla fur',(.28,.13,.065)); orange=mat('Ginger beard',(.7,.19,.04)); skin=mat('Warrior skin',(.75,.40,.20)); yellow=mat('Yellow display',(.95,.75,.03))
names=['WARRIOR','MONKEY','GLITCH','CAT ROBOT']
positions=[(2,1),(-9,-11),(-2.5,-23),(4,-35)]
windows=[(7,8.7),(8.7,10.5),(10.5,12.3),(12.3,14)]
hero_groups=[]
for i,((x,y),name) in enumerate(zip(positions,names)):
 start=set(bpy.data.objects)
 def part(n,dx,dy,z,w,d,h,ma): return cube(name+' '+n,(x+dx,y+dy,z),(w,d,h),ma)
 if i==0:
  part('torso',0,0,1.35,1.15,.55,1,skin); part('head',0,0,2.15,.55,.5,.6,skin)
  part('beard',0,-.29,1.99,.46,.17,.45,orange); part('mohawk',0,0,2.55,.12,.46,.3,orange)
  part('blue face paint',0,-.26,2.23,.55,.03,.08,blue); part('silver shoulder',.64,0,1.85,.45,.65,.3,cream)
  part('red loincloth',0,-.33,.66,.4,.07,.7,red)
  for dx in [-.32,.32]: part('leg',dx,0,.45,.35,.4,.85,dark)
  for dx in [-.77,.77]: part('arm',dx,0,1.28,.4,.4,.85,skin)
 elif i==1:
  part('gorilla body',0,0,1.15,1.25,.75,1.3,brown); part('white vest',0,-.4,1.3,.9,.06,.8,white)
  part('banana emblem',0,-.44,1.35,.28,.03,.14,yellow); part('head',0,-.05,2.1,.75,.65,.65,brown)
  part('red cap',0,-.04,2.47,.8,.75,.14,red); part('cap brim',0,-.5,2.43,.7,.4,.08,red)
  part('red shorts',0,0,.62,1,.8,.45,red); part('basket',0,.6,1.4,.9,.5,.9,orange)
  for dx in [-.82,.82]: part('long arm',dx,0,.95,.45,.55,1.45,brown)
  for dx in [-.35,.35]: part('leg',dx,0,.28,.45,.6,.5,brown)
 elif i==2:
  part('slim torso',0,0,1.27,.52,.38,.8,cream); part('CRT head',0,0,2.03,.85,.55,.6,cream)
  part('blue CRT face',0,-.29,2.03,.72,.025,.45,blue)
  for dx in [-.28,.28]:
   part('antenna',dx,0,2.57,.04,.04,.48,cream)
   part('leg',dx*.65,0,.52,.14,.18,.85,cream)
   part('arm',dx*1.45,0,1.25,.13,.17,.85,cream)
  # Intentionally no invented combat mechanics for Glitch.
 else:
  part('wide chassis',0,0,.95,1.7,.9,.65,cream); part('wide CRT',0,-.05,1.7,1.8,.85,.95,teal)
  part('screen',0,-.49,1.7,1.5,.025,.7,dark)
  for dx in [-.4,.4]: part('happy eye',dx,-.51,1.83,.22,.025,.1,yellow)
  part('smile',0,-.51,1.5,.35,.025,.08,yellow)
  for dx in [-.68,.68]:
   part('front broad leg',dx,-.36,.38,.42,.4,.65,cream)
   for toe in [-.12,0,.12]: part('front toe',dx+toe,-.65,.12,.09,.35,.15,teal)
   part('rear thin leg',dx,.48,.4,.12,.12,.7,teal)
   part('rear round foot placeholder',dx,.48,.1,.37,.37,.12,dark)
  part('black cat body',0,.02,2.43,.45,.4,.55,dark); part('cat head',0,-.05,2.85,.48,.4,.4,dark)
  for dx in [-.17,.17]: part('cat ear',dx,-.03,3.12,.13,.23,.2,dark)
 # Group heroes for orientation and weapon rigs; always exist in the world.
 objects=set(bpy.data.objects)-start
 root=bpy.data.objects.new(name+' ROOT',None);scene.collection.objects.link(root);root.location=(x,y,0);bpy.context.view_layer.update()
 for o in objects:
  o.parent=root;o.matrix_parent_inverse=root.matrix_world.inverted()
 hero_groups.append(root)
 if i==0:
  pivot=bpy.data.objects.new('Warrior sword wrist',None);scene.collection.objects.link(pivot);pivot.location=(x-.9,y-.25,1.0);bpy.context.view_layer.update()
  swordparts=[cube('Sword grip',(x-.9,y-.25,1.0),(.12,.14,.42),brown),cube('Sword guard',(x-.9,y-.25,1.25),(.5,.2,.1),yellow),cube('Sword silver blade',(x-.9,y-.25,2.05),(.19,.08,1.55),cream)]
  for o in swordparts:o.parent=pivot;o.matrix_parent_inverse=pivot.matrix_world.inverted()
  for t,a in [(0,0),(7,0),(7.35,-1.1),(7.65,.8),(8,0),(8.3,-1.1),(8.65,.8),(9,0)]:
   pivot.rotation_euler.y=a;pivot.keyframe_insert(data_path='rotation_euler',frame=round(t*24)+1)
 if i==3:
  # Robot's front points toward +Y, away from the backward-facing camera.
  root.rotation_euler.z=math.pi
  # Weapon is fixed in the world-facing forward direction, held by the right arm.
  cube('Robot blaster grip',(x+.95,y+.25,1.25),(.2,.25,.45),dark)
  cube('Robot blaster body',(x+.95,y+.62,1.53),(.45,.9,.4),cream)
  cube('Robot blaster barrel',(x+.95,y+1.2,1.53),(.25,.6,.24),teal)
  cube('Robot blaster muzzle',(x+.95,y+1.52,1.53),(.28,.04,.27),dark)
  for k in range(5):
   bolt=cube('Blaster pulse',(x+.95,y+1.65,1.53),(.08,.6,.08),blue)
   for t,dy,sc in [(12.1+k*.28,1.65,0),(12.12+k*.28,1.65,1),(12.30+k*.28,5.5,1),(12.32+k*.28,5.5,0)]:
    bolt.location.y=y+dy;bolt.scale=(sc,sc,sc);bolt.keyframe_insert(data_path='location',frame=round(t*24)+1);bolt.keyframe_insert(data_path='scale',frame=round(t*24)+1)
 label(name,(x,y-.7,3.55),.32)
# Open field, low polygon hills and sparse trees, no room-like barriers.
leaf=mat('Angular foliage',(.18,.42,.07)); stone=mat('Weathered stone',(.34,.4,.28)); bark=mat('Wood',(.26,.13,.045)); pathmat=mat('Earth path',(.32,.25,.10))
def ico(name,loc,scale,ma,sub=1):
 bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=sub,radius=1,location=loc);o=bpy.context.object;o.name=name;o.scale=scale;o.data.materials.append(ma);return o
for x,y,sz in [(-18,5,1),(18,-5,1),(-18,-17,1),(18,-29,1),(-18,-41,.8),(19,16,1.7),(-21,17,1.9)]:
 ico('Grassy rolling hill',(x,y,-.45),(6*sz,4.5*sz,3.3*sz),ground,2)
 for dx,dy in [(-2,1),(2,-1)]:
  ico('Low angular rock',(x+dx,y+dy,.6),(1.6,1.2,1.3),stone)
 for dx,dy in [(-1,0),(3,2)]:
  tx,ty=x+dx,y+dy
  cube('Sparse tree trunk',(tx,ty,2.5),(.35,.4,5),bark)
  ico('Angular tree crown',(tx,ty,4.8),(2.2,1.5,.9),leaf)
  ico('Offset tree crown',(tx+1,ty,5.5),(1.6,1.2,.7),leaf)
for x,y in [(-14,-8),(13,-17),(-15,-29)]:
 for dx in [0,2.2]: cube('Broken ruin column',(x+dx,y,1.2),(.65,.7,2.4),stone)
 cube('Ruin fallen stone',(x+.8,y-.7,.3),(1.3,.8,.6),stone)
for x,y,ma in [(12,-11,pink),(-13,-21,teal),(14,-30,yellow)]:
 cube('Giant mushroom stem',(x,y,1.4),(.3,.3,2.8),cream)
 ico('Giant mushroom cap',(x,y,2.8),(1.5,1.5,.5),ma,2)
for x,y,rx,ry,h in [(3,-6,3.7,3.1,4.2),(-.5,-19,5,3.1,4.2),(-1,-31,4,3.0,4.2)]:
 ico('Sightline grassy hill',(x,y,-.5),(rx,ry,h),ground,2)
 ico('Sightline rock',(x,y+.5,1.8),(.9,.8,1.0),stone)
# Grounded crowds, exact anatomy: 2 arms, 2 legs, 2 cross-shaped eyes.
# Each group is a permanent part of the field, never toggled for the shot.
mob_roots=[]
for stage,(hx,hy) in enumerate(positions):
 # Robot fires forward (+Y) into a crowd 4.5-8m away; other groups surround the hero.
 if stage==3:
  offsets=[(-2,4.5),(0,5),(2,5.5),(-3,6.3),(-1,6.8),(1,7),(3,7.8),(-2.5,8),(0,8.5),(2,8.8)]
 else:
  side=1 if hx>0 else -1
  offsets=[(-2.3,-1),(2.3,-.8),(side*2.8,.6),(side*3,2.5),(side*1.4,3.3),(-.5,3.4),(side*4,4.5),(side*2,5.2),(side*4.5,1.3),(side*.3,5.8)]
 for j,(dx,dy) in enumerate(offsets):
  x,y=hx+dx,hy+dy
  # Keep the central camera corridor clear.
  route_x=7*math.sin((y+3)*math.pi/24)
  if abs(x-route_x)<2.0:x=route_x+(2.0 if hx>=route_x else -2.0)
  start=set(bpy.data.objects);kind=(stage+j)%3
  cloak=[teal,red,leaf][kind];h=[1.5,1.65,.95][kind];w=[.36,.58,.48][kind]
  ico('Mob hood',(x,y,h*.74),(w,.34,h*.4),cloak,1)
  cube('Mob wooden face',(x,y-.32,h*.86),(w*1.25,.07,.32),bark)
  for side in [-1,1]:
   ex=x+side*w*.35;eyeMat=blue if kind==0 else yellow
   cube('Mob eye vertical',(ex,y-.365,h*.89),(.04,.025,.13),eyeMat)
   cube('Mob eye horizontal',(ex,y-.367,h*.89),(.11,.025,.04),eyeMat)
   horn=cube('Mob branch horn',(x+side*w*.7,y,h*1.2),(.07,.08,.3),bark);horn.rotation_euler.y=side*.4
   cube('Mob leg',(x+side*w*.42,y,.22),(.13,.18,.44),bark)
   cube('Mob foot',(x+side*w*.42,y-.06,.08),(.16,.28,.16),bark)
   cube('Mob arm',(x+side*(w+.09),y,.56),(.15,.18,.55),bark)
  if kind==1:cube('Mob wooden backpack',(x,y+.35,1.05),(.65,.35,.85),bark)
  root=bpy.data.objects.new('MOB_%s_%02d'%(names[stage],j),None);scene.collection.objects.link(root);root.location=(x,y,0);bpy.context.view_layer.update()
  for o in set(bpy.data.objects)-start:
   if o==root:continue
   o.parent=root;o.matrix_parent_inverse=root.matrix_world.inverted()
  mob_roots.append(root)
  # A small ground-level recoil. No flying bodies or airborne crowd placement.
  if stage!=2 and j<3:
   for t,offset in [(0,0),(windows[stage][0]+.3,0),(windows[stage][0]+.6,.6),(windows[stage][0]+1,.8),(18,.8)]:
    root.location=(x+(1 if dx>0 else -1)*offset,y+offset*.3,0);root.keyframe_insert(data_path='location',frame=min(432,round(t*24)+1))
# Simple punch beats only for warrior and monkey; Glitch remains neutral.
for o in list(bpy.data.objects):
 if o.name.startswith('MONKEY long arm'):
  stage=0 if o.name.startswith('WARRIOR') else 1
  for dt,angle in [(0,0),(.3,-.55),(.5,.8),(.8,0),(1.1,-.55),(1.3,.8),(1.5,0)]:
   o.rotation_euler.x=angle;o.keyframe_insert(data_path='rotation_euler',frame=round((windows[stage][0]+dt)*24)+1)
# Skeleton placeholder faces camera at negative Y.
sx,sy=0,-47
cube('Skateboard',(sx,sy,.12),(1.3,.65,.15),blue)
skel=cube('Skeleton torso',(sx,sy,1.3),(.65,.35,.8),bone)
head=cube('Skeleton head',(sx,sy,2.05),(.65,.55,.65),bone)
for dx in [-.16,.16]:
 eye=cube('Skeleton eye socket',(dx,sy-.285,2.12),(.15,.025,.14),bossmat)
 eye.parent=head; eye.matrix_parent_inverse=head.matrix_world.inverted()
for dx in [-.22,.22]: cube('Skeleton legs',(sx+dx,sy,.65),(.15,.17,.8),bone)
hand=cube('Skeleton camera-grabbing hand',(.8,sy-.2,1.5),(.3,.25,.3),bone)
reach=cube('Skeleton reaching arm',(.55,sy-.3,1.7),(.16,.8,.16),bone)
for t,pos in [(0,(.55,sy-.3,1.7)),(13,(.55,sy-.3,1.7)),(15,(.48,sy-.65,1.9)),(18,(.48,sy-.65,1.9))]:
 reach.location=pos; reach.keyframe_insert(data_path='location',frame=round(t*24)+1)
cube('Pink skeleton cap',(0,sy,2.41),(.73,.65,.14),pink)
cube('Cap brim',(0,sy-.37,2.38),(.7,.36,.06),pink)
for dx in [-.23,.23]:
 cube('Black sneakers',(dx,sy-.12,.29),(.27,.48,.2),dark)
 for dy in [-.25,.25]: cube('Turquoise skate wheel',(dx*2,sy+dy,.07),(.17,.17,.17),teal)
for dx in [-.16,.16]: cube('Blue skeleton pupil',(dx,sy-.305,2.12),(.065,.025,.08),blue)
label('SKELETON / CAMERA CATCH',(0,-47,3.2))
def frame(t): return round(t*24)+1
for t,loc in [(0,(.8,sy-.2,1.5)),(13,(.8,sy-.2,1.5)),(15,(.48,-48.2,2.1)),(18,(.48,-48.2,2.1))]:
 hand.location=loc; hand.keyframe_insert(data_path='location',frame=min(432,frame(t)))
for t,y in [(0,sy),(15.8,sy),(16.4,sy-.65),(16.8,sy),(18,sy)]:
 head.location.y=y; head.keyframe_insert(data_path='location',frame=min(432,frame(t)))
bpy.ops.object.camera_add(); cam=bpy.context.object; cam.name='Camera — backward waist-height flight'; scene.camera=cam; cam.data.lens=29; cam.data.clip_end=200
# Smooth time-parametrized flight: no hero look-at targets, no camera stops.
def smooth(u):
 u=max(0,min(1,u));return u*u*u*(u*(u*6-15)+10)
def hermite(a,b,va,vb,u,duration):
 return (2*u**3-3*u*u+1)*a+(u**3-2*u*u+u)*duration*va+(-2*u**3+3*u*u)*b+(u**3-u*u)*duration*vb
keys=[]
lastq=None
cam.rotation_mode='QUATERNION';cam.data.lens=21
for f in range(1,433):
 t=(f-1)/24
 if t<5:
  u=smooth(t/5);pos=Vector((0,12-4*u,23-5*u));target=Vector((0,25,23-2*u))
 elif t<7:
  u=(t-5)/2;y=hermite(8,-3,-1,-6.5,u,2);z=18+(1.2-18)*smooth(u)
  pos=Vector((0,y,z));tilt=smooth(u);target=pos+Vector((0,15,3*(1-tilt)+.10*tilt))
 elif t<13.65:
  y=-3-6.5*(t-7);x=7*math.sin((y+3)*math.pi/24)*smooth((t-7)/.7);z=1.2+.035*math.sin(t*1.2)
  pos=Vector((x,y,z))
  # Small, slowly changing yaw follows the route with an intentionally long look-back.
  target=pos+Vector((1.5*math.sin((y+10)*math.pi/32)*smooth((t-7)/.7),16,.12))
 elif t<15:
  u=(t-13.65)/1.35;y=hermite(-46.225,-48.4,-6.5,0,u,1.35)
  x0=7*math.sin((-46.225+3)*math.pi/24);vx0=-6.5*7*math.pi/24*math.cos((-46.225+3)*math.pi/24)
  x=hermite(x0,0,vx0,0,u,1.35)
  z=1.2+(2.65-1.2)*smooth(u/.55) if u<.55 else 2.65+(2.1-2.65)*smooth((u-.55)/.45)
  pos=Vector((x,y,z))
  # Blend smoothly from the flight direction to the skeleton only at the catch.
  direction=Vector((1.5*math.sin((-46.225+10)*math.pi/32),16,.12)).lerp(Vector((0,-47,2.05))-pos,smooth(u));target=pos+direction
 else:
  u=t-15;pos=Vector((.02*math.sin(u*1.1),-48.4,2.1));target=Vector((0,-47,2.05))
  if 16.25<t<16.65:pos.y-=.09*math.sin((t-16.25)/.4*math.pi)
 cam.location=pos;q=(target-pos).to_track_quat('-Z','Y')
 if lastq is not None and q.dot(lastq)<0:q.negate()
 cam.rotation_quaternion=q;lastq=q.copy();cam.keyframe_insert(data_path='location',frame=f);cam.keyframe_insert(data_path='rotation_quaternion',frame=f)
 if f%12==1:keys.append((t,tuple(pos),tuple(target)))
# Linear between dense samples reproduces the analytic smooth path without Bezier overshoot.
for action in bpy.data.actions:
 for layer in action.layers:
  for strip in layer.strips:
   for bag in strip.channelbags:
    for fc in bag.fcurves:
     if action==cam.animation_data.action:
      for k in fc.keyframe_points:k.interpolation='LINEAR'
for t,txt in [(0,'SKY / LIGHTNING PLACEHOLDER'),(2,'EYE / RIFT — STATIC BOSS'),(5,'PULL BACK / ACCELERATE'),(7,'WAIST HEIGHT / BACKWARD'),(13,'ONE RISE TO SKELETON'),(15,'HAND CATCH'),(16.4,'HEAD IMPACT / CRACKS')]: scene.timeline_markers.new(txt,frame=frame(t))
# A wrist rig takes control after the grab; camera inherits its sway.
grip=bpy.data.objects.new('Skeleton wrist camera driver',None);scene.collection.objects.link(grip)
for t,loc,roll in [(0,(0,0,0),0),(15,(0,0,0),0),(15.35,(.04,-.025,.025),.035),(15.8,(-.02,.015,-.015),-.025),(16.4,(.02,0,0),.015),(16.55,(.09,-.1,.03),.09),(18,(.02,0,0),.025)]:
 grip.location=loc;grip.rotation_euler.y=roll;grip.keyframe_insert(data_path='location',frame=min(432,frame(t)));grip.keyframe_insert(data_path='rotation_euler',frame=min(432,frame(t)))
con=cam.constraints.new('CHILD_OF');con.name='Caught by skeleton wrist';con.target=grip
con.influence=0;con.keyframe_insert(data_path='influence',frame=frame(14.9));con.influence=1;con.keyframe_insert(data_path='influence',frame=frame(15))
# Knuckles and curled fingers wrap the lens border rather than filling its center.
for i,(x,y,rz) in enumerate([(.19,.095,.2),(.185,.04,.1),(.185,-.025,-.15),(.13,.115,1.2)]):
 for j in range(2):
  o=cube('Lens gripping bone finger', (0,0,0),(.045,.025,.025),bone);o.parent=cam;o.location=(x-.024*j,y,-.32-.015*j);o.rotation_euler.z=rz
  o.scale=(0,0,0);o.keyframe_insert(data_path='scale',frame=frame(14.65));o.scale=(1,1,1);o.keyframe_insert(data_path='scale',frame=frame(15))
# Route curve is a viewport guide; hidden from camera renders.
cu=bpy.data.curves.new('Camera path guide','CURVE'); cu.dimensions='3D'; cu.bevel_depth=.035
sp=cu.splines.new('POLY'); sp.points.add(len(keys)-1)
for point,(_,pos,_) in zip(sp.points,keys): point.co=(*pos,1)
route=bpy.data.objects.new('Camera path — viewport only',cu); scene.collection.objects.link(route); route.data.materials.append(blue); route.hide_render=True
scene['mob_count']=len(mob_roots)
scene['camera_motion']='Continuous analytical backward path; no hero targeting; all crowds grounded.'
scene['notes']='18s blockout. Boss static. Camera travels backward at waist height with minimal vertical variation, one rise at skeleton. Cubes are motion placeholders; no final visuals.'
# Cracked glass stays attached to the camera after head impact.
crackmat=mat('Cracked lens dark',(.025,.025,.025))
for i,pts in enumerate([[(0,0),(-.05,.03),(-.09,.025),(-.14,.07)],[(0,0),(.04,.025),(.08,.07)],[(0,0),(.04,-.025),(.1,-.04),(.16,-.08)],[(0,0),(-.025,-.04),(-.06,-.075)],[(.04,.025),(.075,.015),(.13,.03)]]):
 c=bpy.data.curves.new('Lens crack','CURVE'); c.dimensions='3D'; c.bevel_depth=.0007; s=c.splines.new('POLY'); s.points.add(len(pts)-1)
 for p,(x,y) in zip(s.points,pts): p.co=(x,y,-.3,1)
 o=bpy.data.objects.new('Crack '+str(i),c); scene.collection.objects.link(o); o.parent=cam; c.materials.append(crackmat)
 o.scale=(0,0,0); o.keyframe_insert(data_path='scale',frame=394)
 o.scale=(1,1,1); o.keyframe_insert(data_path='scale',frame=395)
# Review the real scene from above before generating an overall visual reference.
scene.frame_set(300)
bpy.ops.object.camera_add(location=(35,-63,45));overview=bpy.context.object;overview.name='Overview actual layout';overview.data.type='ORTHO';overview.data.ortho_scale=76;overview.rotation_euler=(Vector((0,-17,0))-overview.location).to_track_quat('-Z','Y').to_euler()
scene.camera=overview
scene.render.image_settings.file_format='PNG';scene.render.filepath=os.path.join(OUT,'layout-overview.png');bpy.ops.render.render(write_still=True)
# Top plan includes the actual route, shown only for this diagnostic render.
bpy.ops.object.camera_add(location=(0,-16,80));top=bpy.context.object;top.name='Top plan';top.data.type='ORTHO';top.data.ortho_scale=81;top.rotation_euler=(0,0,0)
route.hide_render=False;scene.camera=top;top.rotation_euler=(Vector((0,-16,0))-top.location).to_track_quat('-Z','Y').to_euler();scene.render.filepath=os.path.join(OUT,'layout-top.png');bpy.ops.render.render(write_still=True);route.hide_render=True
scene.camera=cam;scene.frame_set(1)
import json
with open(os.path.join(OUT,'scene-metrics.json'),'w') as file:json.dump({'ground_width_m':52,'ground_length_m':104,'hero_positions':positions,'mobs_per_group':10,'total_mobs':len(mob_roots),'camera_lens_mm':cam.data.lens,'ground_flight_height_m':1.2,'skeleton_position':[sx,sy],'robot_facing':'+Y, away from camera; mobs 4.5-8.8m ahead','duration_seconds':18},file,indent=2)
scene.frame_set(1)
for area in bpy.context.screen.areas:
 if area.type=='VIEW_3D': area.spaces.active.region_3d.view_perspective='CAMERA'
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT,'camera_blockout_18s_v4.blend'))
scene.render.image_settings.file_format='PNG'; scene.render.filepath=os.path.join(OUT,'preview','frame_'); os.makedirs(os.path.join(OUT,'preview'),exist_ok=True)
bpy.ops.render.render(animation=True)

