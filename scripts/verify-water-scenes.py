"""Read-only verification of generated Blender theatre files."""
import bpy
import json
from pathlib import Path

root = Path(__file__).resolve().parent.parent / '资料库'
reports = []
for path in sorted(root.rglob('*_可编辑水面_v001.blend')):
    bpy.ops.wm.open_mainfile(filepath=str(path))
    scene = bpy.context.scene
    water = next(o for o in scene.objects if o.name.startswith('WATER_'))
    keys = water.data.shape_keys.key_blocks
    values = []
    for frame in (1, 31, 61, 91, 121):
        scene.frame_set(frame)
        values.append([round(k.value, 4) for k in list(keys)[1:]])
    report = dict(file=str(path.relative_to(root)), vertices=len(water.data.vertices),
                  shapeKeys=len(keys), waveValues=values,
                  packedImages=sum(bool(i.packed_file) for i in bpy.data.images),
                  duration=scene.frame_end/scene.render.fps,
                  stage=scene.get('asset_stage'))
    assert report['vertices'] > 8000
    assert report['shapeKeys'] == 5
    assert report['packedImages'] >= 1
    assert values[0] == values[-1] and values[0] != values[1]
    reports.append(report)
assert len(reports) == 4
print('VERIFIED_SCENES_JSON=' + json.dumps(reports, ensure_ascii=False))
