import { ShieldOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const UnauthorizedPage = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center px-4">
      <div className="rounded-full bg-destructive/10 p-6">
        <ShieldOff className="h-12 w-12 text-destructive" />
      </div>
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-foreground">Access Denied</h1>
        <p className="text-muted-foreground max-w-md">
          You don't have permission to view this page. Contact your administrator to request access.
        </p>
      </div>
      <Button onClick={() => navigate('/dashboard')}>Go to Dashboard</Button>
    </div>
  );
};

export default UnauthorizedPage;
