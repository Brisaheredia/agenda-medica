import { useCallback, useEffect, useState } from "react";

function rutaActual() {
  return window.location.pathname.replace(/\/$/, "") || "/";
}

export function usePathname() {
  const [pathname, setPathname] = useState(rutaActual);

  useEffect(() => {
    const actualizar = () => setPathname(rutaActual());
    window.addEventListener("popstate", actualizar);
    return () => window.removeEventListener("popstate", actualizar);
  }, []);

  const navigate = useCallback((to: string) => {
    const url = new URL(to, window.location.href);
    if (url.origin !== window.location.origin) return;
    window.history.pushState(null, "", url);
    setPathname(rutaActual());
  }, []);

  return { pathname, navigate };
}
