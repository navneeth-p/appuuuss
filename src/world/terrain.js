// Ground plane with a subtle rolling surface + a visible path ribbon that
// follows the CatmullRomCurve3 from pathCurve.js.
import * as THREE from 'three/webgpu';
import { pathCurve } from './pathCurve.js';

const GROUND_SIZE = 140;
const GROUND_SEGMENTS = 80;

function buildGround() {
  const geometry = new THREE.PlaneGeometry(
    GROUND_SIZE,
    GROUND_SIZE,
    GROUND_SEGMENTS,
    GROUND_SEGMENTS,
  );
  geometry.rotateX(-Math.PI / 2);

  const position = geometry.attributes.position;
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i);
    const z = position.getZ(i);
    // Gentle multi-frequency roll, subtle enough not to fight the path.
    const roll = Math.sin(x * 0.08) * 0.4
      + Math.cos(z * 0.1) * 0.35
      + Math.sin((x + z) * 0.05) * 0.25;
    position.setY(i, roll);
  }
  geometry.computeVertexNormals();

  const material = new THREE.MeshStandardMaterial({
    color: 0x4c7a4f,
    roughness: 1,
    metalness: 0,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.receiveShadow = true;
  return mesh;
}

function buildPathRibbon(curve) {
  const points = curve.getSpacedPoints(160);
  const width = 1.4;

  // Build a ribbon by sampling the curve and emitting a thin quad strip
  // (rather than a round TubeGeometry) so the path reads as lying flat on
  // the ground.
  const positions = [];
  const indices = [];
  const up = new THREE.Vector3(0, 1, 0);

  for (let i = 0; i < points.length; i++) {
    const t = i / (points.length - 1);
    const point = curve.getPointAt(t);
    const tangent = curve.getTangentAt(t);
    const side = new THREE.Vector3().crossVectors(tangent, up).normalize();

    const left = point.clone().addScaledVector(side, -width / 2);
    const right = point.clone().addScaledVector(side, width / 2);
    // Lift slightly above the rolling ground to avoid z-fighting.
    left.y += 0.05;
    right.y += 0.05;

    positions.push(left.x, left.y, left.z);
    positions.push(right.x, right.y, right.z);

    if (i > 0) {
      const a = (i - 1) * 2;
      const b = a + 1;
      const c = i * 2;
      const d = c + 1;
      indices.push(a, c, b, b, c, d);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  const material = new THREE.MeshStandardMaterial({
    color: 0xd8c39a,
    roughness: 0.9,
    metalness: 0,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.receiveShadow = true;
  return mesh;
}

/**
 * Builds terrain (ground + path ribbon) and adds it to the given scene.
 * @param {THREE.Scene} scene
 * @returns {{ground: THREE.Mesh, path: THREE.Mesh}}
 */
export function createTerrain(scene) {
  const ground = buildGround();
  const path = buildPathRibbon(pathCurve);
  scene.add(ground);
  scene.add(path);
  return { ground, path };
}
