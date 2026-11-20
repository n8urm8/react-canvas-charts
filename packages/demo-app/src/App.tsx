import { Routes, Route } from 'react-router'
import { Navigation } from './ExampleComponents'
import { MainDemo } from './pages/MainDemo'
import './App.css'
import InteractiveChartDemoNew from './pages/InteractiveChartDemoNew'
import { ChartExamples } from './pages/ChartExamples'
import { BeatChartsPage } from './pages/BeatChartsPage'
import { NotFound } from './pages/NotFound'
import { PageMeta } from './components/PageMeta'

function App() {
  return (
    <div className="font-sans bg-gray-50 min-h-screen w-full">
      <Navigation />

      <Routes>
        <Route
          path="/"
          element={
            <>
              <PageMeta />
              <MainDemo />
            </>
          }
        />
        <Route
          path="/interactive"
          element={
            <>
              <PageMeta
                title="Interactive Chart Demo - React Canvas Charts"
                description="Try React Canvas Charts live. Add lines and axes, stream data, change the options, and see the code preview update with every change."
              />
              <InteractiveChartDemoNew />
            </>
          }
        />
        <Route
          path="/examples"
          element={
            <>
              <PageMeta
                title="Chart Examples - React Canvas Charts"
                description="Live examples of line, area, bar, grouped and horizontal bar, scatter, bubble and spark charts built with React Canvas Charts. Click any card to see its code."
              />
              <ChartExamples />
            </>
          }
        />
        <Route
          path="/beat-charts"
          element={
            <>
              <PageMeta
                title="Beat Charts - React Canvas Charts"
                description="A neon pitch sequencer built with React Canvas Charts. Click chart cells to add or remove notes, and drag blocks to move them."
              />
              <BeatChartsPage />
            </>
          }
        />
        <Route
          path="*"
          element={
            <>
              <PageMeta title="Page not found - React Canvas Charts" description="This page does not exist." noindex />
              <NotFound />
            </>
          }
        />
      </Routes>
    </div>
  )
}

export default App
