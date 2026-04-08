(split-by-toolpath)
(T1 D=6 CR=0 - ZMIN=-4 - flat end mill)
(T2 D=3 CR=0 - ZMIN=-11 - flat end mill)

(FluidNC config: arc_tol=0.002mm junc_dev=0.01mm min_seg=0.1mm)
(Ensure firmware arc_tolerance_mm and junction_deviation_mm match these values)
(***THIS FILE DOES NOT CONTAIN NC CODE***)
G90 G94 G21 G17

(Load tool number 1 and subprogram split-by-toolpath_1_01_rough_pocket_t1_T1)
(Load tool number 2 and subprogram split-by-toolpath_2_02_bore_12mm_t2_T2)
(Load tool number 1 and subprogram split-by-toolpath_3_03_outer_profile_t1_T1)
