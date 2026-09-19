import { useEffect } from 'react';

declare const bootstrap: any;

export function useBootstrapTooltip(theme?: 'light' | 'dark', deps: any[] = []) {
  useEffect(() => {
    document.querySelectorAll('[data-bs-toggle="tooltip"]').forEach((el) => {
      // Destroy any existing instance
      const instance = bootstrap.Tooltip.getInstance(el);
      if (instance) instance.dispose();

      // Recreate the tooltip with custom class
      bootstrap.Tooltip.getOrCreateInstance(el, {
        customClass:
          theme === 'light'
            ? 'custom-tooltip-light'
            : theme === 'dark'
            ? 'custom-tooltip-dark'
            : undefined,
      });
    });
  }, [theme, ...deps]); // re-run when theme or other dependencies change
}
