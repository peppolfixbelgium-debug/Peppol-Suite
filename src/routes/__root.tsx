import { Outlet, createRootRoute } from "@tanstack/react-router";
import { Shell } from "@/components/shell";
import { useAuth } from "@/lib/auth/local";
import { useEffect } from "react";

export const Route = createRootRoute({ component: Root });

function Root() {
  const hydrate = useAuth((s) => s.hydrate);
  useEffect(() => {
    void hydrate();
  }, [hydrate]);
  return <Shell><Outlet /></Shell>;
}
