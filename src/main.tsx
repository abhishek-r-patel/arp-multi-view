// App entry point: mounts the root <App /> component into the #root div from index.html.
// StrictMode double-invokes effects/renders in development only, to surface side-effect bugs early.
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
