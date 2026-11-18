import { DepthSensingSystem, World } from '@iwsdk/core';
import projectOptions from 'virtual:iwsdk-project';
import { LabPanelSystem } from './systems/lab-panel-system.js';
import { QuantumLabSystem } from './systems/quantum-lab-system.js';
import { mountQuantumHud } from './ui/quantum-hud.js';

World.create(
  document.getElementById('scene-container') as HTMLDivElement,
  projectOptions,
).then((world) => {
  world.registerSystem(DepthSensingSystem, {
    configData: {
      enableDepthTexture: true,
      enableOcclusion: true,
      useFloat32: true,
      blurRadius: 20,
    },
  });
  world.registerSystem(QuantumLabSystem);
  world.registerSystem(LabPanelSystem);
  mountQuantumHud(world);
});
