import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Users } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import smartClarityLogo from '@/assets/smartclarity-logo.png'

const Index = () => {
  const { user, signIn, isAdmin, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Handle redirect based on user role
  useEffect(() => {
    console.log('Index: useEffect triggered - user:', user?.email || 'null', 'authLoading:', authLoading, 'isAdmin:', isAdmin)
    if (user && !authLoading) {
      console.log('Index: User authenticated, redirecting...')
      if (isAdmin) {
        console.log('Index: Redirecting to /admin')
        navigate('/admin')
      } else {
        console.log('Index: Redirecting to /dashboard')
        navigate('/dashboard')
      }
    }
  }, [user, isAdmin, authLoading, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      await signIn(email, password)
      // Let the useEffect handle the redirect based on user role
    } catch (err) {
      setError('Credenciales incorrectas. Verifique su email y contraseña.')
    } finally {
      setLoading(false)
    }
  }

  // Show loading while auth is being determined
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    )
  }

  // If user is already logged in, the useEffect will handle the redirect
  if (user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 flex flex-col">
      <Header showAdminAccess={true} />
      
      <div className="container mx-auto px-4 py-16 flex-1">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Portal de Clientes</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Servicio para la gestión de documentos de clientes de SmartClarity.
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
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Ingresar
                </Button>
                
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Index;
