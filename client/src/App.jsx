import { Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import PollBuilder from "./pages/PollBuilder.jsx";
import PollEdit from "./pages/PollEdit.jsx";
import PollPublic from "./pages/PollPublic.jsx";
import Analytics from "./pages/Analytics.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import PublicOnlyRoute from "./components/PublicOnlyRoute.jsx";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route
        path="/login"
        element={
          <PublicOnlyRoute>
            <Login />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicOnlyRoute>
            <Register />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/polls/new"
        element={
          <ProtectedRoute>
            <PollBuilder />
          </ProtectedRoute>
        }
      />
      <Route
        path="/polls/:id/edit"
        element={
          <ProtectedRoute>
            <PollEdit />
          </ProtectedRoute>
        }
      />
      <Route
        path="/polls/:id/analytics"
        element={
          <ProtectedRoute>
            <Analytics />
          </ProtectedRoute>
        }
      />
      <Route path="/p/:slug" element={<PollPublic />} />
    </Routes>
  );
}

export default App
