import { Toaster as Sonner, type ToasterProps } from "sonner";

import { useTheme } from "#/components/theme-provider";

function Toaster(props: ToasterProps) {
  const { theme } = useTheme();

  return (
    <Sonner
      theme={theme}
      position="bottom-center"
      className="toaster group"
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
        } as React.CSSProperties
      }
      toastOptions={{ className: "font-sans" }}
      {...props}
    />
  );
}

export { Toaster };
