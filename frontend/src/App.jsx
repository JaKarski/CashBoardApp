import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login/Login";
import Register from "./pages/Register/Register";
import Home from "./pages/Home/Home";
import NotFound from "./pages/NotFound/NotFound";
import ProtectedRoute from "./components/ProtectedRoute/ProtectedRoute";
import SuperUserRoute from "./components/SuperUserRoute/SuperUserRoute";
import Game from "./pages/Game/Game";
import WorkInProgress from "./pages/WorkInProgress/WorkInProgress";
import GameForm from "./pages/GameForm/GameForm";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css"; // Import default styles for Toastify

function Logout() {
  localStorage.clear();
  return <Navigate to="/login" />;
}

function RegisterAndLogout() {
  localStorage.clear();
  return <Register />;
}

function App() {
  return (
    <BrowserRouter>
      {/* Global ToastContainer */}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        pauseOnHover
        draggable
        pauseOnFocusLoss
        theme="dark" // Możesz ustawić "dark" lub "colored"
      />
      <Routes>
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />
        <Route
          path="/game/:code"
          element={
            <ProtectedRoute>
              <SuperUserRoute>
                <Game />
              </SuperUserRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/wip"
          element={
            <ProtectedRoute>
              <WorkInProgress />
            </ProtectedRoute>
          }
        />
        <Route
          path="/createGame"
          element={
            <ProtectedRoute>
              <SuperUserRoute>
                <GameForm />
              </SuperUserRoute>
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<Login />} />
        <Route path="/logout" element={<Logout />} />
        <Route path="/register" element={<RegisterAndLogout />} />
        <Route path="*" element={<NotFound />}></Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
