import { ComparisonChart } from './components/ComparisonChart';
import './index.css';

function App() {
  return (
    <div className="w-full max-w-7xl mx-auto p-6 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
      <div className="container-app">
        <ComparisonChart />
      </div>
    </div>
  );
}

export default App;
