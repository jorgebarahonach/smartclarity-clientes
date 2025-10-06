import { useToast } from "@/hooks/use-toast";
import { Toast, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from "@/components/ui/toast";
import { CheckCircle2, AlertCircle, AlertTriangle } from "lucide-react";

export function Toaster() {
  const { toasts } = useToast();

  const getIcon = (variant?: string) => {
    const iconProps = { className: "h-12 w-12 mb-2" };
    
    switch (variant) {
      case 'success':
        return <CheckCircle2 {...iconProps} className="h-12 w-12 mb-2 text-action-green" />;
      case 'warning':
        return <AlertTriangle {...iconProps} className="h-12 w-12 mb-2 text-action-yellow" />;
      case 'destructive':
        return <AlertCircle {...iconProps} className="h-12 w-12 mb-2 text-action-red" />;
      default:
        return null;
    }
  };

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        return (
          <Toast key={id} variant={variant} {...props}>
            {getIcon(variant)}
            <div className="text-center space-y-2">
              {title && <ToastTitle className="text-center">{title}</ToastTitle>}
              {description && <ToastDescription className="text-center">{description}</ToastDescription>}
            </div>
            {action}
            <ToastClose />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}
