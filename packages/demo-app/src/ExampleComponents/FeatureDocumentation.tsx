import React from 'react';

export const FeatureDocumentation: React.FC = () => {
  return (
    <div className="max-w-6xl text-left">
      <h2 className="text-2xl font-semibold text-gray-900 mb-4">✨ Fully Customizable Components:</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">🎯 Chart Title</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Font size, family, weight, color</li>
            <li>• Position and margins</li>
            <li>• Custom renderer support</li>
          </ul>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">📊 Chart Bars</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Border radius, borders, shadows</li>
            <li>• Gradients (vertical/horizontal)</li>
            <li>• Individual styling per bar</li>
          </ul>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">📈 Chart Lines</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Line width, dash patterns, caps</li>
            <li>• Smooth curves with tension control</li>
            <li>• Gradients and shadows</li>
          </ul>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">🔵 Chart Points</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Multiple shapes (circle, square, star, etc.)</li>
            <li>• Hollow/filled, borders, shadows</li>
            <li>• Size and rotation control</li>
          </ul>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">📏 Axes (X & Y)</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Colors, line width, visibility</li>
            <li>• Labels, ticks, padding</li>
            <li>• Font customization</li>
          </ul>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">📋 Value Labels</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Position (top, center, inside, etc.)</li>
            <li>• Background, borders, rotation</li>
            <li>• Custom formatters</li>
          </ul>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">🔲 Grid Lines</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Horizontal/vertical visibility</li>
            <li>• Line style, dash patterns</li>
            <li>• Opacity and colors</li>
          </ul>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">🎯 Interactive Cursor</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Crosshair lines (horizontal/vertical)</li>
            <li>• Snap to nearest data points</li>
            <li>• Customizable line styles</li>
          </ul>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">💬 Smart Tooltips</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Multiple positioning modes</li>
            <li>• Custom content templates</li>
            <li>• Styled backgrounds & borders</li>
          </ul>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">🎨 Advanced Features</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Multi-series support (Line Charts)</li>
            <li>• Area fill under lines</li>
            <li>• Custom renderers for any component</li>
          </ul>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">⚡ Performance</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Canvas-based rendering</li>
            <li>• Responsive & fixed sizing</li>
            <li>• Tailwind CSS integration</li>
          </ul>
        </div>
      </div>

      <div className="mt-8 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
        <h4 className="text-lg font-semibold text-blue-900 mb-2">🚀 Modular Architecture</h4>
        <p className="text-blue-800 text-sm mb-3">
          Every part of the chart is now a separate, customizable component:
        </p>
        <div className="grid grid-cols-2 gap-2 text-blue-800 text-sm">
          <div>• <strong>ChartTitle</strong> - Title rendering</div>
          <div>• <strong>ChartAxis</strong> - X/Y axis rendering</div>
          <div>• <strong>ChartGrid</strong> - Grid line rendering</div>
          <div>• <strong>ChartBar</strong> - Individual bar rendering</div>
          <div>• <strong>ChartLabel</strong> - Value label rendering</div>
          <div>• <strong>ChartCursor</strong> - Interactive cursor</div>
          <div>• <strong>ChartTooltip</strong> - Smart tooltips</div>
          <div>• <strong>Custom Renderers</strong> - Complete control</div>
        </div>
      </div>
    </div>
  );
}; 