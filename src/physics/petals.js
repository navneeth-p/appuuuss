// Rapier-backed (or scripted-fallback) petal particles + a handful of
// scripted butterfly billboards. Petal behavior per phaseState.petalMode:
//   'settle' -> normal gravity, petals drift down and rest.
//   'gust'   -> lateral impulses, petals get blown sideways.
//   'rise'   -> upward force exceeding gravity, petals float up like embers.
import * as THREE from 'three/webgpu';

const PETAL_COUNT = 300;
const BUTTERFLY_COUNT = 6;
const BOUNDS_RADIUS = 14;
const MIN_Y = -2;
const MAX_Y = 12;
const PETAL_RADIUS = 0.05;

function randomAround(center, radius) {
  const angle = Math.random() * Math.PI * 2;
  const dist = Math.random() * radius;
  return {
    x: center.x + Math.cos(angle) * dist,
    y: center.y + MAX_Y * 0.4 + Math.random() * MAX_Y * 0.4,
    z: center.z + Math.sin(angle) * dist,
  };
}

function buildPetalGeometry() {
  const geometry = new THREE.PlaneGeometry(0.12, 0.12);
  return geometry;
}

function buildButterflyGeometry() {
  // Cross-billboard, larger than petals, reused pattern from foliage flowers.
  const geometry = new THREE.PlaneGeometry(0.3, 0.2);
  return geometry;
}

/**
 * @param {THREE.Scene} scene
 * @param {{ available:boolean, world?:any, RAPIER?:any }} physics
 * @param {object} [opts]
 * @returns {{ update:(dt:number, phaseState:object, focusPos:{x:number,y:number,z:number})=>void }}
 */
