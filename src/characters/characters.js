// Two avatars walking along pathCurve.js's path, driven by input.axis().
// Movement is constrained to the path parameter (pathT, 0..1) rather than
// free-roam — always on-path, and pathT doubles as journey `progress` for
// the day-cycle. Also owns the world camera: scene.js only sets an initial
// camera pose and never repositions it per frame, so characters.update()
// can freely move/lookAt the camera each frame without any fight over
// ownership.
import * as THREE from 'three/webgpu';
import { getPathPoint, getPathTangent } from '../world/pathCurve.js';
import { SETTINGS } from '../config.js';

const TRAIL_OFFSET = 0.02; // pathT gap between the two avatars
const CAMERA_BACK = 4.5;
const CAMERA_UP = 2.2;
const CAMERA_LERP = 0.06;
const BOB_AMPLITUDE = 0.08;
const BOB_SPEED = 8;

function buildAvatar(color) {
  const group = new THREE.Group();

  const bodyGeometry = new THREE.CapsuleGeometry(0.28, 0.6, 4, 10);
  const bodyMaterial = new THREE.MeshStandardMaterial({ color, roughness: 0.6 });
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
  body.position.y = 0.6;
  group.add(body);

  const headGeometry = new THREE.SphereGeometry(0.22, 14, 12);
  const headMaterial = new THREE.MeshStandardMaterial({ color: 0xf2d3b6, roughness: 0.7 });
  const head = new THREE.Mesh(headGeometry, headMaterial);
  head.position.y = 1.15;
  group.add(head);

  return group;
}

/**
 * @param {THREE.Scene} scene
 * @param {{getPathPoint:Function, getPathTangent:Function}} curve unused
 *   directly (kept for API parity with the plan — movement samples the
 *   shared pathCurve module's getPathPoint/getPathTangent helpers, same as
 *   terrain.js/foliage.js).
 * @param {ReturnType<typeof import('../input.js').createInputState>} input
 * @param {THREE.PerspectiveCamera} camera world camera, repositioned each
 *   frame by the follow-cam below.
 * @param {object} [opts]
 * @returns {{ update:(dt:number)=>void, progress:number, leadPos:{x:number,y:number,z:number}, group:THREE.Group }}
 */
export function createCharacters(scene, curve, input, camera, opts = {}) {
  const walkSpeed = opts.walkSpeed ?? SETTINGS.walkSpeed;

  let pathT = 0;
  let bobPhase = 0;

  const group = new THREE.Group();
  const lead = buildAvatar(opts.avatarA ?? SETTINGS.avatarA);
  const trail = buildAvatar(opts.avatarB ?? SETTINGS.avatarB);
  group.add(lead);
  group.add(trail);
  scene.add(group);

  const leadPos = { x: 0, y: 0, z: 0 };

  const cameraTarget = new THREE.Vector3();
  const lookTarget = new THREE.Vector3();
  const tmpTangent = new THREE.Vector3();
  const tmpUp = new THREE.Vector3(0, 1, 0);

  function placeAvatar(obj, t, bobAmount) {
    const point = getPathPoint(t);
    const tangent = getPathTangent(t);
    const bob = bobAmount * Math.sin(bobPhase);
    obj.position.set(point.x, point.y + bob, point.z);
    // Face along the direction of travel.
    const facing = Math.atan2(tangent.x, tangent.z);
    obj.rotation.y = facing;
    return point;
  }

  function update(dt) {
    const axis = input.axis();
    pathT += axis * walkSpeed * dt;
    pathT = Math.min(1, Math.max(0, pathT));

    const moving = axis !== 0;
    if (moving) {
      bobPhase += dt * BOB_SPEED;
    } else {
      bobPhase = 0;
    }
    const bobAmount = moving ? BOB_AMPLITUDE : 0;

    const leadPoint = placeAvatar(lead, pathT, bobAmount);
    leadPos.x = leadPoint.x;
    leadPos.y = leadPoint.y;
    leadPos.z = leadPoint.z;

    const trailT = Math.min(1, Math.max(0, pathT - TRAIL_OFFSET));
    placeAvatar(trail, trailT, bobAmount);

    // Follow-camera: sit behind + above the lead, looking at the lead.
    tmpTangent.copy(getPathTangent(pathT));
    cameraTarget.set(
      leadPoint.x - tmpTangent.x * CAMERA_BACK,
      leadPoint.y + CAMERA_UP,
      leadPoint.z - tmpTangent.z * CAMERA_BACK,
    );
    camera.position.lerp(cameraTarget, CAMERA_LERP);
    lookTarget.set(leadPoint.x, leadPoint.y + 1.1, leadPoint.z);
    camera.up.copy(tmpUp);
    camera.lookAt(lookTarget);
  }

  return {
    update,
    get progress() {
      return pathT;
    },
    get leadPos() {
      return leadPos;
    },
    group,
  };
}
