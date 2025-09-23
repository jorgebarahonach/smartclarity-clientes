import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Shield } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'

export default function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      await signIn(email, password)
      navigate('/admin')
    } catch (err) {
      setError('Credenciales incorrectas. Verifique su email y contraseña.')
    } finally {
      setLoading(false)
    }
  }

  const handleBootstrapAdmin = async () => {
    setLoading(true)
    setError('')
    try {
      const { error } = await supabase.functions.invoke('bootstrap-admin', {
        body: { email, password },
      })
      if (error) throw error
      toast({ title: 'Admin listo', description: 'Ahora intenta iniciar sesión.' })
    } catch (e: any) {
      setError(e?.message || 'No se pudo crear/restablecer el admin')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Shield className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Panel Administrativo</CardTitle>
          <CardDescription>
            Ingrese sus credenciales de administrador
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
            
            <div className="space-y-2">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Ingresar al Panel
              </Button>
              <Button type="button" variant="outline" className="w-full" disabled={loading} onClick={handleBootstrapAdmin}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Crear/Restablecer Admin inicial
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}