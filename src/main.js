import './styles.css';
import { createWorld } from './world/scene.js';
import { createTerrain } from './world/terrain.js';
import { getPhaseState } from './world/phase.js';
import { createFoliage } from './world/foliage.js';
import { initPhysics } from './physics/rapier.js';
import { createPetals } from './physics/petals.js';

// TEMP: auto-advance journey progress 0->1 over ~60s so day-cycle/foliage/
// petal phase transitions are visible without characters (Task 7) yet.
// Remove this and drive `progress` from the lead character's path param
// once Task 7 lands.
const TEMP_JOURNEY_SECONDS = 60;

async function boot() {
  const canvas = document.getElementById('app');
  const world = await createWorld({ canvas });
  const { scene, render } = world;

  createTerrain(scene);
  const foliage = createFoliage(scene);

  const physics = await initPhysics();
  const petals = createPetals(scene, physics);

  let lastTime = performance.now();
  let firstFrame = true;
  let journeyElapsed = 0;
  const focusPos = { x: 0, y: 2, z: 0 }; // TEMP: origin stand-in for characters

  function loop(now) {
    const dt = (now - lastTime) / 1000;
    lastTime = now;

    journeyElapsed += dt; // TEMP auto-advance
    const progress = Math.min(1, journeyElapsed / TEMP_JOURNEY_SECONDS);
    const phaseState = getPhaseState(progress);

    world.setPhase(phaseState);
    foliage.update(dt, phaseState);
    petals.update(dt, phaseState, focusPos);

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
