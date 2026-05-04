import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield, Lock, Server, Eye, RefreshCw, CheckCircle, ExternalLink } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";

const SUB_PROCESSORS = [
  { name: "Amazon Web Services (AWS)", purpose: "Infrastructure, compute & storage", location: "US / EU (configurable)", dpa: "https://aws.amazon.com/agreement/" },
  { name: "OpenAI", purpose: "LLM inference (GPT-4o, Whisper STT)", location: "United States", dpa: "https://openai.com/policies/data-processing-addendum" },
  { name: "Groq", purpose: "High-speed LLM inference (Llama, Mixtral)", location: "United States", dpa: "https://groq.com/privacy-policy/" },
  { name: "Google (Gemini / Vertex AI)", purpose: "LLM inference & OAuth login", location: "US / EU", dpa: "https://cloud.google.com/terms/data-processing-addendum" },
  { name: "Twilio", purpose: "Voice, SMS & WhatsApp messaging", location: "US / EU", dpa: "https://www.twilio.com/en-us/legal/data-protection-addendum" },
  { name: "LiveKit", purpose: "Real-time video & audio", location: "United States", dpa: "https://livekit.io/privacy" },
  { name: "Meta (Messenger / Instagram / WhatsApp)", purpose: "Messaging channel APIs", location: "US / EU", dpa: "https://www.facebook.com/legal/terms/dataprocessing" },
  { name: "LinkedIn", purpose: "OAuth login & lead enrichment", location: "United States", dpa: "https://www.linkedin.com/legal/l/dpa" },
  { name: "PostgreSQL (self-hosted)", purpose: "Primary database", location: "Customer-controlled", dpa: null },
  { name: "Redis (self-hosted)", purpose: "Session cache & presence", location: "Customer-controlled", dpa: null },
];

const CONTROLS = [
  { icon: Lock, title: "Encryption at rest & in transit", desc: "All data stored in the database is encrypted at rest using AES-256. All data in transit is protected with TLS 1.2+. Passwords are hashed with bcrypt." },
  { icon: Shield, title: "Role-based access control", desc: "Granular permission system with Admin, Member, and custom roles. Every API endpoint enforces permission checks. Users can only access their own company's data." },
  { icon: Eye, title: "Audit logging", desc: "All significant user actions are logged with actor, timestamp, IP address, and field-level changes. Logs are retained for 5 years and exportable." },
  { icon: Server, title: "Infrastructure security", desc: "Backend services run in isolated containers. Database access is restricted to the application layer only. No direct public access to the database." },
  { icon: RefreshCw, title: "Vulnerability management", desc: "Dependencies are reviewed regularly for known CVEs. Security patches are applied within 30 days of disclosure, critical patches within 72 hours." },
  { icon: CheckCircle, title: "Data isolation", desc: "Every query is scoped to the authenticated user's company_id. Cross-tenant data access is architecturally prevented at the ORM layer." },
];

const SecurityPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <SEOHead
        title="Security – How HeyGenAlly Protects Your Data"
        description="HeyGenAlly uses AES-256 encryption, TLS 1.2+, role-based access control, and SOC 2-aligned practices to keep your data secure."
        canonical="/security"
      />
      <div className="max-w-5xl mx-auto px-4 py-12">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        {/* Hero */}
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-8 text-white mb-10 shadow-xl">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <Shield className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Security & Trust</h1>
              <p className="text-emerald-100 mt-0.5">How we protect your data</p>
            </div>
          </div>
          <p className="text-emerald-50 max-w-2xl leading-relaxed">
            Security is built into every layer of HeyGenAlly. This page describes our security controls,
            sub-processors, and your rights as a data subject under GDPR.
          </p>
        </div>

        {/* Security controls */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Security Controls</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {CONTROLS.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 flex-shrink-0">
                    <Icon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">{title}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Compliance status */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Compliance Status</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "GDPR", status: "Compliant", color: "emerald" },
              { label: "SOC 2 Type II", status: "In progress", color: "amber" },
              { label: "ISO 27001", status: "Planned", color: "slate" },
              { label: "HIPAA", status: "Not certified", color: "slate" },
            ].map(({ label, status, color }) => (
              <div key={label} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm text-center">
                <p className="font-semibold text-gray-900 dark:text-white mb-2">{label}</p>
                <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                  color === "emerald" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" :
                  color === "amber" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
                  "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                }`}>
                  {status}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Sub-processors */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Sub-processors</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">
            The following third-party service providers may process personal data on our behalf.
            Last updated: May 3, 2026.
          </p>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
            {/* Mobile cards */}
            <div className="sm:hidden divide-y divide-gray-100 dark:divide-gray-700">
              {SUB_PROCESSORS.map((sp) => (
                <div key={sp.name} className="p-4 space-y-1">
                  <p className="font-medium text-gray-900 dark:text-white text-sm">{sp.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{sp.purpose}</p>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-gray-400 dark:text-gray-500">{sp.location}</span>
                    {sp.dpa && (
                      <a href={sp.dpa} target="_blank" rel="noopener noreferrer" className="text-xs text-violet-600 dark:text-violet-400 hover:underline flex items-center gap-1">
                        DPA <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left px-5 py-3 font-semibold text-gray-700 dark:text-gray-300">Processor</th>
                    <th className="text-left px-5 py-3 font-semibold text-gray-700 dark:text-gray-300">Purpose</th>
                    <th className="text-left px-5 py-3 font-semibold text-gray-700 dark:text-gray-300">Location</th>
                    <th className="text-left px-5 py-3 font-semibold text-gray-700 dark:text-gray-300">DPA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {SUB_PROCESSORS.map((sp) => (
                    <tr key={sp.name} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="px-5 py-3 font-medium text-gray-900 dark:text-white">{sp.name}</td>
                      <td className="px-5 py-3 text-gray-500 dark:text-gray-400">{sp.purpose}</td>
                      <td className="px-5 py-3 text-gray-500 dark:text-gray-400">{sp.location}</td>
                      <td className="px-5 py-3">
                        {sp.dpa ? (
                          <a href={sp.dpa} target="_blank" rel="noopener noreferrer" className="text-violet-600 dark:text-violet-400 hover:underline flex items-center gap-1 text-xs">
                            View DPA <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : (
                          <span className="text-gray-400 dark:text-gray-600 text-xs">N/A</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* GDPR rights */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Your GDPR Rights</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { right: "Right of access (Art. 15)", desc: "Request a copy of all personal data we hold about you." },
              { right: "Right to rectification (Art. 16)", desc: "Correct inaccurate personal data via your account settings." },
              { right: "Right to erasure (Art. 17)", desc: "Request permanent deletion of your account and personal data from your account settings → Security tab." },
              { right: "Right to portability (Art. 20)", desc: "Download all your data as CSV/JSON from Settings → Data Export." },
              { right: "Right to restrict processing (Art. 18)", desc: "Request restriction of processing in specific circumstances. Contact us to exercise this right." },
              { right: "Right to object (Art. 21)", desc: "Object to processing based on legitimate interests. Contact privacy@heygenally.com." },
            ].map(({ right, desc }) => (
              <div key={right} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
                <p className="font-semibold text-gray-900 dark:text-white text-sm mb-1">{right}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Contact */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Contact our Security Team</h2>
          <div className="grid sm:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-gray-500 dark:text-gray-400 mb-0.5">Security vulnerabilities</p>
              <a href="mailto:security@heygenally.com" className="text-violet-600 dark:text-violet-400 hover:underline">security@heygenally.com</a>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400 mb-0.5">Privacy & GDPR requests</p>
              <a href="mailto:privacy@heygenally.com" className="text-violet-600 dark:text-violet-400 hover:underline">privacy@heygenally.com</a>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400 mb-0.5">DPA / legal requests</p>
              <a href="mailto:legal@heygenally.com" className="text-violet-600 dark:text-violet-400 hover:underline">legal@heygenally.com</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecurityPage;
