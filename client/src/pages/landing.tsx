import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Users, MessageSquare, Calendar, Brain } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-stak-black">
      {/* Header */}
      <header className="bg-stak-black border-b border-stak-gray">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img src="/api/logo" alt="STAK" className="h-8 w-8" />
              <h1 className="text-2xl font-bold text-stak-white">STAK Signal</h1>
            </div>
            <Button asChild className="bg-stak-copper hover:bg-stak-dark-copper text-stak-black font-medium">
              <a href="/api/login">Sign In</a>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 bg-stak-black text-stak-white overflow-hidden">
        <div className="absolute inset-0">
          <div className="w-full h-full bg-gradient-to-br from-stak-black via-stak-gray to-stak-black opacity-80" />
        </div>
        <div className="relative max-w-7xl mx-auto px-6">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              Find <span className="text-stak-copper">Signal</span>, Cut the Noise
            </h1>
            <p className="text-lg md:text-xl mb-4 text-stak-copper font-medium">
              An AI-powered networking and matchmaking system built to unlock the full power of relationships—before, during, and after every STAK event.
            </p>
            <p className="text-xl md:text-2xl mb-8 text-stak-light-gray leading-relaxed">
              Your STAK membership opens doors to extraordinary connections. We help you weave stronger interpersonal bonds with fellow innovators, investors, and visionaries who share your ambition.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="bg-stak-copper hover:bg-stak-dark-copper text-stak-black font-semibold px-8 py-4">
                <a href="/api/login">Access Your Network</a>
              </Button>
              <Button variant="outline" size="lg" className="border-2 border-stak-copper text-stak-copper hover:bg-stak-copper hover:text-stak-black px-8 py-4">
                Discover STAK
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-stak-gray">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-stak-white mb-4">
              Maximize Your Membership Value
            </h2>
            <p className="text-xl text-stak-light-gray max-w-3xl mx-auto">
              Your prestigious STAK membership connects you to an exclusive community. We amplify these relationships, helping you forge deeper bonds that create lasting value and meaningful impact.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="bg-stak-black border border-stak-gray text-center hover:border-stak-copper transition-colors">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-stak-copper/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Brain className="w-8 h-8 text-stak-copper" />
                </div>
                <h3 className="text-xl font-semibold text-stak-white mb-2">
                  Smart Introductions
                </h3>
                <p className="text-stak-light-gray">
                  Discover members who complement your vision and goals. Our intelligent matching helps you find your next co-founder, investor, or strategic partner.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-stak-black border border-stak-gray text-center hover:border-stak-copper transition-colors">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-stak-copper/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-8 h-8 text-stak-copper" />
                </div>
                <h3 className="text-xl font-semibold text-stak-white mb-2">
                  Meaningful Conversations
                </h3>
                <p className="text-stak-light-gray">
                  Connect directly with fellow members in a trusted environment. Share ideas, explore collaborations, and build relationships that matter.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-stak-black border border-stak-gray text-center hover:border-stak-copper transition-colors">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-stak-copper/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-8 h-8 text-stak-copper" />
                </div>
                <h3 className="text-xl font-semibold text-stak-white mb-2">
                  Curated Experiences
                </h3>
                <p className="text-stak-light-gray">
                  Meet in person at 1900 Broadway and exclusive STAK events. Transform digital connections into lasting partnerships in inspiring spaces.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-stak-black border border-stak-gray text-center hover:border-stak-copper transition-colors">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-stak-copper/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-stak-copper" />
                </div>
                <h3 className="text-xl font-semibold text-stak-white mb-2">
                  Elite Community
                </h3>
                <p className="text-stak-light-gray">
                  Join a carefully curated group of entrepreneurs, investors, and thought leaders who are shaping the future across industries.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-stak-black text-stak-white">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold mb-4">
            Unlock Your Network's Potential
          </h2>
          <p className="text-xl mb-8 text-stak-light-gray">
            Your membership is your key to extraordinary connections. Let us help you discover the relationships that will define your next chapter.
          </p>
          <Button asChild size="lg" className="bg-stak-copper hover:bg-stak-dark-copper text-stak-black font-semibold px-8 py-4">
            <a href="/api/login">Activate Signal</a>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-stak-black border-t border-stak-gray text-stak-white py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-2xl font-bold text-stak-copper mb-4">STAK Signal</h3>
              <p className="text-stak-light-gray leading-relaxed">
                An exclusive platform for STAK members to discover meaningful connections, forge stronger relationships, and unlock the full potential of our prestigious community.
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4 text-stak-copper">Ecosystem</h4>
              <ul className="space-y-2 text-stak-light-gray">
                <li><a href="https://stakventures.com" className="hover:text-stak-copper transition-colors">STAK Ventures</a></li>
                <li><a href="https://live1900.com" className="hover:text-stak-copper transition-colors">1900 Broadway</a></li>
                <li><a href="#" className="hover:text-stak-copper transition-colors">STAK Space</a></li>
                <li><a href="#" className="hover:text-stak-copper transition-colors">Tech Solutions</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4 text-stak-copper">Platform</h4>
              <ul className="space-y-2 text-stak-light-gray">
                <li><a href="#" className="hover:text-stak-copper transition-colors">Smart Introductions</a></li>
                <li><a href="#" className="hover:text-stak-copper transition-colors">Member Conversations</a></li>
                <li><a href="#" className="hover:text-stak-copper transition-colors">Exclusive Events</a></li>
                <li><a href="#" className="hover:text-stak-copper transition-colors">Relationship Insights</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4 text-stak-copper">Support</h4>
              <ul className="space-y-2 text-stak-light-gray">
                <li><a href="#" className="hover:text-stak-copper transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-stak-copper transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-stak-copper transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-stak-copper transition-colors">System Status</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-stak-gray mt-12 pt-8 text-center text-stak-light-gray">
            <p>&copy; 2024 STAK Signal. All rights reserved. Where meaningful connections create lasting impact.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
