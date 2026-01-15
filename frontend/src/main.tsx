import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

console.log('🚀 main.tsx is loading...');
console.log('🌐 Current URL:', window.location.href);
console.log('📱 User Agent:', navigator.userAgent);

const rootElement = document.getElementById('root');
console.log('📍 Root element found:', rootElement);

if (rootElement) {
  console.log('⚛️ Creating React root...');
  const root = createRoot(rootElement);
  console.log('🎯 Rendering App component...');
  
  try {
    root.render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
    console.log('✅ React app rendered successfully!');
  } catch (error) {
    console.error('❌ Error rendering React app:', error);
    // Fallback rendering
    rootElement.innerHTML = `
      <div style="padding: 20px; text-align: center; color: red; font-family: Arial, sans-serif;">
        <h1>React Rendering Error</h1>
        <p>Failed to render the React application.</p>
        <pre style="background: #f5f5f5; padding: 10px; border-radius: 4px; text-align: left; overflow: auto;">${String(error)}</pre>
        <button onclick="window.location.reload()" style="margin-top: 20px; padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">
          Reload Page
        </button>
      </div>
    `;
  }
} else {
  console.error('❌ Root element not found!');
  // Create a fallback message
  document.body.innerHTML = `
    <div style="padding: 20px; text-align: center; color: red; font-family: Arial, sans-serif;">
      <h1>Error: Root element not found</h1>
      <p>The React app could not mount properly.</p>
      <p>Looking for element with id="root"</p>
    </div>
  `;
}