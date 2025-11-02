import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookText } from "lucide-react";
import { useI18n } from '@/hooks/useI18n';

const CodeBlock = ({ children }: { children: React.ReactNode }) => (
  <pre className="bg-gray-100 dark:bg-slate-900 p-4 rounded-md overflow-x-auto dark:border dark:border-slate-700">
    <code className="dark:text-gray-300">{children}</code>
  </pre>
);

export const ApiDocs = () => {
  const { t, isRTL } = useI18n();

  return (
    <Card dir={isRTL ? 'rtl' : 'ltr'} className="dark:bg-slate-800 dark:border-slate-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 dark:text-white">
          <BookText className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
          {t('apiDocs.title')}
        </CardTitle>
        <CardDescription className="dark:text-gray-400">
          {t('apiDocs.subtitle')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <section>
          <h3 className="text-lg font-semibold dark:text-white">{t('apiDocs.authenticationTitle')}</h3>
          <p className="text-gray-600 dark:text-gray-400">
            {t('apiDocs.authenticationDesc1')}{" "}
            <code className="bg-gray-100 dark:bg-slate-900 p-1 rounded-md dark:text-cyan-400">X-API-Key</code>{" "}
            {t('apiDocs.authenticationDesc2')}
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold dark:text-white">{t('apiDocs.endpointTitle')}</h3>
          <p className="text-gray-600 dark:text-gray-400">
            {t('apiDocs.endpointDesc')}
          </p>
          <CodeBlock>POST /api/v1/proactive/message</CodeBlock>
        </section>

        <section>
          <h3 className="text-lg font-semibold dark:text-white">{t('apiDocs.requestBodyTitle')}</h3>
          <p className="text-gray-600 dark:text-gray-400">
            {t('apiDocs.requestBodyDesc')}
          </p>
          <ul className={`list-disc ${isRTL ? 'list-inside mr-5' : 'list-inside ml-5'} space-y-2 dark:text-gray-400`}>
            <li>
              <code className="bg-gray-100 dark:bg-slate-900 p-1 rounded-md dark:text-cyan-400">text</code> {t('apiDocs.textField')}
            </li>
            <li>
              <code className="bg-gray-100 dark:bg-slate-900 p-1 rounded-md dark:text-cyan-400">session_id</code> {t('apiDocs.sessionIdField')}
            </li>
            <li>
              <code className="bg-gray-100 dark:bg-slate-900 p-1 rounded-md dark:text-cyan-400">contact_id</code> {t('apiDocs.contactIdField')}
            </li>
          </ul>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            {t('apiDocs.requireEither')} <code className="bg-gray-100 dark:bg-slate-900 p-1 rounded-md dark:text-cyan-400">session_id</code> {t('apiDocs.or')} <code className="bg-gray-100 dark:bg-slate-900 p-1 rounded-md dark:text-cyan-400">contact_id</code>.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold dark:text-white">{t('apiDocs.exampleTitle')}</h3>
          <CodeBlock>
            {`curl -X POST 'https://your-domain.com/api/v1/proactive/message' \\
--header 'Content-Type: application/json' \\
--header 'X-API-Key: YOUR_API_KEY' \\
--data-raw '{
    "session_id": "your_session_id",
    "text": "Hello from the API!"
}'`}
          </CodeBlock>
        </section>
      </CardContent>
    </Card>
  );
};