import { createComponent, defineComponents, Types } from '@iwsdk/core';

export const QuantumBenchMarker = createComponent('QuantumBenchMarker', {});

export const BenchAnchorMarker = createComponent('BenchAnchorMarker', {});

export const DoubleSlitRigMarker = createComponent('DoubleSlitRigMarker', {});

export const EntanglementRigMarker = createComponent('EntanglementRigMarker', {});

export const DetectorProbeMarker = createComponent('DetectorProbeMarker', {
  isObserving: { type: Types.Boolean, default: false },
});

export const AnalyzerDialMarker = createComponent('AnalyzerDialMarker', {
  station: { type: Types.String, default: 'alice' },
});

export const SlitShutterMarker = createComponent('SlitShutterMarker', {
  closed: { type: Types.Boolean, default: false },
});

export const FilterCrystalMarker = createComponent('FilterCrystalMarker', {
  wavelengthNm: { type: Types.Int32, default: 532 },
});

export const BombRigMarker = createComponent('BombRigMarker', {});

export const BombCrateMarker = createComponent('BombCrateMarker', {
  crateId: { type: Types.String, default: 'alpha' },
});

export const BombBs2Marker = createComponent('BombBs2Marker', {});

export const TetherRigMarker = createComponent('TetherRigMarker', {});

export const TetherOrbMarker = createComponent('TetherOrbMarker', {
  side: { type: Types.String, default: 'left' },
});

export const SchrodingerRigMarker = createComponent('SchrodingerRigMarker', {});

export const BoxLidMarker = createComponent('BoxLidMarker', {});

export const GateCubeMarker = createComponent('GateCubeMarker', {
  gate: { type: Types.String, default: 'H' },
});

export const RoomWaveFieldMarker = createComponent('RoomWaveFieldMarker', {});

export const GuideArrowMarker = createComponent('GuideArrowMarker', {});

export const LabPanelMarker = createComponent('LabPanelMarker', {});

export default defineComponents([
  QuantumBenchMarker,
  BenchAnchorMarker,
  DoubleSlitRigMarker,
  EntanglementRigMarker,
  DetectorProbeMarker,
  AnalyzerDialMarker,
  SlitShutterMarker,
  FilterCrystalMarker,
  BombRigMarker,
  BombCrateMarker,
  BombBs2Marker,
  TetherRigMarker,
  TetherOrbMarker,
  SchrodingerRigMarker,
  BoxLidMarker,
  GateCubeMarker,
  RoomWaveFieldMarker,
  GuideArrowMarker,
  LabPanelMarker,
]);
