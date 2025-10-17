import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Download, FileText, Image, File, Link2 } from 'lucide-react'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'

type Project = {
  id: string
  name: string
  description: string | null
  company_id: string
}

type Document = {
  id: string
  name: string
  original_file_name?: string
  file_path: string
  file_type: string
  file_size: number
  document_type: 'manual' | 'plano' | 'archivo' | 'otro'
  created_at: string
  is_url: boolean
  url?: string
  url_excerpt?: string
  url_published_date?: string
  url_source?: string
}

const getFileIcon = (fileType: string, documentType: string) => {
  if (documentType === 'plano') return Image
  if (fileType.includes('pdf') || documentType === 'manual') return FileText
  return File
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export default function ProjectView() {
  const { projectId } = useParams<{ projectId: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [project, setProject] = useState<Project | null>(null)
  const [documents, setDocuments] = useState<Document[]>([])
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState<'date' | 'name'>('date')

  useEffect(() => {
    if (!user || !projectId) {
      navigate('/')
      return
    }

    loadProjectAndDocuments()
  }, [user, projectId, navigate])

  useEffect(() => {
    // Apply sorting
    const sorted = [...documents].sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      } else {
        return a.name.localeCompare(b.name)
      }
    })
    setFilteredDocuments(sorted)
  }, [documents, sortBy])

  const loadProjectAndDocuments = async () => {
    try {
      // Get project
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single()

      if (projectError) {
        console.error('Error loading project:', projectError)
        navigate('/dashboard')
        return
      }

      setProject(projectData)

      // Get documents for this project via document_projects table
      const { data: docProjectsData, error: docProjectsError } = await supabase
        .from('document_projects')
        .select('document_id')
        .eq('project_id', projectId)

      if (docProjectsError) {
        console.error('Error loading document relationships:', docProjectsError)
        return
      }

      if (docProjectsData && docProjectsData.length > 0) {
        const documentIds = docProjectsData.map(dp => dp.document_id)
        
        const { data: documentsData, error: documentsError } = await supabase
          .from('documents')
          .select('*')
          .in('id', documentIds)
          .order('created_at', { ascending: false })

        if (documentsError) {
          console.error('Error loading documents:', documentsError)
          return
        }

        setDocuments(documentsData || [])
      } else {
        setDocuments([])
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async (doc: Document) => {
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .download(doc.file_path)

      if (error) throw error

      // Create download link
      const url = URL.createObjectURL(data)
      const a = window.document.createElement('a')
      a.href = url
      a.download = doc.name
      window.document.body.appendChild(a)
      a.click()
      window.document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading file:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando documentos...</p>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header variant="client" title="Portal de Clientes" />
        <div className="flex-1 flex items-center justify-center">
          <Card className="max-w-md w-full mx-4">
            <CardHeader className="text-center">
              <CardTitle>Proyecto No Encontrado</CardTitle>
              <CardDescription>
                El proyecto solicitado no existe o no tiene acceso a él.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button onClick={() => navigate('/dashboard')} variant="outline">
                Volver al Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header variant="client" title="Portal de Clientes" />
      
      <main className="container mx-auto px-4 py-8 flex-1">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/dashboard')}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
          
          <div className="flex items-center gap-2 mb-4">
            <h1 className="text-3xl font-bold">{project.name}</h1>
          </div>
          
          {project.description && (
            <p className="text-muted-foreground mb-4">{project.description}</p>
          )}
        </div>

        {/* Filters */}
        <div className="mb-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Ordenar:</span>
              <Select value={sortBy} onValueChange={(value: 'date' | 'name') => setSortBy(value)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Por fecha</SelectItem>
                  <SelectItem value="name">Por nombre</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {filteredDocuments.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No hay documentos disponibles</h3>
              <p className="text-muted-foreground">
                Los documentos aparecerán aquí cuando estén disponibles.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredDocuments.map((doc) => {
              const IconComponent = getFileIcon(doc.file_type, doc.document_type)
              return (
                <Card key={doc.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <IconComponent className="h-8 w-8 text-primary flex-shrink-0" />
                         <div className="min-w-0 flex-1">
                           <CardTitle className="text-sm font-medium leading-tight break-words">
                             {doc.name}
                           </CardTitle>
                           {doc.is_url ? (
                             <div className="mt-2 space-y-1">
                               <p className="text-xs text-muted-foreground line-clamp-2">
                                 🔗 {doc.url_excerpt || doc.url}
                               </p>
                               {doc.url_published_date && (
                                 <p className="text-xs text-muted-foreground">
                                   📅 {new Date(doc.url_published_date).toLocaleDateString('es-ES')}
                                 </p>
                               )}
                               {doc.url_source && (
                                 <p className="text-xs text-muted-foreground">
                                   📰 {doc.url_source}
                                 </p>
                               )}
                             </div>
                           ) : (
                             <p className="text-xs text-muted-foreground mt-1">
                               📎 {doc.original_file_name || doc.name}
                             </p>
                           )}
                         </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {doc.document_type}
                        </Badge>
                        {doc.is_url ? (
                          <Badge variant="outline" className="text-xs">
                            URL
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">
                            {formatFileSize(doc.file_size)}
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-xs text-muted-foreground">
                        {new Date(doc.created_at).toLocaleDateString('es-ES')}
                      </p>
                      
                      {doc.is_url ? (
                        <Button 
                          onClick={() => window.open(doc.url, '_blank')}
                          variant="action-green"
                          size="sm"
                          className="w-full"
                        >
                          <FileText className="mr-2 h-3 w-3" />
                          Abrir URL
                        </Button>
                      ) : (
                        <Button 
                          onClick={() => handleDownload(doc)}
                          variant="action-green"
                          size="sm"
                          className="w-full"
                        >
                          <Download className="mr-2 h-3 w-3" />
                          Descargar
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}