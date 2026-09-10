import { Route, Routes } from 'react-router-dom'
import { WorkspaceProvider } from './workspace/WorkspaceStore'
import { Today } from './views/Today'
import { CasesTable } from './views/CasesTable'
import { CaseDetailView } from './views/CaseDetailView'
import { InboxView } from './views/InboxView'
import { ClientsView } from './views/ClientsView'
import { SettingsView } from './views/SettingsView'
import { Sidebar } from './shell/Sidebar'
import { Topbar } from './shell/Topbar'
import './advisor.css'

function AdvisorShell() {
  return (
    <div className="advisor tf-advisor-app">
      <Sidebar />
      <div className="tf-advisor-main">
        <Topbar />
        <p className="tf-draft-tag" aria-label="This web app is a design draft, unfinished">Design draft · unfinished</p>
        <Routes>
          <Route index element={<Today />} />
          <Route path="cases" element={<CasesTable />} />
          <Route path="cases/:id" element={<CaseDetailView />} />
          <Route path="inbox" element={<InboxView />} />
          <Route path="clients" element={<ClientsView />} />
          <Route path="settings" element={<SettingsView />} />
        </Routes>
      </div>
    </div>
  )
}

export function AdvisorApp() {
  return (
    <WorkspaceProvider>
      <AdvisorShell />
    </WorkspaceProvider>
  )
}
