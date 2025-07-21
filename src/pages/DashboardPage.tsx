import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

export const DashboardPage = () => {
  const { logout } = useAuth();

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Button onClick={logout}>Logout</Button>
      </div>
      <p>Welcome to your dashboard!</p>
    </div>
  );
};
