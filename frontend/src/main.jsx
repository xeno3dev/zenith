import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App.jsx'
import './index.css'

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1A1A2E',
            color: '#E2E8F0',
            border: '1px solid #6C63FF',
          },
          success: {
            iconTheme: {
              primary: '#6C63FF',
              secondary: '#E2E8F0',
            },
          },
          error: {
            iconTheme: {
              primary: '#FF6B6B',
              secondary: '#E2E8F0',
            },
          },
        }}
      />
    </BrowserRouter>
  </React.StrictMode>
)
