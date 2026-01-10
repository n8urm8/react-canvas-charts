import React, { Activity, useState } from 'react'

interface ChartExampleCardProps {
  title: string
  description: string
  chart: React.ReactNode
  code: string
}

export const ChartExampleCard: React.FC<ChartExampleCardProps> = ({ title, description, chart, code }) => {
  const [isFlipped, setIsFlipped] = useState(false)

  return (
    <div className="relative perspective-1000">
      <div
        className={`relative w-full transition-transform duration-500 transform-style-3d ${
          isFlipped ? 'rotate-y-180' : ''
        }`}
      >
        {/* Front of card - Chart */}
        <div className="backface-hidden bg-white rounded-lg shadow-lg p-4 md:p-6">
          <div className="mb-3 md:mb-4">
            <h2 className="text-xl md:text-2xl font-semibold text-gray-800 mb-2">{title}</h2>
            <p className="text-gray-600 text-xs md:text-sm">{description}</p>
          </div>
          <div className="h-[300px] md:h-[400px] overflow-hidden">
            <Activity mode={isFlipped ? 'hidden' : 'visible'}>{chart}</Activity>
          </div>
          <div
            className="mt-3 text-center text-xs md:text-sm text-gray-500 cursor-pointer hover:text-gray-700 transition-colors py-2"
            onClick={() => setIsFlipped(true)}
          >
            Click to view code →
          </div>
        </div>

        {/* Back of card - Code */}
        <div className="absolute inset-0 backface-hidden bg-gray-900 rounded-lg shadow-lg p-4 md:p-6 rotate-y-180 flex flex-col min-h-[400px] md:min-h-[500px]">
          <div className="flex justify-between items-center mb-3 md:mb-4 flex-shrink-0">
            <h3 className="text-lg md:text-xl font-semibold text-white">Code</h3>
            <button
              onClick={(e) => {
                e.stopPropagation()
                navigator.clipboard.writeText(code)
              }}
              className="px-2 md:px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs md:text-sm rounded transition-colors"
            >
              Copy
            </button>
          </div>
          <div className="flex-1 overflow-auto min-h-0">
            <pre className="text-xs md:text-sm text-gray-100">
              <code>{code}</code>
            </pre>
          </div>
          <div
            className="mt-3 md:mt-4 text-center text-xs md:text-sm text-gray-400 cursor-pointer hover:text-gray-200 transition-colors py-2 flex-shrink-0"
            onClick={() => setIsFlipped(false)}
          >
            Click to view chart ←
          </div>
        </div>
      </div>
    </div>
  )
}
