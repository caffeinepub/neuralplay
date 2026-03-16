import { Toaster } from "@/components/ui/sonner";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import CustomerDisplayPage from "./pages/CustomerDisplayPage";
import POSDashboard from "./pages/POSDashboard";
import POSLoginPage from "./pages/POSLoginPage";

const rootRoute = createRootRoute({
  component: () => (
    <div className="min-h-dvh bg-background text-foreground">
      <Toaster position="top-center" />
      <Outlet />
    </div>
  ),
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: POSLoginPage,
});

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/dashboard",
  component: POSDashboard,
});

const customerDisplayRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/customer-display",
  component: CustomerDisplayPage,
});

const routeTree = rootRoute.addChildren([
  loginRoute,
  dashboardRoute,
  customerDisplayRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return <RouterProvider router={router} />;
}
