import adsk.core
import adsk.fusion
import os
import traceback


OUTPUT_PATH = r'C:\src\fluidnc-posts\fixtures\expected\fusion\tiny-segment-storm\fixture-tiny-segment-storm.f3d'


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


def add_wavy_outline(sketch: adsk.fusion.Sketch, width_mm: float, height_mm: float) -> None:
    points = adsk.core.ObjectCollection.create()
    fit_count = 33
    base_y = height_mm
    amplitudes = [0.0, 1.2, -1.0, 0.9, -1.3, 0.8, -1.1, 1.0]

    for i in range(fit_count):
        x = width_mm * i / (fit_count - 1)
        if i == 0 or i == fit_count - 1:
            y = base_y
        else:
            y = base_y + amplitudes[i % len(amplitudes)]
        points.add(point_mm(x, y))

    spline = sketch.sketchCurves.sketchFittedSplines.add(points)
    fit_points = spline.fitPoints
    left_top = fit_points.item(0)
    right_top = fit_points.item(fit_points.count - 1)

    lines = sketch.sketchCurves.sketchLines
    bottom_left = point_mm(0, 0)
    bottom_right = point_mm(width_mm, 0)
    lines.addByTwoPoints(bottom_left, left_top)
    lines.addByTwoPoints(right_top, bottom_right)
    lines.addByTwoPoints(bottom_right, bottom_left)


def build_fixture() -> str:
    app = adsk.core.Application.get()
    design = adsk.fusion.Design.cast(app.activeProduct)
    if not design:
        raise RuntimeError('Active product is not a Fusion design.')

    design.fusionUnitsManager.distanceDisplayUnits = adsk.fusion.DistanceUnits.MillimeterDistanceUnits
    root = design.rootComponent
    sketches = root.sketches
    extrudes = root.features.extrudeFeatures

    outline_sketch = sketches.add(root.xYConstructionPlane)
    outline_sketch.name = 'sketch_dense_outline'
    add_wavy_outline(outline_sketch, 90, 50)

    base_profile = profile_near(outline_sketch, 45, 20)
    base_distance = adsk.core.ValueInput.createByString('8 mm')
    base_feature = extrudes.addSimple(base_profile, base_distance, adsk.fusion.FeatureOperations.NewBodyFeatureOperation)
    body = base_feature.bodies.item(0)
    body.name = 'storm_fixture_body'

    top_face = highest_planar_face(body)

    hole_sketch = sketches.add(top_face)
    hole_sketch.name = 'sketch_bore_reference'
    hole_sketch.sketchCurves.sketchCircles.addByCenterRadius(point_mm(70, 15), mm(6))
    hole_profile = profile_near(hole_sketch, 70, 15)
    hole_feature = extrude_cut(root, hole_profile, '8 mm')
    hole_feature.name = 'bore_reference_hole'

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
            ui.messageBox('Created tiny-segment-storm fixture archive:\n{}'.format(output))
    except:
        if ui:
            ui.messageBox('GenerateTinySegmentStormFixture failed:\n{}'.format(traceback.format_exc()))
        else:
            print(traceback.format_exc())
