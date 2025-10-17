import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { MessageSquare, X } from 'lucide-react';
import { cn } from '@/lib/utils';

// Re-defining necessary types and structures locally for this standalone page
interface PublishedWidgetSettings {
  primary_color: string;
  header_title: string;
  welcome_message: string;
  position: string;
  border_radius: number;
  font_family: string;
  agent_avatar_url: string;
  widget_size: 'small' | 'medium' | 'large';
  show_header: boolean;
  dark_mode: boolean;
  client_website_url?: string;
}

const widgetSizes = {
  small: { width: 320, height: 450 },
  medium: { width: 360, height: 550 },
  large: { width: 400, height: 650 },
};

const PublishedPreviewPage = () => {
  const { publishId } = useParams<{ publishId: string }>();
  const [settings, setSettings] = useState<PublishedWidgetSettings | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isWidgetOpen, setIsWidgetOpen] = useState(true);
  const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

  useEffect(() => {
    const fetchPublishedSettings = async () => {
      try {
        const response = await fetch(`/api/v1/published/${publishId}`);
        if (response.ok) {
          const data = await response.json();
          // The settings are nested inside a 'settings' property
          setSettings(data.settings);
        } else {
          setError('Failed to load preview. This link may be invalid or expired.');
        }
      } catch (err) {
        setError('An error occurred while trying to load the preview.');
      }
    };

    if (publishId) {
      fetchPublishedSettings();
    }
  }, [publishId, backendUrl]);

  if (error) {
    return <div className="flex items-center justify-center h-screen bg-gray-100 text-red-500 font-semibold">{error}</div>;
  }

  if (!settings) {
    return <div className="flex items-center justify-center h-screen bg-gray-100">Loading Live Preview...</div>;
  }

  const { position, primary_color, agent_avatar_url, widget_size, border_radius, dark_mode, header_title, show_header, welcome_message, font_family } = settings;
  const [vertical, horizontal] = position.split('-');
  const size = widgetSizes[widget_size] || widgetSizes.medium;

  return (
    <div className="relative w-screen h-screen" style={{ fontFamily: font_family }}>
      {settings.client_website_url && (
        <iframe
          src={settings.client_website_url}
          className="absolute top-0 left-0 w-full h-full border-0"
          title="Client Website Preview"
          sandbox="allow-scripts allow-same-origin" // Added sandbox for security
        />
      )}
      <div style={{ position: 'fixed', zIndex: 9999, [vertical]: '20px', [horizontal]: '20px' }}>
        {!isWidgetOpen ? (
          <Button
            onClick={() => setIsWidgetOpen(true)}
            style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              backgroundColor: primary_color,
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            }}
            className="flex items-center justify-center"
          >
            {agent_avatar_url ? (
              <img
                src={`${backendUrl}/api/v1/proxy/image-proxy?url=${encodeURIComponent(agent_avatar_url)}`}
                alt="Avatar"
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <MessageSquare size={32} color="white" />
            )}
          </Button>
        ) : (
          <div
            style={{
              width: `${size.width}px`,
              height: `${size.height}px`,
              borderRadius: `${border_radius}px`,
              boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
            }}
            className={cn(
              'flex flex-col overflow-hidden animate-fade-in',
              dark_mode ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-800'
            )}
          >
            {show_header && (
              <div
                style={{
                  backgroundColor: primary_color,
                  borderTopLeftRadius: `${border_radius}px`,
                  borderTopRightRadius: `${border_radius}px`,
                }}
                className="p-4 text-white flex justify-between items-center flex-shrink-0"
              >
                <div className="flex items-center gap-3">
                  {agent_avatar_url && (
                     <Avatar className="h-10 w-10 border-2 border-white/50">
                        <AvatarImage src={`${backendUrl}/api/v1/proxy/image-proxy?url=${encodeURIComponent(agent_avatar_url)}`} alt="Header Avatar" />
                        <AvatarFallback>{header_title.charAt(0)}</AvatarFallback>
                    </Avatar>
                  )}
                  <span className="font-bold text-lg">{header_title}</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsWidgetOpen(false)}
                  className="text-white hover:bg-white/20"
                >
                  <X className="h-6 w-6" />
                </Button>
              </div>
            )}
            <div className="flex-grow p-4 overflow-y-auto">
                <div className="flex w-full justify-start">
                    <div className={cn('max-w-[85%] p-3 flex flex-col bg-gray-100 rounded-lg', dark_mode && 'bg-gray-800')}>
                        <p className={cn('text-sm', dark_mode ? 'text-gray-200' : 'text-gray-800')}>{welcome_message}</p>
                    </div>
                </div>
            </div>
            <div className={cn('p-3 border-t', dark_mode ? 'border-gray-800' : 'border-gray-200')}>
                <p className="text-center text-xs text-gray-400">This is a visual preview. Chat is disabled.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PublishedPreviewPage;