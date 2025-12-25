import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Widget from '@/Widget';
import { BACKEND_URL } from '@/config/env';
import { apiFetch } from '@/lib/api';

type DisplayMode = 'widget' | 'iframe' | 'fullpage';

interface PublishedSettings {
  agent_id: number;
  companyId: number;
  backendUrl: string;
}

interface PublishedPreviewPageProps {
  mode?: DisplayMode;
}

const PublishedPreviewPage = ({ mode = 'widget' }: PublishedPreviewPageProps) => {
  const { publishId } = useParams<{ publishId: string }>();
  const [settings, setSettings] = useState<PublishedSettings | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPublishedSettings = async () => {
      try {
        const response = await apiFetch(`/api/v1/published/${publishId}`);
        if (response.ok) {
          const data = await response.json();
          setSettings(data.settings);
        } else {
          setError('Failed to load preview. This link may be invalid or expired.');
        }
      } catch (err) {
        setError('An error occurred while trying to load the preview.');
      }
    };
    if (publishId) fetchPublishedSettings();
  }, [publishId]);

  if (error) {
    return <div className="flex items-center justify-center h-screen bg-gray-100 text-red-500 font-semibold">{error}</div>;
  }

  if (!settings || !settings.agent_id || !settings.companyId) {
    return <div className="flex items-center justify-center h-screen bg-gray-100">Loading...</div>;
  }

  // Container styling based on mode
  const containerClass = mode === 'iframe'
    ? 'w-full h-full'
    : 'w-screen h-screen';

  return (
    <div className={containerClass}>
      <Widget
        agentId={String(settings.agent_id)}
        companyId={String(settings.companyId)}
        backendUrl={settings.backendUrl || BACKEND_URL}
        displayMode={mode}
      />
    </div>
  );
};

export default PublishedPreviewPage;
