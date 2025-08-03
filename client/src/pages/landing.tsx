import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Users, MessageSquare, Calendar, Brain } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-soft-white">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-playfair font-bold text-navy">ConnectAI</h1>
            <Button asChild className="bg-navy hover:bg-blue-800">
              <a href="/api/login">Sign In</a>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-br from-navy to-blue-900 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="w-full h-full bg-gradient-to-br from-navy to-blue-900" />
        </div>
        <div className="relative max-w-7xl mx-auto px-6">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-playfair font-bold mb-6 leading-tight">
              AI-Powered Professional <span className="text-gold">Networking</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-gray-200 leading-relaxed">
              Connect with venture capitalists, founders, and industry leaders through intelligent matchmaking designed for meaningful professional relationships.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="bg-gold hover:bg-yellow-600 text-navy font-semibold px-8 py-4">
                <a href="/api/login">Start Networking</a>
              </Button>
              <Button variant="outline" size="lg" className="border-2 border-white text-white hover:bg-white hover:text-navy px-8 py-4">
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-playfair font-bold text-navy mb-4">
              Intelligent Professional Networking
            </h2>
            <p className="text-xl text-charcoal max-w-3xl mx-auto">
              Our AI-powered platform connects you with the right people at the right time, making every conversation count.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="luxury-card text-center">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-light-blue rounded-full flex items-center justify-center mx-auto mb-4">
                  <Brain className="w-8 h-8 text-navy" />
                </div>
                <h3 className="text-xl font-playfair font-semibold text-navy mb-2">
                  AI Matching
                </h3>
                <p className="text-gray-600">
                  Smart algorithms analyze your profile and goals to find perfect professional matches.
                </p>
              </CardContent>
            </Card>

            <Card className="luxury-card text-center">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-light-blue rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-8 h-8 text-navy" />
                </div>
                <h3 className="text-xl font-playfair font-semibold text-navy mb-2">
                  Secure Messaging
                </h3>
                <p className="text-gray-600">
                  Professional messaging platform designed for meaningful business conversations.
                </p>
              </CardContent>
            </Card>

            <Card className="luxury-card text-center">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-light-blue rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-8 h-8 text-navy" />
                </div>
                <h3 className="text-xl font-playfair font-semibold text-navy mb-2">
                  Meetup Scheduling
                </h3>
                <p className="text-gray-600">
                  Coordinate in-person meetings at events and private clubs with ease.
                </p>
              </CardContent>
            </Card>

            <Card className="luxury-card text-center">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-light-blue rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-navy" />
                </div>
                <h3 className="text-xl font-playfair font-semibold text-navy mb-2">
                  Premium Network
                </h3>
                <p className="text-gray-600">
                  Connect with verified VCs, founders, and industry professionals.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-navy text-white">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-playfair font-bold mb-4">
            Ready to Transform Your Network?
          </h2>
          <p className="text-xl mb-8 text-gray-200">
            Join thousands of professionals already making meaningful connections.
          </p>
          <Button asChild size="lg" className="bg-gold hover:bg-yellow-600 text-navy font-semibold px-8 py-4">
            <a href="/api/login">Get Started Today</a>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-navy text-white py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-2xl font-playfair font-bold text-gold mb-4">ConnectAI</h3>
              <p className="text-gray-300 leading-relaxed">
                AI-powered professional networking platform connecting venture capitalists, founders, and industry leaders for meaningful business relationships.
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Platform</h4>
              <ul className="space-y-2 text-gray-300">
                <li><a href="#" className="hover:text-gold transition-colors">AI Matching</a></li>
                <li><a href="#" className="hover:text-gold transition-colors">Messaging</a></li>
                <li><a href="#" className="hover:text-gold transition-colors">Event Networking</a></li>
                <li><a href="#" className="hover:text-gold transition-colors">Private Clubs</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-gray-300">
                <li><a href="#" className="hover:text-gold transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-gold transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-gold transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-gold transition-colors">Safety Guidelines</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Connect</h4>
              <ul className="space-y-2 text-gray-300">
                <li><a href="#" className="hover:text-gold transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-gold transition-colors">LinkedIn</a></li>
                <li><a href="#" className="hover:text-gold transition-colors">Twitter</a></li>
                <li><a href="#" className="hover:text-gold transition-colors">Blog</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-600 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2024 ConnectAI. All rights reserved. Professional networking redefined.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
