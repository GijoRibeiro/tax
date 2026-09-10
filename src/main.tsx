import './styles/fonts.css'
import './styles/tokens.css'
import './styles/global.css'
import './components/components.css'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { CaseStoreProvider } from './store/CaseStore'
import { AdvisorApp } from './advisor/AdvisorApp'
import { Hub } from './hub/Hub'
import { Press } from './press/Press'
import { Stakeholders } from './stakeholders/Stakeholders'
import { Landing } from './landing/Landing'
import { PageTitle } from './components/PageTitle'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<><PageTitle title="Gijo Ribeiro · Senior Product Designer" /><Landing /></>} />
      <Route path="/hub" element={<><PageTitle title="Specs · The Hand-off Moment" /><Hub /></>} />
      <Route path="/advisor/*" element={<><PageTitle title="Advisor dashboard · The Hand-off Moment" /><AdvisorApp /></>} />
      <Route path="/press" element={<><PageTitle title="Presentation · The Hand-off Moment" /><Press /></>} />
      <Route path="/stakeholders" element={<><PageTitle title="Interviews · The Hand-off Moment" /><Stakeholders /></>} />
    </Routes>
  )
}

const root = document.getElementById('root')
if (root) ReactDOM.createRoot(root).render(
  <React.StrictMode><BrowserRouter><CaseStoreProvider><AppRoutes /></CaseStoreProvider></BrowserRouter></React.StrictMode>,
)
