// Instanced flowers + grass scattered along the garden path, swaying in a
// wind driven by phase.js's windStrength. Uses two InstancedMeshes (flowers,
// grass) with a small raw ShaderMaterial so it works the same way under the
// WebGPURenderer's WebGL fallback and under plain WebGL (this repo's sky
// material in scene.js already proves raw ShaderMaterial + this renderer
// combo works — instancing itself only needs the `instanceMatrix` attribute,
// which three.js auto-injects for any shader on an InstancedMesh via
// `#ifdef USE_INSTANCING`, no `#include` chunks required).
import * as THREE from 'three/webgpu';
import { getPathPoint } from './pathCurve.js';

const FLOWER_COUNT = 400;
const GRASS_COUNT = 2000;
const LATERAL_SPREAD = 6.5;
const LATERAL_MIN = 0.9;

// Mirrors the rolling-ground formula in terrain.js so foliage sits on the
// surface instead of floating/clipping. Kept in sync manually since
// terrain.js doesn't currently export a shared height function.
function groundHeight(x, z) {
  return Math.sin(x * 0.08) * 0.4
    + Math.cos(z * 0.1) * 0.35
    + Math.sin((x + z) * 0.05) * 0.25;
}

function scatterPoint() {
  const t = Math.random();
  const point = getPathPoint(t);
  const angle = Math.random() * Math.PI * 2;
  const dist = LATERAL_MIN + Math.random() * LATERAL_SPREAD;
  const x = point.x + Math.cos(angle) * dist;
  const z = point.z + Math.sin(angle) * dist;
  return { x, y: groundHeight(x, z), z };
}

function buildWindMaterial(color) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uWind: { value: 0.2 },
      diffuse: { value: new THREE.Color(color) },
    },
    vertexShader: /* glsl */ `
      uniform float uTime;
      uniform float uWind;
      attribute float aPhase;
      varying vec3 vNormalW;
      void main() {
        vec3 transformed = position;
        #ifdef USE_INSTANCING
        float sway = sin(uTime * 1.6 + aPhase) * uWind * max(position.y, 0.0) * 0.7;
        transformed.x += sway;
        transformed.z += sway * 0.5;
        vec4 worldPosition = instanceMatrix * vec4(transformed, 1.0);
        #else
        vec4 worldPosition = vec4(transformed, 1.0);
        #endif
        vNormalW = normalize(normal);
        gl_Position = projectionMatrix * modelViewMatrix * worldPosition;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 diffuse;
      varying vec3 vNormalW;
      void main() {
        float shade = 0.75 + 0.25 * max(vNormalW.y, 0.0);
        gl_FragColor = vec4(diffuse * shade, 1.0);
      }
    `,
  });
}

function buildFlowerGeometry() {
  // Simple cross-billboard: two intersecting planes read as a small bloom
  // from any angle without needing per-instance billboarding logic.
  const geometry = new THREE.PlaneGeometry(0.35, 0.35);
  geometry.translate(0, 0.175, 0);
  const b = geometry.clone();
  b.rotateY(Math.PI / 2);

  const merged = new THREE.BufferGeometry();
  const positions = [
    ...geometry.attributes.position.array,
    ...b.attributes.position.array,
  ];
  const normals = [
    ...geometry.attributes.normal.array,
    ...b.attributes.normal.array,
  ];
  const uvs = [...geometry.attributes.uv.array, ...b.attributes.uv.array];
  const idxA = Array.from(geometry.index.array);
  const idxB = Array.from(b.index.array).map((i) => i + geometry.attributes.position.count);

  merged.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  merged.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  merged.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  merged.setIndex([...idxA, ...idxB]);
  return merged;
}

function buildGrassGeometry() {
  // Single tapered blade (a thin triangle standing upright).
  const geometry = new THREE.BufferGeometry();
  const w = 0.05;
  const h = 0.4;
  const positions = new Float32Array([
    -w, 0, 0,
    w, 0, 0,
    0, h, 0,
  ]);
  const normals = new Float32Array([
    0, 0, 1,
    0, 0, 1,
    0, 0, 1,
  ]);
  const uvs = new Float32Array([0, 0, 1, 0, 0.5, 1]);
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
  geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  geometry.setIndex([0, 1, 2]);
  return geometry;
}

