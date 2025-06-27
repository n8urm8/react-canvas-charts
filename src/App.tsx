import { useState } from "react";
import { type BarChartData } from "./components/BarChart/BarChart";
import { 
  barStyleVariants, 
  lineStyleVariants,
  ChartControls,
  ChartContainer,
  FeatureDocumentation,
  UsageExamples,
  LineChartShowcase,
  Navigation
} from "./ExampleComponents";
import "./App.css";

function App() {
  const [sampleData] = useState<BarChartData[]>([
    { label: "Jan", value: 65, color: "#3b82f6" },
    { label: "Feb", value: 45, color: "#ef4444" },
    { label: "Mar", value: 78, color: "#10b981" },
    { label: "Apr", value: 52, color: "#f59e0b" },
    { label: "May", value: 89, color: "#8b5cf6" },
    { label: "Jun", value: 73, color: "#06b6d4" },
  ]);

  const [alternateData] = useState<BarChartData[]>([
    { label: "Product A", value: 120 },
    { label: "Product B", value: 98 },
    { label: "Product C", value: 145 },
    { label: "Product D", value: 67 },
    { label: "Product E", value: 201 },
  ]);

  const [currentDataIndex, setCurrentDataIndex] = useState(0);
  const [isResponsive, setIsResponsive] = useState(true);
  const [styleVariant, setStyleVariant] = useState(0);
  const [chartType, setChartType] = useState<'bar' | 'line'>('bar');
  const [currentPage, setCurrentPage] = useState<'main' | 'linechart'>('main');
  
  const datasets = [sampleData, alternateData];
  const titles = ["Monthly Sales (K$)", "Product Performance"];
  const currentStyleVariants = chartType === 'bar' ? barStyleVariants : lineStyleVariants;
  const currentStyle = currentStyleVariants[styleVariant] || {};

  return (
    <div className="font-sans bg-gray-50 min-h-screen">
      <Navigation currentPage={currentPage} onPageChange={setCurrentPage} />
      
      {currentPage === 'main' ? (
        <div className="p-5">
          <h1 className="text-center text-3xl font-bold text-gray-900 mb-8">
            React Canvas Charting Library - Bar & Line Charts
          </h1>
          
          <ChartControls
            chartType={chartType}
            onChartTypeChange={() => setChartType(chartType === 'bar' ? 'line' : 'bar')}
            currentDataIndex={currentDataIndex}
            totalDatasets={datasets.length}
            onDatasetChange={() => setCurrentDataIndex((prev) => (prev + 1) % datasets.length)}
            isResponsive={isResponsive}
            onResponsiveToggle={() => setIsResponsive(!isResponsive)}
            styleVariant={styleVariant}
            totalStyleVariants={currentStyleVariants.length}
            onStyleChange={() => setStyleVariant((prev) => (prev + 1) % currentStyleVariants.length)}
          />

          <div className="flex flex-col gap-10 items-center">
            <ChartContainer
              chartType={chartType}
              data={datasets[currentDataIndex]}
              title={titles[currentDataIndex]}
              isResponsive={isResponsive}
              currentStyle={currentStyle}
            />

            <FeatureDocumentation />
            <UsageExamples />
          </div>
        </div>
      ) : (
        <LineChartShowcase />
      )}
    </div>
  );
}

export default App;
