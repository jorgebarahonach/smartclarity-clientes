import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import smartClarityLogoBlack from '@/assets/smartclarity-logo-black.png'

export function Footer() {
  const { isAdmin } = useAuth()
  
  const mailtoLink = `mailto:jaime.lopez@smartclarity.com?subject=${encodeURIComponent('No puedo acceder a mis documentos')}`

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
          
          {!isAdmin && (
            <div className="text-right">
              <Button 
                variant="outline" 
                size="sm"
                className="h-8 bg-gray-500 border-gray-500 text-white hover:bg-white hover:text-gray-500"
                asChild
              >
                <a href={mailtoLink}>
                  No puedo acceder a mis documentos
                </a>
              </Button>
            </div>
          )}
        </div>
      </div>
    </footer>
  )
}