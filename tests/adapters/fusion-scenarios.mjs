function countMatches(text, pattern) {
  return [...text.matchAll(pattern)].length;
}

export const unitScenarios = [
  {
    name: "writes inch-safe startup and repeated section resets",
    async run(assert, loadPost, helpers = {}) {
      const post = await loadPost({
        programName: "base-inch",
        unit: helpers.IN,
        properties: {
          minimumSegmentLength: 0.01
        },
        sections: [
          {
            parameters: { "operation-comment": "01_linear_profile" },
            tool: { number: 1, spindleRPM: 11999, coolant: 9, diameter: 0.25, description: "flat end mill" },
            zMin: -0.165
          },
          {
            parameters: { "operation-comment": "02_arc_profile" },
            tool: { number: 1, spindleRPM: 5000, coolant: 9, diameter: 0.25, description: "flat end mill" },
            zMin: -0.165
          }
        ]
      });

      post.host.onOpen();
      post.host.onSection();
      post.host.onRapid(3.065, -0.16, 0.6);
      post.host.onLinear(3.065, -0.16, 0.2, 33.15);
      post.host.onSectionEnd();
      post.setSectionIndex(1);
      post.host.onSection();
      post.host.onCircular(false, 1.54, 1.04, -0.04, 1.9091, 1.04, -0.0573, 39.37);
      post.host.onSectionEnd();
      post.host.onClose();

      const text = post.getMainText();

      assert.match(text, /\(base-inch\)/);
      assert.match(text, /G90 G94 G20 G17/);
      assert.ok(!text.includes("G21"));
      assert.match(text, /\(02_arc_profile\)/);
      assert.ok(countMatches(text, /^G53 G0 Z0$/gm) >= 3);
    }
  },
  {
    name: "writes multi-tool tool changes with optional stops, coolant, and dwell",
    async run(assert, loadPost) {
      const post = await loadPost({
        programName: "manual-toolchange-default",
        sections: [
          {
            parameters: { "operation-comment": "01_pocket_t1" },
            tool: { number: 1, spindleRPM: 5000, coolant: 4, diameter: 6, description: "flat end mill" },
            zMin: -4
          },
          {
            parameters: { "operation-comment": "02_bore_t2" },
            tool: { number: 2, spindleRPM: 8000, coolant: 4, diameter: 3, description: "flat end mill" },
            zMin: -11
          }
        ]
      });

      post.host.onOpen();
      post.host.onSection();
      post.host.onLinear(101.934, 65.004, -3.4, 2388.4);
      post.host.onSectionEnd();
      post.setSectionIndex(1);
      post.host.onSection();
      post.host.onLinear(22.6, 18.7, -4, 417.8);
      post.host.onSectionEnd();
      post.host.onClose();

      const text = post.getMainText();

      assert.match(text, /\(01_pocket_t1\)/);
      assert.match(text, /\(02_bore_t2\)/);
      assert.ok(text.includes("T1"));
      assert.ok(text.includes("T2"));
      assert.ok(text.includes("M8"));
      assert.ok(text.includes("M9"));
      assert.ok(text.includes("M1"));
      assert.ok(countMatches(text, /G4 P3\./g) >= 2);
      assert.ok(countMatches(text, /^G53 G0 Z0$/gm) >= 3);
    }
  },
  {
    name: "suppresses optional stops when disabled",
    async run(assert, loadPost) {
      const post = await loadPost({
        programName: "manual-toolchange-no-optional-stop",
        properties: {
          optionalStop: false
        },
        sections: [
          {
            parameters: { "operation-comment": "01_pocket_t1" },
            tool: { number: 1, spindleRPM: 5000, coolant: 4 }
          },
          {
            parameters: { "operation-comment": "02_bore_t2" },
            tool: { number: 2, spindleRPM: 8000, coolant: 4 }
          }
        ]
      });

      post.host.onOpen();
      post.host.onSection();
      post.host.onSectionEnd();
      post.setSectionIndex(1);
      post.host.onSection();
      post.host.onSectionEnd();
      post.host.onClose();

      assert.ok(!post.getMainText().includes("M1"));
    }
  },
  {
    name: "flushes filtered linear motion before rapids, arcs, and section end",
    async run(assert, loadPost) {
      const post = await loadPost({
        programName: "default-filter",
        properties: {
          minimumSegmentLength: 0.5
        },
        sections: [
          {
            initialPosition: { x: 0, y: 0, z: 0 }
          }
        ]
      });

      post.host.onOpen();
      post.host.onSection();
      post.setCurrentPosition({ x: 0, y: 0, z: 0 });
      post.host.onLinear(0.1, 0, 0, 100);
      assert.ok(!post.getMainText().includes("X0.1"));
      post.host.onRapid(1, 0, 0);
      assert.match(post.getMainText(), /G1 X0\.1 F100/);
      assert.match(post.getMainText(), /G0 X1/);

      post.setCurrentPosition({ x: 1, y: 0, z: 0 });
      post.host.onLinear(1.2, 0, 0, 200);
      post.host.onCircular(true, 1.2, 0.5, 0, 1.5, 0.5, 0, 300);
      assert.match(post.getMainText(), /G1 X1\.2 F200/);
      assert.match(post.getMainText(), /G2 X1\.5 Y0\.5 I0 J0\.5 F300/);

      post.setCurrentPosition({ x: 1.5, y: 0.5, z: 0 });
      post.host.onLinear(1.6, 0.5, 0, 400);
      post.host.onSectionEnd();
      assert.match(post.getMainText(), /G1 X1\.6 F400/);

      post.setCurrentPosition({ x: 1.6, y: 0.5, z: 0 });
      post.host.onLinear(1.7, 0.5, 0, 500);
      post.host.onClose();
      assert.ok(!post.getMainText().includes("X1.7"));

      post.setCurrentPosition({ x: 1.7, y: 0.5, z: 0 });
      post.host.onLinear(1.7, 0.5, 0, 550);
      assert.ok(!post.getMainText().includes("F550"));
    }
  },
  {
    name: "handles supported circular planes and linearizes unsupported ones",
    async run(assert, loadPost) {
      const post = await loadPost();

      post.host.onOpen();
      post.host.onSection();
      post.setCurrentPosition({ x: 0, y: 0, z: 0 });
      post.setCircularPlane(post.host.PLANE_XY);
      post.host.onCircular(false, 0, 1, 0, 2, 3, 0, 100);
      post.setCurrentPosition({ x: 2, y: 3, z: 0 });
      post.setCircularPlane(post.host.PLANE_ZX);
      post.host.onCircular(true, 1, 0, 1, 2, 0, 3, 200);
      post.setCurrentPosition({ x: 2, y: 0, z: 3 });
      post.setCircularPlane(post.host.PLANE_YZ);
      post.host.onCircular(false, 0, 1, 1, 0, 2, 3, 300);
      post.setCircularPlane(99);
      post.host.onCircular(false, 0, 0, 0, 1, 1, 1, 400);

      const text = post.getMainText();

      assert.match(text, /G3 X2 Y3 Z0 I0 J1 F100/);
      assert.match(text, /G18 G2 X2 Y0 Z3 I-1 K1 F200/);
      assert.match(text, /G19 G3 X0 Y2 Z3 J1 K-2 F300/);
      assert.equal(post.linearizeCalls.length, 1);

      post.setCurrentPosition({ x: 5, y: 6, z: 0 });
      post.setCircularPlane(post.host.PLANE_XY);
      post.host.onCircular(false, 4, 6, 0, 5, 6, 0, 111);
      post.setCurrentPosition({ x: 5, y: 6, z: 0 });
      post.setCircularPlane(post.host.PLANE_XY);
      post.host.onCircular(true, 4, 6, 0, 5, 6, 0, 112);
      post.setCurrentPosition({ x: 5, y: 6, z: 7 });
      post.setCircularPlane(post.host.PLANE_ZX);
      post.host.onCircular(true, 4, 6, 6, 5, 6, 7, 222);
      post.setCurrentPosition({ x: 5, y: 6, z: 7 });
      post.setCircularPlane(post.host.PLANE_ZX);
      post.host.onCircular(false, 4, 6, 6, 5, 6, 7, 223);
      post.setCurrentPosition({ x: 8, y: 9, z: 10 });
      post.setCircularPlane(post.host.PLANE_YZ);
      post.host.onCircular(false, 8, 8, 9, 8, 9, 10, 333);
      post.setCurrentPosition({ x: 8, y: 9, z: 10 });
      post.setCircularPlane(post.host.PLANE_YZ);
      post.host.onCircular(true, 8, 8, 9, 8, 9, 10, 334);
      post.setCurrentPosition({ x: 1, y: 2, z: 0 });
      post.setCircularPlane(post.host.PLANE_XY);
      post.host.onCircular(false, 0, 1, 0, 1, 2, 1, 444);
      post.setCurrentPosition({ x: 3, y: 4, z: 5 });
      post.setCircularPlane(98);
      post.host.onCircular(false, 0, 0, 0, 3, 4, 5, 555);
      const fullText = post.getMainText();
      assert.match(fullText, /G17 G3 X5 I-1 J0 F111/);
      assert.match(fullText, /G18 G2 Z7 I-1 K-1 F222/);
      assert.match(fullText, /G19 G3 Y9 J-1 K-1 F333/);
      assert.equal(post.linearizeCalls.length, 3);

      const sectionEndPost = await loadPost();
      sectionEndPost.host.onOpen();
      sectionEndPost.host.onSection();
      sectionEndPost.setCircularPlane(sectionEndPost.host.PLANE_YZ);
      sectionEndPost.host.onCircular(false, 0, 1, 1, 0, 2, 3, 300);
      sectionEndPost.host.onSectionEnd();
      assert.match(sectionEndPost.getMainText(), /^G17$/m);

      const noFullCirclePost = await loadPost();
      noFullCirclePost.host.onOpen();
      noFullCirclePost.host.onSection();
      noFullCirclePost.host.isFullCircle = undefined;
      noFullCirclePost.setCircularPlane(noFullCirclePost.host.PLANE_XY);
      noFullCirclePost.host.onCircular(false, 0, 1, 0, 2, 3, 0, 100);

      const fallbackStartPost = await loadPost();
      fallbackStartPost.host.onOpen();
      fallbackStartPost.host.onSection();
      fallbackStartPost.setCurrentPosition({ x: 0, y: 0, z: 0 });
      fallbackStartPost.host.runtime.currentPosition = undefined;
      fallbackStartPost.setCircularPlane(fallbackStartPost.host.PLANE_XY);
      fallbackStartPost.host.onCircular(false, 0, 1, 0, 2, 3, 0, 100);
    }
  },
  {
    name: "writes split-file masters and subfiles for tool and toolpath modes",
    async run(assert, loadPost) {
      const baseSections = [
        {
          parameters: { "operation-comment": "01_rough_pocket_t1" },
          tool: { number: 1, spindleRPM: 5000, coolant: 4 }
        },
        {
          parameters: { "operation-comment": "02_bore_12mm_t2" },
          tool: { number: 2, spindleRPM: 8000, coolant: 4 }
        },
        {
          parameters: { "operation-comment": "03_outer_profile_t1" },
          tool: { number: 1, spindleRPM: 5000, coolant: 4 }
        }
      ];

      const byTool = await loadPost({
        programName: "split-by-tool",
        properties: { splitFile: "tool" },
        sections: baseSections
      });

      byTool.host.onOpen();
      for (let index = 0; index < baseSections.length; index += 1) {
        byTool.setSectionIndex(index);
        byTool.host.onSection();
        byTool.host.onLinear(index + 1, index + 2, index + 3, 1000);
        byTool.host.onSectionEnd();
      }
      byTool.host.onClose();

      assert.match(byTool.getMainText(), /\(\*\*\*THIS FILE DOES NOT CONTAIN NC CODE\*\*\*\)/);
      assert.deepEqual(byTool.getFileNames(), [
        "split-by-tool_1_T1.nc",
        "split-by-tool_2_T2.nc",
        "split-by-tool_3_T1.nc"
      ]);
      for (const fileName of byTool.getFileNames()) {
        const text = byTool.getFileText(fileName);
        assert.match(text, /G21/);
        assert.match(text, /G54/);
        assert.match(text, /G53 G0 Z0/);
        assert.match(text, /M30/);
      }

      const byToolpath = await loadPost({
        programName: "split-by-toolpath",
        properties: { splitFile: "toolpath" },
        sections: baseSections
      });

      byToolpath.host.onOpen();
      for (let index = 0; index < baseSections.length; index += 1) {
        byToolpath.setSectionIndex(index);
        byToolpath.host.onSection();
        byToolpath.host.onSectionEnd();
      }
      byToolpath.host.onClose();

      assert.deepEqual(byToolpath.getFileNames(), [
        "split-by-toolpath_1_01_rough_pocket_t1_T1.nc",
        "split-by-toolpath_2_02_bore_12mm_t2_T2.nc",
        "split-by-toolpath_3_03_outer_profile_t1_T1.nc"
      ]);
    }
  },
  {
    name: "supports comments, passthrough, sequence numbers, clearance retracts, and spindle updates",
    async run(assert, loadPost) {
      const post = await loadPost({
        programName: "sequence-demo",
        properties: {
          showSequenceNumbers: "toolChange",
          safePositionMethod: "clearanceHeight",
          useM06: true
        },
        sections: [
          {
            parameters: { "operation-comment": "01 (rough) pocket" },
            initialPosition: { x: 0, y: 0, z: 12.5 },
            tool: { number: 7, spindleRPM: 9000, coolant: 2, description: "mist tool" }
          }
        ]
      });

      assert.equal(post.host.cleanFileToken(" 01 (rough) pocket "), "01_rough_pocket");
      assert.equal(post.host.formatComment(" Alpha (Beta) "), "Alpha Beta");

      post.host.onOpen();
      post.host.onComment("Ready (operator)");
      post.host.onPassThrough("M123");
      post.host.onSection();
      post.host.onSpindleSpeed(9100);
      post.host.onCommand(post.host.COMMAND_START_SPINDLE);
      post.host.onCommand(post.host.COMMAND_COOLANT_OFF);
      post.host.onCommand(post.host.COMMAND_OPTIONAL_STOP);
      post.host.onCommand(post.host.COMMAND_STOP);
      post.host.onCommand(post.host.COMMAND_LOAD_TOOL);
      post.host.onCommand(post.host.COMMAND_END);
      post.host.onSectionEnd();
      post.host.onClose();

      const text = post.getMainText();

      assert.match(text, /\(Ready operator\)/);
      assert.match(text, /M123/);
      assert.match(text, /N10 T7/);
      assert.match(text, /N11 M6/);
      assert.match(text, /G0 Z12\.5/);
      assert.match(text, /S9100 M3/);
      assert.match(text, /M7/);
      assert.match(text, /M9/);
      assert.match(text, /M0/);
      assert.match(text, /M30/);
    }
  },
  {
    name: "covers feed-only linear moves, default commands, and unsupported 5-axis callbacks",
    async run(assert, loadPost) {
      const post = await loadPost();

      post.host.onOpen();
      post.host.onSection();
      post.host.onLinear(0, 0, 0, 250);
      assert.match(post.getMainText(), /G1 Z0 F250/);
      post.host.onLinear(0, 0, 0, 275);
      assert.match(post.getMainText(), /^F275$/m);

      post.host.onCommand(9999);
      assert.equal(post.warnings.length, 1);

      assert.throws(() => {
        post.host.onRapid5D(0, 0, 0, 0, 0, 0);
      }, /3-axis/);
      assert.throws(() => {
        post.host.onLinear5D(0, 0, 0, 0, 0, 0, 100);
      }, /3-axis/);
      assert.throws(() => {
        post.host.onRadiusCompensation();
      }, /not supported/);
    }
  },
  {
    name: "covers helper fallbacks and empty-input branches",
    async run(assert, loadPost) {
      const post = await loadPost({
        programName: "",
        properties: {
          showSequenceNumbers: "true",
          sequenceNumberStart: 0,
          sequenceNumberIncrement: 0,
          safePositionMethod: "clearanceHeight",
          useCoolant: false,
          minimumSegmentLength: 0
        },
        sections: []
      });

      assert.equal(post.host.cleanText(undefined), "");
      assert.equal(post.host.cleanFileToken("!!!"), "section");
      assert.equal(post.host.cleanProgramToken("!!!"), "program");
      assert.equal(post.host.axisWord("X", undefined), "");
      assert.equal(post.host.feedWord(undefined), "");
      assert.equal(post.host.spindleWord(undefined), "");
      assert.equal(post.host.getProgramLabel(), "program");
      assert.equal(post.host.getSectionLabel(undefined, 1), "section_2");
      assert.equal(post.host.getWorkOffsetCode({ workOffset: 99 }), "G54");
      assert.equal(post.host.coolantCodeForSection(), "");
      assert.equal(post.host.shouldFilterLinearMove(1, 1, 1), false);

      post.host.runtime.currentPosition = { x: 4, y: 5, z: 6 };
      assert.equal(post.host.getClearanceHeight(undefined), 6);
      post.host.runtime.currentPosition = undefined;
      post.host.getCurrentPosition = () => undefined;
      post.host.runtime.lastOutputPosition = undefined;
      assert.equal(post.host.shouldFilterLinearMove(1, 1, 1), false);

      post.host.writeComment("");
      post.host.writeBlock(["G0", ["X1"], "Y2"], false);
      post.host.writeBlock(["G0", "Z3"], false);
      post.host.onDwell(1.25);
      post.host.onSpindleSpeed(1234);
      post.host.onDwell(0);
      post.host.onPassThrough("");
      post.host.closeSplitOutput();
      post.host.onOpen();

      const quietPost = await loadPost({
        properties: {
          showSequenceNumbers: "false"
        },
        sections: []
      });
      quietPost.host.writeBlock(["", null], false);
      assert.equal(quietPost.getMainText(), "");

      const nestedPost = await loadPost({
        properties: {
          showSequenceNumbers: "false"
        }
      });
      const nestedWords = new nestedPost.host.Array("G0", new nestedPost.host.Array("X1"), "Y2");
      nestedPost.host.writeBlock(nestedWords, false);
      assert.match(nestedPost.getMainText(), /G0 X1 Y2/);

      const anchorlessPost = await loadPost({
        properties: {
          minimumSegmentLength: 0.5
        },
        sections: []
      });
      anchorlessPost.host.runtime.currentPosition = undefined;
      anchorlessPost.host.runtime.lastOutputPosition = undefined;
      anchorlessPost.host.getCurrentPosition = () => undefined;
      assert.equal(anchorlessPost.host.shouldFilterLinearMove(1, 1, 1), false);
      assert.equal(anchorlessPost.host.getClearanceHeight({ getInitialPosition() { return {}; } }), undefined);
      anchorlessPost.host.runtime.currentPosition = { x: 1, y: 1, z: 1 };
      anchorlessPost.host.setCurrentPosition(2, undefined, 3);
      assert.equal(anchorlessPost.host.coolantCodeForSection(undefined), "");
      delete anchorlessPost.host.getNumberOfSections;
      assert.equal(anchorlessPost.host.collectToolSummaries().length, 0);

      const fallbackSplitPost = await loadPost({
        programName: "",
        properties: {
          splitFile: "tool"
        }
      });
      assert.equal(fallbackSplitPost.host.buildSplitFileName(fallbackSplitPost.host.currentSection), "program_1_T1");
      fallbackSplitPost.setCurrentPosition({ x: 0, y: 0, z: 0 });
      fallbackSplitPost.host.emitLinearMove(0, 0, 0);
      fallbackSplitPost.host.currentSection = undefined;
      delete fallbackSplitPost.host.getNumberOfSections;
      fallbackSplitPost.host.finishMainProgram();

      const noRedirectSplitPost = await loadPost({
        properties: {
          splitFile: "tool"
        }
      });
      noRedirectSplitPost.host.onOpen();
      noRedirectSplitPost.host.onClose();

      const finalSectionPost = await loadPost({
        sections: [
          {
            initialPosition: { x: 0, y: 0, z: 9 },
            tool: { number: 1, spindleRPM: 0, coolant: 9 }
          }
        ]
      });
      finalSectionPost.host.currentSection = undefined;
      finalSectionPost.host.finishMainProgram();

      const text = post.getMainText();

      assert.match(text, /N10 G0 X1 Y2/);
      assert.match(text, /N11 G0 Z3/);
      assert.match(text, /N12 G4 P1\.25/);
      assert.match(text, /\(FluidNC config:/);
      assert.ok(!text.includes("M8"));
    }
  },
  {
    name: "covers remaining coolant, tool, split-close, and spindle branches",
    async run(assert, loadPost) {
      const helperPost = await loadPost({
        programName: "!!!",
        properties: {
          toolAsName: true,
          useToolCall: true,
          spindleWarmupDelay: 0
        },
        sections: [
          {
            parameters: {},
            workOffset: 0,
            tool: {
              number: 3,
              diameter: 0,
              cornerRadius: 0,
              description: "",
              spindleRPM: 0,
              clockwise: false,
              coolant: 2
            }
          }
        ]
      });

      helperPost.host.getNumberOfSections = () => 2;
      helperPost.host.getSection = (index) => {
        if (index === 0) {
          return {
            getTool() {
              return {
                number: 3,
                diameter: 0,
                cornerRadius: 0,
                description: "",
                spindleRPM: 0,
                clockwise: false,
                coolant: 2
              };
            }
          };
        }
        return {
          getTool() {
            return {
              number: 4,
              diameter: 2,
              cornerRadius: 0,
              description: "named tool",
              spindleRPM: 0,
              clockwise: false,
              coolant: 3
            };
          },
          getGlobalZRange() {
            return {};
          }
        };
      };

      helperPost.host.writeToolComments();
      helperPost.host.writeToolCall({ number: 9, description: "named tool" }, false);
      helperPost.host.startCoolant(helperPost.host.currentSection);
      helperPost.host.startCoolant(helperPost.host.currentSection);
      helperPost.host.onCommand(helperPost.host.COMMAND_STOP_SPINDLE);
      helperPost.host.startSpindle(helperPost.host.currentSection);
      const beforeRepeatedSpindleStart = helperPost.getMainText();
      assert.equal(helperPost.host.startSpindle(helperPost.host.currentSection), false);
      assert.equal(helperPost.getMainText(), beforeRepeatedSpindleStart);
      helperPost.host.setCurrentPosition(undefined, 2, undefined);
      helperPost.setCurrentPosition({ x: 0, y: 0, z: 0 });
      helperPost.setCircularPlane(helperPost.host.PLANE_ZX);
      helperPost.host.onCircular(false, 1, 0, 1, 2, 0, 3, 200);
      helperPost.setCurrentPosition({ x: 2, y: 0, z: 3 });
      helperPost.setCircularPlane(helperPost.host.PLANE_YZ);
      helperPost.host.onCircular(true, 0, 1, 1, 0, 2, 3, 300);

      const helperText = helperPost.getMainText();
      assert.match(helperText, /\(TOOL named tool\)/);
      assert.match(helperText, /\(T3 D=0 CR=0 - flat end mill\)/);
      assert.match(helperText, /M7/);
      assert.match(helperText, /S0 M4/);
      assert.match(helperText, /G18 G3/);
      assert.match(helperText, /G19 G2/);

      const reverseDirectionPost = await loadPost({
        properties: {
          spindleWarmupDelay: 0
        },
        sections: [
          {
            tool: {
              number: 8,
              spindleRPM: 5000,
              coolant: 9,
              clockwise: false
            }
          }
        ]
      });
      reverseDirectionPost.host.runtime.spindleDirection = "M3";
      reverseDirectionPost.host.runtime.activeSpindleSpeed = 5000;
      reverseDirectionPost.host.startSpindle(reverseDirectionPost.host.currentSection);
      assert.match(reverseDirectionPost.getMainText(), /S5000 M4/);

      const silentToolPost = await loadPost({
        properties: {
          useToolCall: false
        }
      });
      silentToolPost.host.writeToolCall({ number: 5 }, false);
      assert.equal(silentToolPost.getMainText(), "");

      const splitPost = await loadPost({
        programName: "split-by-tool-safe-start",
        properties: {
          splitFile: "tool"
        },
        sections: [
          {
            parameters: { "operation-comment": "01_restart" },
            tool: { number: 1, spindleRPM: 5000, coolant: 4 }
          }
        ]
      });

      splitPost.host.onOpen();
      splitPost.host.onSection();
      splitPost.host.onClose();

      const splitFiles = splitPost.getFileNames();
      assert.deepEqual(splitFiles, ["split-by-tool-safe-start_1_T1.nc"]);
      assert.match(splitPost.getFileText(splitFiles[0]), /M30/);

      const fallbackToolTypePost = await loadPost({
        sections: [
          {
            tool: {
              number: 5,
              description: "",
              spindleRPM: 0,
              coolant: 9
            }
          }
        ]
      });
      delete fallbackToolTypePost.host.getToolTypeName;
      fallbackToolTypePost.host.writeToolComments();
      assert.match(fallbackToolTypePost.getMainText(), /\(T5 D=6 CR=0 - ZMIN=-4 - tool\)/);

      const noFirstSectionPost = await loadPost({
        properties: {
          splitFile: "tool"
        }
      });
      noFirstSectionPost.host.onOpen();
      delete noFirstSectionPost.host.isFirstSection;
      noFirstSectionPost.host.runtime.activeToolNumber = 99;
      noFirstSectionPost.host.onSection();

      const noFirstSectionNoStopPost = await loadPost({
        properties: {
          splitFile: "tool",
          optionalStop: false
        }
      });
      noFirstSectionNoStopPost.host.onOpen();
      delete noFirstSectionNoStopPost.host.isFirstSection;
      noFirstSectionNoStopPost.host.runtime.activeToolNumber = 99;
      noFirstSectionNoStopPost.host.onSection();

      const coolantBoundaryPost = await loadPost({
        sections: [
          {
            tool: { number: 1, spindleRPM: 5000, coolant: 4 }
          },
          {
            tool: { number: 1, spindleRPM: 5000, coolant: 9 }
          }
        ]
      });
      coolantBoundaryPost.host.onOpen();
      coolantBoundaryPost.host.onSection();
      coolantBoundaryPost.host.onSectionEnd();
      assert.match(coolantBoundaryPost.getMainText(), /M8[\s\S]*M9/);

      const sectionEndFallbackPost = await loadPost();
      sectionEndFallbackPost.host.onOpen();
      sectionEndFallbackPost.host.onSection();
      delete sectionEndFallbackPost.host.isLastSection;
      delete sectionEndFallbackPost.host.getNextSection;
      sectionEndFallbackPost.host.onSectionEnd();
    }
  },
  {
    name: "covers legacy compatibility wrappers and legacy property surface",
    async run(assert, loadPost) {
      const post = await loadPost({
        properties: {
          safePositionMethod: "clearanceHeight",
          spindleWarmupDelay: 0
        }
      });

      assert.equal(post.host.properties.useG95.value, false);
      assert.equal(post.host.properties.useDPMFeeds.value, false);
      assert.equal(post.host.properties.useTiltedWorkplane.value, false);
      assert.equal(post.host.getSetting("comments.prefix", ""), "(");
      assert.equal(post.host.getSetting("comments.showSequenceNumbers", true), false);
      assert.equal(post.host.getSetting(undefined, "fallback"), "fallback");
      assert.equal(post.host.getSetting("missing.path", "fallback"), "fallback");
      assert.equal(post.host.getBodyLength({ bodyLength: 7 }), 7);
      assert.equal(post.host.getBodyLength({ fluteLength: 3 }), 3);
      assert.equal(post.host.getBodyLength({}), 0);
      assert.equal(post.host.getFeed(123), "F123");
      assert.equal(post.host.activateMachine(), post.host.machineConfiguration);
      assert.equal(post.host.defineMachine(), post.host.machineConfiguration);
      assert.equal(post.host.validateToolData(), true);
      assert.equal(post.host.validateCommonParameters(), true);
      assert.equal(post.host.forceFeed(), true);
      assert.equal(post.host.forceXYZ(), true);
      assert.equal(post.host.forceABC(), true);
      assert.equal(post.host.forceAny(), true);
      assert.equal(post.host.forceModals(), true);
      assert.equal(post.host.forceCircular(19), 19);
      assert.equal(post.host.subprogramsAreSupported(), true);
      assert.equal(post.host.machineSimulation(), false);
      assert.equal(post.host.isTCPSupportedByOperation(), false);
      assert.equal(post.host.forceWorkPlane(), true);
      assert.equal(post.host.cancelWCSRotation(), false);
      assert.equal(post.host.cancelWorkPlane(), false);
      assert.equal(post.host.setWorkPlane(), false);
      assert.equal(post.host.getOffsetCode(), "");

      const directForward = post.host.getForwardDirection({ workPlane: { forward: { x: 9, y: 8, z: 7 } } });
      assert.equal(directForward.x, 9);
      const forward = post.host.getForwardDirection(post.host.currentSection);
      assert.equal(forward.x, 0);
      const definedPlane = post.host.defineWorkPlane({ workPlane: { forward: { x: 1, y: 2, z: 3 } } });
      assert.equal(definedPlane.z, 3);
      const fallbackForward = post.host.getForwardDirection();
      assert.equal(fallbackForward.z, 1);
      const partialForward = post.host.getForwardDirection({ workPlane: {} });
      assert.equal(partialForward.z, 1);
      const fallbackPlane = post.host.defineWorkPlane();
      assert.equal(fallbackPlane.z, 1);
      const machineABC = post.host.getWorkPlaneMachineABC();
      assert.equal(machineABC.x, 0);
      assert.equal(machineABC.isNonZero(), false);
      const positioned = post.host.positionABC(machineABC);
      assert.equal(positioned.x, 0);

      const retractParameters = post.host.getRetractParameters();
      assert.equal(retractParameters.method, "clearanceHeight");
      assert.equal(retractParameters.words[0], "Z0");

      assert.equal(post.host.getCoolantCodes(post.host.COOLANT_OFF)[0], "M9");
      assert.equal(post.host.getCoolantCodes(post.host.COOLANT_MIST)[0], "M7");
      assert.equal(post.host.getCoolantCodes(post.host.COOLANT_FLOOD).length, 0);

      post.host.writeToolBlock("T99");
      post.host.writeProgramHeader();
      post.host.writeModalReset();
      post.host.writeStartBlocks(true, function () {
        post.host.writeBlock(["M7"], false);
      });
      post.host.writeStartBlocks(true, null);
      delete post.host.getCurrentSectionId;
      post.host.runtime.currentSectionId = 3;
      post.host.writeStartBlocks(true, null);
      post.host.writeWCS(post.host.currentSection);
      post.host.writeWCS();
      post.host.writeInitialPositioning({ x: 1, y: 2, z: 3 });
      post.host.writeInitialPositioning({ x: 4, y: 5, z: 6 }, false);
      post.host.writeInitialPositioning({ x: 11, y: 12 }, false);
      post.host.writeInitialPositioning();
      post.host.setCoolant(post.host.COOLANT_AIR);
      post.host.setCoolant(post.host.COOLANT_OFF);
      post.host.runtime.pendingLinearMove = { x: 4, y: 5, z: 6, feed: 10 };
      post.host._fluidncFlushPending();
      post.host.forceModals(null);
      const customModal = { resetCount: 0, reset() { this.resetCount += 1; } };
      post.host.forceModals(customModal);
      assert.equal(customModal.resetCount, 1);
      post.host.writeInitialPositioning({ x: 9, y: 8 });
      post.host.emitLinearMove(9, 8, 3, 12);
      post.host.emitLinearMove(9, 8, 3, 13);
      post.host.emitLinearMove(9, 8, 3);
      post.host.writeProgramStart();
      post.host.writeRetract();
      post.host.onMoveToSafeRetractPosition();
      post.host.onRotateAxes(7, 8, 9);
      post.host.onReturnFromSafeRetractPosition(10, 11, 12);
      const beforeRepeatRapid = post.getMainText();
      post.host.onRapid(10, 11, 12);
      assert.equal(post.getMainText(), beforeRepeatRapid);
      post.host.writeProgramEnd();

      const text = post.getMainText();
      assert.match(text, /T99/);
      assert.match(text, /M7/);
      assert.match(text, /G54/);
      assert.match(text, /G90 G17 G0 X1 Y2/);
      assert.match(text, /G90 G0 X4 Y5/);
      assert.match(text, /G90 G0 X11 Y12/);
      assert.match(text, /^Z6$/m);
      assert.match(text, /^Z3$/m);
      assert.match(text, /M8/);
      assert.match(text, /M9/);
      assert.match(text, /G1 X4 Y5 F10/);
      assert.match(text, /G90 G94 G21 G17/);
      assert.match(text, /G0 Z15/);
      assert.match(text, /G0 X7 Z9/);
      assert.match(text, /X10 Y11 Z12/);
      assert.match(text, /M30/);

      const noForceControlPost = await loadPost({
        omitControlForce: true
      });
      noForceControlPost.host.onOpen();

      const safeStartFallbackPost = await loadPost({
        properties: {
          safeStartAllOperations: true
        }
      });
      safeStartFallbackPost.host.writeInitialPositioning({ x: 7, y: 8, z: 9 }, false);
      assert.match(safeStartFallbackPost.getMainText(), /G90 G17 G0 X7 Y8/);

      const noInitialPositionPost = await loadPost();
      const manualSection = {
        workOffset: 1,
        getTool() {
          return { number: 6, spindleRPM: 0, coolant: 9 };
        },
        getParameter(_name, fallback = "") {
          return fallback;
        }
      };
      noInitialPositionPost.host.currentSection = manualSection;
      noInitialPositionPost.host.writeSectionStart(manualSection);
    }
  }
];
