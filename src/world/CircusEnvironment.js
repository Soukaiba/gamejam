import * as THREE from "three";
import { GAME_CONFIG } from "../config.js";
import { clamp, randomRange } from "../utils/math.js";

export class CircusEnvironment {
  constructor(scene) {
    this.scene = scene;
    this.awakeningProgress = 0;
    this.gateOpenProgress = 0;
    this.gateSealed = false;
    this.ticketFloatingEnabled = true;
    this.ticketDissolving = false;
    this.ticketDissolveProgress = 0;
    this.serviceDoorOpen = false;
    this.serviceDoorProgress = 0;
    this.animations = {
      ticketGlow: 0,
      particles: 0,
    };
    this.warmLights = [];
    this.lightBulbs = [];
    this.particles = null;
    this.ticket = null;
    this.ticketCard = null;
    this.ticketAura = null;
    this.ticketInventoryImage = "";
    this.ticketConfetti = [];
    this.gateLeft = null;
    this.gateRight = null;
    this.serviceDoorPivot = null;
    this.serviceDoorHandle = null;
    this.gateBarrier = { active: true };
    this.exitBarrier = { active: false };

    this.build();
  }

  build() {
    this.scene.background = new THREE.Color(0x050a11);
    this.scene.fog = new THREE.FogExp2(GAME_CONFIG.colors.fog, 0.031);

    const moonLight = new THREE.DirectionalLight(GAME_CONFIG.colors.moon, 0.72);
    moonLight.position.set(-18, 24, 14);
    this.scene.add(moonLight);

    const ambient = new THREE.HemisphereLight(0x425d7f, 0x04080d, 0.42);
    this.scene.add(ambient);

    const moon = new THREE.Mesh(
      new THREE.SphereGeometry(1.5, 20, 20),
      new THREE.MeshBasicMaterial({ color: 0xdfeaff }),
    );
    moon.position.set(-24, 19, -28);
    this.scene.add(moon);

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(140, 140),
      new THREE.MeshStandardMaterial({
        color: 0x10161f,
        roughness: 0.98,
        metalness: 0.02,
      }),
    );
    ground.rotation.x = -Math.PI / 2;
    this.scene.add(ground);

