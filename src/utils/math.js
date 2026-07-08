import * as THREE from "three";

export const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export const dampVector = (current, target, smoothing, deltaTime) => {
  current.x = THREE.MathUtils.damp(current.x, target.x, smoothing, deltaTime);
  current.y = THREE.MathUtils.damp(current.y, target.y, smoothing, deltaTime);
  current.z = THREE.MathUtils.damp(current.z, target.z, smoothing, deltaTime);
  return current;
};

export const yawForward = (yaw) => new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw));

export const yawRight = (yaw) => new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw));

export const randomRange = (min, max) => min + Math.random() * (max - min);
