// src/App.jsx - MODIFICAR

import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import AuthModal from './components/AuthModal'
import Dashboard from './components/Dashboard' // ✅ Importar Dashboard

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="App">
          {/* Puedes mantener tu navbar aquí si tienes */}
          
          <Routes>
            <Route path="/" element={
              <div>
                <h1>Bienvenido a TVCRAFT</h1>
                <AuthModal />
              </div>
            } />
            
            {/* ✅ Añadir ruta protegida del Dashboard */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  )
}

export default App