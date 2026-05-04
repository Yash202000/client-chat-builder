import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="space-y-3">
    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h2>
    <div className="text-gray-700 dark:text-gray-300 space-y-2 leading-relaxed">{children}</div>
  </section>
);

const TermsOfService = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 space-y-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Terms of Service</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Last updated: May 3, 2026</p>
          </div>

          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
            Please read these Terms of Service ("Terms") carefully before using the HeyGenAlly platform
            operated by HeyGenAlly Inc. ("we", "us", or "our"). By accessing or using the Service, you
            agree to be bound by these Terms.
          </p>

          <Section title="1. Acceptance of Terms">
            <p>
              By creating an account or using the Service, you represent that you are at least 18 years old,
              have the authority to enter into this agreement on behalf of yourself or your organisation,
              and agree to these Terms and our Privacy Policy.
            </p>
          </Section>

          <Section title="2. Description of Service">
            <p>
              HeyGenAlly provides a conversational AI platform including an AI agent builder, omnichannel
              inbox, CRM, marketing automation, voice center, and team collaboration tools
              ("Service"). Features and availability may change over time.
            </p>
          </Section>

          <Section title="3. Account Registration">
            <p>
              You must provide accurate and complete registration information. You are responsible for
              maintaining the confidentiality of your credentials and for all activity under your account.
              Notify us immediately at security@heygenally.com of any unauthorised use.
            </p>
          </Section>

          <Section title="4. Acceptable Use">
            <p>You agree not to use the Service to:</p>
            <ul className="list-disc ml-6 space-y-1">
              <li>Violate any applicable law or regulation</li>
              <li>Send spam, unsolicited messages, or harvest contact data without consent</li>
              <li>Upload malicious code, viruses, or any software intended to damage systems</li>
              <li>Infringe any intellectual property rights of third parties</li>
              <li>Impersonate any person or entity</li>
              <li>Attempt to gain unauthorised access to our systems or other users' accounts</li>
              <li>Use the Service to train competing AI models without our written permission</li>
            </ul>
          </Section>

          <Section title="5. Data & Privacy">
            <p>
              Your use of the Service is also governed by our{" "}
              <a href="/privacy-policy" className="text-violet-600 dark:text-violet-400 hover:underline">Privacy Policy</a>.
              You retain ownership of all data you input into the Service. By using the Service, you grant us
              a limited licence to process that data solely to provide the Service to you.
            </p>
          </Section>

          <Section title="6. Intellectual Property">
            <p>
              The Service, including all software, design, trademarks, and content created by us, is owned
              by HeyGenAlly Inc. and protected by applicable intellectual property laws. You may not copy,
              modify, or distribute any part of the Service without our prior written consent.
            </p>
          </Section>

          <Section title="7. Subscription & Billing">
            <p>
              Certain features require a paid subscription. Subscription fees are billed in advance on a
              monthly or annual basis and are non-refundable except as required by law. We reserve the right
              to change pricing with 30 days' notice.
            </p>
          </Section>

          <Section title="8. Uptime & Service Level">
            <p>
              We target 99.9% monthly uptime for the core platform. Scheduled maintenance will be announced
              at least 24 hours in advance where possible. We are not liable for downtime caused by factors
              outside our reasonable control.
            </p>
          </Section>

          <Section title="9. Termination">
            <p>
              Either party may terminate these Terms at any time. We may suspend or terminate your access
              immediately if you breach these Terms. Upon termination, you may request a copy of your data
              within 30 days before it is deleted in accordance with our retention policy.
            </p>
          </Section>

          <Section title="10. Limitation of Liability">
            <p>
              To the maximum extent permitted by law, HeyGenAlly Inc. shall not be liable for any indirect,
              incidental, special, consequential, or punitive damages. Our total liability to you for all
              claims shall not exceed the amount you paid us in the 12 months preceding the claim.
            </p>
          </Section>

          <Section title="11. Indemnification">
            <p>
              You agree to indemnify and hold harmless HeyGenAlly Inc. and its officers, directors,
              employees, and agents from any claims, damages, or expenses arising from your use of the
              Service or violation of these Terms.
            </p>
          </Section>

          <Section title="12. Governing Law">
            <p>
              These Terms are governed by the laws of the State of Delaware, USA, without regard to conflict
              of law principles. Any disputes shall be resolved exclusively in the courts of Delaware.
            </p>
          </Section>

          <Section title="13. Changes to Terms">
            <p>
              We may update these Terms at any time. We will notify you by email or in-app notification at
              least 14 days before material changes take effect. Continued use after the effective date
              constitutes acceptance of the updated Terms.
            </p>
          </Section>

          <Section title="14. Contact Us">
            <p>
              For questions about these Terms, contact us at{" "}
              <a href="mailto:legal@heygenally.com" className="text-violet-600 dark:text-violet-400 hover:underline">
                legal@heygenally.com
              </a>.
            </p>
          </Section>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
