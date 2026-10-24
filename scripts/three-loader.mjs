// Resolve the browser's pinned Three.js module for DOM-free model tests.
const threeURL = new URL('../web/vendor/three.module.min.js', import.meta.url).href;

export async function resolve(specifier, context, nextResolve) {
  if (specifier === 'three') return { url: threeURL, shortCircuit: true };
  return nextResolve(specifier, context);
}
