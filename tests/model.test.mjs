import assert from 'node:assert/strict';
import { register } from 'node:module';
import test from 'node:test';
import { isBlocked, isOnFloor, safeSpawn } from '../web/collision.js';

// Self-register so npm test works; an explicit --experimental-loader also works.
register(new URL('../scripts/three-loader.mjs', import.meta.url));
const cases = await Promise.all(['tianlan-385a-01', 'tianlan-385a-american'].map(async slug => ({slug, createApartment:(await import(`../showrooms/${slug}/model.js`)).createApartment})));
for (const {slug, createApartment} of cases) {
const caseTest = (name, fn) => test(`${slug}: ${name}`, fn);
const apartment = createApartment();
const STEP = 0.15;
const RADIUS = 0.19;
const finite = values => values.every(Number.isFinite);
const coordinate = point => `(${point.x.toFixed(2)}, ${point.z.toFixed(2)})`;

function validAt(x, z, includeFurniture) {
  return isOnFloor(x, z, apartment.walkable, apartment.bounds, RADIUS)
    && !isBlocked(x, z, apartment.colliders, RADIUS, includeFurniture);
}

// Check the whole grid edge, not just its endpoints: a route cannot jump a wall
// or a gap between floor patches. The graph has four neighbours, no diagonals.
function clearSegment(a, b, includeFurniture) {
  const samples = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.z - a.z) / 0.04));
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    if (!validAt(a.x + (b.x - a.x) * t, a.z + (b.z - a.z) * t, includeFurniture)) return false;
  }
  return true;
}

function makeGrid(includeFurniture) {
  const { bounds } = apartment;
  const columns = Math.floor((bounds.maxX - bounds.minX) / STEP) + 1;
  const rows = Math.floor((bounds.maxZ - bounds.minZ) / STEP) + 1;
  const size = columns * rows;
  assert.ok(size <= 50_000, `connectivity grid is too large: ${size}`);
  const valid = new Uint8Array(size);
  const visited = new Uint8Array(size);
  const queue = new Uint32Array(size);
  const point = index => ({ x: bounds.minX + (index % columns) * STEP, z: bounds.minZ + Math.floor(index / columns) * STEP });
  for (let i = 0; i < size; i++) {
    const p = point(i);
    valid[i] = Number(validAt(p.x, p.z, includeFurniture));
  }

  // Only inspect a bounded neighbourhood. A distant cell across a wall must not
  // be accepted as the grid representative of a teleport destination.
  function nearest(pointToFind) {
    const baseX = Math.round((pointToFind.x - bounds.minX) / STEP);
    const baseZ = Math.round((pointToFind.z - bounds.minZ) / STEP);
    let index = -1, distance = Infinity;
    for (let dz = -3; dz <= 3; dz++) for (let dx = -3; dx <= 3; dx++) {
      const x = baseX + dx, z = baseZ + dz;
      if (x < 0 || x >= columns || z < 0 || z >= rows) continue;
      const candidate = z * columns + x;
      if (!valid[candidate]) continue;
      const p = point(candidate), d = Math.hypot(p.x - pointToFind.x, p.z - pointToFind.z);
      if (d < distance && clearSegment(pointToFind, p, includeFurniture)) {
        index = candidate; distance = d;
      }
    }
    return { index, distance };
  }

  function flood(start) {
    let head = 0, tail = 0;
    queue[tail++] = start;
    visited[start] = 1;
    while (head < tail) {
      const index = queue[head++], x = index % columns, z = Math.floor(index / columns);
      const neighbours = [];
      if (x) neighbours.push(index - 1);
      if (x + 1 < columns) neighbours.push(index + 1);
      if (z) neighbours.push(index - columns);
      if (z + 1 < rows) neighbours.push(index + columns);
      for (const neighbour of neighbours) {
        if (visited[neighbour] || !valid[neighbour]) continue;
        if (!clearSegment(point(index), point(neighbour), includeFurniture)) continue;
        visited[neighbour] = 1;
        queue[tail++] = neighbour;
      }
    }
    return tail;
  }
  return { size, valid, visited, point, nearest, flood };
}

function blockedDoorways(includeFurniture) {
  return (apartment.metrics.openings || []).filter(door => {
    for (let along = door.start + RADIUS + 0.03; along <= door.end - RADIUS - 0.03; along += 0.10) {
      const a = door.axis === 'x' ? { x: along, z: door.fixed - 0.40 } : { x: door.fixed - 0.40, z: along };
      const b = door.axis === 'x' ? { x: along, z: door.fixed + 0.40 } : { x: door.fixed + 0.40, z: along };
      if (clearSegment(a, b, includeFurniture)) return false;
    }
    return true;
  }).map(door => `${door.axis} fixed=${door.fixed.toFixed(2)} opening=${door.start.toFixed(2)}..${door.end.toFixed(2)}`);
}

