// ═══════════════════════════════════════════════════════════════════════════════
// SOLANA TRACKER - Main App Component
// ═══════════════════════════════════════════════════════════════════════════════

import { useState } from 'react'
import { Layout } from '@/components/Layout'
import { TrackerPage } from '@/pages/TrackerPage'
import { WalletManagementPage } from '@/pages/WalletManagementPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { Toaster } from '@/components/ui/sonner'
import './App.css'

type Page = 'tracker' | 'wallets' | 'settings'

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('tracker')

  return (
    <>
      <Layout currentPage={currentPage} onPageChange={setCurrentPage}>
        {currentPage === 'tracker' && <TrackerPage />}
        {currentPage === 'wallets' && <WalletManagementPage />}
        {currentPage === 'settings' && <SettingsPage />}
      </Layout>
      <Toaster position="bottom-right" />
    </>
  )
}

export default App
