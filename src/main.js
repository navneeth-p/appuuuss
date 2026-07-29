import './styles.css';
import { createWorld } from './world/scene.js';
import { createTerrain } from './world/terrain.js';
import { getPhaseState } from './world/phase.js';
import { createFoliage } from './world/foliage.js';
import { initPhysics } from './physics/rapier.js';
import { createPetals } from './physics/petals.js';
import { createInputState, attach } from './input.js';
import { createDpad } from './ui/dpad.js';
import { createCharacters } from './characters/characters.js';
import { createStops } from './characters/stops.js';
import { validateStops } from './validateConfig.js';
import { STOPS } from './config.js';

async function boot() {
  const canvas = document.getElementById('app');
  const world = await createWorld({ canvas });
  const { scene, camera, render } = world;

  createTerrain(scene);
  const foliage = createFoliage(scene);

  const physics = await initPhysics();
  const petals = createPetals(scene, physics);

  const input = createInputState();
  attach(input, window);
  createDpad(input);

  // Camera ownership: scene.js sets an initial pose and never repositions
  // the camera per frame (render() just calls renderer.render), so
  // characters.update() below is free to move/lookAt it every frame with
  // no fighting between modules.
  const characters = createCharacters(scene, null, input, camera);

  const stops = createStops(scene, null, onStopEnter, null, validateStops(STOPS));

  // Task 9 will replace this with real card open/close + unlock-on-close.
  function onStopEnter(id) {
    window.__onStopEnter?.(id) ?? console.log('[main] stop entered:', id);
    input.setLocked(true);
    // Auto-unlock for now so the journey stays walkable during testing.
    setTimeout(() => input.setLocked(false), 1200);
  }

  let lastTime = performance.now();
  let firstFrame = true;

  function loop(now) {
    const dt = (now - lastTime) / 1000;
    lastTime = now;

    characters.update(dt);
    const progress = characters.progress;
    const phaseState = getPhaseState(progress);

    world.setPhase(phaseState);
    foliage.update(dt, phaseState);
    petals.update(dt, phaseState, characters.leadPos);
    stops.check(progress);

    render(dt);

    if (firstFrame) {
      firstFrame = false;
      document.getElementById('loading')?.classList.add('hidden');
    }

    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
}

boot().catch((err) => {
  console.error('[main] boot failed', err);
});
