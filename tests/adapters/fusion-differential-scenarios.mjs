function queueNextMotion(post, isMotion) {
  post.host.queueNextRecords([{ isMotion }]);
}

function runRapid(post, x, y, z) {
  post.host.onRapid(x, y, z);
}

function runLinear(post, x, y, z, feed, nextIsMotion = false) {
  queueNextMotion(post, nextIsMotion);
  post.host.onLinear(x, y, z, feed);
}

function runArc(post, plane, clockwise, cx, cy, cz, x, y, z, feed) {
  post.setCircularPlane(plane);
  post.host.onCircular(clockwise, cx, cy, cz, x, y, z, feed);
}

export const differentialScenarios = [
  {
    name: "matches inch safe-start output for mixed linear and arc sections",
    fixtureChecks: [
      [
        {
          type: "include",
          text: "G90 G94 G20 G17\n\n(02_arc_profile)\nS5000 M3\nG4 P3.\nG53 G0 Z0"
        }
      ]
    ],
    async run(loadPost, helpers = {}) {
      const post = await loadPost({
        programName: "base-inch",
        unit: helpers.IN,
        properties: {
          minimumSegmentLength: 0.01,
          safeStartAllOperations: true,
          useCoolant: false
        },
        sections: [
          {
            parameters: { "operation-comment": "01_linear_profile" },
            initialPosition: { x: 3.065, y: -0.16, z: 0.6 },
            tool: { number: 1, spindleRPM: 11999, coolant: 9, diameter: 0.25, description: "flat end mill" },
            zMin: -0.165
          },
          {
            parameters: { "operation-comment": "02_arc_profile" },
            initialPosition: { x: 1.8466, y: 1.015, z: 0.6 },
            tool: { number: 1, spindleRPM: 5000, coolant: 9, diameter: 0.25, description: "flat end mill" },
            zMin: -0.165
          }
        ]
      });

      post.host.onOpen();
      post.host.onSection();
      runRapid(post, 3.065, -0.16, 0.2);
      runArc(post, post.host.PLANE_YZ, false, 3.065, -0.135, -0.14, 3.065, -0.11, -0.14, 99.46);
      runArc(post, post.host.PLANE_XY, false, 3.04, -0.11, -0.14, 3.04, -0.085, -0.14, 99.46);
      runLinear(post, 0.04, -0.085, -0.14, 99.46, true);
      runLinear(post, -0.085, -0.085, -0.14, 99.46, true);
      runLinear(post, -0.085, 2.165, -0.14, 99.46, true);
      runLinear(post, 3.165, 2.165, -0.14, 99.46, true);
      runLinear(post, 3.165, -0.085, -0.14, 99.46, true);
      runLinear(post, 3.04, -0.085, -0.14, 99.46, true);
      runArc(post, post.host.PLANE_XY, false, 3.04, -0.11, -0.14, 3.015, -0.11, -0.14, 99.46);
      runLinear(post, 3.015, -0.135, -0.14, 99.46, true);
      runArc(post, post.host.PLANE_YZ, true, 3.015, -0.135, -0.115, 3.015, -0.16, -0.115, 99.46);
      runRapid(post, 3.015, -0.16, 0.6);
      post.host.onSectionEnd();

      post.setSectionIndex(1);
      post.host.onSection();
      runRapid(post, 1.8466, 1.015, 0.0387);
      runLinear(post, 1.8466, 1.015, -0.015, 39.37, true);
      runArc(post, post.host.PLANE_ZX, true, 1.8716, 1.015, -0.015, 1.8716, 1.015, -0.04, 39.37);
      runLinear(post, 1.8841, 1.015, -0.04, 39.37, true);
      runArc(post, post.host.PLANE_XY, false, 1.8841, 1.04, -0.04, 1.9091, 1.04, -0.04, 39.37);
      runArc(post, post.host.PLANE_XY, false, 1.54, 1.04, -0.04, 1.1709, 1.04, -0.0573, 39.37);
      runArc(post, post.host.PLANE_XY, false, 1.54, 1.04, -0.0573, 1.9091, 1.04, -0.0745, 39.37);
      post.host.onSectionEnd();
      post.host.onClose();

      return [post];
    }
  },
  {
    name: "matches multi-tool output around tool boundaries",
    async run(loadPost) {
      const post = await loadPost({
        programName: "manual-toolchange-default",
        properties: {
          optionalStop: true,
          useCoolant: true,
          minimumSegmentLength: 0.01
        },
        sections: [
          {
            parameters: { "operation-comment": "01_pocket_t1" },
            initialPosition: { x: 101.934, y: 65.004, z: 15 },
            tool: { number: 1, spindleRPM: 5000, coolant: 4, diameter: 6, description: "flat end mill" },
            zMin: -4
          },
          {
            parameters: { "operation-comment": "02_bore_t2" },
            initialPosition: { x: 22.6, y: 18.7, z: 15 },
            tool: { number: 2, spindleRPM: 8000, coolant: 9, diameter: 3, description: "flat end mill" },
            zMin: -11
          },
          {
            parameters: { "operation-comment": "03_outer_profile_t1" },
            initialPosition: { x: 0.4, y: 65.8, z: 15 },
            tool: { number: 1, spindleRPM: 5000, coolant: 4, diameter: 6, description: "flat end mill" },
            zMin: -3
          }
        ]
      });

      post.host.onOpen();
      post.host.onSection();
      runRapid(post, 101.934, 65.004, 5);
      runLinear(post, 101.934, 65.004, 1, 796.1, true);
      runLinear(post, 101.934, 65.004, -3.4, 2388.4);
      runRapid(post, 101.934, 65.004, 15);
      post.host.onSectionEnd();

      post.setSectionIndex(1);
      post.host.onSection();
      runRapid(post, 22.6, 18.7, -2);
      runLinear(post, 22.6, 18.7, -3.7, 417.8, true);
      runArc(post, post.host.PLANE_ZX, true, 22.9, 18.7, -3.7, 22.9, 18.7, -4, 417.8);
      runRapid(post, 22.75, 18.7, 15);
      post.host.onSectionEnd();

      post.setSectionIndex(2);
      post.host.onSection();
      runRapid(post, 0.4, 65.8, 5);
      runLinear(post, 0.4, 65.8, 1, 796.1, true);
      runLinear(post, 0.4, 65.8, -2.4, 796.1, true);
      runArc(post, post.host.PLANE_YZ, true, 0.4, 65.2, -2.4, 0.4, 65.2, -3, 2388.4);
      post.host.onSectionEnd();
      post.host.onClose();

      return [post];
    }
  },
  {
    name: "matches split-file output trees for tool, toolpath, and safe-start modes",
    async run(loadPost) {
      const sections = [
        {
          parameters: { "operation-comment": "01_rough_pocket_t1" },
          initialPosition: { x: 42.264, y: 27.091, z: 15 },
          tool: { number: 1, spindleRPM: 5000, coolant: 9, diameter: 6, description: "flat end mill" },
          zMin: -4
        },
        {
          parameters: { "operation-comment": "02_bore_12mm_t2" },
          initialPosition: { x: 86.6, y: 18.7, z: 15 },
          tool: { number: 2, spindleRPM: 8000, coolant: 9, diameter: 3, description: "flat end mill" },
          zMin: -11
        },
        {
          parameters: { "operation-comment": "03_outer_profile_t1" },
          initialPosition: { x: 96.2, y: 30.4, z: 15 },
          tool: { number: 1, spindleRPM: 3234, coolant: 9, diameter: 6, description: "flat end mill" },
          zMin: -3
        }
      ];

      const runSplit = async (programName, properties) => {
        const post = await loadPost({
          programName,
          properties: {
            optionalStop: false,
            minimumSegmentLength: 0.1,
            ...properties
          },
          sections
        });

        post.host.onOpen();
        post.host.onSection();
        runRapid(post, 42.264, 27.091, 5);
        runLinear(post, 42.264, 27.091, 3.1, 333.3, true);
        post.host.onSectionEnd();

        post.setSectionIndex(1);
        post.host.onSection();
        runRapid(post, 86.6, 18.7, 1);
        runLinear(post, 86.6, 18.7, -0.7, 1206, true);
        runArc(post, post.host.PLANE_ZX, true, 86.9, 18.7, -0.7, 86.9, 18.7, -1, 1206);
        post.host.onSectionEnd();

        post.setSectionIndex(2);
        post.host.onSection();
        runRapid(post, 96.2, 30.4, 5);
        runLinear(post, 96.2, 30.4, 1, 67.5, true);
        runLinear(post, 96.2, 30.4, -2.4, 67.5);
        post.host.onSectionEnd();
        post.host.onClose();

        return post;
      };

      const byTool = await runSplit("split-by-tool", { splitFile: "tool" });
      const byToolpath = await runSplit("split-by-toolpath", { splitFile: "toolpath" });
      const byToolSafeStart = await runSplit("split-by-tool-safe-start", {
        splitFile: "tool",
        safeStartAllOperations: true
      });

      return [byTool, byToolpath, byToolSafeStart];
    }
  },
  {
    name: "matches tiny-segment filtering around dense-region and restart boundaries",
    fixtureChecks: [
      [
        {
          type: "include",
          text: "X-0.304 Y51.741\nG90 G94 G21 G17\n\n(02_circle_profile)\nG53 G0 Z0"
        }
      ],
      [
        {
          type: "include",
          text: "X-0.304 Y51.741\nG90 G94 G21 G17\n\n(02_circle_profile)\nG53 G0 Z0"
        }
      ],
      [
        {
          type: "include",
          text: "X-0.304 Y51.741\nG90 G94 G21 G17\n\n(02_circle_profile)\nG53 G0 Z0"
        }
      ]
    ],
    async run(loadPost) {
      const runTiny = async (programName, minimumSegmentLength) => {
        const post = await loadPost({
          programName,
          properties: {
            minimumSegmentLength,
            fluidncArcTolerance: 0.002,
            useCoolant: true
          },
          sections: [
            {
              parameters: { "operation-comment": "01_dense_spline_profile" },
              initialPosition: { x: -1.4, y: 26.549, z: 15 },
              tool: { number: 1, spindleRPM: 12000, coolant: 9, diameter: 3, description: "flat end mill" },
              zMin: -9
            },
            {
              parameters: { "operation-comment": "02_circle_profile" },
              initialPosition: { x: 74.6, y: 15.7, z: 15 },
              tool: { number: 1, spindleRPM: 12000, coolant: 9, diameter: 3, description: "flat end mill" },
              zMin: -9
            }
          ]
        });

        post.host.onOpen();
        post.host.onSection();
        runRapid(post, -1.4, 26.549, 5);
        runLinear(post, -1.4, 26.549, 0.6, 402, true);
        runLinear(post, -1.4, 26.549, -2.7, 402, true);
        runArc(post, post.host.PLANE_ZX, true, -1.1, 26.549, -2.7, -1.1, 26.549, -3, 1206);
        runLinear(post, -0.8, 26.549, -3, 1206, true);
        runArc(post, post.host.PLANE_XY, false, -0.8, 26.849, -3, -0.5, 26.849, -3, 1206);
        runLinear(post, -0.5, 51, -3, 1206, true);
        runLinear(post, -0.5, 51.396, -3, 1206, true);
        runLinear(post, -0.304, 51.741, -3, 1206);
        post.host.onSectionEnd();

        post.setSectionIndex(1);
        post.host.onSection();
        runRapid(post, 74.6, 15.7, 1);
        runLinear(post, 74.6, 15.7, -0.7, 1206, true);
        runArc(post, post.host.PLANE_ZX, true, 74.9, 15.7, -0.7, 74.9, 15.7, -1, 1206);
        runLinear(post, 75.05, 15.7, -1, 1206, true);
        runArc(post, post.host.PLANE_XY, false, 75.05, 16, -1, 75.35, 16, -1, 1206);
        post.host.onSectionEnd();
        post.host.onClose();

        return post;
      };

      const noFilter = await runTiny("no-filter", 0);
      const defaultFilter = await runTiny("default-filter", 0.05);
      const aggressiveFilter = await runTiny("aggressive-filter", 0.1);

      return [noFilter, defaultFilter, aggressiveFilter];
    }
  }
];
