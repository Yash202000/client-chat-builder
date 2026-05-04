import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="space-y-3">
    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h2>
    <div className="text-gray-700 dark:text-gray-300 space-y-2 leading-relaxed">{children}</div>
  </section>
);

type CookieRow = { name: string; purpose: string; type: string; duration: string };

const CookieTable = ({ rows }: { rows: CookieRow[] }) => (
  <div className="overflow-x-auto">
    <table className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
      <thead className="bg-gray-50 dark:bg-gray-900">
        <tr>
          {["Name", "Purpose", "Type", "Duration"].map((h) => (
            <th key={h} className="text-left px-4 py-3 font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
        {rows.map((r) => (
          <tr key={r.name} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
            <td className="px-4 py-3 font-mono text-xs text-gray-900 dark:text-white">{r.name}</td>
            <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{r.purpose}</td>
            <td className="px-4 py-3">
              <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                r.type === "Essential"
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                  : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
              }`}>
                {r.type}
              </span>
            </td>
            <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{r.duration}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const ESSENTIAL_COOKIES: CookieRow[] = [
  { name: "accessToken", purpose: "Stores your JWT authentication token to keep you logged in", type: "Essential", duration: "7 days" },
  { name: "cookie_consent", purpose: "Remembers your cookie consent choice", type: "Essential", duration: "1 year" },
  { name: "companyId", purpose: "Stores your active workspace ID", type: "Essential", duration: "Session" },
];

const ANALYTICS_COOKIES: CookieRow[] = [
  { name: "_ga", purpose: "Google Analytics — distinguishes unique users", type: "Analytics", duration: "2 years" },
  { name: "_ga_*", purpose: "Google Analytics — stores session state", type: "Analytics", duration: "2 years" },
];

const CookiePolicyPage = () => {
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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Cookie Policy</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Last updated: May 3, 2026</p>
          </div>

          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
            This Cookie Policy explains how HeyGenAlly ("we", "us", "our") uses cookies and similar
            tracking technologies when you use our platform. It should be read alongside our{" "}
            <a href="/privacy-policy" className="text-violet-600 dark:text-violet-400 hover:underline">Privacy Policy</a>.
          </p>

          <Section title="1. What are cookies?">
            <p>
              Cookies are small text files placed on your device by a website. They are widely used to make
              websites work or work more efficiently, and to provide information to the website owner.
              We also use localStorage for similar purposes.
            </p>
          </Section>

          <Section title="2. How we use cookies">
            <p>We use cookies for three purposes:</p>
            <ul className="list-disc ml-6 space-y-1">
              <li><strong>Essential</strong> — required for the platform to function (authentication, session management)</li>
              <li><strong>Analytics</strong> — help us understand how users interact with the platform so we can improve it</li>
              <li><strong>Preferences</strong> — remember your settings such as dark mode and language</li>
            </ul>
          </Section>

          <Section title="3. Cookies we use">
            <h3 className="font-semibold text-gray-800 dark:text-gray-200 mt-2">Essential cookies</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              These cannot be disabled — they are necessary for you to use the platform.
            </p>
            <CookieTable rows={ESSENTIAL_COOKIES} />

            <h3 className="font-semibold text-gray-800 dark:text-gray-200 mt-4">Analytics cookies</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Only set if you accept analytics cookies via the consent banner.
            </p>
            <CookieTable rows={ANALYTICS_COOKIES} />
          </Section>

          <Section title="4. Third-party cookies">
            <p>
              Some features involve third-party services that may set their own cookies. These include:
            </p>
            <ul className="list-disc ml-6 space-y-1">
              <li><strong>Google</strong> — OAuth login, Google Analytics</li>
              <li><strong>LinkedIn</strong> — OAuth login</li>
              <li><strong>Twilio</strong> — voice/SMS features (no cookies, uses server-side tokens)</li>
              <li><strong>LiveKit</strong> — video conferencing (no cookies, uses WebSocket tokens)</li>
            </ul>
            <p>
              We do not control third-party cookies. Please refer to the respective privacy policies for details.
            </p>
          </Section>

          <Section title="5. Managing cookies">
            <p>
              You can control cookies through the consent banner shown on your first visit, or via your
              browser settings. Note that blocking essential cookies will prevent you from logging in.
            </p>
            <p>
              Most browsers allow you to view, delete, and block cookies via their settings menu.
              For instructions, visit{" "}
              <a href="https://www.aboutcookies.org" target="_blank" rel="noopener noreferrer" className="text-violet-600 dark:text-violet-400 hover:underline">
                aboutcookies.org
              </a>.
            </p>
          </Section>

          <Section title="6. Changes to this policy">
            <p>
              We may update this Cookie Policy from time to time. Changes will be posted on this page
              with an updated "Last updated" date.
            </p>
          </Section>

          <Section title="7. Contact us">
            <p>
              For questions about this Cookie Policy, contact us at{" "}
              <a href="mailto:privacy@heygenally.com" className="text-violet-600 dark:text-violet-400 hover:underline">
                privacy@heygenally.com
              </a>.
            </p>
          </Section>
        </div>
      </div>
    </div>
  );
};

export default CookiePolicyPage;
