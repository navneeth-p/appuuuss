// Renderer + scene + camera + sky + render loop.
// WebGPURenderer auto-falls back to a WebGL2 backend when WebGPU isn't
// available; pass ?forceWebGL=1 in the URL to force the WebGL2 backend
// (useful for testing the fallback path deliberately).
import * as THREE from 'three/webgpu';
import { getPhaseState } from './phase.js';

const SKY_RADIUS = 500;

function buildSkyMesh() {
  const geometry = new THREE.SphereGeometry(SKY_RADIUS, 32, 16);
  const material = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: {
      topColor: { value: new THREE.Color(0x334a73) },
      bottomColor: { value: new THREE.Color(0xf2b38c) },
    },
    vertexShader: /* glsl */ `
      varying vec3 vWorldPosition;
      void main() {
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        gl_Position = projectionMatrix * viewMatrix * worldPosition;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 topColor;
      uniform vec3 bottomColor;
      varying vec3 vWorldPosition;
      void main() {
        float h = normalize(vWorldPosition).y * 0.5 + 0.5;
        gl_FragColor = vec4(mix(bottomColor, topColor, clamp(h, 0.0, 1.0)), 1.0);
      }
    `,
  });
  return new THREE.Mesh(geometry, material);
}

/**
 * @param {{canvas: HTMLCanvasElement}} opts
 * @returns {Promise<{renderer:any, scene:THREE.Scene, camera:THREE.PerspectiveCamera, render:(dt:number)=>void, setPhase:(state:object)=>void}>}
 */
export async function createWorld({ canvas }) {
  const params = new URLSearchParams(window.location.search);
  const forceWebGL = params.has('forceWebGL');

  const renderer = new THREE.WebGPURenderer({
    canvas,
    antialias: true,
    forceWebGL,
  });

  try {
    await renderer.init();
  } catch (err) {
    console.warn('[scene] WebGPURenderer init failed, retrying with forceWebGL', err);
    renderer.dispose?.();
    const fallback = new THREE.WebGPURenderer({ canvas, antialias: true, forceWebGL: true });
    await fallback.init();
    return buildWorld(fallback, canvas);
  }

  return buildWorld(renderer, canvas);
}

function buildWorld(renderer, canvas) {
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(
    55,
    window.innerWidth / window.innerHeight,
    0.1,
    SKY_RADIUS * 1.5,
  );
  camera.position.set(0, 3.5, 8);
  camera.lookAt(0, 1, 0);

  const sky = buildSkyMesh();
  scene.add(sky);

  const hemiLight = new THREE.HemisphereLight(0xffffff, 0x334422, 0.6);
  scene.add(hemiLight);

  const sunLight = new THREE.DirectionalLight(0xffffff, 1.0);
  sunLight.position.set(10, 20, 10);
  scene.add(sunLight);

  scene.fog = new THREE.FogExp2(0x88aacc, 0.01);

  function onResize() {
    const { innerWidth, innerHeight } = window;
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  }
  window.addEventListener('resize', onResize);

  canvas.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    console.warn('[scene] WebGL context lost');
  });

  /**
   * Applies interpolated day-cycle state (sky colors, fog, sun) to the scene.
   * @param {ReturnType<typeof getPhaseState>} state
   */
  function setPhase(state) {
    sky.material.uniforms.topColor.value.setRGB(
      state.skyTop.r,
      state.skyTop.g,
      state.skyTop.b,
    );
    sky.material.uniforms.bottomColor.value.setRGB(
      state.skyBottom.r,
      state.skyBottom.g,
      state.skyBottom.b,
    );

    scene.fog.color.setRGB(state.fogColor.r, state.fogColor.g, state.fogColor.b);
    scene.fog.density = state.fogDensity;

    sunLight.color.setRGB(state.sunColor.r, state.sunColor.g, state.sunColor.b);
    const elevationRad = THREE.MathUtils.degToRad(state.sunElevation);
    const dist = 30;
    sunLight.position.set(
      Math.cos(elevationRad) * dist,
      Math.max(Math.sin(elevationRad) * dist, 1),
      dist * 0.4,
    );
    sunLight.intensity = Math.max(0.15, Math.sin(elevationRad)) * 1.2;
  }

  // Initial dawn-ish state so the sky isn't blank before the first phase update.
  setPhase(getPhaseState(0));

  function render() {
    renderer.render(scene, camera);
  }

  return { renderer, scene, camera, render, setPhase };
}
