import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import smartClarityLogo from '@/assets/smartclarity-logo-new.png'

interface HeaderProps {
  showAdminAccess?: boolean
  onSignOut?: () => void
  title?: string
  variant?: 'public' | 'client' | 'admin'
}

export function Header({ showAdminAccess = false, onSignOut, title, variant = 'public' }: HeaderProps) {
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
      <div className="container mx-auto px-4 py-4 flex justify-between items-center h-16">
        <div className="flex items-center gap-3">
          <img 
            src={smartClarityLogo} 
            alt="SmartClarity Logo" 
            className="w-[250px] h-auto cursor-pointer"
            onClick={() => navigate('/')}
          />
          {title && (
            <h1 className="text-lg font-semibold">{title}</h1>
          )}
        </div>
        
        <div className="flex items-center gap-2 h-8">
          {showAdminAccess && (
            <Button 
              onClick={() => navigate('/admin/login')} 
              variant="outline"
              size="sm"
              className="h-8 bg-white border-black text-black hover:bg-gray-50"
            >
              Administración de Portal
            </Button>
          )}
          
          {user && (variant === 'client' || variant === 'admin') && (
            <Button variant="outline" onClick={handleSignOut} size="sm" className="h-8">
              <LogOut className="mr-2 h-4 w-4" />
              Cerrar Sesión
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}