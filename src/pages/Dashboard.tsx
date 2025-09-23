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
      navigate('/login')
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

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header 
        title="Portal de Clientes" 
        variant="client" 
        onSignOut={handleSignOut} 
      />

      <main className="container mx-auto px-4 py-8 flex-1">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Bienvenido, {company?.name}</h2>
          <p className="text-muted-foreground">Acceda a sus proyectos y documentos</p>
          {lastUpdateDate && (
            <p className="text-sm text-muted-foreground mt-2">
              Última actualización: {lastUpdateDate}
            </p>
          )}
        </div>

        {projects.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FolderOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No hay proyectos disponibles</h3>
              <p className="text-muted-foreground">
                Contacte a su administrador para que le asigne proyectos.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <Card 
                key={project.id} 
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => navigate(`/project/${project.id}`)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{project.name}</CardTitle>
                      {project.description && (
                        <CardDescription className="mt-2">
                          {project.description}
                        </CardDescription>
                      )}
                    </div>
                    <Badge variant="secondary">
                      <FolderOpen className="mr-1 h-3 w-3" />
                      Proyecto
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button variant="action-green" size="sm" className="w-full">
                    Ver Documentos
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