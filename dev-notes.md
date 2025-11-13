## improve performance
Profile the pointer-move path: log time inside the cursor/tooltip handlers (especially nearest-point lookup and tooltip content formatting). Use Chrome Performance with 100k+ samples to map which functions dominate; note whether findNearestDataPoint is scanning the full array every frame.

If nearest-point lookup is O(N) today, replace the full scan with a binary search or spatial index: keep X-sorted arrays per series and do a two-step search (binary search on X to a small window, then minimal distance test). For multi-series, build a structure (kd-tree or uniform grid) per series on data ingest so pointer move only inspects ≈log N nodes rather than N.

Move heavy math off the main thread: prebuild those spatial indexes and any tooltip aggregation in a Web Worker and reuse results until data changes. The worker can push the nearest-point payload back via postMessage, and the render loop just draws.

Cache expensive text measurements and tooltip HTML. For static labels/tooltips, compute once and reuse—avoid calling measureText or formatting strings on every hover.

Throttle pointer updates with requestAnimationFrame: queue mousemove events and process once per frame so multiple rapid events collapse into one pass.

Avoid per-point canvas state changes: draw cursor/tooltip overlays in their own lightweight layer canvas to limit redraw work. Ensure the main chart layer stays untouched when the cursor moves; only the overlay canvas clears/redraws a couple lines.

Revisit large-array storage: use typed arrays (Float32Array) and keep per-series data in contiguous buffers, enabling faster iteration and potential WebGL migration if you later need GPU acceleration.

If you plan to hit ~1M points, consider a WebGL-based renderer (via regl or custom shader) for the line layer; CPU canvas with 1M dynamic lookups per frame will struggle even after optimizations.