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
for x in range(-50,51,10): bar(x,10,.12,190,gridmat)
for y in range(-80,101,10):
 bar(0,y,100,.12,gridmat);label('%d м'%y,-46,y+1.2,1.3)
route=scene.objects['Camera path — viewport only'];route.hide_render=False
cam=scene.objects['Camera'];
for t in range(5,19):
 scene.frame_set(round(t*24)+1);p=cam.matrix_world.translation
 bpy.ops.mesh.primitive_uv_sphere_add(radius=.7,location=(p.x,p.y,10));bpy.context.object.data.materials.append(tick)
 label('%d с'%t,p.x+(3.5 if p.x<=0 else -3.5),p.y,1.5,tick)
scene.frame_set(100)
for name,txt in [('WARRIOR','ВОИН\n7–9,5 с'),('MONKEY','ОБЕЗЬЯНА\n9,5–12 с'),('GLITCH','ГЛИТЧ\n12–14,5 с'),('CAT ROBOT','РОБОТ С КОШКОЙ\n14,5–17 с'),('SKELETON','СКЕЛЕТ\nзахват 18,3 с')]:
 p=scene.objects[name].matrix_world.translation;label(txt,p.x+(9 if p.x>0 else -9),p.y,1.8)
label('МАЙНФРЕЙМ В НЕБЕ\n(высота 40 м)',0,70,2.4)
label('КАМЕРА СТАРТУЕТ\nв небе, 0–5 с',14,22,1.8)
for o in scene.objects:
 if o.name.startswith(('Cloud','Lightning')): o.hide_render=True
bpy.ops.object.camera_add(location=(0,8,200));top=bpy.context.object;top.data.type='ORTHO';top.data.ortho_scale=180;top.data.clip_end=500
scene.camera=top;scene.render.resolution_x=1200;scene.render.resolution_y=2000;scene.display.shading.show_shadows=False
scene.render.filepath=os.path.join(OUT,'top-view-for-notes.png');bpy.ops.render.render(write_still=True)
