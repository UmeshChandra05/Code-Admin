import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminLayout from "@/components/AdminLayout";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import TagsPage from "@/pages/TagsPage";
import ModulesPage from "@/pages/ModulesPage";
import ProblemsPage from "@/pages/ProblemsPage";
import ProblemEditorPage from "@/pages/ProblemEditorPage";
import ContestsPage from "@/pages/ContestsPage";
import ContestDetailPage from "@/pages/ContestDetailPage";
import SubmissionsPage from "@/pages/SubmissionsPage";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/admin" replace />} />
            <Route path="/login" element={<Login />} />
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="tags" element={<TagsPage />} />
              <Route path="modules" element={<ModulesPage />} />
              <Route path="problems" element={<ProblemsPage />} />
              <Route path="problems/new" element={<ProblemEditorPage />} />
              <Route path="problems/:id" element={<ProblemEditorPage />} />
              <Route path="contests" element={<ContestsPage />} />
              <Route path="contests/:id" element={<ContestDetailPage />} />
              <Route path="submissions" element={<SubmissionsPage />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
