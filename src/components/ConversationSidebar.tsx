import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Clock, Mail, Phone } from 'lucide-react';
import { useI18n } from '@/hooks/useI18n';

interface ConversationSidebarProps {
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  sessionId: string;
  createdAt: string;
}

export const ConversationSidebar: React.FC<ConversationSidebarProps> = ({
  contactName,
  contactEmail,
  contactPhone,
  sessionId,
  createdAt,
}) => {
  const { isRTL } = useI18n();

  return (
    <div className={`w-1/4 bg-gray-50/50 p-4 flex flex-col gap-4 ${isRTL ? 'border-r' : 'border-l'}`}>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Contact Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <Avatar className="h-12 w-12">
              <AvatarImage src={`https://avatar.vercel.sh/${contactEmail}.png`} alt={contactName} />
              <AvatarFallback>{contactName.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold">{contactName}</p>
              <p className="text-sm text-gray-500">Customer</p>
            </div>
          </div>
          <div className="space-y-2 text-sm">
            <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Mail className="h-4 w-4 text-gray-500" />
              <span>{contactEmail}</span>
            </div>
            <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Phone className="h-4 w-4 text-gray-500" />
              <span>{contactPhone || 'Not provided'}</span>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Session Info</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <Clock className="h-4 w-4 text-gray-500" />
            <span>Started: {new Date(createdAt).toLocaleString()}</span>
          </div>
          <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <User className="h-4 w-4 text-gray-500" />
            <span>Session ID: {sessionId}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
