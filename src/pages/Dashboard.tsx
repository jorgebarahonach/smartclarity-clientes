import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { FolderOpen, FileText, ChevronDown, Download } from 'lucide-react'
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
  is_default?: boolean
}

type Document = {
  id: string
  name: string
  document_type: string
  file_path: string
  original_file_name: string | null
  project_id: string
  created_at: string
  is_url: boolean
  url?: string
  url_excerpt?: string
  url_publication_date?: string
  url_source?: string
}

export default function Dashboard() {
  const { user, signOut } = useAuth()
  const [company, setCompany] = useState<Company | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdateDate, setLastUpdateDate] = useState<string | null>(null)
  const [openProjects, setOpenProjects] = useState<Record<string, boolean>>({})
  const [companyOpen, setCompanyOpen] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    if (!user) {
      navigate('/')
      return
    }

    loadCompanyAndProjects()
  }, [user, navigate])

  const loadCompanyAndProjects = async () => {
    try {
      // Get company by user email
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .select('*')
        .eq('email', user?.email)
        .single()

      if (companyError) {
        console.error('Error loading company:', companyError)
        return
      }

      setCompany(companyData)

      // If no company found, nothing else to load
      if (!companyData) {
        setProjects([])
        return
      }

      // Get projects for this company
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .eq('company_id', companyData.id)
        .order('created_at', { ascending: false })

      if (projectsError) {
        console.error('Error loading projects:', projectsError)
        return
      }

      setProjects(projectsData || [])

      // Get all documents for these projects via document_projects
      if (projectsData && projectsData.length > 0) {
        const projectIds = projectsData.map(p => p.id)
        
        const { data: docProjectsData, error: docProjectsError } = await supabase
          .from('document_projects')
          .select('document_id, project_id')
          .in('project_id', projectIds)

        if (docProjectsError) {
          console.error('Error loading document relationships:', docProjectsError)
        } else if (docProjectsData && docProjectsData.length > 0) {
          const documentIds = [...new Set(docProjectsData.map(dp => dp.document_id))]
          
          const { data: documentsData, error: documentsError } = await supabase
            .from('documents')
            .select('*')
            .in('id', documentIds)
            .order('created_at', { ascending: false })

          if (documentsError) {
            console.error('Error loading documents:', documentsError)
          } else {
            // Map documents to include project_id for filtering
            const docsWithProjects = documentsData?.map(doc => {
              const projectRel = docProjectsData.find(dp => dp.document_id === doc.id)
              return {
                ...doc,
                project_id: projectRel?.project_id || ''
              }
            }) || []
            
            setDocuments(docsWithProjects)
            
            // Get last document update date
            if (documentsData && documentsData.length > 0) {
              setLastUpdateDate(new Date(documentsData[0].created_at).toLocaleDateString('es-ES'))
            }
          }
        }
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando proyectos...</p>
        </div>
      </div>
    )
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header variant="client" title="Portal de Clientes" />
        <div className="flex-1 flex items-center justify-center">
          <Card className="max-w-md w-full mx-4">
            <CardHeader className="text-center">
              <CardTitle>Acceso No Autorizado</CardTitle>
              <CardDescription>
                No se encontró una empresa asociada con su cuenta.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button onClick={() => navigate('/')} variant="outline">
                Volver al Inicio
              </Button>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    )
  }

  const handleDownload = async (doc: Document) => {
    if (doc.is_url && doc.url) {
      window.open(doc.url, '_blank')
      return
    }

    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .download(doc.file_path)

      if (error) throw error

      const url = URL.createObjectURL(data)
      const a = document.createElement('a')
      a.href = url
      a.download = doc.original_file_name || doc.name
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading file:', error)
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header variant="client" title="Portal de Clientes" />
      
      <main className="container mx-auto px-4 py-8 flex-1">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Bienvenido, {company.name}</h1>
          <p className="text-muted-foreground mb-4">
            Acceda a sus proyectos y documentos desde este panel de control.
          </p>
          {lastUpdateDate && (
            <p className="text-sm text-muted-foreground">
              Última actualización: {lastUpdateDate}
            </p>
          )}
        </div>

        {projects.length === 0 ? (
          <Card className="p-6">
            <p className="text-muted-foreground">No hay proyectos disponibles</p>
          </Card>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {projects.map((project) => {
              const projectDocuments = documents.filter(doc => doc.project_id === project.id)
              const isOpen = !!openProjects[project.id]
              
              return (
                <Collapsible 
                  key={project.id} 
                  open={isOpen} 
                  onOpenChange={(open) => setOpenProjects(prev => ({ ...prev, [project.id]: open }))}
                >
                  <Card className={`p-4 ${project.is_default ? 'bg-primary/5' : ''}`}>
                    <CollapsibleTrigger className="w-full">
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-left flex-1">
                          <h4 className="font-medium">
                            {project.name}
                            {project.is_default && (
                              <span className="ml-2 text-xs text-primary">(Estratégico)</span>
                            )}
                          </h4>
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
                              const fileExtension = doc.is_url ? 'URL' : (
                                doc.original_file_name?.split('.').pop()?.toUpperCase() || 
                                doc.file_path.split('.').pop()?.toUpperCase() || 'FILE'
                              )
                              return (
                                <div key={doc.id} className="flex items-center justify-between p-2 border rounded">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                      <p className="font-medium text-sm truncate">{doc.name}</p>
                                    </div>
                                    {doc.is_url && doc.url_excerpt && (
                                      <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                                        {doc.url_excerpt}
                                      </p>
                                    )}
                                    <div className="flex items-center gap-2 mt-2">
                                      <Badge variant="secondary" className="text-xs">
                                        {doc.document_type}
                                      </Badge>
                                      <Badge variant="outline" className="text-xs">
                                        {fileExtension}
                                      </Badge>
                                    </div>
                                  </div>
                                  <Button
                                    variant="action-green"
                                    size="sm"
                                    onClick={() => handleDownload(doc)}
                                    className="flex-shrink-0"
                                  >
                                    <Download className="h-4 w-4" />
                                  </Button>
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
        )}
      </main>

      <Footer />
    </div>
  )
}