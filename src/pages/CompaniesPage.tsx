import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Company } from "@/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Building2, PlusCircle, Loader2 } from "lucide-react";
import { useI18n } from '@/hooks/useI18n';

export const CompaniesPage = () => {
  const { t, isRTL } = useI18n();
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
      toast({ title: t('companies.companyCreatedSuccess') });
      setCreateModalOpen(false);
      setNewCompanyName("");
    },
    onError: (e: Error) => toast({ title: t('companies.companyCreatedError'), description: e.message, variant: "destructive" }),
  });

  const handleCreateCompany = () => {
    if (newCompanyName) {
      createCompanyMutation.mutate(newCompanyName);
    }
  };

  return (
    <div className="min-h-full app-surface" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="bg-card/80 backdrop-blur-sm border-b border-border px-4 sm:px-6 py-4 sm:py-6">
        <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${isRTL ? 'sm:flex-row-reverse' : ''}`}>
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 sm:h-12 sm:w-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
              <Building2 className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white leading-tight">{t('companies.title')}</h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">{t('companies.subtitle')}</p>
            </div>
          </div>
          <Button
            onClick={() => setCreateModalOpen(true)}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl h-9 px-3 sm:px-4 text-sm self-start sm:self-auto"
          >
            <PlusCircle className={`${isRTL ? 'sm:ml-2' : 'sm:mr-2'} h-4 w-4`} /><span className="hidden sm:inline"> {t('companies.createCompany')}</span>
          </Button>
        </div>
      </div>
      <div className="px-4 sm:px-6 py-4 sm:py-6">
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800">
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">{t('companies.allCompanies')}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{t('companies.viewAndManage')}</p>
          </div>
          <div className="p-4 sm:p-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
              </div>
            ) : companies && companies.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                    <TableHead className="text-slate-600 dark:text-slate-400">{t('companies.id')}</TableHead>
                    <TableHead className="text-slate-600 dark:text-slate-400">{t('companies.companyName')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {companies.map((company) => (
                    <TableRow key={company.id} className="border-border row-hover-active cursor-pointer">
                      <TableCell className="font-mono text-sm text-slate-500 dark:text-slate-400">{company.id}</TableCell>
                      <TableCell className="font-medium text-slate-900 dark:text-white">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg flex items-center justify-center">
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
              <div className="text-center py-12">
                <div className="h-14 w-14 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center mx-auto mb-4">
                  <Building2 className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">{t('companies.noCompaniesFound')}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t('companies.createFirstCompany')}</p>
                <Button onClick={() => setCreateModalOpen(true)} className="mt-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl h-9 px-4 text-sm">
                  <PlusCircle className={`${isRTL ? 'ml-2' : 'mr-2'} h-4 w-4`} /> {t('companies.createCompany')}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <Dialog open={isCreateModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent dir={isRTL ? 'rtl' : 'ltr'} className="rounded-xl dark:bg-slate-900 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="dark:text-white">{t('companies.createDialogTitle')}</DialogTitle>
            <DialogDescription className="dark:text-slate-400">
              {t('companies.createDialogDesc')}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="company-name" className="dark:text-slate-300">{t('companies.companyName')}</Label>
            <Input
              id="company-name"
              placeholder={t('companies.companyNamePlaceholder')}
              value={newCompanyName}
              onChange={(e) => setNewCompanyName(e.target.value)}
              className="dark:bg-slate-800 dark:border-slate-700 dark:text-white mt-2"
            />
          </div>
          <DialogFooter className={isRTL ? 'flex-row-reverse' : ''}>
            <Button variant="outline" onClick={() => setCreateModalOpen(false)} className="dark:border-slate-700 dark:text-white dark:hover:bg-slate-800">
              {t('common.cancel')}
            </Button>
            <Button onClick={handleCreateCompany} disabled={createCompanyMutation.isPending} className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl">
              {createCompanyMutation.isPending ? t('companies.creating') : t('companies.createCompany')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
