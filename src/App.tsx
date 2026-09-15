import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Home } from "@/pages/Home";
import { Upload } from "@/pages/Upload";
import { DocumentDetail } from "@/pages/DocumentDetail";
import { Dashboard } from "@/pages/Dashboard";
import { ThemeProvider } from "@/hooks/use-theme";

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.25 }}
      >
        <Routes location={location}>
          <Route path="/" element={<Home />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/document/:id" element={<DocumentDetail />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-background">
          <Navbar />
          <main className="pb-12">
            <AnimatedRoutes />
          </main>
          <footer className="border-t py-6 text-center text-xs text-muted-foreground">
            StudyForge AI - Turn your notes into study magic
          </footer>
        </div>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
