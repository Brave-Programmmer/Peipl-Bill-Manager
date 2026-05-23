import { useEffect } from 'react';
import { HashRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { InvoiceEditor } from './pages/InvoiceEditor';
import { History } from './pages/History';
import { Settings } from './pages/Settings';
import { PrintExport } from './pages/PrintExport';
import { useInvoiceStore } from './store/useInvoiceStore';

function AppContent() {
  const navigate = useNavigate();
  const setCurrentInvoice = useInvoiceStore((state) => state.setCurrentInvoice);

  useEffect(() => {
    if (window.electron) {
      const unsubscribe = window.electron.onFileOpen((data: any) => {
        console.log('File opened from OS:', data);
        if (data && data.content) {
          setCurrentInvoice(data.content);
          navigate('/editor');
        }
      });
      return () => unsubscribe();
    }
  }, [navigate, setCurrentInvoice]);

  return (
    <Routes>
      <Route path="/print-export" element={<PrintExport />} />
      <Route path="*" element={
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/editor" element={<InvoiceEditor />} />
            <Route path="/editor/:id" element={<InvoiceEditor />} />
            <Route path="/history" element={<History />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </Layout>
      } />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
