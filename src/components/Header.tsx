import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import smartClarityLogo from '@/assets/smartclarity-logo.png'

interface HeaderProps {
  showAdminAccess?: boolean
  onSignOut?: () => void
}

export function Header({ showAdminAccess = false, onSignOut }: HeaderProps) {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    if (onSignOut) {
      onSignOut()
    } else {
      await signOut()
      navigate('/')
    }
  }

  return (
    <header className="border-b bg-card">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <img 
            src={smartClarityLogo} 
            alt="SmartClarity Logo" 
            className="h-8 w-auto cursor-pointer"
            onClick={() => navigate('/')}
          />
          <h1 className="text-lg font-semibold">Portal de Clientes</h1>
        </div>
        
        <div className="flex items-center gap-2">
          {showAdminAccess && (
            <Button 
              onClick={() => navigate('/admin/login')} 
              variant="ghost" 
              size="sm"
              className="text-muted-foreground hover:text-foreground"
            >
              Administración de Portal
            </Button>
          )}
          
          {user && (
            <Button variant="outline" onClick={handleSignOut} size="sm">
              <LogOut className="mr-2 h-4 w-4" />
              Cerrar Sesión
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}