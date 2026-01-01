import { Routes, Route } from 'react-router'
import { Navigation } from './ExampleComponents'
import { MainDemo } from './pages/MainDemo'
import './App.css'
import InteractiveChartDemoNew from './pages/InteractiveChartDemoNew'
import { ChartExamples } from './pages/ChartExamples'

function App() {
  return (
    <div className="font-sans bg-gray-50 min-h-screen">
      <Navigation />

      <Routes>
        <Route path="/" element={<MainDemo />} />
        <Route path="/interactive" element={<InteractiveChartDemoNew />} />
        <Route path="/examples" element={<ChartExamples />} />
      </Routes>
    </div>
  )
}

export default App
