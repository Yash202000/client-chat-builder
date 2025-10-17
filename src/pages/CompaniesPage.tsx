import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Company } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Building2, PlusCircle } from "lucide-react";

export const CompaniesPage = () => {
  const { authFetch } = useAuth();
  const queryClient = useQueryClient();
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState("");

  const { data: companies, isLoading } = useQuery<Company[]>({
    queryKey: ['companies'],
    queryFn: async () => {
      const response = await authFetch(`/api/v1/companies/`);
      if (!response.ok) throw new Error("Failed to fetch companies");
      return response.json();
    },
  });

  const createCompanyMutation = useMutation({
    mutationFn: (companyName: string) => authFetch(`/api/v1/companies/`, {
      method: 'POST',
      body: JSON.stringify({ name: companyName }),
    }).then(res => { if (!res.ok) throw new Error('Failed to create company'); return res.json() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      toast({ title: "Company created successfully!" });
      setCreateModalOpen(false);
      setNewCompanyName("");
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const handleCreateCompany = () => {
    if (newCompanyName) {
      createCompanyMutation.mutate(newCompanyName);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8">
      <header>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
          🏢 Companies
        </h1>
        <p className="text-gray-600 dark:text-gray-400 text-lg">Manage all companies on the platform</p>
      </header>

      <Card className="card-shadow-lg border-slate-200 dark:border-slate-700 dark:bg-slate-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900">
          <div>
            <CardTitle className="text-2xl font-bold dark:text-white">All Companies</CardTitle>
            <CardDescription className="dark:text-gray-400">View and manage company accounts</CardDescription>
          </div>
          <Dialog open={isCreateModalOpen} onOpenChange={setCreateModalOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all">
                <PlusCircle className="mr-2 h-4 w-4" /> Create Company
              </Button>
            </DialogTrigger>
            <DialogContent className="dark:bg-slate-800 dark:border-slate-700">
              <DialogHeader>
                <DialogTitle className="dark:text-white">Create New Company</DialogTitle>
                <DialogDescription className="dark:text-gray-400">
                  Add a new company to the platform
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <Label htmlFor="company-name" className="dark:text-gray-300">Company Name</Label>
                <Input
                  id="company-name"
                  placeholder="e.g., Acme Corporation"
                  value={newCompanyName}
                  onChange={(e) => setNewCompanyName(e.target.value)}
                  className="dark:bg-slate-900 dark:border-slate-600 dark:text-white mt-2"
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateModalOpen(false)} className="dark:border-slate-600 dark:text-white dark:hover:bg-slate-700">
                  Cancel
                </Button>
                <Button onClick={handleCreateCompany} disabled={createCompanyMutation.isPending} className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white">
                  {createCompanyMutation.isPending ? "Creating..." : "Create Company"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-2 text-muted-foreground dark:text-gray-400">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600 dark:border-indigo-400"></div>
                <span>Loading companies...</span>
              </div>
            </div>
          ) : companies && companies.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                  <TableHead className="dark:text-gray-300">ID</TableHead>
                  <TableHead className="dark:text-gray-300">Company Name</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {companies.map((company) => (
                  <TableRow key={company.id} className="border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                    <TableCell className="font-mono text-sm text-gray-600 dark:text-gray-400">{company.id}</TableCell>
                    <TableCell className="font-medium dark:text-white">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50 rounded-full flex items-center justify-center">
                          <Building2 className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        {company.name}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-16 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900/50">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50 mb-4">
                <Building2 className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">No companies found</h3>
              <p className="text-gray-500 dark:text-gray-400 mt-2">Create your first company to get started</p>
              <Button onClick={() => setCreateModalOpen(true)} className="mt-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white">
                <PlusCircle className="mr-2 h-4 w-4" /> Create Company
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
