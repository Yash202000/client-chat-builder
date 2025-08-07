import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookText } from "lucide-react";

const CodeBlock = ({ children }: { children: React.ReactNode }) => (
  <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto">
    <code>{children}</code>
  </pre>
);

export const ApiDocs = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookText className="h-5 w-5" />
          API Documentation
        </CardTitle>
        <CardDescription>
          A guide for developers to integrate with the proactive messaging API.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <section>
          <h3 className="text-lg font-semibold">Authentication</h3>
          <p className="text-gray-600">
            Authentication is handled via an API key. You must include your API key in the{" "}
            <code className="bg-gray-100 p-1 rounded-md">X-API-Key</code> header of your request.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold">Endpoint</h3>
          <p className="text-gray-600">
            All requests should be made to the following endpoint:
          </p>
          <CodeBlock>POST /api/v1/proactive/message</CodeBlock>
        </section>

        <section>
          <h3 className="text-lg font-semibold">Request Body</h3>
          <p className="text-gray-600">
            The request body must be a JSON object with the following fields:
          </p>
          <ul className="list-disc list-inside space-y-2">
            <li>
              <code className="bg-gray-100 p-1 rounded-md">text</code> (string, required): The content of the message to be sent.
            </li>
            <li>
              <code className="bg-gray-100 p-1 rounded-md">session_id</code> (string, optional): The ID of the conversation session to send the message to.
            </li>
            <li>
              <code className="bg-gray-100 p-1 rounded-md">contact_id</code> (integer, optional): The ID of the contact to send the message to.
            </li>
          </ul>
          <p className="text-gray-600 mt-2">
            You must provide either a <code className="bg-gray-100 p-1 rounded-md">session_id</code> or a{" "}
            <code className="bg-gray-100 p-1 rounded-md">contact_id</code>.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold">Example Request (cURL)</h3>
          <CodeBlock>
            {`curl -X POST 'https://your-domain.com/api/v1/proactive/message' \
--header 'Content-Type: application/json' \
--header 'X-API-Key: YOUR_API_KEY' \
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