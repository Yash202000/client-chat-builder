
import { TeamManagement } from "@/components/TeamManagement";

const TeamPage = () => {
  return (
    <div className="space-y-6 p-6 animate-fade-in">
      <div>
        <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-2">
          Team Management
        </h2>
        <p className="text-gray-600 dark:text-gray-400 text-lg">Manage users, teams, roles and permissions</p>
      </div>
      <TeamManagement />
    </div>
  );
};

export default TeamPage;
