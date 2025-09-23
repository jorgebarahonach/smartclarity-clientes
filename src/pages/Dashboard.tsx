import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FolderOpen } from 'lucide-react'
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
}

export default function Dashboard() {
  const { user, signOut } = useAuth()
  const [company, setCompany] = useState<Company | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdateDate, setLastUpdateDate] = useState<string | null>(null)
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

      // Get last document update date for this company
      if (projectsData && projectsData.length > 0) {
        const projectIds = projectsData.map(p => p.id)
        const { data: documentsData } = await supabase
          .from('documents')
          .select('created_at')
          .in('project_id', projectIds)
          .order('created_at', { ascending: false })
          .limit(1)

        if (documentsData && documentsData.length > 0) {
          setLastUpdateDate(new Date(documentsData[0].created_at).toLocaleDateString('es-ES'))
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
          <Card className="text-center py-12">
            <CardContent>
              <FolderOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No hay proyectos disponibles</h3>
              <p className="text-muted-foreground">
                Contacte con el administrador para que le asignen proyectos.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <Card key={project.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{project.name}</CardTitle>
                    <Badge variant="secondary">Proyecto</Badge>
                  </div>
                  {project.description && (
                    <CardDescription>{project.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={() => navigate(`/project/${project.id}`)}
                    className="w-full"
                    variant="action-green"
                    size="sm"
                  >
                    <FolderOpen className="mr-2 h-4 w-4" />
                    Ver documentos
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}