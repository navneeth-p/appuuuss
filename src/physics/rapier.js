// Rapier (offline, WASM-compat build) init. Never import
// `three/addons/physics/RapierPhysics.js` — that one fetches Rapier from a
// CDN, which breaks the offline/home-server requirement.
import RAPIER from '@dimforge/rapier3d-compat';

/**
 * Initializes the Rapier physics world. Never throws — on any failure it
 * resolves with `{ available:false }` so callers can fall back to a
 * scripted (non-physics) animation path.
 * @returns {Promise<{ available:boolean, world?:any, RAPIER?:any }>}
 */
export async function initPhysics() {
  try {
    await RAPIER.init();
    const world = new RAPIER.World({ x: 0, y: -9.81, z: 0 });
    return { available: true, world, RAPIER };
  } catch (err) {
    console.warn('[physics] Rapier init failed, falling back to scripted drift', err);
    return { available: false };
  }
}
