import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import Discover from "@/pages/discover";
import Matches from "@/pages/matches";
import Messages from "@/pages/messages";
import Events from "@/pages/events";
import LiveDashboard from "@/pages/live-dashboard";
import Admin from "@/pages/admin";
import AdminEvents from "@/pages/admin-events";
import Profile from "@/pages/profile";
import Questionnaire from "@/pages/questionnaire";
import NotFound from "@/pages/not-found";
import Layout from "@/components/Layout";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#141414] flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <Switch>
      {!isAuthenticated ? (
        <Switch>
          <Route path="/" component={Landing} />
          <Route component={Landing} />
        </Switch>
      ) : (
        <Layout>
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/discover" component={Discover} />
            <Route path="/matches" component={Matches} />
            <Route path="/messages" component={Messages} />
            <Route path="/events" component={Events} />
            <Route path="/live-dashboard" component={LiveDashboard} />
            <Route path="/admin" component={Admin} />
            <Route path="/admin/events" component={AdminEvents} />
            <Route path="/profile" component={Profile} />
            <Route path="/questionnaire" component={Questionnaire} />
            <Route component={NotFound} />
          </Switch>
        </Layout>
      )}
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
