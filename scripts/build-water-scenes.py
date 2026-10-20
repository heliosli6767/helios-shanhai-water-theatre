"""Build four editable 2.5D theatre scenes: concept backplate + genuine 3D water/props.
Run in Blender, not system Python. Images are packed; no external web downloads.
The concept illustration is not converted into fully sculpted scenery or character rigs.
"""
import bpy
import math
import random
import sys
from pathlib import Path
from mathutils import Vector

ROOT = Path(__file__).resolve().parent.parent
LIB = ROOT / '资料库'
SCENES = [
    ('首页_山海群像', '01_首页_山海水戏/01_背景/山海群像水上剧场', '山海群像_3D风格概念_v001.png', 0.055),
    ('精卫01_发鸠山', '02_故事/01_精卫填海/01_背景/第一幕_发鸠山与山林', '发鸠山_3D风格概念_v001.png', 0.045),
    ('精卫02_明亮暴风东海', '02_故事/01_精卫填海/01_背景/第二幕_明亮暴风东海', '明亮暴风东海_3D风格概念_v001.png', 0.22),
    ('精卫03_海礁新陆', '02_故事/01_精卫填海/01_背景/第三幕_海上礁石与渐生陆地', '海礁新陆_3D风格概念_v001.png', 0.065),
]

def material(name, color, roughness=0.4, metallic=0.0):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = (*color, 1)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get('Principled BSDF')
    bsdf.inputs['Base Color'].default_value = (*color, 1)
    bsdf.inputs['Roughness'].default_value = roughness
    bsdf.inputs['Metallic'].default_value = metallic
    return mat

def assign(obj, mat):
    obj.data.materials.append(mat)
    return obj

def aim(obj, target):
    obj.rotation_euler = (Vector(target) - obj.location).to_track_quat('-Z', 'Y').to_euler()

def sphere(name, xyz, scale, mat):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=20, ring_count=12, location=xyz)
    obj = bpy.context.object
    obj.name = name
    obj.scale = scale
    assign(obj, mat)
    for p in obj.data.polygons:
        p.use_smooth = True
    return obj

