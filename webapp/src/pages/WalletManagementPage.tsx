// ═══════════════════════════════════════════════════════════════════════════════
// WALLET MANAGEMENT PAGE - Mobile-Optimized 3D Glassmorphism Add/Delete Wallets
// ═══════════════════════════════════════════════════════════════════════════════

import { useState } from 'react'
import { 
  Plus, 
  Trash2, 
  Edit2, 
  Wallet, 
  Check, 
  X,
  Search,
  Copy,
  ExternalLink,
  PauseCircle,
  PlayCircle,
  AlertCircle,
  Shield,
  Sparkles
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { cn } from '@/lib/utils'
import { useWalletStore } from '@/store/walletStore'

function shortenAddress(address: string): string {
  if (!address || address.length < 10) return address
  return `${address.slice(0, 4)}...${address.slice(-4)}`
}

function isValidSolanaAddress(address: string): boolean {
  const base58Regex = /^[A-HJ-NP-Za-km-z1-9]{32,44}$/
  return base58Regex.test(address)
}

export function WalletManagementPage() {
  const [newWalletAddress, setNewWalletAddress] = useState('')
  const [newWalletName, setNewWalletName] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [editingWallet, setEditingWallet] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [walletToDelete, setWalletToDelete] = useState<string | null>(null)
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null)
  
  const wallets = useWalletStore(state => state.wallets)
  const addWallet = useWalletStore(state => state.addWallet)
  const deleteWallet = useWalletStore(state => state.deleteWallet)
  const updateWalletName = useWalletStore(state => state.updateWalletName)
  const toggleWalletActive = useWalletStore(state => state.toggleWalletActive)
  const error = useWalletStore(state => state.error)
  const clearError = useWalletStore(state => state.clearError)
  const isLoading = useWalletStore(state => state.isLoading)
  
  const filteredWallets = wallets.filter(wallet =>
    wallet.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    wallet.address.toLowerCase().includes(searchQuery.toLowerCase())
  )
  
  const handleAddWallet = async () => {
    if (!newWalletAddress.trim()) return
    
    clearError()
    const success = await addWallet(newWalletAddress.trim(), newWalletName.trim() || undefined)
    
    if (success) {
      setNewWalletAddress('')
      setNewWalletName('')
      setIsAdding(false)
    }
  }
  
  const handleDeleteWallet = () => {
    if (walletToDelete) {
      deleteWallet(walletToDelete)
      setWalletToDelete(null)
    }
  }
  
  const handleEditName = (walletId: string) => {
    if (editName.trim()) {
      updateWalletName(walletId, editName.trim())
    }
    setEditingWallet(null)
    setEditName('')
  }
  
  const startEditing = (wallet: typeof wallets[0]) => {
    setEditingWallet(wallet.id)
    setEditName(wallet.name)
  }
  
  const handleCopy = async (address: string) => {
    await navigator.clipboard.writeText(address)
    setCopiedAddress(address)
    setTimeout(() => setCopiedAddress(null), 2000)
  }
  
  const handleOpenExplorer = (address: string) => {
    window.open(`https://solscan.io/account/${address}`, '_blank')
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4 lg:space-y-8">
      {/* Header - Glass Card */}
      <div className="glass-card p-4 lg:p-6 holographic">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-xl bg-gradient-to-br from-plasma-300 to-plasma-500 flex items-center justify-center shrink-0">
              <Shield className="w-4 h-4 lg:w-5 lg:h-5 text-black" />
            </div>
            <div>
              <h1 className="text-xl lg:text-3xl font-bold glow-text">Wallets</h1>
              <p className="text-plasma-500 text-xs lg:text-sm hidden sm:block">
                Manage your tracked wallets
              </p>
            </div>
          </div>
          
          <Button 
            onClick={() => setIsAdding(true)} 
            className="glass-button gap-2 bg-plasma-500/20 hover:bg-plasma-500/30 text-sm shrink-0"
            size="sm"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Wallet</span>
          </Button>
        </div>
      </div>
      
      {/* Add Wallet Form - Glass */}
      {isAdding && (
        <Card className="glass-card border-plasma-500/30 pulse-glow">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-base lg:text-lg flex items-center gap-2">
              <Sparkles className="w-4 h-4 lg:w-5 lg:h-5 text-plasma-400" />
              Add New Wallet
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            {error && (
              <Alert className="glass-60 border-red-500/30">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <AlertDescription className="text-red-300 text-sm">{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs lg:text-sm font-medium text-plasma-400">Wallet Address</label>
                <Input
                  placeholder="Enter Solana address..."
                  value={newWalletAddress}
                  onChange={(e) => setNewWalletAddress(e.target.value)}
                  className={cn(
                    "glass-input text-sm",
                    newWalletAddress && !isValidSolanaAddress(newWalletAddress) && "border-red-500/50"
                  )}
                />
                {newWalletAddress && !isValidSolanaAddress(newWalletAddress) && (
                  <p className="text-xs text-red-400">Invalid Solana address</p>
                )}
              </div>
              
              <div className="space-y-1.5">
                <label className="text-xs lg:text-sm font-medium text-plasma-400">Name (Optional)</label>
                <Input
                  placeholder="e.g., My Wallet"
                  value={newWalletName}
                  onChange={(e) => setNewWalletName(e.target.value)}
                  className="glass-input text-sm"
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsAdding(false)
                  setNewWalletAddress('')
                  setNewWalletName('')
                  clearError()
                }}
                className="glass-button text-sm"
                size="sm"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddWallet}
                disabled={!newWalletAddress.trim() || !isValidSolanaAddress(newWalletAddress) || isLoading}
                className="glass-button bg-plasma-500/20 hover:bg-plasma-500/30 text-sm"
                size="sm"
              >
                {isLoading ? 'Adding...' : 'Add'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Search Bar - Glass */}
      <div className="glass-card p-3 lg:p-4">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-plasma-500" />
          <Input
            placeholder="Search wallets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="glass-input pl-10 w-full text-sm"
          />
        </div>
      </div>
      
      {/* Wallets List */}
      {wallets.length === 0 ? (
        <Card className="glass-card border-dashed border-2 border-white/10">
          <CardContent className="py-12 lg:py-20 text-center px-4">
            <div className="relative inline-block mb-4 lg:mb-6">
              <div className="w-16 h-16 lg:w-20 lg:h-20 rounded-2xl glass-60 flex items-center justify-center float-3d">
                <Wallet className="w-8 h-8 lg:w-10 lg:h-10 text-plasma-400" />
              </div>
              <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 lg:w-8 lg:h-8 rounded-full bg-plasma-500/20 flex items-center justify-center">
                <Plus className="w-3 h-3 lg:w-4 lg:h-4 text-plasma-300" />
              </div>
            </div>
            <h3 className="text-lg lg:text-xl font-medium mb-2 text-white">No wallets added yet</h3>
            <p className="text-plasma-500 text-sm mb-4 lg:mb-6 max-w-md mx-auto px-4">
              Add wallets to start tracking their transactions in real-time
            </p>
            <Button 
              onClick={() => setIsAdding(true)}
              className="glass-button gap-2 bg-plasma-500/20 hover:bg-plasma-500/30 text-sm"
            >
              <Plus className="w-4 h-4" />
              Add Your First Wallet
            </Button>
          </CardContent>
        </Card>
      ) : filteredWallets.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="py-12 lg:py-16 text-center">
            <Search className="w-10 h-10 lg:w-12 lg:h-12 mx-auto mb-3 text-plasma-500" />
            <h3 className="text-base lg:text-lg font-medium mb-1 text-white">No wallets match</h3>
            <p className="text-plasma-500 text-sm">
              Try adjusting your search criteria
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2 lg:space-y-3">
          {filteredWallets.map((wallet) => (
            <Card 
              key={wallet.id} 
              className="glass-card overflow-hidden group"
            >
              <CardContent className="p-3 lg:p-4">
                <div className="flex items-center gap-3 lg:gap-4">
                  {/* Icon */}
                  <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-gradient-to-br from-plasma-600 to-plasma-800 flex items-center justify-center shrink-0 group-hover:from-plasma-500 group-hover:to-plasma-700 transition-all">
                    <Wallet className="w-5 h-5 lg:w-6 lg:h-6 text-plasma-200" />
                  </div>
                  
                  {/* Wallet Info */}
                  <div className="flex-1 min-w-0">
                    {editingWallet === wallet.id ? (
                      <div className="flex items-center gap-2">
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="h-8 w-32 lg:w-48 glass-input text-sm"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleEditName(wallet.id)
                            if (e.key === 'Escape') {
                              setEditingWallet(null)
                              setEditName('')
                            }
                          }}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 lg:h-8 lg:w-8 glass-button"
                          onClick={() => handleEditName(wallet.id)}
                        >
                          <Check className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-green-400" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 lg:h-8 lg:w-8 glass-button"
                          onClick={() => {
                            setEditingWallet(null)
                            setEditName('')
                          }}
                        >
                          <X className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-red-400" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 group/name">
                        <h3 className="font-medium text-white text-sm lg:text-base truncate">{wallet.name}</h3>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 lg:h-6 lg:w-6 opacity-0 group-hover/name:opacity-100 transition-opacity glass-button shrink-0"
                          onClick={() => startEditing(wallet)}
                        >
                          <Edit2 className="w-3 h-3 text-plasma-400" />
                        </Button>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 lg:gap-2 mt-0.5">
                      <code className="text-[10px] lg:text-xs text-plasma-500 bg-black/50 px-1.5 py-0.5 rounded">
                        {shortenAddress(wallet.address)}
                      </code>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 lg:h-6 lg:w-6 glass-button"
                        onClick={() => handleCopy(wallet.address)}
                      >
                        {copiedAddress === wallet.address ? (
                          <Check className="w-2.5 h-2.5 lg:w-3 lg:h-3 text-green-400" />
                        ) : (
                          <Copy className="w-2.5 h-2.5 lg:w-3 lg:h-3 text-plasma-500" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 lg:h-6 lg:w-6 glass-button hidden sm:flex"
                        onClick={() => handleOpenExplorer(wallet.address)}
                      >
                        <ExternalLink className="w-2.5 h-2.5 lg:w-3 lg:h-3 text-plasma-500" />
                      </Button>
                    </div>
                  </div>
                  
                  {/* Status & Actions */}
                  <div className="flex items-center gap-1 lg:gap-2 shrink-0">
                    <Badge 
                      variant={wallet.isActive ? 'default' : 'secondary'}
                      className={cn(
                        "text-[10px] lg:text-xs px-1.5 py-0.5",
                        wallet.isActive 
                          ? "bg-green-500/20 text-green-400 border-green-500/30" 
                          : "bg-plasma-700/30 text-plasma-400 border-plasma-600/30"
                      )}
                    >
                      {wallet.isActive ? 'Active' : 'Paused'}
                    </Badge>
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 lg:h-9 lg:w-9 glass-button"
                      onClick={() => toggleWalletActive(wallet.id)}
                      title={wallet.isActive ? 'Pause' : 'Resume'}
                    >
                      {wallet.isActive ? (
                        <PauseCircle className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-yellow-400" />
                      ) : (
                        <PlayCircle className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-green-400" />
                      )}
                    </Button>
                    
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 lg:h-9 lg:w-9 glass-button text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          onClick={() => setWalletToDelete(wallet.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="glass-card border-red-500/20 mx-4">
                        <DialogHeader>
                          <DialogTitle className="text-white text-lg">Delete Wallet</DialogTitle>
                          <DialogDescription className="text-plasma-400 text-sm">
                            Delete "{wallet.name}"? This cannot be undone.
                          </DialogDescription>
                        </DialogHeader>
                        <DialogFooter className="gap-2">
                          <Button
                            variant="outline"
                            onClick={() => setWalletToDelete(null)}
                            className="glass-button text-sm"
                            size="sm"
                          >
                            Cancel
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={handleDeleteWallet}
                            className="bg-red-500/20 hover:bg-red-500/30 border-red-500/30 text-red-400 text-sm"
                            size="sm"
                          >
                            Delete
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      {/* Summary */}
      {wallets.length > 0 && (
        <div className="glass-card p-3 lg:p-4 flex items-center justify-between text-xs lg:text-sm">
          <span className="text-plasma-500">
            {wallets.length} wallet{wallets.length !== 1 ? 's' : ''}
          </span>
          <span className="text-plasma-400">
            {wallets.filter(w => w.isActive).length} active
          </span>
        </div>
      )}
    </div>
  )
}
