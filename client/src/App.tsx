import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import HomeNew from "@/pages/home-new";
import Discover from "@/pages/discover";
import Matches from "@/pages/matches";
import Messages from "@/pages/messages";
import EventsNew from "@/pages/events-new";
import LiveDashboard from "@/pages/live-dashboard";
import Admin from "@/pages/admin";
import AdminUsers from "@/pages/admin-users";
import AdminUserProfile from "@/pages/admin-user-profile";
import AdminEvents from "@/pages/admin-events";
import AdminBilling from "@/pages/admin-billing";
import AdminSponsors from "@/pages/admin-sponsors";
import EventAttendeesPage from "@/pages/event-attendees";
import Profile from "@/pages/profile";
import ConnectRequest from "@/pages/connect-request";
import MatchAnalysis from "@/pages/match-analysis";
import Questionnaire from "@/pages/questionnaire";
import ProximityPage from "@/pages/proximity";
import LiveEvent from "@/pages/LiveEvent";
import EventPreparation from "@/pages/event-preparation";
import EventSignup from "@/pages/event-signup";
import Logout from "@/pages/logout";
import NotFound from "@/pages/not-found";
import Layout from "@/components/Layout";
import SignupLogin from "@/pages/SignupLogin";
import SignupPage from "@/pages/SignupPage";
import VerificationSuccess from "@/pages/VerificationSuccess";
import Interview from "@/pages/interview";
import TeaserPage from "@/pages/teaser";
import ActivationPage from "@/pages/activate";
import EventRecap from "@/pages/event-recap";

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
      <Route path="/teaser/:token" component={TeaserPage} />
      <Route path="/activate/:token" component={ActivationPage} />
      {!isAuthenticated ? (
        <Switch>
          <Route path="/" component={Landing} />
          <Route path="/signup" component={SignupPage} />
          <Route path="/login" component={SignupLogin} />
          <Route path="/verified" component={VerificationSuccess} />
          <Route component={Landing} />
        </Switch>
      ) : (
        <Layout>
          <Switch>
            <Route path="/" component={HomeNew} />
            <Route path="/discover" component={Discover} />
            <Route path="/matches" component={Matches} />
            <Route path="/messages" component={Messages} />
            <Route path="/events" component={EventsNew} />
            <Route path="/events/:eventId" component={EventSignup} />
            <Route path="/events/:eventId/prep" component={EventPreparation} />
            <Route path="/events/:eventId/recap" component={EventRecap} />
            <Route path="/events/:eventId/attendees" component={EventAttendeesPage} />
            <Route path="/events/live/:eventId" component={LiveEvent} />
            <Route path="/events/live/:eventId/preparation" component={EventPreparation} />
            <Route path="/live-dashboard" component={LiveDashboard} />
            <Route path="/admin" component={Admin} />
            <Route path="/admin/users" component={AdminUsers} />
            <Route path="/admin/user/:userId" component={AdminUserProfile} />
            <Route path="/admin/events" component={AdminEvents} />
            <Route path="/admin/billing" component={AdminBilling} />
            <Route path="/admin/sponsors" component={AdminSponsors} />
            <Route path="/profile" component={Profile} />
            <Route path="/profile/:userId" component={Profile} />
            <Route path="/connect-request" component={ConnectRequest} />
            <Route path="/match-analysis" component={MatchAnalysis} />
            <Route path="/notifications" component={() => <div className="p-8"><h1 className="text-2xl font-bold">Notifications</h1><p className="mt-4 text-gray-600">Notification center coming soon! For now, check the Messages and Matches tabs for updates.</p></div>} />
            <Route path="/proximity" component={ProximityPage} />
            <Route path="/questionnaire" component={Questionnaire} />
            <Route path="/interview" component={Interview} />
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
