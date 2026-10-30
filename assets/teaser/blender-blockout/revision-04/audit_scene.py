import bpy,json,math,os
from mathutils import Vector
scene=bpy.context.scene;cam=scene.objects.get('Camera — backward waist-height flight')
report={'crowds':[],'camera':{},'collisions':[]}
for root in [o for o in scene.objects if o.name.startswith('MOB_')]:
 names=[o.name for o in root.children]
 counts={p:sum(n.startswith(p) for n in names) for p in ['Mob arm','Mob leg','Mob eye vertical']}
 report['crowds'].append({'name':root.name,**counts})
 assert all(v==2 for v in counts.values()),(root.name,counts)
 assert abs(root.location.z)<.001
last=None;maxstep=0
for f in range(169,328):
 scene.frame_set(f);p=cam.matrix_world.translation.copy()
 if last is not None:maxstep=max(maxstep,(p-last).length)
 last=p
 for o in scene.objects:
  if 'Grassy rolling hill' not in o.name and 'Sightline grassy hill' not in o.name:continue
  d=p-o.location;test=sum((d[i]/o.scale[i])**2 for i in range(3))
  if test<1:report['collisions'].append({'frame':f,'hill':o.name})
report['camera']={'max_ground_frame_step_m':maxstep,'all_mob_parts_correct':True,'mob_count':len(report['crowds'])}
with open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'verification.json'),'w') as file:json.dump(report,file,indent=2)
print('AUDIT',len(report['crowds']),maxstep,'hill overlaps',len(report['collisions']))
