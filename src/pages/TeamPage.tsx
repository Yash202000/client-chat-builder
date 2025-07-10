
import { UserManagement } from "@/components/UserManagement";

const TeamPage = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-3xl font-bold bg-gradient-to-r from-orange-900 to-yellow-900 bg-clip-text text-transparent">
          Team Management
        </h2>
        <p className="text-gray-600 mt-1">Manage users, teams, and permissions</p>
      </div>
      <UserManagement />
    </div>
  );
};

export default TeamPage;
