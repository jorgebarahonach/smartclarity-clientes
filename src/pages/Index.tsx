import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Shield, LogOut } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import smartClarityLogo from '@/assets/smartclarity-logo.png'

const Index = () => {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10">
      <div className="absolute top-4 right-4">
        <Button 
          onClick={() => navigate('/admin/login')} 
          variant="ghost" 
          size="sm"
          className="text-muted-foreground hover:text-foreground"
        >
          Administración de Portal
        </Button>
      </div>
      
      {user && (
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Sesión activa como: {user.email}</span>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => navigate('/dashboard')} variant="outline" size="sm">
                Ir al Dashboard
              </Button>
              <Button onClick={handleSignOut} variant="ghost" size="sm">
                <LogOut className="mr-2 h-4 w-4" />
                Cerrar Sesión
              </Button>
            </div>
          </div>
        </div>
      )}
      
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <img 
              src={smartClarityLogo} 
              alt="SmartClarity Logo" 
              className="h-20 w-auto"
            />
          </div>
          <h1 className="text-4xl font-bold mb-4">Portal de Clientes</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Servicio para la gestión de documentos de clientes de Smartclariti.
          </p>
        </div>

        <div className="flex justify-center max-w-md mx-auto">
          <Card className="hover:shadow-lg transition-shadow w-full">
            <CardHeader className="text-center">
              <Users className="h-12 w-12 text-primary mx-auto mb-4" />
              <CardTitle>Acceso de Cliente</CardTitle>
              <CardDescription>
                Ingrese con sus credenciales para acceder a sus proyectos y documentos
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button onClick={() => navigate('/login')} className="w-full">
                Ingresar como Cliente
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
