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
import EventsNew from "@/pages/events-new";
import LiveDashboard from "@/pages/live-dashboard";
import Admin from "@/pages/admin";
import AdminUsers from "@/pages/admin-users";
import AdminEvents from "@/pages/admin-events";
import AdminBilling from "@/pages/admin-billing";
import Profile from "@/pages/profile";
import ProfileDetail from "@/pages/profile-detail";
import ConnectRequest from "@/pages/connect-request";
import MatchAnalysis from "@/pages/match-analysis";
import Questionnaire from "@/pages/questionnaire";
import Logout from "@/pages/logout";
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
      <Route path="/landing" component={Landing} />
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
            <Route path="/events" component={EventsNew} />
            <Route path="/live-dashboard" component={LiveDashboard} />
            <Route path="/admin" component={Admin} />
            <Route path="/admin/users" component={AdminUsers} />
            <Route path="/admin/events" component={AdminEvents} />
            <Route path="/admin/billing" component={AdminBilling} />
            <Route path="/profile" component={Profile} />
            <Route path="/profile/:userId" component={Profile} />
            <Route path="/profile-detail" component={ProfileDetail} />
            <Route path="/connect-request" component={ConnectRequest} />
            <Route path="/match-analysis" component={MatchAnalysis} />
            <Route path="/notifications" component={() => <div className="p-8"><h1 className="text-2xl font-bold">Notifications</h1><p className="mt-4 text-gray-600">Notification center coming soon! For now, check the Messages and Matches tabs for updates.</p></div>} />
            <Route path="/questionnaire" component={Questionnaire} />
            <Route path="/logout" component={Logout} />
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
