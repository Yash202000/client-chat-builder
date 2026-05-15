import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";

export const PrivacyPolicy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <SEOHead
        title="Privacy Policy"
        description="Read HeyGenAlly's privacy policy to understand how we collect, use, and protect your personal data."
        canonical="/privacy-policy"
      />
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Privacy Policy
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mb-8 text-sm">
            Last updated: May 16, 2026
          </p>

          <div className="space-y-8 text-gray-700 dark:text-gray-300 leading-relaxed">

            {/* 1 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">1. Introduction</h2>
              <p>
                HeyGenAlly ("we", "us", or "our") is a customer engagement and AI automation platform that
                helps businesses manage conversations, leads, appointments, and outreach across multiple
                communication channels. This Privacy Policy explains what personal data we collect, why we
                collect it, how we use and protect it, and your rights in relation to it.
              </p>
              <p className="mt-2">
                By using HeyGenAlly you agree to the practices described in this policy. If you do not
                agree, please discontinue use of the platform.
              </p>
            </section>

            {/* 2 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">2. Information We Collect</h2>

              <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-2">2.1 Account &amp; Team Data</h3>
              <ul className="list-disc ml-6 space-y-1">
                <li>Name, email address, and password (hashed) when you register</li>
                <li>Company name, logo, and billing information</li>
                <li>Profile photos and team member details</li>
                <li>Role and permission settings within your workspace</li>
              </ul>

              <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-2 mt-4">2.2 Messaging &amp; Communication Data</h3>
              <p className="mb-2">When you connect a messaging channel, we receive and store:</p>
              <ul className="list-disc ml-6 space-y-1">
                <li>Message content, timestamps, and read receipts from connected channels (Instagram Direct, Facebook Messenger, WhatsApp, Telegram, SMS, email)</li>
                <li>Contact names, profile pictures, phone numbers, and email addresses provided by end-users through those channels</li>
                <li>Attachments and media files shared in conversations</li>
                <li>AI-generated responses and conversation summaries</li>
              </ul>

              <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-2 mt-4">2.3 Meta Platform Data (Facebook &amp; Instagram)</h3>
              <p className="mb-2">
                When you connect a Facebook Page or Instagram Business account, HeyGenAlly receives data
                through the Meta Graph API and Messenger Platform, including:
              </p>
              <ul className="list-disc ml-6 space-y-1">
                <li>Messages sent to and from your Facebook Page or Instagram account via the Messenger Platform API</li>
                <li>Sender IDs (Page-scoped user IDs) and display names of people who message your page</li>
                <li>Profile pictures provided by Facebook/Instagram for conversation display</li>
                <li>Delivery and read receipt events</li>
                <li>Postback payloads from interactive message elements (buttons, quick replies)</li>
                <li>Your Facebook Page access token used to send and receive messages on your behalf</li>
              </ul>
              <p className="mt-2 text-sm bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded p-3">
                <strong>Important:</strong> We access Meta platform data solely to provide the messaging and
                automation features you configure. We do not use this data for advertising, sell it to third
                parties, or use it for any purpose beyond operating the services you have enabled.
              </p>

              <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-2 mt-4">2.4 CRM &amp; Lead Data</h3>
              <ul className="list-disc ml-6 space-y-1">
                <li>Contact records: names, email addresses, phone numbers, company, tags, and custom fields</li>
                <li>Lead status, pipeline stage, and activity history</li>
                <li>Notes, tasks, and interactions logged by your team</li>
                <li>Imported contact lists via CSV or third-party integrations</li>
              </ul>

              <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-2 mt-4">2.5 Booking &amp; Calendar Data</h3>
              <ul className="list-disc ml-6 space-y-1">
                <li>Booking requests: name, email, phone, and notes submitted by people booking appointments</li>
                <li>Meeting times, durations, and calendar event details</li>
                <li>Video call recordings (if enabled by the account owner)</li>
              </ul>

              <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-2 mt-4">2.6 Usage &amp; Technical Data</h3>
              <ul className="list-disc ml-6 space-y-1">
                <li>Browser type, operating system, and IP address</li>
                <li>Pages visited within the platform, feature usage, and click patterns</li>
                <li>API request logs and error reports</li>
                <li>Authentication tokens stored locally in your browser</li>
              </ul>
            </section>

            {/* 3 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">3. How We Use Your Information</h2>
              <ul className="list-disc ml-6 space-y-2">
                <li><strong>Delivering the service:</strong> routing messages, triggering AI agent responses, managing contacts and leads, sending outreach sequences, and scheduling appointments</li>
                <li><strong>AI automation:</strong> processing message content through our AI models to generate contextually relevant replies, summaries, and suggested actions</li>
                <li><strong>Analytics &amp; reporting:</strong> generating dashboards, conversation metrics, campaign performance reports, and booking summaries visible only to your team</li>
                <li><strong>Notifications:</strong> sending in-app alerts, email notifications, and real-time WebSocket events for new messages, calls, and task assignments</li>
                <li><strong>Security:</strong> detecting abuse, preventing fraud, and enforcing our Terms of Service</li>
                <li><strong>Product improvement:</strong> understanding aggregate usage patterns to improve platform features (never individual message content)</li>
                <li><strong>Legal compliance:</strong> responding to lawful requests and fulfilling regulatory obligations</li>
              </ul>
            </section>

            {/* 4 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">4. Data Sharing &amp; Third-Party Services</h2>
              <p className="mb-3">We do not sell personal data. We share data only in these circumstances:</p>

              <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-2">4.1 Service Providers</h3>
              <ul className="list-disc ml-6 space-y-1">
                <li><strong>Meta (Facebook/Instagram):</strong> messages are exchanged via the Messenger Platform API in accordance with Meta's Platform Terms</li>
                <li><strong>Twilio:</strong> voice and SMS communications are routed through Twilio's infrastructure</li>
                <li><strong>LiveKit:</strong> video call sessions are facilitated through LiveKit's WebRTC infrastructure</li>
                <li><strong>OpenAI / AI model providers:</strong> message content may be sent to AI providers to generate responses; these providers are contractually prohibited from training on your data</li>
                <li><strong>Cloud infrastructure:</strong> our servers and databases are hosted on secure cloud infrastructure with encryption at rest</li>
                <li><strong>MinIO / object storage:</strong> file attachments and media are stored in encrypted object storage</li>
              </ul>

              <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-2 mt-4">4.2 Legal Requirements</h3>
              <p>We may disclose data if required by law, court order, or to protect the rights and safety of our users or the public.</p>

              <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-2 mt-4">4.3 Business Transfers</h3>
              <p>In the event of a merger, acquisition, or sale of assets, user data may be transferred. We will notify affected users before data is subject to a different privacy policy.</p>
            </section>

            {/* 5 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">5. Data Storage &amp; Security</h2>
              <ul className="list-disc ml-6 space-y-2">
                <li>All data is encrypted in transit using TLS 1.2+ and encrypted at rest using AES-256</li>
                <li>Passwords are hashed using bcrypt and never stored in plain text</li>
                <li>API keys and integration credentials are stored in an encrypted vault</li>
                <li>Access to production systems is restricted to authorised personnel only</li>
                <li>We conduct regular security reviews and vulnerability assessments</li>
              </ul>
            </section>

            {/* 6 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">6. Data Retention</h2>
              <ul className="list-disc ml-6 space-y-2">
                <li><strong>Account data:</strong> retained for the duration of your subscription and deleted within 90 days of account closure</li>
                <li><strong>Conversation messages:</strong> retained for as long as your account is active; you may delete individual conversations at any time</li>
                <li><strong>CRM contacts and leads:</strong> retained until explicitly deleted by your team</li>
                <li><strong>Booking records:</strong> retained for 2 years for business record purposes, then deleted</li>
                <li><strong>Usage logs:</strong> retained for 90 days for security and debugging purposes</li>
                <li><strong>Meta platform data:</strong> message content from Facebook/Instagram is retained only as long as the associated conversation exists in your account</li>
              </ul>
            </section>

            {/* 7 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">7. Data Deletion</h2>
              <p className="mb-3">
                You have the right to request deletion of your personal data and the data of contacts in your workspace.
              </p>
              <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-2">For account owners:</h3>
              <ul className="list-disc ml-6 space-y-1">
                <li>Delete individual contacts from the CRM at any time</li>
                <li>Delete conversation history from the Inbox</li>
                <li>Close your account by contacting support — all workspace data is permanently deleted within 30 days</li>
              </ul>
              <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-2 mt-3">For end-users (people who messaged your business):</h3>
              <p>
                If you are an end-user who messaged a business using HeyGenAlly and wish to have your data
                deleted, please submit a request to{" "}
                <a href="mailto:privacy@heygenally.com" className="text-blue-600 hover:underline">
                  privacy@heygenally.com
                </a>{" "}
                with the subject line "Data Deletion Request". We will process all requests within 30 days.
              </p>
              <p className="mt-2">
                You may also use our{" "}
                <a href="/data-deletion" className="text-blue-600 hover:underline">
                  Data Deletion Request page
                </a>{" "}
                to submit a request directly.
              </p>
            </section>

            {/* 8 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">8. Your Rights</h2>
              <p className="mb-3">Depending on your location, you may have the following rights:</p>
              <ul className="list-disc ml-6 space-y-2">
                <li><strong>Access:</strong> request a copy of the personal data we hold about you</li>
                <li><strong>Correction:</strong> request correction of inaccurate data</li>
                <li><strong>Deletion:</strong> request deletion of your data (see Section 7)</li>
                <li><strong>Portability:</strong> request your data in a structured, machine-readable format</li>
                <li><strong>Objection:</strong> object to certain types of processing</li>
                <li><strong>Restriction:</strong> request that we restrict processing in certain circumstances</li>
              </ul>
              <p className="mt-3">
                To exercise any of these rights, contact us at{" "}
                <a href="mailto:privacy@heygenally.com" className="text-blue-600 hover:underline">
                  privacy@heygenally.com
                </a>.
              </p>
            </section>

            {/* 9 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">9. Cookies &amp; Tracking</h2>
              <p>
                HeyGenAlly uses essential cookies for authentication and session management. We do not use
                third-party advertising or tracking cookies. For full details, see our{" "}
                <a href="/cookie-policy" className="text-blue-600 hover:underline">
                  Cookie Policy
                </a>.
              </p>
            </section>

            {/* 10 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">10. Children's Privacy</h2>
              <p>
                HeyGenAlly is a business platform and is not directed at children under the age of 16.
                We do not knowingly collect personal data from children. If you believe we have
                inadvertently collected such data, please contact us immediately.
              </p>
            </section>

            {/* 11 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">11. International Data Transfers</h2>
              <p>
                Your data may be processed in countries outside your own. Where we transfer data
                internationally, we ensure appropriate safeguards are in place (such as Standard
                Contractual Clauses) in accordance with applicable data protection laws.
              </p>
            </section>

            {/* 12 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">12. Changes to This Policy</h2>
              <p>
                We may update this Privacy Policy from time to time. When we make material changes, we will
                notify you by email or through an in-app notice at least 14 days before the changes take effect.
                The "Last updated" date at the top of this page always reflects the current version.
              </p>
            </section>

            {/* 13 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">13. Contact Us</h2>
              <p>If you have questions, concerns, or requests regarding this Privacy Policy, please contact us:</p>
              <div className="mt-3 space-y-1">
                <p><strong>Email:</strong>{" "}
                  <a href="mailto:privacy@heygenally.com" className="text-blue-600 hover:underline">
                    privacy@heygenally.com
                  </a>
                </p>
                <p><strong>Data Deletion Requests:</strong>{" "}
                  <a href="/data-deletion" className="text-blue-600 hover:underline">
                    heygenally.com/data-deletion
                  </a>
                </p>
              </div>
            </section>

          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
