import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2, Users, Shield } from 'lucide-react'

const Index = () => {
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (user) {
      navigate('/dashboard')
    }
  }, [user, navigate])

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <Building2 className="h-16 w-16 text-primary" />
          </div>
          <h1 className="text-4xl font-bold mb-4">Portal de Clientes</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Plataforma para gestión de proyectos de energía eléctrica e infraestructura. 
            Acceda a sus documentos, manuales y planos de manera segura.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <Card className="hover:shadow-lg transition-shadow">
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

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="text-center">
              <Shield className="h-12 w-12 text-primary mx-auto mb-4" />
              <CardTitle>Panel Administrativo</CardTitle>
              <CardDescription>
                Acceso para administradores para gestionar empresas, proyectos y documentos
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button onClick={() => navigate('/admin/login')} variant="outline" className="w-full">
                Panel de Administración
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="mt-16 text-center">
          <div className="grid md:grid-cols-3 gap-8 max-w-3xl mx-auto">
            <div className="text-center">
              <h3 className="font-semibold mb-2">Archivos</h3>
              <p className="text-sm text-muted-foreground">
                Documentos generales del proyecto
              </p>
            </div>
            <div className="text-center">
              <h3 className="font-semibold mb-2">Manuales</h3>
              <p className="text-sm text-muted-foreground">
                Guías de instalación y mantenimiento
              </p>
            </div>
            <div className="text-center">
              <h3 className="font-semibold mb-2">Planos</h3>
              <p className="text-sm text-muted-foreground">
                Diagramas técnicos y esquemas
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
