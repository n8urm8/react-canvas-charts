/** Blocks per pyramid level for the illustration (16 raw samples → 8 → 4 → 2 → 1 blocks). */
const PYRAMID_LEVELS = [1, 2, 4, 8, 16]

/**
 * Which cells answer the example query over samples [3, 13): samples 3 and 12 are read raw, and
 * samples 4–11 come from two whole blocks of the 4-sample level. Keyed by blocks per level.
 */
const QUERY = { start: 3, end: 13 }
const COVER: Record<number, number[]> = { 16: [3, 12], 4: [1, 2] }

const PyramidDiagram = () => {
  const width = 640
  const rowHeight = 34
  const left = 120
  const usable = width - left - 10
  return (
    <svg
      viewBox={`0 0 ${width} ${PYRAMID_LEVELS.length * rowHeight + 30}`}
      className="w-full max-w-3xl"
      role="img"
      aria-label="Min/max pyramid: each level summarises blocks twice as large as the level below. A range query reads two raw samples and two whole blocks."
    >
      {[...PYRAMID_LEVELS].reverse().map((blocks, row) => {
        const size = 16 / blocks
        const y = row * rowHeight + 4
        const label = blocks === 16 ? 'raw samples' : `blocks of ${size}`
        return (
          <g key={blocks}>
            <text x={0} y={y + 20} fontSize={12} fill="#4b5563">
              {label}
            </text>
            {Array.from({ length: blocks }, (_, i) => {
              const x = left + (i * usable) / blocks
              const w = usable / blocks - 3
              const used = COVER[blocks]?.includes(i)
              const inQuery = blocks === 16 && i >= QUERY.start && i < QUERY.end
              return (
                <g key={i}>
                  <rect
                    x={x}
                    y={y}
                    width={w}
                    height={26}
                    rx={4}
                    fill={used ? '#2563eb' : inQuery ? '#dbeafe' : '#f3f4f6'}
                    stroke={used ? '#1d4ed8' : '#d1d5db'}
                  />
                  {blocks <= 4 && (
                    <text
                      x={x + w / 2}
                      y={y + 17}
                      fontSize={11}
                      textAnchor="middle"
                      fill={used ? '#ffffff' : '#6b7280'}
                    >
                      min / max
                    </text>
                  )}
                  {blocks === 16 && (
                    <text
                      x={x + w / 2}
                      y={y + 17}
                      fontSize={11}
                      textAnchor="middle"
                      fill={used ? '#ffffff' : '#6b7280'}
                    >
                      {i}
                    </text>
                  )}
                </g>
              )
            })}
          </g>
        )
      })}
      <text x={left} y={PYRAMID_LEVELS.length * rowHeight + 22} fontSize={12} fill="#374151">
        Query samples 3–12: read 2 raw samples + 2 blocks (dark) instead of all 10.
      </text>
    </svg>
  )
}

