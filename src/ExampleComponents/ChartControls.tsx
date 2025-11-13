import React from 'react';

interface ChartControlsProps {
  chartType: 'bar' | 'line';
  onChartTypeChange: () => void;
  currentDataIndex: number;
  totalDatasets: number;
  onDatasetChange: () => void;
  isResponsive: boolean;
  onResponsiveToggle: () => void;
  styleVariant: number;
  totalStyleVariants: number;
  onStyleChange: () => void;
}

export const ChartControls: React.FC<ChartControlsProps> = ({
  chartType,
  onChartTypeChange,
  currentDataIndex,
  totalDatasets,
  onDatasetChange,
  isResponsive,
  onResponsiveToggle,
  styleVariant,
  totalStyleVariants,
  onStyleChange,
}) => {
  void currentDataIndex;
  void totalDatasets;
  return (
    <div className="text-center mb-5 space-x-4">
      <button
        onClick={onChartTypeChange}
        className="px-5 py-2.5 text-base bg-red-500 text-white border-none rounded cursor-pointer hover:bg-red-600 transition-colors"
      >
        {chartType === 'bar' ? 'Switch to Line Chart' : 'Switch to Bar Chart'}
      </button>
      
      <button
        onClick={onDatasetChange}
        className="px-5 py-2.5 text-base bg-blue-500 text-white border-none rounded cursor-pointer hover:bg-blue-600 transition-colors"
      >
        Switch Dataset
      </button>
      
      <button
        onClick={onResponsiveToggle}
        className="px-5 py-2.5 text-base bg-green-500 text-white border-none rounded cursor-pointer hover:bg-green-600 transition-colors"
      >
        {isResponsive ? 'Fixed Size' : 'Responsive'}
      </button>
      
      <button
        onClick={onStyleChange}
        className="px-5 py-2.5 text-base bg-purple-500 text-white border-none rounded cursor-pointer hover:bg-purple-600 transition-colors"
      >
        Change Style ({styleVariant + 1}/{totalStyleVariants})
      </button>
    </div>
  );
}; 