caseTest('all model transforms, vertex positions and geometry bounds are finite', () => {
  let meshCount = 0;
  apartment.group.updateMatrixWorld(true);
  const seen = new Set();
  apartment.group.traverse(object => {
    const label = object.name || object.type;
    assert.ok(finite([...object.position.toArray(), ...object.quaternion.toArray(), ...object.scale.toArray(), ...object.matrixWorld.elements]), `${label}: non-finite transform`);
    if (object.isInstancedMesh) assert.ok(finite(object.instanceMatrix.array), `${label}: non-finite instance transform`);
    if (!object.geometry || seen.has(object.geometry)) return;
    seen.add(object.geometry); meshCount++;
    const positions = object.geometry.getAttribute('position');
    assert.ok(positions && positions.count > 0, `${label}: missing geometry positions`);
    assert.ok(finite(positions.array), `${label}: non-finite vertex`);
    object.geometry.computeBoundingBox();
    const box = object.geometry.boundingBox;
    assert.ok(box && !box.isEmpty() && finite([...box.min.toArray(), ...box.max.toArray()]), `${label}: invalid bounding box`);
  });
  assert.ok(meshCount > 0, 'model contains no geometry');
  assert.ok(apartment.walkable.length > 0, 'model needs explicit walkable floor rectangles');
  for (const rectangle of [apartment.bounds, ...apartment.walkable, ...apartment.colliders]) {
    assert.ok(finite([rectangle.minX, rectangle.maxX, rectangle.minZ, rectangle.maxZ]));
    assert.ok(rectangle.minX < rectangle.maxX && rectangle.minZ < rectangle.maxZ, 'invalid rectangle dimensions');
  }
});

for (const includeFurniture of [false, true]) {
  const mode = includeFurniture ? 'with furniture' : 'without furniture';
  caseTest(`all 14 rooms have safe teleport destinations ${mode}`, () => {
    assert.equal(apartment.rooms.length, 14);
    assert.equal(new Set(apartment.rooms.map(room => room.id)).size, 14, 'room ids must be unique');
    for (const room of apartment.rooms) {
      assert.ok(finite([room.x, room.z, room.yaw]), `${room.id}: invalid room coordinate`);
      const spawn = safeSpawn(room, apartment, includeFurniture);
      assert.ok(spawn, `${room.id} / ${room.name}: no safe destination near ${coordinate(room)}`);
      assert.ok(validAt(spawn.x, spawn.z, includeFurniture), `${room.id}: unsafe returned spawn ${coordinate(spawn)}`);
      assert.ok(Math.hypot(spawn.x - room.x, spawn.z - room.z) <= 1.5 + 1e-8, `${room.id}: spawn moved too far`);
    }
  });

  caseTest(`entry has a continuous walking route to all 14 room destinations ${mode}`, t => {
    assert.ok(validAt(apartment.entry.x, apartment.entry.z, includeFurniture), `entry itself is blocked: ${coordinate(apartment.entry)}`);
    const grid = makeGrid(includeFurniture);
    const start = grid.nearest(apartment.entry);
    assert.notEqual(start.index, -1, 'no connected grid cell near entry');
    assert.ok(start.distance <= STEP * 2, 'entry is too far from the connectivity grid');
    const reached = grid.flood(start.index);
    const failures = [];
    for (const room of apartment.rooms) {
      const spawn = safeSpawn(room, apartment, includeFurniture);
      if (!spawn) { failures.push(`${room.id}: no safe spawn`); continue; }
      const target = grid.nearest(spawn);
      if (target.index === -1 || target.distance > STEP * 2) {
        failures.push(`${room.id}: no nearby valid grid cell at ${coordinate(spawn)}`); continue;
      }
      if (grid.visited[target.index]) continue;
      // A linear scan per failed room is bounded by 14 * grid.size, not a
      // pairwise cell search. Include a useful frontier coordinate in failures.
      let closest = null, distance = Infinity;
      for (let i = 0; i < grid.size; i++) if (grid.visited[i]) {
        const p = grid.point(i), d = Math.hypot(p.x - spawn.x, p.z - spawn.z);
        if (d < distance) { closest = p; distance = d; }
      }
      failures.push(`${room.id} / ${room.name}: spawn ${coordinate(spawn)}, grid ${coordinate(grid.point(target.index))}, nearest entry-connected cell ${coordinate(closest)} (${distance.toFixed(2)} m away)`);
    }
    t.diagnostic(`${mode}: ${reached} reachable cells / ${grid.size} total; spacing ${STEP} m; person radius ${RADIUS} m`);
    if (failures.length) t.diagnostic(`Doorways with no clear 0.8 m crossing: ${blockedDoorways(includeFurniture).join('; ') || 'none'}`);
    assert.deepEqual(failures, [], `Disconnected rooms ${mode}:\n${failures.join('\n')}`);
  });
}


caseTest('study has separate corridor access and no direct bathroom connection', () => {
  const study = apartment.rooms.find(room => room.id === 'study');
  assert.ok(study, 'the northeastern independent room is a study');
  assert.equal(apartment.metrics.bedrooms, 3);
  assert.equal(apartment.metrics.studies, 1);
  // Both shared boundaries must remain closed, with furniture hidden as well.
  for (let x = 7.9; x <= 9.5; x += .1) {
    assert.equal(clearSegment({x,z:10.6},{x,z:11.3},false), false, 'study must not open through bathroom north wall');
  }
  for (let z = 11.15; z <= 12.5; z += .1) {
    assert.equal(clearSegment({x:9.3,z},{x:10.0,z},false), false, 'study entrance must not open through bathroom east wall');
  }
  assert.equal(clearSegment({x:10.42,z:12.35},{x:10.42,z:13.05},true), true, 'study keeps its independent public-corridor doorway');
});

}
