import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export const PrivacyPolicy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
            Privacy Policy
          </h1>

          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Last updated: January 2026
          </p>

          <div className="space-y-6 text-gray-700 dark:text-gray-300">
            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                1. Information We Collect
              </h2>
              <p>
                AgentConnect collects information necessary to provide our conversational AI services, including:
              </p>
              <ul className="list-disc ml-6 mt-2 space-y-1">
                <li>Messages sent through connected platforms (Instagram, WhatsApp, Messenger, etc.)</li>
                <li>Contact information provided through messaging platforms</li>
                <li>Usage data and interaction logs</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                2. How We Use Your Information
              </h2>
              <p>
                We use collected information to:
              </p>
              <ul className="list-disc ml-6 mt-2 space-y-1">
                <li>Provide automated responses and customer support</li>
                <li>Improve our AI and workflow systems</li>
                <li>Analyze usage patterns to enhance our services</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                3. Data Storage and Security
              </h2>
              <p>
                We implement appropriate security measures to protect your data. All credentials
                and sensitive information are encrypted at rest and in transit.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                4. Third-Party Services
              </h2>
              <p>
                AgentConnect integrates with third-party platforms including Meta (Instagram,
                Facebook Messenger), WhatsApp, Telegram, and others. Your use of these
                platforms is subject to their respective privacy policies.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                5. Data Deletion
              </h2>
              <p>
                You may request deletion of your data by contacting us. We will process
                deletion requests in accordance with applicable laws.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                6. Contact Us
              </h2>
              <p>
                For questions about this privacy policy, please contact us through the
                AgentConnect platform.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
