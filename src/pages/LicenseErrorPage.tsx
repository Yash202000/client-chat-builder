import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Mail, Phone, Key, RefreshCw } from "lucide-react";
import { useAuth } from '@/hooks/useAuth';

interface LicenseErrorInfo {
  status: string;
  message: string;
  contact: {
    name: string;
    email: string;
    phone: string;
  };
}

export const LicenseErrorPage = () => {
  const { logout } = useAuth();
  const [errorInfo, setErrorInfo] = useState<LicenseErrorInfo | null>(null);

  useEffect(() => {
    // Get error info from session storage
    const storedError = sessionStorage.getItem('licenseError');
    if (storedError) {
      try {
        setErrorInfo(JSON.parse(storedError));
      } catch (e) {
        console.error('Failed to parse license error', e);
      }
    }
  }, []);

  const handleRetry = () => {
    sessionStorage.removeItem('licenseError');
    window.location.reload();
  };

  const handleLogout = () => {
    sessionStorage.removeItem('licenseError');
    logout();
  };

  const statusConfig = {
    expired: {
      title: 'License Expired',
      color: 'text-red-600',
      bgColor: 'bg-red-50 dark:bg-red-950/50',
      borderColor: 'border-red-200 dark:border-red-800',
    },
    invalid: {
      title: 'Invalid License',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 dark:bg-orange-950/50',
      borderColor: 'border-orange-200 dark:border-orange-800',
    },
    not_configured: {
      title: 'License Not Configured',
      color: 'text-gray-600',
      bgColor: 'bg-gray-50 dark:bg-gray-950/50',
      borderColor: 'border-gray-200 dark:border-gray-800',
    },
  };

  const config = statusConfig[errorInfo?.status as keyof typeof statusConfig] || statusConfig.invalid;
  const contact = errorInfo?.contact || {
    name: 'Yash Panchwatkar',
    email: 'yashpanchwatkar@gmail.com',
    phone: '+91 7083581881',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <Card className={`max-w-md w-full ${config.bgColor} ${config.borderColor} border-2`}>
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full flex items-center justify-center mb-4">
            <Key className="w-8 h-8 text-white" />
          </div>
          <CardTitle className={`text-2xl font-bold ${config.color}`}>
            {config.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-start gap-3 p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
            <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-slate-600 dark:text-slate-300">
              {errorInfo?.message || 'Your license has expired or is invalid. Please contact the administrator to renew your license.'}
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wide">
              Contact for License Renewal
            </h3>
            <div className="bg-white dark:bg-slate-800 rounded-lg p-4 space-y-3 border border-slate-200 dark:border-slate-700">
              <p className="font-semibold text-lg text-slate-900 dark:text-white">
                {contact.name}
              </p>
              <a
                href={`mailto:${contact.email}`}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors group"
              >
                <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/50 rounded-full flex items-center justify-center">
                  <Mail className="w-5 h-5 text-amber-600" />
                </div>
                <span className="text-slate-600 dark:text-slate-300 group-hover:text-amber-600 transition-colors">
                  {contact.email}
                </span>
              </a>
              <a
                href={`tel:${contact.phone}`}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors group"
              >
                <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/50 rounded-full flex items-center justify-center">
                  <Phone className="w-5 h-5 text-amber-600" />
                </div>
                <span className="text-slate-600 dark:text-slate-300 group-hover:text-amber-600 transition-colors">
                  {contact.phone}
                </span>
              </a>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleLogout}
            >
              Logout
            </Button>
            <Button
              className="flex-1 bg-amber-600 hover:bg-amber-700"
              onClick={handleRetry}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>

          <p className="text-center text-xs text-slate-400">
            Powered by <span className="font-semibold text-amber-500">HeyGenAlly</span>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default LicenseErrorPage;