    this.createPath();
    this.createGate();
    this.createFenceLine();
    this.createTent();
    this.createWagons();
    this.createLampPosts();
    this.createTicket();
    this.createStars();
    this.createDust();
  }

  createPath() {
    const pathMaterial = new THREE.MeshStandardMaterial({
      color: 0x2b2e2f,
      roughness: 1,
      metalness: 0,
    });

    const outerPath = new THREE.Mesh(new THREE.BoxGeometry(6, 0.05, 30), pathMaterial);
    outerPath.position.set(0, 0.025, 17);
    this.scene.add(outerPath);

    const innerPath = new THREE.Mesh(new THREE.BoxGeometry(6, 0.05, 40), pathMaterial);
    innerPath.position.set(0, 0.025, -10);
    this.scene.add(innerPath);

    const puddle = new THREE.Mesh(
      new THREE.CircleGeometry(2.4, 32),
      new THREE.MeshStandardMaterial({
        color: 0x0c131b,
        roughness: 0.08,
        metalness: 0,
      }),
    );
    puddle.rotation.x = -Math.PI / 2;
    puddle.position.set(-4.6, 0.02, 16.8);
    this.scene.add(puddle);
  }

  createGate() {
    const gateGroup = new THREE.Group();
    gateGroup.position.set(0, 0, GAME_CONFIG.world.gateLineZ);
    this.scene.add(gateGroup);

    const ironMaterial = new THREE.MeshStandardMaterial({
      color: 0x202a35,
      roughness: 0.78,
      metalness: 0.42,
    });
    const woodMaterial = new THREE.MeshStandardMaterial({
      color: 0x4a3026,
      roughness: 0.92,
      metalness: 0.04,
    });

    const arch = new THREE.Mesh(new THREE.BoxGeometry(8.8, 0.45, 0.6), woodMaterial);
    arch.position.set(0, 3.9, 0);
    gateGroup.add(arch);

    const signBacking = new THREE.Mesh(new THREE.BoxGeometry(4.2, 1.05, 0.2), woodMaterial);
    signBacking.position.set(0, 4.34, 0.2);
    gateGroup.add(signBacking);

    const postGeometry = new THREE.BoxGeometry(0.65, 4.1, 0.65);
    const leftPost = new THREE.Mesh(postGeometry, ironMaterial);
    leftPost.position.set(-3.3, 2.05, 0);
    gateGroup.add(leftPost);

    const rightPost = leftPost.clone();
    rightPost.position.x = 3.3;
    gateGroup.add(rightPost);

    this.gateLeft = this.createGateDoor(ironMaterial, -2.5);
    this.gateRight = this.createGateDoor(ironMaterial, 2.5, true);
    gateGroup.add(this.gateLeft);
    gateGroup.add(this.gateRight);
  }

  createGateDoor(material, x, mirrored = false) {
    const pivot = new THREE.Group();
    pivot.position.set(x, 0, 0);

    const frame = new THREE.Mesh(new THREE.BoxGeometry(2.2, 3.2, 0.15), material);
    frame.position.set(mirrored ? -1.1 : 1.1, 1.6, 0);
    pivot.add(frame);

    const barGeometry = new THREE.BoxGeometry(0.09, 2.7, 0.09);
    for (let index = 0; index < 7; index += 1) {
      const bar = new THREE.Mesh(barGeometry, material);
      const offset = -0.8 + index * 0.27;
      bar.position.set((mirrored ? -1.45 : 1.45) + offset, 1.6, 0.02);
      pivot.add(bar);
    }

    const light = new THREE.PointLight(GAME_CONFIG.colors.warmLight, 0, 7, 2);
    light.position.set(mirrored ? -1.1 : 1.1, 2.7, 0.5);
    pivot.add(light);
    this.warmLights.push({ light, offset: 0.15 + this.warmLights.length * 0.035 });

    return pivot;
  }

  createFenceLine() {
    const fenceMaterial = new THREE.MeshStandardMaterial({
      color: 0x1b232d,
      roughness: 0.82,
      metalness: 0.32,
    });

    const segments = [
      { x: -8.8, z: 8.4, w: 10.6, d: 0.2 },
      { x: 8.8, z: 8.4, w: 10.6, d: 0.2 },
      { x: -19.2, z: -8, w: 0.2, d: 33 },
      { x: 19.2, z: -8, w: 0.2, d: 33 },
      { x: 0, z: -24.3, w: 38.2, d: 0.2 },
    ];

    for (const segment of segments) {
      const rail = new THREE.Mesh(
        new THREE.BoxGeometry(segment.w, 2.6, segment.d),
        fenceMaterial,
      );
      rail.position.set(segment.x, 1.3, segment.z);
      this.scene.add(rail);
    }
  }

  createTent() {
    const tentGroup = new THREE.Group();
    tentGroup.position.set(0, 0, -12);
    this.scene.add(tentGroup);

    const canopy = new THREE.Mesh(
      new THREE.ConeGeometry(11.5, 9.5, 16, 1, true),
      new THREE.MeshStandardMaterial({
        color: 0x543445,
        roughness: 0.88,
        metalness: 0.06,
        side: THREE.DoubleSide,
      }),
    );
    canopy.position.y = 7;
    tentGroup.add(canopy);

    const stripes = new THREE.Mesh(
      new THREE.CylinderGeometry(9.8, 9.8, 5.2, 20, 1, true),
      new THREE.MeshStandardMaterial({
        color: 0x311b2a,
        roughness: 0.95,
        metalness: 0,
        side: THREE.DoubleSide,
      }),
    );
    stripes.position.y = 2.6;
    tentGroup.add(stripes);

    const entrance = new THREE.Mesh(
      new THREE.BoxGeometry(4, 3.5, 0.6),
      new THREE.MeshStandardMaterial({
        color: 0x0d0d13,
        roughness: 1,
      }),
    );
    entrance.position.set(0, 1.75, 9.5);
    tentGroup.add(entrance);

    for (let index = 0; index < 12; index += 1) {
      const angle = (index / 12) * Math.PI * 2;
      const bulb = new THREE.Mesh(
        new THREE.SphereGeometry(0.18, 10, 10),
        new THREE.MeshStandardMaterial({
          color: 0xd6d8dd,
          emissive: new THREE.Color(0x000000),
          emissiveIntensity: 0,
        }),
      );
      bulb.position.set(Math.cos(angle) * 9.7, 4.8, Math.sin(angle) * 9.7);
      tentGroup.add(bulb);
      this.lightBulbs.push({ bulb, offset: index * 0.06 });

      const pointLight = new THREE.PointLight(GAME_CONFIG.colors.warmLight, 0, 10, 2);
      pointLight.position.copy(bulb.position);
      tentGroup.add(pointLight);
      this.warmLights.push({ light: pointLight, offset: index * 0.06 });
    }
  }

  createWagons() {
    const wagonMaterial = new THREE.MeshStandardMaterial({
      color: 0x2d3440,
      roughness: 0.88,
      metalness: 0.12,
    });

    const positions = [
      { x: -12.5, z: -6.5, rotation: 0.18 },
      { x: 13.2, z: -3.5, rotation: -0.24 },
      { x: -11.8, z: -16.8, rotation: 0.32 },
    ];

    for (const config of positions) {
      const wagon = new THREE.Group();
      wagon.position.set(config.x, 0, config.z);
      wagon.rotation.y = config.rotation;

      const body = new THREE.Mesh(new THREE.BoxGeometry(4.2, 2.2, 2.2), wagonMaterial);
      body.position.y = 1.65;
      wagon.add(body);

      const canopy = new THREE.Mesh(
        new THREE.CylinderGeometry(1.5, 1.5, 4, 12, 1, true, 0, Math.PI),
        new THREE.MeshStandardMaterial({
          color: 0x4b2334,
          roughness: 0.92,
          metalness: 0,
          side: THREE.DoubleSide,
        }),
      );
      canopy.rotation.z = Math.PI / 2;
      canopy.position.set(0, 2.65, 0);
      wagon.add(canopy);

      for (const wheelX of [-1.45, 1.45]) {
        for (const wheelZ of [-1, 1]) {
          const wheel = new THREE.Mesh(
            new THREE.CylinderGeometry(0.55, 0.55, 0.24, 20),
            new THREE.MeshStandardMaterial({
              color: 0x1d1d1d,
              roughness: 0.9,
              metalness: 0.18,
            }),
          );
          wheel.rotation.z = Math.PI / 2;
          wheel.position.set(wheelX, 0.6, wheelZ);
          wagon.add(wheel);
        }
      }

      this.scene.add(wagon);
    }

    this.createServiceWagon();
  }

  createServiceWagon() {
    const wagon = new THREE.Group();
    wagon.position.set(-8.9, 0, 13.3);
    wagon.rotation.y = -0.34;
    this.scene.add(wagon);

    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0x3a3d4a,
      roughness: 0.9,
      metalness: 0.08,
    });
    const woodMaterial = new THREE.MeshStandardMaterial({
      color: 0x5a3f32,
      roughness: 0.92,
      metalness: 0.04,
    });

    const body = new THREE.Mesh(new THREE.BoxGeometry(3.4, 2, 2.3), bodyMaterial);
    body.position.y = 1.4;
    wagon.add(body);

    const canopy = new THREE.Mesh(
      new THREE.BoxGeometry(3.8, 0.18, 2.7),
      woodMaterial,
    );
    canopy.position.y = 2.55;
    wagon.add(canopy);

    this.serviceDoorPivot = new THREE.Group();
    this.serviceDoorPivot.position.set(1.72, 1.45, 0);
    wagon.add(this.serviceDoorPivot);

    const door = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.6, 1.7), woodMaterial);
    door.position.set(-0.06, 0, 0);
    this.serviceDoorPivot.add(door);

    this.serviceDoorHandle = new THREE.Mesh(
      new THREE.SphereGeometry(0.06, 10, 10),
      new THREE.MeshStandardMaterial({
        color: 0xb8955d,
        roughness: 0.42,
        metalness: 0.68,
      }),
    );
    this.serviceDoorHandle.position.set(-0.13, 0.05, 0.35);
    this.serviceDoorPivot.add(this.serviceDoorHandle);

    const lamp = new THREE.PointLight(GAME_CONFIG.colors.warmLight, 0, 6, 2);
    lamp.position.set(-1.2, 2.1, 0);
    wagon.add(lamp);
    this.warmLights.push({ light: lamp, offset: 0.5 });
  }

  createLampPosts() {
    const positions = [
      { x: -4.4, z: 3.5 },
      { x: 4.4, z: 0.8 },
      { x: -4.2, z: -8.7 },
      { x: 4.1, z: -14.2 },
    ];

    for (let index = 0; index < positions.length; index += 1) {
      const config = positions[index];
      const post = new THREE.Group();
      post.position.set(config.x, 0, config.z);

      const shaft = new THREE.Mesh(
        new THREE.CylinderGeometry(0.11, 0.14, 3.7, 10),
        new THREE.MeshStandardMaterial({
          color: 0x222932,
          roughness: 0.72,
          metalness: 0.45,
        }),
      );
      shaft.position.y = 1.85;
      post.add(shaft);

      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.08, 0.08), shaft.material);
      arm.position.set(0.32, 3.48, 0);
      post.add(arm);

      const lantern = new THREE.Mesh(
        new THREE.SphereGeometry(0.22, 12, 12),
        new THREE.MeshStandardMaterial({
          color: 0xeed8aa,
          emissive: new THREE.Color(0x000000),
          emissiveIntensity: 0,
        }),
      );
      lantern.position.set(0.66, 3.25, 0);
      post.add(lantern);
      this.lightBulbs.push({ bulb: lantern, offset: 0.2 + index * 0.08 });

      const light = new THREE.PointLight(GAME_CONFIG.colors.warmLight, 0, 12, 2);
      light.position.copy(lantern.position);
      post.add(light);
      this.warmLights.push({ light, offset: 0.2 + index * 0.08 });

      this.scene.add(post);
    }
  }

  createTicket() {
    const frontTexture = this.createTicketTexture(true);
    const backTexture = this.createTicketTexture(false);

    const group = new THREE.Group();
    const cardGroup = new THREE.Group();
    group.add(cardGroup);

    const body = new THREE.Mesh(
      new THREE.BoxGeometry(0.95, 0.05, 0.45),
      new THREE.MeshStandardMaterial({
        color: 0xdcc28f,
        roughness: 0.8,
        metalness: 0.04,
      }),
    );
    cardGroup.add(body);

    const front = new THREE.Mesh(
      new THREE.PlaneGeometry(0.89, 0.39),
      new THREE.MeshStandardMaterial({
        map: frontTexture,
        transparent: true,
      }),
    );
    front.rotation.x = -Math.PI / 2;
    front.position.y = 0.026;
    cardGroup.add(front);

    const back = new THREE.Mesh(
      new THREE.PlaneGeometry(0.89, 0.39),
      new THREE.MeshStandardMaterial({
        map: backTexture,
        transparent: true,
      }),
    );
    back.rotation.x = Math.PI / 2;
    back.position.y = -0.026;
    cardGroup.add(back);

    const aura = new THREE.Mesh(
      new THREE.SphereGeometry(0.55, 16, 16),
      new THREE.MeshBasicMaterial({
        color: GAME_CONFIG.colors.ticket,
        transparent: true,
        opacity: 0.2,
      }),
    );
    aura.scale.set(1, 0.38, 1);
    aura.position.y = 0.14;
    group.add(aura);

    group.position.set(
      GAME_CONFIG.world.ticketPosition.x,
      GAME_CONFIG.world.ticketPosition.y,
      GAME_CONFIG.world.ticketPosition.z,
    );
    group.rotation.x = -0.25;

    this.scene.add(group);
    this.ticket = group;
    this.ticketCard = cardGroup;
    this.ticketAura = aura;
    this.ticketInventoryImage = frontTexture.image.toDataURL("image/png");
    this.ticketTemplate = group.clone(true);

    for (let index = 0; index < 18; index += 1) {
      const piece = new THREE.Mesh(
        new THREE.PlaneGeometry(0.05, 0.07),
        new THREE.MeshBasicMaterial({
          color: index % 2 === 0 ? 0xf6cf7d : 0xa8e7ff,
          transparent: true,
          opacity: 0,
          side: THREE.DoubleSide,
        }),
      );
      piece.visible = false;
      piece.userData.velocity = new THREE.Vector3(
        randomRange(-0.7, 0.7),
        randomRange(0.3, 1.3),
        randomRange(-0.35, 0.35),
      );
      piece.userData.spin = randomRange(-5, 5);
      group.add(piece);
      this.ticketConfetti.push(piece);
    }
  }

  createTicketTexture(isFront) {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 256;
    const context = canvas.getContext("2d");

    context.fillStyle = "#d7be8d";
    context.fillRect(0, 0, canvas.width, canvas.height);

    const gradient = context.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, "rgba(255, 245, 218, 0.45)");
    gradient.addColorStop(1, "rgba(120, 80, 48, 0.2)");
    context.fillStyle = gradient;
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.strokeStyle = "#7f5e3d";
    context.lineWidth = 14;
    context.strokeRect(14, 14, canvas.width - 28, canvas.height - 28);

    context.fillStyle = "#6a4b2f";
    context.font = "bold 28px Georgia";
    context.textAlign = "center";
    context.fillText("THE CIRCUS REMEMBERS", canvas.width / 2, 56);

    if (isFront) {
      context.font = "bold 44px Georgia";
      context.fillText("ONE TICKET", canvas.width / 2, 122);
      context.fillText("ONE MEMORY", canvas.width / 2, 178);
    } else {
      context.font = "italic 30px Georgia";
      context.fillText("Admit one dreamer", canvas.width / 2, 124);
      context.font = "24px Georgia";
      context.fillText("Keep dry. Do not fold.", canvas.width / 2, 176);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  createStars() {
    const points = [];
    for (let index = 0; index < 500; index += 1) {
      points.push((Math.random() - 0.5) * 120, 16 + Math.random() * 28, (Math.random() - 0.5) * 120);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(points, 3));
    const material = new THREE.PointsMaterial({
      color: 0xbfd5ff,
      size: 0.24,
      transparent: true,
      opacity: 0.78,
    });

    this.scene.add(new THREE.Points(geometry, material));
  }

  createDust() {
    const positions = [];
    for (let index = 0; index < 220; index += 1) {
      positions.push(
        (Math.random() - 0.5) * 30,
        Math.random() * 5 + 0.15,
        Math.random() * 58 - 26,
      );
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({
      color: 0xe5f4ff,
      size: 0.08,
      transparent: true,
      opacity: 0.28,
    });

    this.particles = new THREE.Points(geometry, material);
    this.scene.add(this.particles);
  }

  update(deltaTime, elapsedTime) {
    this.animations.ticketGlow += deltaTime;
    this.animations.particles += deltaTime;
    const pulse = (Math.sin(this.animations.ticketGlow * 2.4) + 1) * 0.5;

    if (this.ticket && this.ticketFloatingEnabled && !this.ticketDissolving && this.ticket.parent === this.scene) {
      this.ticket.position.y = GAME_CONFIG.world.ticketPosition.y + Math.sin(elapsedTime * 1.35) * 0.05;
      this.ticket.rotation.y += deltaTime * 0.45;
      this.ticketAura.scale.setScalar(1 + pulse * 0.2);
      this.ticketAura.scale.y = 0.38;
      this.ticketAura.material.opacity = 0.18 + pulse * 0.12;
    }

    for (const entry of this.warmLights) {
      const base = clamp((this.awakeningProgress - entry.offset) / 0.3, 0, 1);
      const flicker = 0.92 + Math.sin(elapsedTime * 7 + entry.light.position.x) * 0.08;
      entry.light.intensity = base * 1.7 * flicker;
    }

    for (const entry of this.lightBulbs) {
      const glow = clamp((this.awakeningProgress - entry.offset) / 0.26, 0, 1);
      entry.bulb.material.emissive.setHex(0xffbc63);
      entry.bulb.material.emissiveIntensity = glow * (0.65 + pulse * 0.3);
    }

    if (this.particles) {
      this.particles.rotation.y += deltaTime * 0.006;
      this.particles.position.y = Math.sin(this.animations.particles * 0.18) * 0.08;
    }

    if (this.serviceDoorPivot) {
      const target = this.serviceDoorOpen ? -Math.PI * 0.48 : 0;
      this.serviceDoorProgress += (target - this.serviceDoorProgress) * (1 - Math.exp(-deltaTime * 8));
      this.serviceDoorPivot.rotation.y = this.serviceDoorProgress;
    }

    const openAngle = this.gateOpenProgress * Math.PI * 0.48;
    this.gateLeft.rotation.y = openAngle;
    this.gateRight.rotation.y = -openAngle;
  }

  prepareTicketForInspection() {
    this.ticketFloatingEnabled = false;
  }

  restoreTicketAfterInspection() {
    this.ticketFloatingEnabled = true;
    this.ticketDissolving = false;
    this.ticketDissolveProgress = 0;
    this.ticketCard.scale.set(1, 1, 1);
    this.ticketCard.rotation.set(0, 0, 0);
    this.ticketAura.visible = true;
    this.ticketAura.material.opacity = 0.2;

    for (const piece of this.ticketConfetti) {
      piece.visible = false;
      piece.material.opacity = 0;
      piece.position.set(0, 0, 0);
      piece.rotation.set(0, 0, 0);
    }
  }

  beginTicketDissolve() {
    this.ticketDissolving = true;
    this.ticketDissolveProgress = 0;
  }

  updateTicketDissolve(progress) {
    this.ticketDissolveProgress = progress;
    const fold = Math.min(progress / 0.5, 1);
    const burst = clamp((progress - 0.38) / 0.62, 0, 1);

    this.ticketCard.scale.x = 1 - fold * 0.92;
    this.ticketCard.rotation.z = fold * 0.42;
    this.ticketCard.rotation.y = fold * 1.2;
    this.ticketAura.material.opacity = (1 - burst) * 0.2;

    for (const piece of this.ticketConfetti) {
      piece.visible = burst > 0.01;
      piece.material.opacity = burst < 0.92 ? 0.8 * (1 - burst * 0.75) : 0;
      piece.position.copy(piece.userData.velocity).multiplyScalar(burst * 1.6);
      piece.rotation.x += piece.userData.spin * 0.005;
      piece.rotation.y += piece.userData.spin * 0.006;
    }
  }

  storeTicketInInventory() {
    this.ticketDissolving = false;
    this.ticketFloatingEnabled = false;

    if (this.ticket.parent) {
      this.ticket.parent.remove(this.ticket);
    }

    for (const piece of this.ticketConfetti) {
      piece.visible = false;
      piece.material.opacity = 0;
    }
  }

  setAwakeningProgress(progress) {
    this.awakeningProgress = progress;
  }

  setGateOpenProgress(progress) {
    this.gateOpenProgress = progress;
    const openEnough = progress >= 0.74 && !this.gateSealed;
    this.gateBarrier.active = !openEnough;
  }

  sealExit() {
    this.gateSealed = true;
    this.exitBarrier.active = true;
  }

  toggleServiceDoor() {
    this.serviceDoorOpen = !this.serviceDoorOpen;
  }

  isServiceDoorOpen() {
    return this.serviceDoorOpen;
  }

  createInventoryTicketPreview() {
    const preview = this.ticketTemplate.clone(true);
    preview.position.set(0, 0, 0);
    preview.rotation.set(0, 0, 0);
    preview.scale.set(1, 1, 1);
    return preview;
  }

  getTicketInventoryImage() {
    return this.ticketInventoryImage;
  }

  getColliders() {
    return [
      { minX: -25, maxX: 25, minZ: 28, maxZ: 29 },
      { minX: -25, maxX: 25, minZ: -29, maxZ: -28 },
      { minX: -25, maxX: -24, minZ: -29, maxZ: 29 },
      { minX: 24, maxX: 25, minZ: -29, maxZ: 29 },
      { minX: -24, maxX: -4.2, minZ: 8.15, maxZ: 8.7 },
      { minX: 4.2, maxX: 24, minZ: 8.15, maxZ: 8.7 },
      { minX: -3.2, maxX: 3.2, minZ: 7.6, maxZ: 8.8, enabled: () => this.gateBarrier.active },
      { minX: -3.2, maxX: 3.2, minZ: 9.1, maxZ: 10.2, enabled: () => this.exitBarrier.active },
      { minX: -3, maxX: 3, minZ: -3.8, maxZ: -2.3 },
      { minX: -13.8, maxX: -11, minZ: -7.8, maxZ: -5.2 },
      { minX: 11.2, maxX: 15.4, minZ: -5.1, maxZ: -1.8 },
      { minX: -13.3, maxX: -10.2, minZ: -18.2, maxZ: -15.1 },
      { minX: -10.9, maxX: -7.1, minZ: 11.6, maxZ: 14.9 },
    ];
  }
}
