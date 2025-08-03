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
              Professional Networking <span className="text-stak-copper">Signal</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-stak-light-gray leading-relaxed">
              Ecosystems are more valuable than products. Connect with the right people at the right time through intelligent matchmaking within the STAK ecosystem.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="bg-stak-copper hover:bg-stak-dark-copper text-stak-black font-semibold px-8 py-4">
                <a href="/api/login">Join the Network</a>
              </Button>
              <Button variant="outline" size="lg" className="border-2 border-stak-copper text-stak-copper hover:bg-stak-copper hover:text-stak-black px-8 py-4">
                Learn More
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
              Intelligent Ecosystem Networking
            </h2>
            <p className="text-xl text-stak-light-gray max-w-3xl mx-auto">
              Built for the STAK ecosystem, our platform weaves individual connections into powerful networks that drive innovation and growth.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="bg-stak-black border border-stak-gray text-center hover:border-stak-copper transition-colors">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-stak-copper/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Brain className="w-8 h-8 text-stak-copper" />
                </div>
                <h3 className="text-xl font-semibold text-stak-white mb-2">
                  AI Signal Matching
                </h3>
                <p className="text-stak-light-gray">
                  Intelligent algorithms identify and strengthen connections within the ecosystem for maximum value creation.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-stak-black border border-stak-gray text-center hover:border-stak-copper transition-colors">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-stak-copper/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-8 h-8 text-stak-copper" />
                </div>
                <h3 className="text-xl font-semibold text-stak-white mb-2">
                  Secure Communication
                </h3>
                <p className="text-stak-light-gray">
                  Enterprise-grade messaging platform designed for high-value business relationships and deal flow.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-stak-black border border-stak-gray text-center hover:border-stak-copper transition-colors">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-stak-copper/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-8 h-8 text-stak-copper" />
                </div>
                <h3 className="text-xl font-semibold text-stak-white mb-2">
                  1900 Broadway Meetings
                </h3>
                <p className="text-stak-light-gray">
                  Schedule high-impact meetings in premium spaces with intelligent technology and luxury amenities.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-stak-black border border-stak-gray text-center hover:border-stak-copper transition-colors">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-stak-copper/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-stak-copper" />
                </div>
                <h3 className="text-xl font-semibold text-stak-white mb-2">
                  STAK Ecosystem
                </h3>
                <p className="text-stak-light-gray">
                  Exclusive access to STAK's curated network of investors, innovators, and ecosystem partners.
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
            Ready to Join the Ecosystem?
          </h2>
          <p className="text-xl mb-8 text-stak-light-gray">
            Connect with STAK's network of innovators, investors, and industry leaders building the future.
          </p>
          <Button asChild size="lg" className="bg-stak-copper hover:bg-stak-dark-copper text-stak-black font-semibold px-8 py-4">
            <a href="/api/login">Request Access</a>
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
                Professional networking platform built for the STAK ecosystem, connecting innovators and investors to build valuable, high-powered networks.
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
                <li><a href="#" className="hover:text-stak-copper transition-colors">AI Signal Matching</a></li>
                <li><a href="#" className="hover:text-stak-copper transition-colors">Secure Messaging</a></li>
                <li><a href="#" className="hover:text-stak-copper transition-colors">Meeting Spaces</a></li>
                <li><a href="#" className="hover:text-stak-copper transition-colors">Network Analytics</a></li>
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
            <p>&copy; 2024 STAK Signal. All rights reserved. Ecosystems are more valuable than products.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
