// ═══════════════════════════════════════════════════════════════════════════════
// SETTINGS PAGE - Mobile-Optimized 3D Glassmorphism App Settings
// ═══════════════════════════════════════════════════════════════════════════════

import { useState } from 'react'
import { 
  Trash2, 
  AlertTriangle,
  Info,
  Database,
  Cpu,
  Globe,
  Clock,
  Zap,
  Shield
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useWalletStore } from '@/store/walletStore'

export function SettingsPage() {
  const [showClearDialog, setShowClearDialog] = useState(false)
  
  const wallets = useWalletStore(state => state.wallets)
  const walletData = useWalletStore(state => state.walletData)
  const tokenMetadataCache = useWalletStore(state => state.tokenMetadataCache)
  const clearAllData = useWalletStore(state => state.clearAllData)
  
  const handleClearAllData = () => {
    clearAllData()
    setShowClearDialog(false)
  }
  
  // Calculate stats
  const totalTransactions = Array.from(walletData.values()).reduce(
    (sum, data) => sum + data.transactions.length, 
    0
  )
  const cachedTokens = tokenMetadataCache.size

  return (
    <div className="max-w-3xl mx-auto space-y-4 lg:space-y-8">
      {/* Header - Glass Card */}
      <div className="glass-card p-4 lg:p-6 holographic">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-xl bg-gradient-to-br from-plasma-300 to-plasma-500 flex items-center justify-center shrink-0">
            <Shield className="w-4 h-4 lg:w-5 lg:h-5 text-black" />
          </div>
          <div>
            <h1 className="text-xl lg:text-3xl font-bold glow-text">Settings</h1>
            <p className="text-plasma-500 text-xs lg:text-sm hidden sm:block">
              Configure your Solana Tracker
            </p>
          </div>
        </div>
      </div>
      
      <div className="space-y-4 lg:space-y-6">
        {/* Data Management - Glass */}
        <Card className="glass-card">
          <CardHeader className="p-4 pb-2 lg:p-6 lg:pb-3">
            <CardTitle className="flex items-center gap-2 text-white text-base lg:text-lg">
              <Database className="w-4 h-4 lg:w-5 lg:h-5 text-plasma-400" />
              Data Management
            </CardTitle>
            <CardDescription className="text-plasma-500 text-xs lg:text-sm">
              Manage your stored data and cache
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 lg:p-6 space-y-4 lg:space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-2 lg:gap-4">
              <div className="glass-60 rounded-xl p-3 lg:p-4 text-center group hover:glass-80 transition-all">
                <div className="text-xl lg:text-3xl font-bold text-white glow-text">{wallets.length}</div>
                <div className="text-[10px] lg:text-xs text-plasma-500 mt-0.5 lg:mt-1 uppercase tracking-wider">Wallets</div>
              </div>
              <div className="glass-60 rounded-xl p-3 lg:p-4 text-center group hover:glass-80 transition-all">
                <div className="text-xl lg:text-3xl font-bold text-white glow-text">{totalTransactions}</div>
                <div className="text-[10px] lg:text-xs text-plasma-500 mt-0.5 lg:mt-1 uppercase tracking-wider">TXs</div>
              </div>
              <div className="glass-60 rounded-xl p-3 lg:p-4 text-center group hover:glass-80 transition-all">
                <div className="text-xl lg:text-3xl font-bold text-white glow-text">{cachedTokens}</div>
                <div className="text-[10px] lg:text-xs text-plasma-500 mt-0.5 lg:mt-1 uppercase tracking-wider">Tokens</div>
              </div>
            </div>
            
            {/* Warning Alert */}
            <Alert className="glass-60 border-red-500/30 bg-red-500/5">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <AlertDescription className="text-red-300 text-xs lg:text-sm">
                Clearing all data will remove all wallets, transactions, and cached token metadata. This action cannot be undone.
              </AlertDescription>
            </Alert>
            
            {/* Clear Data Dialog */}
            <Dialog open={showClearDialog} onOpenChange={setShowClearDialog}>
              <DialogTrigger asChild>
                <Button 
                  variant="destructive" 
                  className="w-full gap-2 bg-red-500/20 hover:bg-red-500/30 border-red-500/30 text-red-400 text-sm lg:text-base"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear All Data
                </Button>
              </DialogTrigger>
              <DialogContent className="glass-card border-red-500/20 mx-4">
                <DialogHeader>
                  <DialogTitle className="text-white flex items-center gap-2 text-lg">
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                    Clear All Data
                  </DialogTitle>
                  <DialogDescription className="text-plasma-400 text-sm">
                    Are you sure? This includes:
                  </DialogDescription>
                </DialogHeader>
                <ul className="list-disc list-inside text-xs lg:text-sm text-plasma-500 space-y-1 py-2">
                  <li>All {wallets.length} wallet{wallets.length !== 1 ? 's' : ''}</li>
                  <li>All {totalTransactions} transaction records</li>
                  <li>All {cachedTokens} cached token metadata</li>
                </ul>
                <DialogFooter className="gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowClearDialog(false)}
                    className="glass-button text-sm"
                    size="sm"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleClearAllData}
                    className="bg-red-500/20 hover:bg-red-500/30 border-red-500/30 text-red-400 text-sm"
                    size="sm"
                  >
                    Clear Everything
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
        
        {/* About - Glass */}
        <Card className="glass-card">
          <CardHeader className="p-4 pb-2 lg:p-6 lg:pb-3">
            <CardTitle className="flex items-center gap-2 text-white text-base lg:text-lg">
              <Info className="w-4 h-4 lg:w-5 lg:h-5 text-plasma-400" />
              About
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 lg:p-6 space-y-3 lg:space-y-4">
            <div className="space-y-2 lg:space-y-3">
              {[
                { icon: Zap, label: 'Version', value: '1.0.0' },
                { icon: Globe, label: 'Network', value: 'Solana Mainnet' },
                { icon: Database, label: 'Data Sources', value: 'DexScreener, PumpFun' },
                { icon: Clock, label: 'Auto-refresh', value: 'Every 30 seconds' },
                { icon: Cpu, label: 'Stack', value: 'React, Solana Web3.js' },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="glass-60 rounded-lg p-2.5 lg:p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2 lg:gap-3">
                    <div className="w-7 h-7 lg:w-8 lg:h-8 rounded-lg bg-plasma-500/20 flex items-center justify-center shrink-0">
                      <Icon className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-plasma-400" />
                    </div>
                    <span className="text-xs lg:text-sm text-plasma-500">{label}</span>
                  </div>
                  <span className="text-xs lg:text-sm font-medium text-white">{value}</span>
                </div>
              ))}
            </div>
            
            {/* Footer */}
            <div className="pt-3 lg:pt-4 border-t border-white/5">
              <p className="text-xs lg:text-sm text-plasma-400 text-center">
                Solana Tracker - Real-time wallet monitoring
              </p>
              <p className="text-[10px] lg:text-xs text-plasma-600 text-center mt-0.5 lg:mt-1">
                Built with 3D Glassmorphism Design
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
