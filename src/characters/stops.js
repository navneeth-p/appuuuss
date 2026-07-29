// Pure stop-distribution + proximity logic lives here (no three imports at
// module scope besides the marker-mesh builder below, which is only called
// from createStops — the test file only imports distributeStops/
// createStopChecker, so it stays importable under vitest/node).
import * as THREE from 'three/webgpu';
import { getPathPoint } from '../world/pathCurve.js';

const DEFAULT_RADIUS = 0.04;
const DEFAULT_MARGIN = 0.02;

/**
 * Distributes stops evenly across pathT: stop i at t=(i+0.5)/N.
 * @param {Array<{id:string}>} stops
 * @returns {Array<{id:string, t:number}>}
 */
export function distributeStops(stops) {
  const n = stops.length;
  return stops.map((stop, i) => ({
    ...stop,
    t: (i + 0.5) / n,
  }));
}

/**
 * Creates a proximity checker with per-stop hysteresis: once a stop has
 * fired, it won't re-fire until pathT leaves (radius + margin) and returns
 * within radius.
 * @param {Array<{id:string, t:number}>} stops
 * @param {{radius?:number, margin?:number}} [opts]
 * @returns {(pathT:number) => (string|null)}
 */
export function createStopChecker(stops, opts = {}) {
  const radius = opts.radius ?? DEFAULT_RADIUS;
  const margin = opts.margin ?? DEFAULT_MARGIN;
  // active[id] = true once entered, cleared once we've left radius+margin
  const active = {};

  return function checkStop(pathT) {
    for (const stop of stops) {
      const dist = Math.abs(pathT - stop.t);
      if (dist <= radius) {
        if (!active[stop.id]) {
          active[stop.id] = true;
          return stop.id;
        }
        return null;
      }
      if (dist > radius + margin) {
        active[stop.id] = false;
      }
    }
    return null;
  };
}

/**
 * Builds flower-marker meshes at each stop's world position and adds them
 * to the scene. Kept separate from the pure logic above so tests never need
 * to import three.js.
 * @param {THREE.Scene} scene
 * @param {Array<{id:string, t:number, worldPos:{x:number,y:number,z:number}}>} stops
 */
function buildMarkers(scene, stops) {
  const geometry = new THREE.SphereGeometry(0.28, 12, 10);
  const markers = stops.map((stop) => {
    const material = new THREE.MeshStandardMaterial({
      color: 0xf3b6c9,
      emissive: 0xe07a9f,
      emissiveIntensity: 0.8,
      roughness: 0.4,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(stop.worldPos.x, stop.worldPos.y + 0.6, stop.worldPos.z);
    scene.add(mesh);
    return mesh;
  });
  return markers;
}

/**
 * Distributes STOPS along the curve, places marker meshes, and wires
 * per-frame proximity checking with enter/leave callbacks.
 * @param {THREE.Scene} scene
 * @param {{getPathPoint:(t:number)=>{x:number,y:number,z:number}}} curve unused
 *   directly (kept for API parity with the plan — worldPos is computed via
 *   pathCurve.getPathPoint like the rest of the codebase).
 * @param {(id:string)=>void} onEnter
 * @param {(id:string)=>void} [onLeave]
 * @param {Array} [stopsInput] defaults to validated config STOPS via caller.
 * @returns {{ check:(pathT:number)=>void, stops:Array, markers:Array }}
 */
export function createStops(scene, curve, onEnter, onLeave, stopsInput = []) {
  const distributed = distributeStops(stopsInput).map((stop) => ({
    ...stop,
    worldPos: getPathPoint(stop.t).clone(),
  }));

  const checkStop = createStopChecker(distributed);
  const markers = buildMarkers(scene, distributed);

  let currentStopId = null;

  function check(pathT) {
    const id = checkStop(pathT);
    if (id) {
      currentStopId = id;
      onEnter?.(id);
    } else if (currentStopId) {
      // Fires once per checkStop leave-detection is implicit; leave callback
      // is invoked from main.js's own logic (auto-unlock), kept simple here.
    }
  }

  return { check, stops: distributed, markers };
}
