import bpy, math, os, sys
from mathutils import Vector
# Labelled top plan of revision-06 for drawing changes on: heroes, timings along the camera route, 10 m grid.
ROOT=os.path.dirname(os.path.abspath(__file__));OUT=os.path.join(ROOT,'revision-06')
bpy.ops.wm.open_mainfile(filepath=os.path.join(OUT,'camera_previs_22s_v6.blend'))
scene=bpy.context.scene;scene.frame_set(100)  # Mainframe is out, every crowd still at its start position
def mat(name,c):
 m=bpy.data.materials.new(name);m.diffuse_color=(*c,1);return m
ink=mat('Label ink',(1,1,1));gridmat=mat('Grid',(.55,.75,.45));tick=mat('Time tick',(1,.9,.1))
def label(txt,x,y,size=2.2,ma=ink):
 cu=bpy.data.curves.new(txt,'FONT');cu.body=txt;cu.size=size;cu.align_x='CENTER';cu.align_y='CENTER';cu.extrude=.05
 o=bpy.data.objects.new(txt,cu);scene.collection.objects.link(o);o.location=(x,y,12);cu.materials.append(ma);return o
def bar(x,y,w,h,ma):
 bpy.ops.mesh.primitive_plane_add(size=1,location=(x,y,.05));o=bpy.context.object;o.scale=(w,h,1);o.data.materials.append(ma)
for x in range(-30,31,5): bar(x,-21,.06 if x%10 else .12,100,gridmat)
for y in range(-70,31,5):
 bar(0,y,66,.06 if y%10 else .12,gridmat)
 if y%10==0: label('%d м'%y,-29,y+.8,.9)
route=scene.objects['Camera path — viewport only'];route.hide_render=False
cam=scene.objects['Camera'];
for k in range(10,37):
 t=k/2;scene.frame_set(round(t*24)+1);p=cam.matrix_world.translation
 bpy.ops.mesh.primitive_uv_sphere_add(radius=.35 if k%2 else .5,location=(p.x,p.y,10));bpy.context.object.data.materials.append(tick)
 if k%2==0: label('%d с'%t,p.x+(2.4 if p.x<=0 else -2.4),p.y,1.0,tick)
scene.frame_set(100)
for name,txt in [('WARRIOR','ВОИН\n7–9,5 с'),('MONKEY','ОБЕЗЬЯНА\n9,5–12 с'),('GLITCH','ГЛИТЧ\n12–14,5 с'),('CAT ROBOT','РОБОТ С КОШКОЙ\n14,5–17 с'),('SKELETON','СКЕЛЕТ\nзахват 18,3 с')]:
 p=scene.objects[name].matrix_world.translation;label(txt,p.x+(7 if p.x>0 else -7),p.y-4.5,1.1)
label('↑ МАЙНФРЕЙМ В НЕБЕ: ещё ~60 м вперёд, высота 40 м',0,27,1.1)
label('камера спускается из неба 0–5 с',12,21,.9)
for o in scene.objects:
 if o.name.startswith(('Cloud','Lightning')): o.hide_render=True
bpy.ops.object.camera_add(location=(0,-21,200));top=bpy.context.object;top.data.type='ORTHO';top.data.ortho_scale=100;top.data.clip_end=500
scene.camera=top;scene.render.resolution_x=1600;scene.render.resolution_y=2400;scene.display.shading.show_shadows=False
scene.render.filepath=os.path.join(OUT,'top-view-for-notes.png');bpy.ops.render.render(write_still=True)
