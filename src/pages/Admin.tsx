import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from '@/components/ui/alert-dialog'
import { ArrowLeft, Upload, Trash2, Plus, Edit, FileText, AlertTriangle, ChevronDown } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'

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
  original_file_name?: string
  file_path: string
  file_type: string
  file_size: number
  document_type: 'manual' | 'plano' | 'archivo' | 'normativa' | 'doc_oficial' | 'otro'
  created_at: string
  projects?: { name: string }
}

type AdminUser = {
  id: string
  email: string
  created_at: string
}

export default function Admin() {
  const { user, signOut, isAdmin, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [companies, setCompanies] = useState<Company[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [documents, setDocuments] = useState<Document[]>([])
  const [admins, setAdmins] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(false)
  const [uploadLoading, setUploadLoading] = useState(false)
  const [openProjects, setOpenProjects] = useState<Record<string, boolean>>({})
  const [openCompanies, setOpenCompanies] = useState<Record<string, boolean>>({})

  // Form states
  const [newCompany, setNewCompany] = useState({ name: '', email: '', password: '' })
  const [newProject, setNewProject] = useState({ name: '', description: '', company_id: '' })
  const [newAdmin, setNewAdmin] = useState({ email: '', password: '' })
  const [editingCompany, setEditingCompany] = useState<Company | null>(null)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [showPasswordReset, setShowPasswordReset] = useState<string | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [showNewCompanyForm, setShowNewCompanyForm] = useState(false)
  const [showNewProjectForm, setShowNewProjectForm] = useState(false)
  const [showNewAdminForm, setShowNewAdminForm] = useState(false)
  const [uploadForm, setUploadForm] = useState({
    project_id: '',
    document_type: 'archivo' as 'manual' | 'plano' | 'archivo' | 'normativa' | 'doc_oficial' | 'otro',
    document_name: '',
    file: null as File | null
  })
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: 'company' | 'project' | 'document' | null
    id: string
    name: string
    email?: string
    filePath?: string
  }>({ type: null, id: '', name: '', email: '', filePath: '' })

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

      // Load admin users
      const { data: adminRolesData } = await supabase
        .from('user_roles')
        .select('user_id, created_at')
        .eq('role', 'admin')

      // Get user emails from admin-get-current-user function
      const adminUsersPromises = (adminRolesData || []).map(async (role) => {
        const { data: userData } = await supabase.functions.invoke('admin-get-current-user', {
          body: { userId: role.user_id }
        })
        return {
          id: role.user_id,
          email: userData?.email || 'Email no disponible',
          created_at: role.created_at
        }
      })

      const adminUsers = await Promise.all(adminUsersPromises)

      setCompanies(companiesData || [])
      setProjects(projectsData || [])
      setDocuments(documentsData || [])
      setAdmins(adminUsers || [])
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
        variant: "success",
        title: "Éxito",
        description: "Empresa y usuario creados correctamente",
      })
      
      setNewCompany({ name: '', email: '', password: '' })
      setShowNewCompanyForm(false)
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
        variant: "success",
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

  const confirmDeleteCompany = (companyId: string, companyName: string, companyEmail: string) => {
    setDeleteConfirm({ type: 'company', id: companyId, name: companyName, email: companyEmail })
  }

  const handleDeleteCompany = async (companyId: string, companyEmail: string, companyName: string) => {
    try {
      // First, check if there are projects associated with this company
      // First delete all projects associated with the company
      const { data: projects } = await supabase
        .from('projects')
        .select('id')
        .eq('company_id', companyId)

      if (projects && projects.length > 0) {
        // Delete all documents associated with each project
        for (const project of projects) {
          const { data: docs } = await supabase
            .from('documents')
            .select('file_path')
            .eq('project_id', project.id)
          
          // Delete files from storage
          if (docs && docs.length > 0) {
            for (const doc of docs) {
              await supabase.storage.from('documents').remove([doc.file_path])
            }
          }
          
          // Delete document records
          await supabase.from('documents').delete().eq('project_id', project.id)
        }
        
        // Delete all projects
        await supabase.from('projects').delete().eq('company_id', companyId)
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
        variant: "success",
        title: "Éxito",
        description: `Se ha borrado "${companyName}"`,
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
      // Try to create user first (handles both creation and password update)
      const { data, error } = await supabase.functions.invoke('admin-create-user', {
        body: { email: companyEmail, password: newPassword }
      })

      if (error) {
        // If user exists, try password update instead
        if (error.message?.includes('already') || error.message?.includes('exists')) {
          const { error: updateError } = await supabase.functions.invoke('admin-update-password', {
            body: { email: companyEmail, password: newPassword }
          })
          if (updateError) throw updateError
        } else {
          throw error
        }
      }

      toast({
        variant: "success",
        title: "Éxito",
        description: "Usuario creado/contraseña actualizada correctamente",
      })
      
      setShowPasswordReset(null)
      setNewPassword('')
      
      // Refresh companies list to update status
      await loadData()
      
    } catch (error: any) {
      console.error('Error with user/password:', error)
      toast({
        title: "Error",
        description: error?.message || "Error al procesar la solicitud",
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
        variant: "success",
        title: "Éxito",
        description: "Proyecto creado correctamente",
      })
      
      setNewProject({ name: '', description: '', company_id: '' })
      setShowNewProjectForm(false)
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

  const handleUpdateProject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingProject) return

    try {
      const { error } = await supabase
        .from('projects')
        .update({ 
          name: editingProject.name, 
          description: editingProject.description,
          company_id: editingProject.company_id 
        })
        .eq('id', editingProject.id)

      if (error) throw error

      toast({
        variant: "success",
        title: "Éxito",
        description: "Proyecto actualizado correctamente",
      })
      
      setEditingProject(null)
      loadData()
    } catch (error) {
      console.error('Error updating project:', error)
      toast({
        title: "Error",
        description: "Error al actualizar el proyecto",
        variant: "destructive",
      })
    }
  }

  const confirmDeleteProject = (projectId: string, projectName: string) => {
    setDeleteConfirm({ type: 'project', id: projectId, name: projectName })
  }

  const handleDeleteProject = async (projectId: string, projectName: string) => {
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId)

      if (error) throw error

      toast({
        variant: "success",
        title: "Éxito",
        description: `Se ha borrado "${projectName}"`,
      })
      
      loadData()
    } catch (error) {
      console.error('Error deleting project:', error)
      toast({
        title: "Error",
        description: "Error al eliminar el proyecto",
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
          name: uploadForm.document_name || uploadForm.file.name,
          original_file_name: uploadForm.file.name,
          file_path: filePath,
          file_type: uploadForm.file.type || 'application/octet-stream',
          file_size: uploadForm.file.size,
          document_type: uploadForm.document_type
        }])

      if (dbError) throw dbError

      toast({
        variant: "success",
        title: "Éxito",
        description: "Documento subido correctamente",
      })
      
      setUploadForm({ project_id: '', document_type: 'archivo', document_name: '', file: null })
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

  const confirmDeleteDocument = (docId: string, docName: string, filePath: string) => {
    setDeleteConfirm({ type: 'document', id: docId, name: docName, filePath })
  }

  const handleDeleteDocument = async (docId: string, filePath: string, docName: string) => {
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
        variant: "success",
        title: "Éxito",
        description: `Se ha borrado "${docName}"`,
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

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const { error } = await supabase.functions.invoke('bootstrap-admin', {
        body: { 
          email: newAdmin.email, 
          password: newAdmin.password,
          role: 'admin'
        }
      })

      if (error) throw error

      toast({
        variant: "success",
        title: "Éxito",
        description: "Administrador creado correctamente",
      })
      
      setNewAdmin({ email: '', password: '' })
      setShowNewAdminForm(false)
      loadData()
    } catch (error) {
      console.error('Error creating admin:', error)
      toast({
        title: "Error",
        description: "Error al crear el administrador",
        variant: "destructive",
      })
    }
  }

  const handleDeleteAdmin = async (adminEmail: string) => {
    try {
      // Delete user via edge function
      await supabase.functions.invoke('admin-delete-user', {
        body: { email: adminEmail }
      })

      toast({
        variant: "success",
        title: "Éxito",
        description: `Administrador ${adminEmail} eliminado`,
      })
      
      loadData()
    } catch (error) {
      console.error('Error deleting admin:', error)
      toast({
        title: "Error",
        description: "Error al eliminar el administrador",
        variant: "destructive",
      })
    }
  }

  // Group projects by company
  const projectsByCompany = companies.map(company => ({
    ...company,
    projects: projects.filter(project => project.company_id === company.id)
  }))

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
    <div className="min-h-screen bg-background flex flex-col">
      <Header variant="admin" title="Panel Administrativo" />

      <AlertDialog open={deleteConfirm.type !== null} onOpenChange={(open) => !open && setDeleteConfirm({ type: null, id: '', name: '', email: '', filePath: '' })}>
        <AlertDialogContent className="bg-background border-border">
          <AlertDialogHeader>
            <div className="flex justify-center mb-4">
              <AlertTriangle className="h-16 w-16 text-[hsl(var(--action-yellow))]" />
            </div>
            <AlertDialogTitle className="text-center text-xl text-foreground">
              Confirmar Eliminación
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center text-base text-muted-foreground">
              Borrará "{deleteConfirm.name}": ¿está seguro de esta acción irreversible?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row justify-center gap-4">
            <AlertDialogCancel className="mt-0">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteConfirm.type === 'company') {
                  handleDeleteCompany(deleteConfirm.id, deleteConfirm.email!, deleteConfirm.name)
                } else if (deleteConfirm.type === 'project') {
                  handleDeleteProject(deleteConfirm.id, deleteConfirm.name)
                } else if (deleteConfirm.type === 'document') {
                  handleDeleteDocument(deleteConfirm.id, deleteConfirm.filePath!, deleteConfirm.name)
                }
                setDeleteConfirm({ type: null, id: '', name: '', email: '', filePath: '' })
              }}
              className="mt-0 bg-[hsl(var(--action-red))] hover:bg-[hsl(var(--action-red))]/90 text-white"
            >
              Aceptar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <main className="container mx-auto px-4 py-8 flex-1">
        <Tabs defaultValue="companies" className="w-full">
          <div className="flex items-center justify-between mb-6">
            <TabsList className="grid w-full max-w-3xl grid-cols-5">
              <TabsTrigger value="admins">Administradores</TabsTrigger>
              <TabsTrigger value="companies">Empresas</TabsTrigger>
              <TabsTrigger value="projects">Proyectos</TabsTrigger>
              <TabsTrigger value="upload">Subir Documentos</TabsTrigger>
              <TabsTrigger value="documents">Gestionar Documentos</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="admins" className="mt-6">
            <div className="space-y-6">
              <div className="flex justify-end">
                <Button 
                  variant="default" 
                  onClick={() => setShowNewAdminForm(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Nuevo administrador
                </Button>
              </div>

              {showNewAdminForm && (
                <Card className="border-2">
                  <CardHeader>
                    <CardTitle>Crear Administrador</CardTitle>
                    <CardDescription>
                      Crear un nuevo usuario con permisos de administrador
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleCreateAdmin} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="adminEmail">Email</Label>
                        <Input
                          id="adminEmail"
                          type="email"
                          value={newAdmin.email}
                          onChange={(e) => setNewAdmin(prev => ({ ...prev, email: e.target.value }))}
                          placeholder="juanjose.decomba@smartclarity.com"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="adminPassword">Contraseña Inicial</Label>
                        <Input
                          id="adminPassword"
                          type="password"
                          value={newAdmin.password}
                          onChange={(e) => setNewAdmin(prev => ({ ...prev, password: e.target.value }))}
                          required
                          placeholder="Mínimo 6 caracteres"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button type="submit" variant="action-green">
                          <Plus className="mr-2 h-4 w-4" />
                          Crear Administrador
                        </Button>
                        <Button type="button" variant="outline" onClick={() => setShowNewAdminForm(false)}>
                          Cancelar
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              )}

              <div className="grid grid-cols-3 gap-4">
                {admins.map((admin) => (
                  <Card key={admin.id}>
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="default">Administrador</Badge>
                          </div>
                          <p className="font-medium">{admin.email}</p>
                          <p className="text-xs text-muted-foreground">
                            Creado: {new Date(admin.created_at).toLocaleDateString('es-ES')}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          {admin.email !== user?.email && (
                            <button
                              className="p-1.5 rounded hover:bg-muted"
                              onClick={() => {
                                if (window.confirm(`¿Eliminar administrador ${admin.email}?`)) {
                                  handleDeleteAdmin(admin.email)
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-[hsl(var(--action-red))]" />
                            </button>
                          )}
                          {admin.email === user?.email && (
                            <span className="text-xs text-muted-foreground">(Usted)</span>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {admins.length === 0 && (
                <Alert>
                  <AlertDescription>
                    No hay administradores registrados en el sistema.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </TabsContent>

          <TabsContent value="companies" className="mt-6">
            <div className="space-y-6">
              <div className="flex justify-end">
                <Button 
                  variant="default" 
                  onClick={() => setShowNewCompanyForm(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Nueva empresa
                </Button>
              </div>

              {showNewCompanyForm && (
                <Card className="border-2">
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
                      <div className="flex gap-2">
                        <Button type="submit" variant="action-green">
                          <Plus className="mr-2 h-4 w-4" />
                          Crear Empresa
                        </Button>
                        <Button type="button" variant="outline" onClick={() => setShowNewCompanyForm(false)}>
                          Cancelar
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              )}

              <div className="grid grid-cols-3 gap-4">
                {companies.map((company) => (
                  <div key={company.id} className="space-y-2">
                    <Card>
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div>
                            <h4 className="font-medium">{company.name}</h4>
                            <p className="text-sm text-muted-foreground">{company.email}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <button
                              className="text-sm underline text-foreground hover:text-foreground/80"
                              onClick={() => setShowPasswordReset(company.email)}
                            >
                              Cambiar clave
                            </button>
                            <button
                              className="p-1.5 rounded hover:bg-muted"
                              onClick={() => setEditingCompany(company)}
                            >
                              <Edit className="h-4 w-4 text-[hsl(var(--action-green))]" />
                            </button>
                            <button
                              className="p-1.5 rounded hover:bg-muted"
                              onClick={() => confirmDeleteCompany(company.id, company.name, company.email)}
                            >
                              <Trash2 className="h-4 w-4 text-[hsl(var(--action-red))]" />
                            </button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Edit Company Form - appears below the company card */}
                    {editingCompany && editingCompany.id === company.id && (
                      <Card className="ml-4 border-2">
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
                              <Button type="submit" variant="action-green">
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

                    {/* Password Reset Form - appears below the company card */}
                    {showPasswordReset === company.email && (
                      <Card className="ml-4 border-2">
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
                              <Button variant="action-yellow" onClick={() => handleResetPassword(showPasswordReset)}>
                                Crear/Cambiar Contraseña
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
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="projects" className="mt-6">
            <div className="space-y-6">
              <div className="flex justify-end">
                <Button 
                  variant="default" 
                  onClick={() => setShowNewProjectForm(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Crear proyecto
                </Button>
              </div>

              {showNewProjectForm && (
                <Card className="border-2">
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
                      <div className="flex gap-2">
                        <Button type="submit" variant="action-green">
                          <Plus className="mr-2 h-4 w-4" />
                          Crear Proyecto
                        </Button>
                        <Button type="button" variant="outline" onClick={() => setShowNewProjectForm(false)}>
                          Cancelar
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              )}

              <div className="grid grid-cols-2 gap-4">
                {projectsByCompany.map((company) => {
                  const isCompanyOpen = !!openCompanies[company.id]; // default to closed
                  
                  return (
                    <Card key={company.id} className="p-6">
                      {company.projects.length === 0 ? (
                        // Si no hay proyectos, solo mostrar el nombre sin collapsible
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-semibold">{company.name}</h3>
                          <span className="text-sm text-muted-foreground">
                            (0 proyectos)
                          </span>
                        </div>
                      ) : (
                        // Si hay proyectos, mostrar collapsible con flecha
                        <Collapsible 
                          open={isCompanyOpen}
                          onOpenChange={(open) => setOpenCompanies(prev => ({ ...prev, [company.id]: open }))}
                        >
                          <CollapsibleTrigger className="w-full">
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-2">
                                <h3 className="text-lg font-semibold">{company.name}</h3>
                                <span className="text-sm text-muted-foreground">
                                  ({company.projects.length} {company.projects.length === 1 ? 'proyecto' : 'proyectos'})
                                </span>
                              </div>
                              <ChevronDown 
                                className={`h-5 w-5 text-muted-foreground transition-transform ${
                                  isCompanyOpen ? 'rotate-180' : ''
                                }`}
                              />
                            </div>
                          </CollapsibleTrigger>
                          
                          <CollapsibleContent>
                            <div className="space-y-3">
                              {company.projects.map((project) => (
                                <Card key={project.id} className="p-4">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <h4 className="font-medium">{project.name}</h4>
                                      {project.description && (
                                        <p className="text-sm text-muted-foreground mt-1">{project.description}</p>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <button
                                        className="p-1.5 rounded hover:bg-muted"
                                        onClick={() => setEditingProject(project)}
                                      >
                                        <Edit className="h-4 w-4 text-[hsl(var(--action-green))]" />
                                      </button>
                                      <button
                                        className="p-1.5 rounded hover:bg-muted"
                                        onClick={() => confirmDeleteProject(project.id, project.name)}
                                      >
                                        <Trash2 className="h-4 w-4 text-[hsl(var(--action-red))]" />
                                      </button>
                                    </div>
                                  </div>

                                  {/* Edit Project Form - appears below the project card */}
                                  {editingProject && editingProject.id === project.id && (
                                    <Card className="mt-2 ml-4 border-2">
                                      <CardHeader>
                                        <CardTitle>Editar Proyecto</CardTitle>
                                      </CardHeader>
                                      <CardContent>
                                        <form onSubmit={handleUpdateProject} className="space-y-4">
                                          <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                              <Label htmlFor="editProjectName">Nombre del Proyecto</Label>
                                              <Input
                                                id="editProjectName"
                                                value={editingProject.name}
                                                onChange={(e) => setEditingProject(prev => prev ? ({ ...prev, name: e.target.value }) : null)}
                                                required
                                              />
                                            </div>
                                            <div className="space-y-2">
                                              <Label htmlFor="editProjectCompany">Empresa</Label>
                                              <Select 
                                                value={editingProject.company_id} 
                                                onValueChange={(value) => setEditingProject(prev => prev ? ({ ...prev, company_id: value }) : null)}
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
                                            <Label htmlFor="editProjectDescription">Descripción</Label>
                                            <Input
                                              id="editProjectDescription"
                                              value={editingProject.description || ''}
                                              onChange={(e) => setEditingProject(prev => prev ? ({ ...prev, description: e.target.value }) : null)}
                                            />
                                          </div>
                                          <div className="flex gap-2">
                                            <Button type="submit" variant="action-green">
                                              Actualizar Proyecto
                                            </Button>
                                            <Button type="button" variant="outline" onClick={() => setEditingProject(null)}>
                                              Cancelar
                                            </Button>
                                          </div>
                                        </form>
                                      </CardContent>
                                    </Card>
                                  )}
                                </Card>
                              ))}
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      )}
                    </Card>
                  )
                })}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="upload" className="mt-6">
            <Card className="max-w-[50%]">
              <CardHeader>
                <CardTitle>Subir Documento</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleFileUpload} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="project">Empresa → Proyecto</Label>
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
                            {project.companies?.name} → {project.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="type">Tipo de Documento</Label>
                    <Select 
                      value={uploadForm.document_type} 
                      onValueChange={(value: 'manual' | 'plano' | 'archivo' | 'normativa' | 'doc_oficial' | 'otro') => 
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
                        <SelectItem value="normativa">Normativa</SelectItem>
                        <SelectItem value="doc_oficial">Doc. oficial</SelectItem>
                        <SelectItem value="otro">Otro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="file">
                      Archivo
                    </Label>
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

                  <div className="space-y-2">
                    <Label htmlFor="document_name">Nombre del Documento/Apodo</Label>
                    <Input
                      id="document_name"
                      type="text"
                      value={uploadForm.document_name}
                      onChange={(e) => setUploadForm(prev => ({ 
                        ...prev, 
                        document_name: e.target.value 
                      }))}
                      placeholder="Nombre personalizado para el documento (opcional)"
                    />
                  </div>

                  <Button type="submit" disabled={uploadLoading || !uploadForm.file} variant="action-green">
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
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                {projectsByCompany.map((company) => {
                  const isCompanyOpen = !!openCompanies[company.id]; // default to closed
                  
                  return (
                    <Card key={company.id} className="p-6">
                      {company.projects.length === 0 ? (
                        // Si no hay proyectos, solo mostrar el nombre sin collapsible
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-semibold">{company.name}</h3>
                          <span className="text-sm text-muted-foreground">
                            (0 proyectos)
                          </span>
                        </div>
                      ) : (
                        // Si hay proyectos, mostrar collapsible con flecha
                        <Collapsible 
                          open={isCompanyOpen}
                          onOpenChange={(open) => setOpenCompanies(prev => ({ ...prev, [company.id]: open }))}
                        >
                          <CollapsibleTrigger className="w-full">
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-2">
                                <h3 className="text-lg font-semibold">{company.name}</h3>
                                <span className="text-sm text-muted-foreground">
                                  ({company.projects.length} {company.projects.length === 1 ? 'proyecto' : 'proyectos'})
                                </span>
                              </div>
                              <ChevronDown 
                                className={`h-5 w-5 text-muted-foreground transition-transform ${
                                  isCompanyOpen ? 'rotate-180' : ''
                                }`}
                              />
                            </div>
                          </CollapsibleTrigger>
                          
                          <CollapsibleContent>
                            <div className="space-y-3">
                              {company.projects.map((project) => {
                                const projectDocuments = documents.filter(doc => doc.project_id === project.id)
                                const isOpen = !!openProjects[project.id] // default to closed
                                
                                return (
                                  <Collapsible 
                                    key={project.id} 
                                    open={isOpen} 
                                    onOpenChange={(open) => setOpenProjects(prev => ({ ...prev, [project.id]: open }))}
                                  >
                                    <Card className="p-4">
                                      <CollapsibleTrigger className="w-full">
                                        <div className="flex items-center justify-between mb-3">
                                          <div className="text-left flex-1">
                                            <h4 className="font-medium">{project.name}</h4>
                                            {project.description && (
                                              <p className="text-sm text-muted-foreground mt-1">{project.description}</p>
                                            )}
                                          </div>
                                          <ChevronDown 
                                            className={`h-5 w-5 text-muted-foreground transition-transform ${
                                              isOpen ? 'rotate-180' : ''
                                            }`}
                                          />
                                        </div>
                                      </CollapsibleTrigger>
                                      
                                      <CollapsibleContent>
                                        <div>
                                          {projectDocuments.length === 0 ? (
                                            <p className="text-sm text-muted-foreground">No hay documentos en este proyecto</p>
                                          ) : (
                                            <div className="space-y-2">
                                              {projectDocuments.map((doc) => {
                                                const fileExtension = doc.original_file_name?.split('.').pop()?.toUpperCase() || 
                                                                    doc.file_path.split('.').pop()?.toUpperCase() || 'FILE'
                                                return (
                                                  <div key={doc.id} className="flex items-center justify-between p-2 border rounded">
                                                    <div className="flex-1">
                                                      <div className="flex items-center gap-2">
                                                        <FileText className="h-4 w-4 text-muted-foreground" />
                                                        <p className="font-medium text-sm">{doc.name}</p>
                                                      </div>
                                                      <div className="flex items-center gap-2 mt-2">
                                                        <Badge variant="secondary" className="text-xs">
                                                          {doc.document_type}
                                                        </Badge>
                                                        <Badge variant="outline" className="text-xs">
                                                          .{fileExtension}
                                                        </Badge>
                                                      </div>
                                                    </div>
                                                    <button
                                                      className="p-1.5 rounded hover:bg-muted"
                                                      onClick={() => confirmDeleteDocument(doc.id, doc.name, doc.file_path)}
                                                    >
                                                      <Trash2 className="h-4 w-4 text-[hsl(var(--action-red))]" />
                                                    </button>
                                                  </div>
                                                )
                                              })}
                                            </div>
                                          )}
                                        </div>
                                      </CollapsibleContent>
                                    </Card>
                                  </Collapsible>
                                )
                              })}
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      )}
                    </Card>
                  )
                })}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>
      
      <Footer />
    </div>
  )
}