export const LargeDatasetsSection = () => {
  return (
    <section id="large-datasets" className="mb-12">
      <h2 className="text-3xl font-bold mb-6 border-b-2 border-gray-200 pb-2">Large Datasets: How Data Is Processed</h2>
      <p className="text-gray-700 mb-4">
        A chart is only a few thousand pixels wide, but it may be given millions of points. This section explains what
        the library does with your data between <code className="font-mono text-sm">columns</code> and the screen, so
        you know what you're looking at when you zoom out over 10 million samples. In short:{' '}
        <strong>
          your data is never modified or resampled in memory. The chart chooses which real samples to draw for each
          pixel column, and draws the true highs and lows.
        </strong>
      </p>

      <ol className="list-decimal ml-6 text-gray-700 space-y-2 mb-8">
        <li>
          <strong>Columnar storage.</strong> Your typed arrays are read in place. No per-point objects or copies are
          made (see <a href="#data-structures" className="text-blue-600 hover:underline">Data Structures</a>).
        </li>
        <li>
          <strong>Min/max pyramid.</strong> A small index built once per series. It answers "what is the min and max
          of samples i to j, and where are they?" without scanning them.
        </li>
        <li>
          <strong>M4 decimation.</strong> Each frame, lines and areas are reduced to at most 4 points per pixel column,
          using the pyramid.
        </li>
        <li>
          <strong>Visible-only work.</strong> Axis ticks, labels, the y-axis domain and hover all look only at the
          visible range, and use the pyramid instead of scanning.
        </li>
      </ol>

      <h3 className="text-2xl font-semibold mb-3">M4 decimation</h3>
      <p className="text-gray-700 mb-4">
        When the visible range has more than 2 samples per pixel column, <code>ChartLineSeries</code> and{' '}
        <code>ChartAreaSeries</code> split it into one bucket per pixel column. From each bucket they keep four real
        samples: the <strong>first</strong>, the <strong>minimum</strong>, the <strong>maximum</strong> and the{' '}
        <strong>last</strong>, connected in time order. This is the M4 algorithm (Jugel et al., VLDB 2014).
      </p>
      <figure className="mb-4">
        <img
          src="/docs/m4-diagram.png"
          alt="Four pixel columns of grey raw samples. In each column the first, min, max and last samples are highlighted and joined by the drawn line; a spike in column 2 is kept as that column's max."
          className="w-full max-w-4xl rounded border border-gray-200 bg-white"
          loading="lazy"
        />
      </figure>
      <p className="text-gray-700 mb-4">Why these four points:</p>
      <ul className="list-disc ml-6 text-gray-700 space-y-2 mb-4">
        <li>
          Inside one pixel column, a line through all the samples paints a vertical stroke from the lowest to the
          highest value. Min and max reproduce that stroke exactly.
        </li>
        <li>
          First and last connect the column to its neighbours at the right heights, so the line between columns matches
          too.
        </li>
        <li>
          The result is a subsequence of the real line, so a spike that is a single sample out of millions is always
          drawn. Taking every Nth sample instead would usually miss it.
        </li>
      </ul>
      <figure className="mb-4">
        <img
          src="/docs/decimation-comparison.png"
          alt="Three versions of the same 2 million point series: raw drawing renders nothing, every-Nth sampling hides four spikes, and M4 shows all four spikes with 9,246 points."
          className="w-full max-w-4xl rounded border border-gray-200 bg-white"
          loading="lazy"
        />
        <figcaption className="text-sm text-gray-500 mt-2">
          The same 2,000,000-point series drawn three ways. Only M4 shows the four injected spikes.
        </figcaption>
      </figure>
      <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg mb-8 text-gray-700">
        <h4 className="font-semibold mb-2">What this means for you</h4>
        <ul className="list-disc ml-6 space-y-1 text-sm">
          <li>The drawn line is pixel-accurate at the current zoom: every peak and trough is visible.</li>
          <li>
            At most about 4 × chart-width points are drawn per series (≈ 4,000 for a 1,000 px chart), whatever the data
            size.
          </li>
          <li>
            Smoothing (<code>smooth</code> / <code>tension</code>) is skipped while a series is decimated, because curving between min and
            max would overshoot the real data. Zoom in until there are fewer than 2 samples per pixel and every sample
            is drawn and smoothed as usual.
          </li>
          <li>
            <code>NaN</code> values are gaps: they are skipped and the line connects across them.
          </li>
          <li>
            Points and bars are not decimated. <code>ChartPointSeries</code> draws nothing when more than{' '}
            <code>maxRenderedPoints</code> (default 10,000) are visible, and reappears as you zoom in. Use{' '}
            <code>ChartLineSeries</code> or <code>ChartAreaSeries</code> for dense data.
          </li>
        </ul>
      </div>

      <h3 className="text-2xl font-semibold mb-3">The min/max pyramid</h3>
      <p className="text-gray-700 mb-4">
        M4 needs the min and max of every bucket. At 10 million points and 1,000 columns, scanning each bucket would
        touch every sample on every frame. Instead, each series gets a <strong>min/max pyramid</strong>: a stack of
        levels where each level stores the min and max of blocks twice as large as the level below (16 samples, 32,
        64, … up to the whole series).
      </p>
      <figure className="mb-4 bg-white border border-gray-200 rounded p-4 max-w-3xl">
        <PyramidDiagram />
        <figcaption className="text-sm text-gray-500 mt-2">
          Simplified to 16 samples. In the library the finest level summarises 16 raw samples per block.
        </figcaption>
      </figure>
      <p className="text-gray-700 mb-4">
        To answer a range query, the pyramid scans the few raw samples at the ragged edges and reads the largest whole
        blocks in between. That takes O(log n) steps instead of O(n). It also tracks where the min and max occur, which
        M4 needs to place them at the right x position.
      </p>
      <div className="overflow-x-auto mb-4">
        <table className="min-w-full text-sm text-left border border-gray-200 bg-white">
          <tbody className="text-gray-700">
            <tr className="border-t">
              <td className="px-3 py-2 font-medium">Memory</td>
              <td className="px-3 py-2">
                About ¼ of the column's size (stored as Float32 for Float32Array columns, else Float64)
              </td>
            </tr>
            <tr className="border-t">
              <td className="px-3 py-2 font-medium">Build</td>
              <td className="px-3 py-2">Once per series, on first use. One pass over the data.</td>
            </tr>
            <tr className="border-t">
              <td className="px-3 py-2 font-medium">Appends</td>
              <td className="px-3 py-2">
                Only the blocks touched by new samples are recomputed. Capacity grows by doubling.
              </td>
            </tr>
            <tr className="border-t">
              <td className="px-3 py-2 font-medium">Rebuilds</td>
              <td className="px-3 py-2">
                When the arrays are replaced, <code>length</code> shrinks, or <code>revision</code> changes.
              </td>
            </tr>
            <tr className="border-t">
              <td className="px-3 py-2 font-medium">Used by</td>
              <td className="px-3 py-2">
                M4 decimation, the y-axis auto domain for the visible range, and hover with{' '}
                <code>snapAlongYAxis</code>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="text-gray-700 mb-8">
        Ranges of 128 samples or fewer are scanned directly, since that's faster than walking the pyramid. <code>NaN</code>{' '}
        values are ignored when computing min and max.
      </p>

      <h3 className="text-2xl font-semibold mb-3">Hover and hit testing</h3>
      <p className="text-gray-700 mb-4">
        Points are evenly spaced by index, so the cursor's x position converts straight to a data index. Snapping to the
        nearest point on x is O(1) whatever the data size. With <code>snapAlongYAxis</code>, the chart searches the
        indices within the snap radius and uses the pyramid to skip whole blocks that can't be closer than the best
        match so far.
      </p>

      <h3 className="text-2xl font-semibold mb-3">Results</h3>
      <p className="text-gray-700 mb-4">
        On the <a href="/interactive" className="text-blue-600 hover:underline">interactive demo</a>, 10 million points
        × 2 series use about 150 MB of data buffers. Panning, zooming and hovering stay interactive because each frame
        draws at most a few thousand points per series. Before these changes the same chart ran out of memory at a few
        million points.
      </p>
    </section>
  )
}
