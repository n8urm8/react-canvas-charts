import { Routes, Route } from "react-router";
import { 
  Navigation,
} from "./ExampleComponents";
import { MainDemo } from "./pages/MainDemo";
import "./App.css";
import { LineChartShowcase } from "./pages/LineChartShowcase";
import { InteractiveChartDemo } from "./pages/InteractiveChartDemo";

function App() {
  return (
    <div className="font-sans bg-gray-50 min-h-screen">
      <Navigation />
      
      <Routes>
        <Route path="/" element={<MainDemo />} />
        <Route path="/linechart-showcase" element={<LineChartShowcase />} />
        <Route path="/interactive" element={<InteractiveChartDemo />} />
      </Routes>
    </div>
  );
}

export default App;
