import * as THREE from "three";

export class PlayerHands {
  constructor(camera) {
    this.root = new THREE.Group();
    this.root.position.set(0, -0.45, -0.22);
    camera.add(this.root);

    this.leftHand = this.createHand(-0.28, false);
    this.rightHand = this.createHand(0.28, true);
    this.root.add(this.leftHand.group);
    this.root.add(this.rightHand.group);
  }

  createHand(x, mirrored) {
    const group = new THREE.Group();
    group.position.set(x, -0.08, -0.26);
    group.rotation.set(-0.38, mirrored ? -0.18 : 0.18, mirrored ? -0.08 : 0.08);

    const sleeve = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 0.28, 0.4),
      new THREE.MeshStandardMaterial({
        color: 0x38404e,
        roughness: 0.92,
        metalness: 0.05,
      }),
    );
    sleeve.position.set(0, -0.05, 0.02);
    group.add(sleeve);

    const hand = new THREE.Mesh(
      new THREE.BoxGeometry(0.16, 0.15, 0.22),
      new THREE.MeshStandardMaterial({
        color: 0xd9ba9d,
        roughness: 0.95,
        metalness: 0,
      }),
    );
    hand.position.set(0, -0.17, -0.14);
    group.add(hand);

    const thumb = new THREE.Mesh(hand.geometry, hand.material);
    thumb.scale.set(0.42, 0.34, 0.5);
    thumb.position.set(mirrored ? 0.08 : -0.08, -0.16, -0.08);
    thumb.rotation.z = mirrored ? -0.42 : 0.42;
    group.add(thumb);

    return { group };
  }

  update(deltaTime, state) {
    const bob = state.bob;
    const inspection = state.inspectWeight;
    const reach = state.reachWeight;
    const crouchOffset = state.crouchWeight * 0.08;

    this.root.position.y += ((-0.45 + crouchOffset) - this.root.position.y) * (1 - Math.exp(-deltaTime * 8));

    this.leftHand.group.position.x += ((-0.28) - this.leftHand.group.position.x) * (1 - Math.exp(-deltaTime * 10));
    this.leftHand.group.position.y += ((-0.08 - bob * 0.12) - this.leftHand.group.position.y) * (1 - Math.exp(-deltaTime * 10));
    this.leftHand.group.position.z += ((-0.26 - bob * 0.18) - this.leftHand.group.position.z) * (1 - Math.exp(-deltaTime * 10));
    this.leftHand.group.rotation.x += ((-0.38 - inspection * 0.35) - this.leftHand.group.rotation.x) * (1 - Math.exp(-deltaTime * 8));
    this.leftHand.group.rotation.y += ((0.18 - inspection * 0.2) - this.leftHand.group.rotation.y) * (1 - Math.exp(-deltaTime * 8));

    this.rightHand.group.position.x += ((0.28 - inspection * 0.18) - this.rightHand.group.position.x) * (1 - Math.exp(-deltaTime * 10));
    this.rightHand.group.position.y += ((-0.08 - bob * 0.12 + reach * 0.05) - this.rightHand.group.position.y) * (1 - Math.exp(-deltaTime * 10));
    this.rightHand.group.position.z += ((-0.26 - bob * 0.18 - inspection * 0.3 - reach * 0.16) - this.rightHand.group.position.z) * (1 - Math.exp(-deltaTime * 10));
    this.rightHand.group.rotation.x += ((-0.38 - inspection * 0.45 - reach * 0.28) - this.rightHand.group.rotation.x) * (1 - Math.exp(-deltaTime * 8));
    this.rightHand.group.rotation.y += ((-0.18 - inspection * 0.55) - this.rightHand.group.rotation.y) * (1 - Math.exp(-deltaTime * 8));
    this.rightHand.group.rotation.z += ((-0.08 + inspection * 0.2) - this.rightHand.group.rotation.z) * (1 - Math.exp(-deltaTime * 8));
  }
}
