import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="top-right"
      toastOptions={{
        classNames: {
          toast: "group toast group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          success: "group-[.toaster]:bg-[hsl(var(--toast-success-bg))] group-[.toaster]:text-[hsl(var(--toast-success-fg))] border-none",
          error: "group-[.toaster]:bg-[hsl(var(--toast-error-bg))] group-[.toaster]:text-[hsl(var(--toast-error-fg))] border-none",
          warning: "group-[.toaster]:bg-[hsl(var(--toast-warning-bg))] group-[.toaster]:text-[hsl(var(--toast-warning-fg))] border-none",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
