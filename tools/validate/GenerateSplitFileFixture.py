import adsk.core
import adsk.fusion
import os
import traceback


OUTPUT_PATH = r'C:\src\fluidnc-posts\fixtures\expected\fusion\split-file\fixture-split-file.f3d'


def mm(value: float) -> float:
    # Fusion's internal length unit is centimeters.
    return value / 10.0


def point_mm(x: float, y: float, z: float = 0.0) -> adsk.core.Point3D:
    return adsk.core.Point3D.create(mm(x), mm(y), mm(z))


def centroid_distance(profile: adsk.fusion.Profile, x_mm: float, y_mm: float) -> float:
    props = profile.areaProperties(adsk.fusion.CalculationAccuracy.LowCalculationAccuracy)
    center = props.centroid
    dx = center.x - mm(x_mm)
    dy = center.y - mm(y_mm)
    return (dx * dx + dy * dy) ** 0.5


def profile_near(sketch: adsk.fusion.Sketch, x_mm: float, y_mm: float) -> adsk.fusion.Profile:
    best = None
    best_distance = None
    for i in range(sketch.profiles.count):
        profile = sketch.profiles.item(i)
        distance = centroid_distance(profile, x_mm, y_mm)
        if best is None or distance < best_distance:
            best = profile
            best_distance = distance
    if best is None:
        raise RuntimeError('Failed to find profile near ({}, {}).'.format(x_mm, y_mm))
    return best


def highest_planar_face(body: adsk.fusion.BRepBody) -> adsk.fusion.BRepFace:
    best = None
    best_z = None
    for face in body.faces:
        try:
            center = face.centroid
        except:
            continue
        if best is None or center.z > best_z:
            best = face
            best_z = center.z
    if best is None:
        raise RuntimeError('Failed to locate top face.')
    return best


def extrude_cut(root: adsk.fusion.Component, profile: adsk.fusion.Profile, depth_expr: str) -> adsk.fusion.ExtrudeFeature:
    extrudes = root.features.extrudeFeatures
    cut_input = extrudes.createInput(profile, adsk.fusion.FeatureOperations.CutFeatureOperation)
    distance = adsk.core.ValueInput.createByString(depth_expr)
    extent = adsk.fusion.DistanceExtentDefinition.create(distance)
    cut_input.setOneSideExtent(extent, adsk.fusion.ExtentDirections.NegativeExtentDirection)
    return extrudes.add(cut_input)


def build_fixture() -> str:
    app = adsk.core.Application.get()
    design = adsk.fusion.Design.cast(app.activeProduct)
    if not design:
        raise RuntimeError('Active product is not a Fusion design.')

    design.fusionUnitsManager.distanceDisplayUnits = adsk.fusion.DistanceUnits.MillimeterDistanceUnits
    root = design.rootComponent
    sketches = root.sketches
    extrudes = root.features.extrudeFeatures

    base_sketch = sketches.add(root.xYConstructionPlane)
    base_sketch.name = 'sketch_base_outline'
    base_sketch.sketchCurves.sketchLines.addTwoPointRectangle(point_mm(0, 0), point_mm(100, 60))

    base_profile = profile_near(base_sketch, 50, 30)
    base_distance = adsk.core.ValueInput.createByString('10 mm')
    base_feature = extrudes.addSimple(base_profile, base_distance, adsk.fusion.FeatureOperations.NewBodyFeatureOperation)
    body = base_feature.bodies.item(0)
    body.name = 'split_fixture_plate'

    top_face = highest_planar_face(body)

    pocket_sketch = sketches.add(top_face)
    pocket_sketch.name = 'sketch_inner_pocket'
    pocket_sketch.sketchCurves.sketchLines.addTwoPointRectangle(point_mm(25, 15), point_mm(75, 45))

    hole_sketch = sketches.add(top_face)
    hole_sketch.name = 'sketch_bore_hole'
    hole_sketch.sketchCurves.sketchCircles.addByCenterRadius(point_mm(82, 18), mm(6))
    hole_profile = profile_near(hole_sketch, 82, 18)
    hole_feature = extrude_cut(root, hole_profile, '10 mm')
    hole_feature.name = 'bore_hole'

    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    export_manager = design.exportManager
    archive_options = export_manager.createFusionArchiveExportOptions(OUTPUT_PATH)
    if not archive_options:
        raise RuntimeError('Failed to create Fusion archive export options.')
    if not export_manager.execute(archive_options):
        raise RuntimeError('Fusion archive export failed.')

    return OUTPUT_PATH


def run(context):
    ui = None
    try:
        app = adsk.core.Application.get()
        ui = app.userInterface
        app.documents.add(adsk.core.DocumentTypes.FusionDesignDocumentType)
        output = build_fixture()
        if ui:
            ui.messageBox('Created split-file fixture archive:\n{}'.format(output))
    except:
        if ui:
            ui.messageBox('GenerateSplitFileFixture failed:\n{}'.format(traceback.format_exc()))
        else:
            print(traceback.format_exc())
