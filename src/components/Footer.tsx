import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'
import smartClarityLogo from '@/assets/smartclarity-logo.png'
import smartClarityLogoBlack from '@/assets/smartclarity-logo-black.png'

export function Footer() {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const { toast } = useToast()
  
  const [form, setForm] = useState({
    company: '',
    fullName: '',
    email: '',
    phone: '',
    problem: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase.functions.invoke('send-support-email', {
        body: {
          to: 'jorgebarahona@proton.me',
          subject: 'Problema de acceso a documentos - SmartClarity Portal',
          company: form.company,
          fullName: form.fullName,
          email: form.email,
          phone: form.phone,
          problem: form.problem
        }
      })

      if (error) throw error

      setShowSuccess(true)
      setForm({ company: '', fullName: '', email: '', phone: '', problem: '' })
      
      setTimeout(() => {
        setIsOpen(false)
        setShowSuccess(false)
      }, 3000)
      
    } catch (error) {
      console.error('Error sending email:', error)
      
      // Check if it's a user/company not found error
      const errorMessage = error?.message || ''
      if (errorMessage.includes('not found') || errorMessage.includes('invalid') || errorMessage.includes('unauthorized') || errorMessage.includes('company') || errorMessage.includes('user')) {
        toast({
          title: "Empresa o correo no encontrado",
          description: (
            <span>
              No encontramos su Empresa y/o correo electrónico. Es posible que no existan en el Portal. Por favor comuníquese al{' '}
              <a href="tel:+56996820893" className="underline font-medium">+56-9-9682 0893</a>{' '}para recibir asistencia.
            </span>
          ),
          variant: "destructive",
        })
      } else {
        toast({
          title: "Empresa o correo no encontrado",
          description: (
            <span>
              No encontramos su Empresa y/o correo electrónico. Es posible que no existan en el Portal. Por favor comuníquese al{' '}
              <a href="tel:+56996820893" className="underline font-medium">+56-9-9682 0893</a>{' '}para recibir asistencia.
            </span>
          ),
          variant: "destructive",
        })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <footer className="border-t bg-background mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="w-4/5 mx-auto border-t border-muted mb-8"></div>
        
        <div className="flex justify-between items-end">
          <div>
            <img 
              src={smartClarityLogoBlack} 
              alt="SmartClarity Logo"
              className="w-[200px] h-auto opacity-50"
            />
          </div>
          
          <div className="text-right">
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="h-8 bg-gray-500 border-gray-500 text-white hover:bg-white hover:text-gray-500"
                >
                  No puedo acceder a mis documentos
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Formulario de Contacto</DialogTitle>
                  <DialogDescription>
                    Déjenos sus datos y le ayudaremos a resolver el problema de acceso.
                  </DialogDescription>
                </DialogHeader>
                
                {showSuccess ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-muted-foreground">
                      Hemos recibido su mensaje, en breve nos pondremos en contacto para solucionar el problema. Gracias.
                    </p>
                    <p className="font-semibold mt-2">Equipo SmartClarity</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="company">Empresa *</Label>
                        <Input
                          id="company"
                          value={form.company}
                          onChange={(e) => setForm(prev => ({ ...prev, company: e.target.value }))}
                          required
                          disabled={loading}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="fullName">Nombre y Apellido *</Label>
                        <Input
                          id="fullName"
                          value={form.fullName}
                          onChange={(e) => setForm(prev => ({ ...prev, fullName: e.target.value }))}
                          required
                          disabled={loading}
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">Correo *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={form.email}
                          onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
                          required
                          disabled={loading}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Teléfono *</Label>
                        <Input
                          id="phone"
                          value={form.phone}
                          onChange={(e) => setForm(prev => ({ ...prev, phone: e.target.value }))}
                          required
                          disabled={loading}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="problem">Explique el problema *</Label>
                      <Textarea
                        id="problem"
                        value={form.problem}
                        onChange={(e) => setForm(prev => ({ ...prev, problem: e.target.value }))}
                        required
                        disabled={loading}
                        rows={4}
                      />
                    </div>
                    
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? 'Enviando...' : 'Enviar'}
                    </Button>
                  </form>
                )}
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </footer>
  )
}