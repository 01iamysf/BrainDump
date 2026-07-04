import { useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Workspace } from './components/Workspace';
import { PropertiesPanel } from './components/PropertiesPanel';
import { seedInitialData } from './db/db';

function App() {
  // Seed database with mock notebooks/pages on mount
  useEffect(() => {
    seedInitialData();
  }, []);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-brand-bg dark:bg-brand-bg-dark text-brand-text dark:text-brand-text-dark">
      {/* 3-panel layout */}
      <Sidebar />
      <Workspace />
      <PropertiesPanel />
    </div>
  );
}

export default App;
