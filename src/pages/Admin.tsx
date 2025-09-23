import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowLeft, Upload, Trash2, Plus, Building2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

type Company = {
  id: string
  name: string
  email: string
}

type Project = {
  id: string
  name: string
  description: string | null
  company_id: string
  companies?: Company
}

type Document = {
  id: string
  project_id: string
  name: string
  file_path: string
  file_type: string
  file_size: number
  document_type: 'manual' | 'plano' | 'archivo'
  created_at: string
  projects?: { name: string }
}

export default function Admin() {
  const { user, signOut, isAdmin, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [companies, setCompanies] = useState<Company[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(false)
  const [uploadLoading, setUploadLoading] = useState(false)

  // Form states
  const [newCompany, setNewCompany] = useState({ name: '', email: '', password: '' })
  const [newProject, setNewProject] = useState({ name: '', description: '', company_id: '' })
  const [editingCompany, setEditingCompany] = useState<Company | null>(null)
  const [showPasswordReset, setShowPasswordReset] = useState<string | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [uploadForm, setUploadForm] = useState({
    project_id: '',
    document_type: 'archivo' as 'manual' | 'plano' | 'archivo',
    file: null as File | null
  })

  useEffect(() => {
    if (authLoading) return
    
    if (!user) {
      navigate('/admin/login')
      return
    }

    if (!isAdmin) {
      toast({
        variant: "destructive",
        title: "Acceso Denegado",
        description: "No tienes permisos de administrador para acceder a esta página.",
      })
      navigate('/')
      return
    }

    loadData()
  }, [user, isAdmin, authLoading, navigate])

  const loadData = async () => {
    setLoading(true)
    try {
      // Load companies
      const { data: companiesData } = await supabase
        .from('companies')
        .select('*')
        .order('name')

      // Load projects with company info
      const { data: projectsData } = await supabase
        .from('projects')
        .select('*, companies(name)')
        .order('created_at', { ascending: false })

      // Load documents with project info
      const { data: documentsData } = await supabase
        .from('documents')
        .select('*, projects(name)')
        .order('created_at', { ascending: false })

      setCompanies(companiesData || [])
      setProjects(projectsData || [])
      setDocuments(documentsData || [])
    } catch (error) {
      console.error('Error loading data:', error)
      toast({
        title: "Error",
        description: "Error al cargar los datos",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      // First create the auth user via edge function
      const { data: authData, error: authError } = await supabase.functions.invoke('admin-create-user', {
        body: { email: newCompany.email, password: newCompany.password }
      })

      if (authError) throw authError

      // Then create the company record
      const { error } = await supabase
        .from('companies')
        .insert([{ name: newCompany.name, email: newCompany.email }])

      if (error) throw error

      toast({
        title: "Éxito",
        description: "Empresa y usuario creados correctamente",
      })
      
      setNewCompany({ name: '', email: '', password: '' })
      loadData()
    } catch (error) {
      console.error('Error creating company:', error)
      toast({
        title: "Error",
        description: "Error al crear la empresa. Verifique que el email no esté en uso.",
        variant: "destructive",
      })
    }
  }

  const handleUpdateCompany = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingCompany) return

    try {
      const { error } = await supabase
        .from('companies')
        .update({ name: editingCompany.name, email: editingCompany.email })
        .eq('id', editingCompany.id)

      if (error) throw error

      toast({
        title: "Éxito",
        description: "Empresa actualizada correctamente",
      })
      
      setEditingCompany(null)
      loadData()
    } catch (error) {
      console.error('Error updating company:', error)
      toast({
        title: "Error",
        description: "Error al actualizar la empresa",
        variant: "destructive",
      })
    }
  }

  const handleDeleteCompany = async (companyId: string, companyEmail: string) => {
    if (!confirm('¿Está seguro de que desea eliminar esta empresa? Esta acción no se puede deshacer.')) {
      return
    }

    try {
      // First, check if there are projects associated with this company
      const { data: projects } = await supabase
        .from('projects')
        .select('id')
        .eq('company_id', companyId)

      if (projects && projects.length > 0) {
        toast({
          title: "Error",
          description: "No se puede eliminar la empresa porque tiene proyectos asociados",
          variant: "destructive",
        })
        return
      }

      // Delete the company record
      const { error } = await supabase
        .from('companies')
        .delete()
        .eq('id', companyId)

      if (error) throw error

      // Try to delete the auth user via edge function
      try {
        await supabase.functions.invoke('admin-delete-user', {
          body: { email: companyEmail }
        })
      } catch (authError) {
        console.warn('Could not delete auth user:', authError)
      }

      toast({
        title: "Éxito",
        description: "Empresa eliminada correctamente",
      })
      
      loadData()
    } catch (error) {
      console.error('Error deleting company:', error)
      toast({
        title: "Error",
        description: "Error al eliminar la empresa",
        variant: "destructive",
      })
    }
  }

  const handleResetPassword = async (companyEmail: string) => {
    if (!newPassword) {
      toast({
        title: "Error",
        description: "Ingrese una nueva contraseña",
        variant: "destructive",
      })
      return
    }

    try {
      // First try to create the user (in case they don't exist)
      const { error: createError } = await supabase.functions.invoke('admin-create-user', {
        body: { email: companyEmail, password: newPassword }
      })

      // If user already exists, try to update password
      if (createError && createError.message?.includes('already')) {
        const { error: updateError } = await supabase.functions.invoke('admin-update-password', {
          body: { email: companyEmail, password: newPassword }
        })
        
        if (updateError) throw updateError
      } else if (createError) {
        throw createError
      }

      toast({
        title: "Éxito",
        description: "Usuario creado/contraseña actualizada correctamente",
      })
      
      setShowPasswordReset(null)
      setNewPassword('')
    } catch (error: any) {
      console.error('Error resetting password:', error)
      toast({
        title: "Error",
        description: error?.message || "Error al cambiar la contraseña",
        variant: "destructive",
      })
    }
  }

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const { error } = await supabase
        .from('projects')
        .insert([newProject])

      if (error) throw error

      toast({
        title: "Éxito",
        description: "Proyecto creado correctamente",
      })
      
      setNewProject({ name: '', description: '', company_id: '' })
      loadData()
    } catch (error) {
      console.error('Error creating project:', error)
      toast({
        title: "Error",
        description: "Error al crear el proyecto",
        variant: "destructive",
      })
    }
  }

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!uploadForm.file || !uploadForm.project_id) return

    setUploadLoading(true)
    try {
      // Upload file to Supabase Storage
      const fileExt = uploadForm.file.name.split('.').pop()
      const fileName = `${Date.now()}.${fileExt}`
      const filePath = `${uploadForm.project_id}/${uploadForm.document_type}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, uploadForm.file)

      if (uploadError) throw uploadError

      // Save document metadata to database
      const { error: dbError } = await supabase
        .from('documents')
        .insert([{
          project_id: uploadForm.project_id,
          name: uploadForm.file.name,
          file_path: filePath,
          file_type: uploadForm.file.type || 'application/octet-stream',
          file_size: uploadForm.file.size,
          document_type: uploadForm.document_type
        }])

      if (dbError) throw dbError

      toast({
        title: "Éxito",
        description: "Documento subido correctamente",
      })
      
      setUploadForm({ project_id: '', document_type: 'archivo', file: null })
      loadData()
    } catch (error) {
      console.error('Error uploading file:', error)
      toast({
        title: "Error",
        description: "Error al subir el documento",
        variant: "destructive",
      })
    } finally {
      setUploadLoading(false)
    }
  }

  const handleDeleteDocument = async (docId: string, filePath: string) => {
    try {
      // Delete from storage
      await supabase.storage
        .from('documents')
        .remove([filePath])

      // Delete from database
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', docId)

      if (error) throw error

      toast({
        title: "Éxito",
        description: "Documento eliminado correctamente",
      })
      
      loadData()
    } catch (error) {
      console.error('Error deleting document:', error)
      toast({
        title: "Error",
        description: "Error al eliminar el documento",
        variant: "destructive",
      })
    }
  }

  // Show loading while checking authentication and permissions
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verificando permisos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </Button>
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                <h1 className="text-lg font-semibold">Panel Administrativo</h1>
              </div>
            </div>
            <Button variant="outline" onClick={() => signOut()}>
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="companies" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="companies">Empresas</TabsTrigger>
            <TabsTrigger value="projects">Proyectos</TabsTrigger>
            <TabsTrigger value="upload">Subir Documentos</TabsTrigger>
            <TabsTrigger value="documents">Gestionar Documentos</TabsTrigger>
          </TabsList>

          <TabsContent value="companies" className="mt-6">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Crear Empresa</CardTitle>
                  <CardDescription>
                    Crear una nueva empresa con cuenta de usuario para acceso al sistema
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreateCompany} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="companyName">Nombre de la Empresa</Label>
                        <Input
                          id="companyName"
                          value={newCompany.name}
                          onChange={(e) => setNewCompany(prev => ({ ...prev, name: e.target.value }))}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="companyEmail">Email</Label>
                        <Input
                          id="companyEmail"
                          type="email"
                          value={newCompany.email}
                          onChange={(e) => setNewCompany(prev => ({ ...prev, email: e.target.value }))}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="companyPassword">Contraseña Inicial</Label>
                      <Input
                        id="companyPassword"
                        type="password"
                        value={newCompany.password}
                        onChange={(e) => setNewCompany(prev => ({ ...prev, password: e.target.value }))}
                        required
                        placeholder="Mínimo 6 caracteres"
                      />
                    </div>
                    <Button type="submit">
                      <Plus className="mr-2 h-4 w-4" />
                      Crear Empresa
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Empresas Existentes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {companies.map((company) => (
                      <div key={company.id} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">{company.name}</h4>
                            <p className="text-sm text-muted-foreground">{company.email}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setEditingCompany(company)}
                            >
                              Editar
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setShowPasswordReset(company.email)}
                            >
                              Cambiar Clave
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteCompany(company.id, company.email)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Edit Company Modal */}
              {editingCompany && (
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle>Editar Empresa</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleUpdateCompany} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="editCompanyName">Nombre de la Empresa</Label>
                          <Input
                            id="editCompanyName"
                            value={editingCompany.name}
                            onChange={(e) => setEditingCompany(prev => prev ? ({ ...prev, name: e.target.value }) : null)}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="editCompanyEmail">Email</Label>
                          <Input
                            id="editCompanyEmail"
                            type="email"
                            value={editingCompany.email}
                            onChange={(e) => setEditingCompany(prev => prev ? ({ ...prev, email: e.target.value }) : null)}
                            required
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button type="submit">
                          Actualizar Empresa
                        </Button>
                        <Button type="button" variant="outline" onClick={() => setEditingCompany(null)}>
                          Cancelar
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              )}

              {/* Password Reset Modal */}
              {showPasswordReset && (
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle>Cambiar Contraseña</CardTitle>
                    <CardDescription>
                      Cambiando contraseña para: {showPasswordReset}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="newPassword">Nueva Contraseña</Label>
                        <Input
                          id="newPassword"
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Mínimo 6 caracteres"
                          required
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={() => handleResetPassword(showPasswordReset)}>
                          Cambiar Contraseña
                        </Button>
                        <Button variant="outline" onClick={() => {
                          setShowPasswordReset(null)
                          setNewPassword('')
                        }}>
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="projects" className="mt-6">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Crear Proyecto</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreateProject} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="projectName">Nombre del Proyecto</Label>
                        <Input
                          id="projectName"
                          value={newProject.name}
                          onChange={(e) => setNewProject(prev => ({ ...prev, name: e.target.value }))}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="company">Empresa</Label>
                        <Select 
                          value={newProject.company_id} 
                          onValueChange={(value) => setNewProject(prev => ({ ...prev, company_id: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar empresa" />
                          </SelectTrigger>
                          <SelectContent>
                            {companies.map((company) => (
                              <SelectItem key={company.id} value={company.id}>
                                {company.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Descripción</Label>
                      <Input
                        id="description"
                        value={newProject.description}
                        onChange={(e) => setNewProject(prev => ({ ...prev, description: e.target.value }))}
                      />
                    </div>
                    <Button type="submit">
                      <Plus className="mr-2 h-4 w-4" />
                      Crear Proyecto
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Proyectos Existentes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {projects.map((project) => (
                      <div key={project.id} className="p-4 border rounded-lg">
                        <h4 className="font-medium">{project.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {project.companies?.name}
                        </p>
                        {project.description && (
                          <p className="text-sm mt-1">{project.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="upload" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Subir Documento</CardTitle>
                <CardDescription>
                  Suba un nuevo documento a un proyecto específico
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleFileUpload} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="project">Proyecto</Label>
                    <Select 
                      value={uploadForm.project_id} 
                      onValueChange={(value) => setUploadForm(prev => ({ ...prev, project_id: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar proyecto" />
                      </SelectTrigger>
                      <SelectContent>
                        {projects.map((project) => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.name} - {project.companies?.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="type">Tipo de Documento</Label>
                    <Select 
                      value={uploadForm.document_type} 
                      onValueChange={(value: 'manual' | 'plano' | 'archivo') => 
                        setUploadForm(prev => ({ ...prev, document_type: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="archivo">Archivo</SelectItem>
                        <SelectItem value="manual">Manual</SelectItem>
                        <SelectItem value="plano">Plano</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="file">Archivo</Label>
                    <Input
                      id="file"
                      type="file"
                      onChange={(e) => setUploadForm(prev => ({ 
                        ...prev, 
                        file: e.target.files?.[0] || null 
                      }))}
                      required
                    />
                  </div>

                  <Button type="submit" disabled={uploadLoading || !uploadForm.file}>
                    {uploadLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Subiendo...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Subir Documento
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Documentos</CardTitle>
                <CardDescription>
                  Lista de todos los documentos en el sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{doc.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {doc.projects?.name} - {doc.document_type}
                        </p>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteDocument(doc.id, doc.file_path)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}