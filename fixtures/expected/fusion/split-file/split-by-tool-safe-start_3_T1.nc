(split-by-tool-safe-start)
G90 G94
G17
G21
(T1 D=6 CR=0 - ZMIN=-4 - flat end mill)
(T2 D=3 CR=0 - ZMIN=-11 - flat end mill)

(FluidNC config: arc_tol=0.002mm junc_dev=0.01mm min_seg=0.1mm)
(Ensure firmware arc_tolerance_mm and junction_deviation_mm match these values)
G54
G53 G0 Z0
(03_outer_profile_t1)
T1
(CHANGE TO T1)
S3234 M3
G4 P3.
G17 G90 G94
G54
G53 G0 Z0
G90 G0 X96.2 Y30.4
Z15
G0 Z5
G1 Z1 F67.5
Z-2.4
G18 G2 X96.8 Z-3 I0.6 K0 F202.5
G1 X97.4
G17 G3 X98 Y31 I0 J0.6
G1 Y58
X4
Y4
X98
Y31
G3 X97.4 Y31.6 I-0.6 J0
G1 X96.8
G18 G3 X96.2 Z-2.4 I0 K0.6
G0 Z15
G17

G53 G0 Z0
G53 G0 X0 Y0
M5
M30
