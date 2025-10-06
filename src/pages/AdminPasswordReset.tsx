import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Shield } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'

const AdminPasswordReset = () => {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [email, setEmail] = useState('jbarahona@ayerviernes.com')
  const [newPassword, setNewPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!newPassword || newPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase.functions.invoke('admin-update-password', {
        body: { email, password: newPassword }
      })

      if (error) throw error

      setSuccess(true)
      toast({
        variant: "success",
        title: "Éxito",
        description: "Contraseña actualizada correctamente",
      })

      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/')
      }, 3000)

    } catch (err: any) {
      console.error('Error updating password:', err)
      setError(err.message || 'Error al actualizar la contraseña')
      toast({
        title: "Error",
        description: err.message || 'Error al actualizar la contraseña',
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Shield className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <CardTitle className="text-green-600">¡Contraseña Actualizada!</CardTitle>
            <CardDescription>
              La contraseña se ha actualizado correctamente. Serás redirigido al login en unos segundos.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => navigate('/')} 
              className="w-full"
              variant="default"
            >
              Ir al Login Ahora
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Shield className="h-12 w-12 text-primary mx-auto mb-4" />
          <CardTitle>Resetear Contraseña de Administrador</CardTitle>
          <CardDescription>
            Configura una nueva contraseña para tu cuenta de administrador
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordReset} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">Email de Administrador</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="bg-muted"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Nueva Contraseña</Label>
              <Input
                id="password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                disabled={loading}
                placeholder="Mínimo 6 caracteres"
              />
            </div>
            
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Actualizar Contraseña
            </Button>
            
            <Button 
              type="button" 
              variant="ghost" 
              className="w-full" 
              onClick={() => navigate('/')}
              disabled={loading}
            >
              Volver al Login
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default AdminPasswordReset