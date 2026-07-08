export class CollisionWorld {
  constructor(radius) {
    this.radius = radius;
    this.colliders = [];
  }

  addRectCollider(config) {
    this.colliders.push(config);
  }

  resolve(position, movement) {
    const next = {
      x: position.x + movement.x,
      z: position.z + movement.z,
    };

    next.x = this.resolveAxis(position.x, position.z, movement.x, "x");
    next.z = this.resolveAxis(position.z, next.x, movement.z, "z");

    return next;
  }

  resolveAxis(primaryValue, secondaryValue, delta, axis) {
    let candidate = primaryValue + delta;
    if (delta === 0) {
      return candidate;
    }

    for (const collider of this.colliders) {
      if (collider.enabled && !collider.enabled()) {
        continue;
      }

      const otherAxis = axis === "x" ? "z" : "x";
      const minPrimary = collider[`min${axis.toUpperCase()}`] - this.radius;
      const maxPrimary = collider[`max${axis.toUpperCase()}`] + this.radius;
      const minSecondary = collider[`min${otherAxis.toUpperCase()}`] - this.radius;
      const maxSecondary = collider[`max${otherAxis.toUpperCase()}`] + this.radius;

      if (secondaryValue < minSecondary || secondaryValue > maxSecondary) {
        continue;
      }

      if (candidate >= minPrimary && candidate <= maxPrimary) {
        candidate = delta > 0 ? minPrimary : maxPrimary;
      }
    }

    return candidate;
  }
}