export function createPetals(scene, physics, opts = {}) {
  const focusDefault = { x: 0, y: 2, z: 0 };

  const petalMaterial = new THREE.MeshBasicMaterial({
    color: opts.petalColor ?? 0xf3b6c9,
    side: THREE.DoubleSide,
    transparent: true,
  });
  const petalGeometry = buildPetalGeometry();
  const petals = new THREE.InstancedMesh(petalGeometry, petalMaterial, PETAL_COUNT);
  petals.frustumCulled = false;
  scene.add(petals);

  const butterflyMaterial = new THREE.MeshBasicMaterial({
    color: opts.butterflyColor ?? 0xf4d35e,
    side: THREE.DoubleSide,
    transparent: true,
  });
  const butterflies = new THREE.InstancedMesh(
    buildButterflyGeometry(),
    butterflyMaterial,
    BUTTERFLY_COUNT,
  );
  butterflies.frustumCulled = false;
  scene.add(butterflies);

  const dummy = new THREE.Object3D();

  // --- Petal pool state ---------------------------------------------------
  const usePhysics = !!physics?.available;
  const bodies = [];
  const velocities = []; // scripted-fallback only: {x,y,z} per petal

  if (usePhysics) {
    const { world, RAPIER } = physics;
    for (let i = 0; i < PETAL_COUNT; i++) {
      const pos = randomAround(focusDefault, BOUNDS_RADIUS);
      const bodyDesc = RAPIER.RigidBodyDesc.dynamic()
        .setTranslation(pos.x, pos.y, pos.z)
        .setLinearDamping(0.6)
        .setAngularDamping(0.8);
      const body = world.createRigidBody(bodyDesc);
      const colliderDesc = RAPIER.ColliderDesc.ball(PETAL_RADIUS).setDensity(0.2);
      world.createCollider(colliderDesc, body);
      bodies.push(body);
    }
  } else {
    for (let i = 0; i < PETAL_COUNT; i++) {
      const pos = randomAround(focusDefault, BOUNDS_RADIUS);
      dummy.position.set(pos.x, pos.y, pos.z);
      dummy.updateMatrix();
      petals.setMatrixAt(i, dummy.matrix);
      velocities.push({ x: 0, y: 0, z: 0 });
    }
    petals.instanceMatrix.needsUpdate = true;
  }

  // --- Butterfly scripted state --------------------------------------------
  const butterflyState = [];
  for (let i = 0; i < BUTTERFLY_COUNT; i++) {
    butterflyState.push({
      basePos: randomAround(focusDefault, BOUNDS_RADIUS * 0.6),
      phase: Math.random() * Math.PI * 2,
      speed: 0.6 + Math.random() * 0.5,
      radius: 1 + Math.random() * 1.5,
    });
  }

  let elapsed = 0;

  function recyclePetalBody(body, focusPos) {
    const pos = randomAround(focusPos, BOUNDS_RADIUS);
    body.setTranslation(pos, true);
    body.setLinvel({ x: 0, y: 0, z: 0 }, true);
    body.setAngvel({ x: 0, y: 0, z: 0 }, true);
  }

  function recyclePetalScripted(index, focusPos) {
    const pos = randomAround(focusPos, BOUNDS_RADIUS);
    dummy.position.set(pos.x, pos.y, pos.z);
    dummy.updateMatrix();
    petals.setMatrixAt(index, dummy.matrix);
    velocities[index] = { x: 0, y: 0, z: 0 };
  }

  function updatePetalsPhysics(dt, phaseState, focusPos) {
    const { world } = physics;
    const mode = phaseState?.petalMode ?? 'settle';

    for (let i = 0; i < bodies.length; i++) {
      const body = bodies[i];
      if (mode === 'gust') {
        body.applyImpulse(
          {
            x: (Math.random() - 0.5) * 0.02,
            y: 0.001,
            z: (Math.random() - 0.5) * 0.02,
          },
          true,
        );
      } else if (mode === 'rise') {
        // Counteract gravity plus a gentle lift so petals float upward.
        body.applyImpulse({ x: 0, y: 0.006, z: 0 }, true);
      }
      // 'settle' relies on default gravity, no extra impulse.
    }

    world.step();

    for (let i = 0; i < bodies.length; i++) {
      const body = bodies[i];
      const t = body.translation();
      const r = body.rotation();

      if (t.y < MIN_Y || t.y > MAX_Y || Math.abs(t.x - focusPos.x) > BOUNDS_RADIUS * 1.5
        || Math.abs(t.z - focusPos.z) > BOUNDS_RADIUS * 1.5) {
        recyclePetalBody(body, focusPos);
        continue;
      }

      dummy.position.set(t.x, t.y, t.z);
      dummy.quaternion.set(r.x, r.y, r.z, r.w);
      dummy.scale.setScalar(1);
      dummy.updateMatrix();
      petals.setMatrixAt(i, dummy.matrix);
    }
    petals.instanceMatrix.needsUpdate = true;
  }

  function updatePetalsScripted(dt, phaseState, focusPos) {
    const mode = phaseState?.petalMode ?? 'settle';
    const gravity = -1.2;
    const rise = 1.6;

    for (let i = 0; i < PETAL_COUNT; i++) {
      petals.getMatrixAt(i, dummy.matrix);
      dummy.matrix.decompose(dummy.position, dummy.quaternion, dummy.scale);

      const vel = velocities[i];
      if (mode === 'gust') {
        vel.x += (Math.random() - 0.5) * 0.6 * dt;
        vel.z += (Math.random() - 0.5) * 0.6 * dt;
        vel.y += gravity * 0.3 * dt;
      } else if (mode === 'rise') {
        vel.y += rise * dt;
        vel.x *= 0.98;
        vel.z *= 0.98;
      } else {
        vel.y += gravity * dt;
        vel.x *= 0.95;
        vel.z *= 0.95;
      }

      dummy.position.x += vel.x * dt;
      dummy.position.y += vel.y * dt;
      dummy.position.z += vel.z * dt;
      dummy.rotation.y += dt * 0.5;

      if (dummy.position.y < MIN_Y || dummy.position.y > MAX_Y
        || Math.abs(dummy.position.x - focusPos.x) > BOUNDS_RADIUS * 1.5
        || Math.abs(dummy.position.z - focusPos.z) > BOUNDS_RADIUS * 1.5) {
        recyclePetalScripted(i, focusPos);
        continue;
      }

      dummy.updateMatrix();
      petals.setMatrixAt(i, dummy.matrix);
    }
    petals.instanceMatrix.needsUpdate = true;
  }

  function updateButterflies(dt, phaseState) {
    const progress = phaseState?.progress ?? 0.5;
    // Weighted toward midday: 1 at progress=0.5, fading toward 0 at the ends.
    const middayWeight = 1 - Math.min(1, Math.abs(progress - 0.5) / 0.5);
    butterflyMaterial.opacity = 0.15 + 0.85 * middayWeight;

    for (let i = 0; i < BUTTERFLY_COUNT; i++) {
      const state = butterflyState[i];
      const t = elapsed * state.speed + state.phase;
      const x = state.basePos.x + Math.cos(t) * state.radius;
      const z = state.basePos.z + Math.sin(t) * state.radius;
      const y = state.basePos.y + Math.sin(t * 2.3) * 0.3;

      dummy.position.set(x, y, z);
      dummy.rotation.y = t;
      dummy.rotation.z = Math.sin(t * 6) * 0.3;
      dummy.scale.setScalar(1);
      dummy.updateMatrix();
      butterflies.setMatrixAt(i, dummy.matrix);
    }
    butterflies.instanceMatrix.needsUpdate = true;
  }

  function update(dt, phaseState, focusPos = focusDefault) {
    elapsed += dt;
    if (usePhysics) {
      updatePetalsPhysics(dt, phaseState, focusPos);
    } else {
      updatePetalsScripted(dt, phaseState, focusPos);
    }
    updateButterflies(dt, phaseState);
  }

  return { update, usePhysics, petals, butterflies };
}
