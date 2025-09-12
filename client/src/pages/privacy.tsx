import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PrivacyPage() {
  return (
    <div className="container max-w-4xl mx-auto py-10 px-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">Privacy Policy</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-gray max-w-none">
          <div className="space-y-6">
            <section>
              <h2 className="text-xl font-semibold mb-3">Our Commitment to Privacy</h2>
              <p className="text-gray-600">
                STAK Sync is committed to protecting your privacy and ensuring you have control over your personal information.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">Seeded Profiles</h2>
              <p className="text-gray-600">
                We create seeded profiles from event registrations and do not activate or display them until you provide explicit consent.
                Your information remains private and anonymized until you choose to activate your account.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">Your Rights</h2>
              <p className="text-gray-600">
                You can opt out and request deletion at any time. We retain a minimal suppression record to honor your request and ensure 
                you are not contacted again. This suppression record contains only the hashed version of your email address.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">Data Protection</h2>
              <p className="text-gray-600">
                We employ industry-standard security measures to protect your data, including encryption for sensitive information 
                and secure communication protocols.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">Contact Us</h2>
              <p className="text-gray-600">
                If you have any questions about our privacy practices, please contact us at privacy@staksync.com.
              </p>
            </section>

            <div className="mt-8 pt-6 border-t">
              <p className="text-sm text-gray-500">
                Last updated: {new Date().toLocaleDateString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}