def build(entry):
    name, folder, image_name, amplitude = entry
    random.seed(12)
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.name = name
    scene.render.engine = 'CYCLES'
    scene.cycles.device = 'CPU'
    scene.cycles.samples = 12
    scene.cycles.use_denoising = True
    scene.render.resolution_x = 1280
    scene.render.resolution_y = 720
    scene.render.resolution_percentage = 100
    scene.render.fps = 24
    scene.frame_start, scene.frame_end = 1, 120
    scene.world = bpy.data.worlds.new('柔和青绿环境光')
    scene.world.use_nodes = True
    scene.world.node_tree.nodes['Background'].inputs[0].default_value = (0.28, 0.43, 0.46, 1)
    scene.world.node_tree.nodes['Background'].inputs[1].default_value = 0.7
    scene.view_settings.view_transform = 'Standard'
    scene.view_settings.look = 'None'

    bpy.ops.object.camera_add(location=(0, -22, 12))
    cam = bpy.context.object
    cam.name = 'CAM_水戏主镜头'
    cam.data.type = 'ORTHO'
    cam.data.ortho_scale = 34
    aim(cam, (0, 5, 2))
    scene.camera = cam
    direction = cam.rotation_euler.to_quaternion() @ Vector((0, 0, -1))
    bpy.ops.mesh.primitive_plane_add(size=2, location=cam.location + direction * 48)
    back = bpy.context.object
    back.name = 'BACKPLATE_概念背景图_非独立角色模型'
    back.rotation_euler = cam.rotation_euler
    back.scale = (17.05, 17.05 * 9 / 16, 1)
    art = bpy.data.images.load(str(LIB / folder / '02_图片' / image_name))
    art.pack()
    mat = bpy.data.materials.new('概念背景_内嵌图像')
    mat.use_nodes = True
    nodes, links = mat.node_tree.nodes, mat.node_tree.links
    nodes.clear()
    tex = nodes.new('ShaderNodeTexImage'); tex.image = art
    em = nodes.new('ShaderNodeEmission')
    out = nodes.new('ShaderNodeOutputMaterial')
    links.new(tex.outputs['Color'], em.inputs['Color'])
    links.new(em.outputs[0], out.inputs['Surface'])
    assign(back, mat)

    # Genuine editable mesh with four periodic wave shapes, five seconds per cycle.
    cols, rows = 100, 85
    verts = [(x / cols * 40 - 20, y / rows * 40 - 22, 0) for y in range(rows + 1) for x in range(cols + 1)]
    faces = []
    for y in range(rows):
        for x in range(cols):
            i = y * (cols + 1) + x
            faces.append((i, i + 1, i + cols + 2, i + cols + 1))
    mesh = bpy.data.meshes.new('水面网格_可编辑')
    mesh.from_pydata(verts, [], faces); mesh.update()
    water = bpy.data.objects.new('WATER_真实网格_循环波浪', mesh)
    scene.collection.objects.link(water)
    water.shape_key_add(name='Basis')
    for phase in range(4):
        key = water.shape_key_add(name=f'波浪相位_{phase}')
        for vert in key.data:
            x, y = vert.co.x, vert.co.y
            angle = phase * math.pi / 2
            vert.co.z = amplitude * (math.sin(x * 1.1 + y * 0.62 + angle) + 0.45 * math.sin(y * 1.9 - x * 0.35 + angle))
        for idx in range(5):
            key.value = 1.0 if idx % 4 == phase else 0.0
            key.keyframe_insert('value', frame=1 + idx * 30)
    wm = material('水_青玉与金色倒影', (0.055, 0.25, 0.28), 0.16, 0.42)
    nodes, links = wm.node_tree.nodes, wm.node_tree.links
    noise = nodes.new('ShaderNodeTexNoise')
    noise.inputs['Scale'].default_value = 16
    noise.inputs['Detail'].default_value = 3
    bump = nodes.new('ShaderNodeBump')
    bump.inputs['Strength'].default_value = 0.22
    bump.inputs['Distance'].default_value = 0.075
    links.new(noise.outputs['Fac'], bump.inputs['Height'])
    links.new(bump.outputs['Normal'], nodes['Principled BSDF'].inputs['Normal'])
    # Camera-projected art preserves the painted reflection palette; the mesh adds
    # time-varying refraction. A feathered mask protects the ensemble at the sides.
    coords = nodes.new('ShaderNodeTexCoord')
    geom = nodes.new('ShaderNodeNewGeometry')
    separate = nodes.new('ShaderNodeSeparateXYZ')
    links.new(coords.outputs['Window'], separate.inputs[0])
    position = nodes.new('ShaderNodeSeparateXYZ')
    links.new(geom.outputs['Position'], position.inputs[0])
    amount = nodes.new('ShaderNodeMath'); amount.operation = 'MULTIPLY'; amount.inputs[1].default_value = 0.035
    links.new(position.outputs['Z'], amount.inputs[0])
    offset = nodes.new('ShaderNodeCombineXYZ'); links.new(amount.outputs[0], offset.inputs['X'])
    add = nodes.new('ShaderNodeVectorMath'); add.operation = 'ADD'
    links.new(coords.outputs['Window'], add.inputs[0]); links.new(offset.outputs[0], add.inputs[1])
    reflection = nodes.new('ShaderNodeTexImage'); reflection.image = art
    links.new(add.outputs[0], reflection.inputs['Vector'])
    surface_art = nodes.new('ShaderNodeEmission'); links.new(reflection.outputs['Color'], surface_art.inputs['Color'])
    reflect_mix = nodes.new('ShaderNodeMixShader'); reflect_mix.inputs[0].default_value = 0.045
    links.new(surface_art.outputs[0], reflect_mix.inputs[1]); links.new(nodes['Principled BSDF'].outputs[0], reflect_mix.inputs[2])
    def smooth_mask(socket, minimum, maximum, invert=False):
        node = nodes.new('ShaderNodeMapRange'); node.clamp = True; node.interpolation_type = 'SMOOTHSTEP'
        links.new(socket, node.inputs['Value'])
        node.inputs['From Min'].default_value = minimum; node.inputs['From Max'].default_value = maximum
        node.inputs['To Min'].default_value = 1 if invert else 0; node.inputs['To Max'].default_value = 0 if invert else 1
        return node.outputs[0]
    masks = [smooth_mask(separate.outputs['X'], 0.22, 0.31), smooth_mask(separate.outputs['X'], 0.73, 0.83, True), smooth_mask(separate.outputs['Y'], 0.39, 0.48, True)]
    mask = masks[0]
    for nxt in masks[1:]:
        mul = nodes.new('ShaderNodeMath'); mul.operation = 'MULTIPLY'
        links.new(mask, mul.inputs[0]); links.new(nxt, mul.inputs[1]); mask = mul.outputs[0]
    transparent = nodes.new('ShaderNodeBsdfTransparent')
    blend = nodes.new('ShaderNodeMixShader'); links.new(mask, blend.inputs[0])
    links.new(transparent.outputs[0], blend.inputs[1]); links.new(reflect_mix.outputs[0], blend.inputs[2])
    links.new(blend.outputs[0], nodes['Material Output'].inputs['Surface'])
    assign(water, wm)
    for p in mesh.polygons: p.use_smooth = True

    stone = material('礁石_湿润青灰', (0.13, 0.19, 0.17), 0.32)
    jade = material('卵石_青玉', (0.14, 0.40, 0.29), 0.26)
    ochre = material('卵石_暖赭', (0.48, 0.24, 0.10), 0.3)
    red = material('卵石_朱红', (0.42, 0.09, 0.045), 0.34)
    wood = material('枯枝_木纹基础', (0.19, 0.09, 0.035), 0.65)
    for side in [-1, 1]:
        for i in range(5):
            sphere(f'ROCK_岸边礁石_{side}_{i}', (side * (13 + random.random() * 4), -5 + i * 3, -0.28), (1.3 + random.random(), 1.2, 0.6 + random.random()), stone)
    if '03_' in name:
        for i in range(18):
            x = -7 + i * 0.8
            sphere(f'PROP_填海石子_{i:02}', (x, -3 + math.sin(i * 0.5), 0.13), (0.48, 0.38, 0.3), [stone, jade, ochre, red][i % 4])
        bpy.ops.mesh.primitive_cylinder_add(vertices=12, radius=0.10, depth=3.4, location=(3, -3, 0.3), rotation=(0.1, math.pi / 2, 0.2))
        branch = bpy.context.object; branch.name = 'PROP_枯枝_独立网格'; assign(branch, wood)
    if name.startswith('首页'):
        bronze = material('灯笼框_古铜', (0.19, 0.09, 0.028), 0.28, 0.65)
        glow = material('灯笼芯_暖光', (1.0, 0.32, 0.055), 0.45)
        p = glow.node_tree.nodes['Principled BSDF']
        p.inputs['Emission Color'].default_value = (1, 0.2, 0.025, 1)
        p.inputs['Emission Strength'].default_value = 4
        for i, x in enumerate([-12, 12]):
            bpy.ops.mesh.primitive_cylinder_add(vertices=12, radius=0.055, depth=2.8, location=(x, -1, 1.25))
            assign(bpy.context.object, bronze).name = f'灯笼支架_{i}'
            sphere(f'灯笼光芯_{i}', (x, -1, 2.35), (0.23, 0.23, 0.40), glow)
            bpy.ops.object.light_add(type='POINT', location=(x, -1, 2.2))
            lamp = bpy.context.object; lamp.name = f'灯笼光源_{i}'
            lamp.data.color = (1, 0.35, 0.07); lamp.data.energy = 180; lamp.data.shadow_soft_size = 0.45

    for label, xyz, color, power, size in [
        ('金色主光', (-8, -3, 14), (1, 0.76, 0.4), 2300, 11),
        ('青色补光', (10, 7, 10), (0.53, 0.83, 1), 1800, 10),
        ('天光', (0, 12, 16), (1, 0.94, 0.78), 3200, 15),
    ]:
        bpy.ops.object.light_add(type='AREA', location=xyz)
        light = bpy.context.object; light.name = label
        light.data.energy = power; light.data.color = color; light.data.shape = 'DISK'; light.data.size = size
        aim(light, (0, 1, 0))

    text = bpy.data.texts.new('请先阅读_场景说明')
    text.write('这是2.5D水傀儡舞台原型：生成概念图作为内嵌背景板，前景为真实可编辑3D水面、礁石和部分道具。背景图内的角色与远山不是独立网格。\n水面含4个形态键，帧1—120为5秒动画，帧121衔接帧1。\n可编辑相机、灯光、网格、材质和波浪幅度。人物绑定、完整场景重建、流体模拟与MediaPipe接入尚未制作。\n')
    for obj in scene.objects:
        if obj.type == 'MESH' and obj not in (water, back):
            obj.hide_render = True
            obj['purpose'] = 'Optional editable prop blockout, hidden in beauty render; enable after refinement.'
    scene['asset_stage'] = '2.5D_backplate_plus_editable_3D_water'
    scene['not_full_3d_reconstruction'] = True
    scene.frame_set(1)
    for area in bpy.context.screen.areas if bpy.context.screen else []:
        if area.type == 'VIEW_3D':
            area.spaces.active.region_3d.view_perspective = 'CAMERA'
    outdir = LIB / folder / '03_Blender'
    outdir.mkdir(parents=True, exist_ok=True)
    blend = outdir / (name + '_可编辑水面_v001.blend')
    bpy.ops.wm.save_as_mainfile(filepath=str(blend))
    scene.render.image_settings.file_format = 'PNG'
    scene.render.filepath = str(LIB / folder / '02_图片' / (name + '_Blender预览_v001.png'))
    bpy.ops.render.render(write_still=True)
    print('SCENE_READY', blend, flush=True)

if __name__ == '__main__':
    selected = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
    for index, entry in enumerate(SCENES):
        if not selected or str(index) in selected:
            build(entry)
