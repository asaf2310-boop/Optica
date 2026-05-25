import { Toaster } from "@/components/ui/toaster";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClientInstance } from "@/lib/query-client";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import PageNotFound from "./lib/PageNotFound";
import { AuthProvider } from "@/lib/AuthContext";
import Home from "./pages/Home";
import Book from "./pages/Book";
import Admin from "./pages/Admin";
import Login from "./pages/Login";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/book" element={<Book />} />
            <Route path="/login" element={<Login />} />
            <Route
              path="/admin"
              element={
                <ProtectedRoute roles={["admin", "staff"]}>
                  <Admin />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<PageNotFound />} />
          </Routes>
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;
