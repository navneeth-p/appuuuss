import './styles.css';
import { createWorld } from './world/scene.js';
import { createTerrain } from './world/terrain.js';
import { getPhaseState } from './world/phase.js';

async function boot() {
  const canvas = document.getElementById('app');
  const world = await createWorld({ canvas });
  const { scene, render } = world;

  createTerrain(scene);

  // Task 7 (characters + input) will drive real path progress; for now show
  // a fixed dawn sky so the sky/fog/sun pipeline is visibly wired up.
  world.setPhase(getPhaseState(0));

  let lastTime = performance.now();
  let firstFrame = true;

  function loop(now) {
    const dt = (now - lastTime) / 1000;
    lastTime = now;

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
