import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LogOut, FolderOpen, Building2 } from 'lucide-react'

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
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Building2 className="h-6 w-6" />
            <h1 className="text-xl font-semibold">Portal de Clientes</h1>
          </div>
          <Button variant="outline" onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Cerrar Sesión
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Bienvenido, {company?.name}</h2>
          <p className="text-muted-foreground">Acceda a sus proyectos y documentos</p>
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
                  <Button className="w-full">
                    Ver Documentos
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}