import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/components/auth/AuthProvider";
import { LoginModal } from "@/components/auth/LoginModal";
import { Dashboard } from "@/pages/Dashboard";
import { Machines } from "@/pages/Machines";
import { Panels } from "@/pages/Panels";
import { Serials } from "@/pages/Serials";
import { OrderDetail } from "@/pages/OrderDetail";
import NotFound from "@/pages/not-found";

// Set up API request interceptor to include auth token
queryClient.setDefaultOptions({
  queries: {
    queryFn: async ({ queryKey }) => {
      const token = localStorage.getItem('auth_token');
      const headers: Record<string, string> = {};
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const res = await fetch(queryKey.join("/") as string, {
        headers,
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 401) {
          localStorage.removeItem('auth_token');
          window.location.reload();
        }
        const text = (await res.text()) || res.statusText;
        throw new Error(`${res.status}: ${text}`);
      }
      
      return await res.json();
    },
  },
});

function Router() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <LoginModal />;
  }

  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/machines" component={Machines} />
      <Route path="/panels" component={Panels} />
      <Route path="/serials" component={Serials} />
      <Route path="/order/:orderId" component={OrderDetail} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Router />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
