import "@/App.css";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AuthCallback from "@/components/AuthCallback";
import IQFirstVisit from "@/components/IQFirstVisit";
import Home from "@/pages/Home";
import Properties from "@/pages/Properties";
import PropertyDetail from "@/pages/PropertyDetail";
import SubmitProperty from "@/pages/SubmitProperty";
import Admin from "@/pages/Admin";
import AdminLogin from "@/pages/AdminLogin";
import Profile from "@/pages/Profile";
import TestsHub from "@/pages/TestsHub";
import ReadingSpeed from "@/pages/tests/ReadingSpeed";
import ReadingStyleImported from "@/pages/tests/ReadingStyleImported";
import Personality from "@/pages/tests/Personality";
import Psychometric from "@/pages/tests/Psychometric";
import CareerPath from "@/pages/tests/CareerPath";
import Relationship from "@/pages/tests/Relationship";
import GeneralKnowledge from "@/pages/tests/GeneralKnowledge";
import Films from "@/pages/tests/Films";

function AppRouter() {
  const location = useLocation();
  if (location.hash?.includes("session_id=")) return <AuthCallback />;
  return (
    <>
      <Navbar />
      <main className="min-h-[70vh]">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/properties" element={<Properties />} />
          <Route path="/properties/:id" element={<PropertyDetail />} />
          <Route path="/submit" element={<SubmitProperty />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/tests" element={<TestsHub />} />
          <Route path="/tests/reading-speed" element={<ReadingSpeed />} />
          <Route path="/tests/reading-style-2" element={<ReadingStyleImported />} />
          <Route path="/tests/personality" element={<Personality />} />
          <Route path="/tests/psychometric" element={<Psychometric />} />
          <Route path="/tests/career-path" element={<CareerPath />} />
          <Route path="/tests/relationship" element={<Relationship />} />
          <Route path="/tests/general-knowledge" element={<GeneralKnowledge />} />
          <Route path="/tests/films" element={<Films />} />
        </Routes>
      </main>
      <IQFirstVisit />
      <Footer />
    </>
  );
}

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <AuthProvider>
          <AppRouter />
          <Toaster position="top-right" richColors closeButton />
        </AuthProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
