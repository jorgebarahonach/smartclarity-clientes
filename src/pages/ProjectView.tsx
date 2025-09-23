import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Download, FileText, Image, File } from 'lucide-react'
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
  file_path: string
  file_type: string
  file_size: number
  document_type: 'manual' | 'plano' | 'archivo'
  created_at: string
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
      navigate('/login')
      return
    }

    loadProjectAndDocuments()
  }, [user, projectId, navigate])

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

      // Get documents for this project
      const { data: documentsData, error: documentsError } = await supabase
        .from('documents')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })

      if (documentsError) {
        console.error('Error loading documents:', documentsError)
        return
      }

      setDocuments(documentsData || [])
      setFilteredDocuments(documentsData || [])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async (document: Document) => {
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .download(document.file_path)

      if (error) {
        console.error('Error downloading file:', error)
        return
      }

      // Create download link
      const url = URL.createObjectURL(data)
      const a = window.document.createElement('a')
      a.href = url
      a.download = document.name
      window.document.body.appendChild(a)
      a.click()
      window.document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const filterDocuments = (type: 'manual' | 'plano' | 'archivo') => {
    const filtered = filteredDocuments.filter(doc => doc.document_type === type)
    return sortDocuments(filtered)
  }

  const sortDocuments = (docs: Document[]) => {
    return [...docs].sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      } else {
        return a.name.localeCompare(b.name)
      }
    })
  }

  const handleSortChange = (value: 'date' | 'name') => {
    setSortBy(value)
  }

  const DocumentList = ({ docs, type }: { docs: Document[], type: string }) => {
    if (docs.length === 0) {
      return (
        <div className="text-center py-8">
          <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">No hay {type.toLowerCase()} disponibles</p>
        </div>
      )
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {docs.map((doc) => {
          const IconComponent = getFileIcon(doc.file_type, doc.document_type)
          return (
            <Card key={doc.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <IconComponent className="h-8 w-8 text-primary" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">{doc.name}</h3>
                      <div className="flex gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {doc.file_type.toUpperCase()}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {formatFileSize(doc.file_size)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <Button 
                    variant="action-green"
                    size="sm" 
                    onClick={() => handleDownload(doc)}
                    className="shrink-0"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Descargar
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando proyecto...</p>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Proyecto no encontrado</p>
          <Button onClick={() => navigate('/dashboard')} className="mt-4">
            Volver al Dashboard
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header title="Portal de Clientes" variant="client" />
      
      <div className="container mx-auto px-4 py-2">
        <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
      </div>

      <main className="container mx-auto px-4 py-8 flex-1">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <h2 className="text-3xl font-bold">{project.name}</h2>
            <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
          </div>
          {project.description && (
            <p className="text-muted-foreground">{project.description}</p>
          )}
        </div>

        <div className="flex justify-end mb-6">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Ordenar por:</span>
            <Select value={sortBy} onValueChange={handleSortChange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Fecha</SelectItem>
                <SelectItem value="name">Nombre</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Tabs defaultValue="archivos" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="archivos">
              Archivos ({filterDocuments('archivo').length})
            </TabsTrigger>
            <TabsTrigger value="manuales">
              Manuales ({filterDocuments('manual').length})
            </TabsTrigger>
            <TabsTrigger value="planos">
              Planos ({filterDocuments('plano').length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="archivos" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Archivos del Proyecto</CardTitle>
                <CardDescription>
                  Documentos generales y archivos relacionados con el proyecto
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DocumentList docs={filterDocuments('archivo')} type="archivos" />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="manuales" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Manuales</CardTitle>
                <CardDescription>
                  Manuales de usuario, instalación y mantenimiento
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DocumentList docs={filterDocuments('manual')} type="manuales" />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="planos" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Planos</CardTitle>
                <CardDescription>
                  Planos técnicos, diagramas y esquemas del proyecto
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DocumentList docs={filterDocuments('plano')} type="planos" />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      
      <Footer />
    </div>
  )
}