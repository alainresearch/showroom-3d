export function isBlocked(x, z, colliders, radius = 0.19, includeFurniture = true) {
  return colliders.some(c => {
    if (!includeFurniture && c.type === 'furniture') return false;
    const dx = Math.max(c.minX - x, 0, x - c.maxX);
    const dz = Math.max(c.minZ - z, 0, z - c.maxZ);
    return dx * dx + dz * dz < radius * radius;
  });
}

export function isOnFloor(x, z, walkable, bounds, radius = 0.19) {
  if (walkable?.length) return walkable.some(r => x >= r.minX && x <= r.maxX && z >= r.minZ && z <= r.maxZ);
  return x >= bounds.minX + radius && x <= bounds.maxX - radius && z >= bounds.minZ + radius && z <= bounds.maxZ - radius;
}

export function moveWithCollision(position, delta, model, includeFurniture = true) {
  const next = { x: position.x, z: position.z };
  const steps = Math.max(1, Math.ceil(Math.hypot(delta.x, delta.z) / 0.08));
  const dx = delta.x / steps, dz = delta.z / steps;
  const valid = (x, z) => isOnFloor(x, z, model.walkable, model.bounds) && !isBlocked(x, z, model.colliders, 0.19, includeFurniture);
  for (let i = 0; i < steps; i++) {
    if (valid(next.x + dx, next.z)) next.x += dx;
    if (valid(next.x, next.z + dz)) next.z += dz;
  }
  return next;
}

export function safeSpawn(room, model, includeFurniture = true) {
  const valid = (x, z) => isOnFloor(x, z, model.walkable, model.bounds) && !isBlocked(x, z, model.colliders, 0.23, includeFurniture);
  if (valid(room.x, room.z)) return { ...room };
  for (let radius = 0.15; radius <= 1.5; radius += 0.15) {
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 10) {
      const x = room.x + Math.sin(a) * radius, z = room.z + Math.cos(a) * radius;
      if (valid(x, z)) return { ...room, x, z };
    }
  }
  return null;
}