function buildInstancedGroup(geometry, material, count, opts) {
  const mesh = new THREE.InstancedMesh(geometry, material, count);
  const phases = new Float32Array(count);
  const dummy = new THREE.Object3D();
  const baseScales = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    const { x, y, z } = scatterPoint();
    const scale = opts.minScale + Math.random() * (opts.maxScale - opts.minScale);
    baseScales[i] = scale;

    dummy.position.set(x, y, z);
    dummy.rotation.y = Math.random() * Math.PI * 2;
    dummy.scale.setScalar(scale);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);

    phases[i] = Math.random() * Math.PI * 2;
  }

  geometry.setAttribute('aPhase', new THREE.InstancedBufferAttribute(phases, 1));
  mesh.instanceMatrix.needsUpdate = true;
  mesh.baseScales = baseScales;
  mesh.frustumCulled = false;
  return mesh;
}

/**
 * Scatters instanced flowers + grass around the garden path and returns an
 * object to drive per-frame wind sway and proximity bloom.
 * @param {THREE.Scene} scene
 * @param {import('three').Curve} curve unused directly (kept for API parity
 *   with the plan; scattering samples pathCurve.getPathPoint via the t=0..1
 *   helper above so the caller doesn't need to pass anything besides scene).
 * @returns {{ update:(dt:number, phaseState:object)=>void, bloomIn:(worldPos:{x:number,z:number}, radius:number)=>void, flowers:THREE.InstancedMesh, grass:THREE.InstancedMesh }}
 */
export function createFoliage(scene, curve, opts = {}) {
  const flowerGeometry = buildFlowerGeometry();
  const grassGeometry = buildGrassGeometry();

  const flowerMaterial = buildWindMaterial(opts.flowerColor ?? 0xe8a0bf);
  flowerMaterial.side = THREE.DoubleSide;
  const grassMaterial = buildWindMaterial(opts.grassColor ?? 0x5f8f5a);
  grassMaterial.side = THREE.DoubleSide;

  const flowers = buildInstancedGroup(flowerGeometry, flowerMaterial, FLOWER_COUNT, {
    minScale: 0.7,
    maxScale: 1.3,
  });
  const grass = buildInstancedGroup(grassGeometry, grassMaterial, GRASS_COUNT, {
    minScale: 0.8,
    maxScale: 1.6,
  });

  scene.add(flowers);
  scene.add(grass);

  let elapsed = 0;
  const dummy = new THREE.Object3D();
  const tmpPos = new THREE.Vector3();

  function update(dt, phaseState) {
    elapsed += dt;
    const wind = phaseState?.windStrength ?? 0.2;
    flowerMaterial.uniforms.uTime.value = elapsed;
    flowerMaterial.uniforms.uWind.value = wind;
    grassMaterial.uniforms.uTime.value = elapsed;
    grassMaterial.uniforms.uWind.value = wind;
  }

  /**
   * Scales flowers near `worldPos` up toward their base scale (a gentle
   * "bloom in" as the characters approach); flowers further than `radius`
   * settle back down. Simple per-frame ease, not a tween library dependency.
   */
  function bloomIn(worldPos, radius = 3) {
    const count = flowers.count;
    for (let i = 0; i < count; i++) {
      flowers.getMatrixAt(i, dummy.matrix);
      dummy.matrix.decompose(dummy.position, dummy.quaternion, dummy.scale);
      tmpPos.set(worldPos.x, dummy.position.y, worldPos.z);
      const dist = dummy.position.distanceTo(tmpPos);
      const base = flowers.baseScales[i];
      const target = dist < radius ? base * 1.15 : base;
      const current = dummy.scale.x;
      const next = current + (target - current) * 0.1;
      dummy.scale.setScalar(next);
      dummy.updateMatrix();
      flowers.setMatrixAt(i, dummy.matrix);
    }
    flowers.instanceMatrix.needsUpdate = true;
  }

  return { update, bloomIn, flowers, grass };
}
