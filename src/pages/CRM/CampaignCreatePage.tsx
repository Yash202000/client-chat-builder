import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  Send,
  Mail,
  MessageSquare,
  Phone,
  Layers,
  Calendar,
  DollarSign,
  Users,
  Target,
  Save,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import axios from 'axios';
import { useToast } from '@/hooks/use-toast';

const CAMPAIGN_TYPES = [
  { value: 'email', labelKey: 'email', icon: Mail, descKey: 'emailDesc' },
  { value: 'sms', labelKey: 'sms', icon: MessageSquare, descKey: 'smsDesc' },
  { value: 'whatsapp', labelKey: 'whatsapp', icon: MessageSquare, descKey: 'whatsappDesc' },
  { value: 'voice', labelKey: 'voice', icon: Phone, descKey: 'voiceDesc' },
  { value: 'multi_channel', labelKey: 'multi_channel', icon: Layers, descKey: 'multiChannelDesc' },
];

export default function CampaignCreatePage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    campaign_type: '',
    goal_type: '',
    goal_value: '',
    budget: '',
    start_date: '',
    end_date: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.campaign_type) {
      toast({
        title: t('crm.common.error'),
        description: 'Campaign name and type are required',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const headers = { Authorization: `Bearer ${token}` };

      const payload: any = {
        name: formData.name,
        description: formData.description || null,
        campaign_type: formData.campaign_type,
        status: 'draft',
      };

      if (formData.goal_type) payload.goal_type = formData.goal_type;
      if (formData.goal_value) payload.goal_value = parseInt(formData.goal_value);
      if (formData.budget) payload.budget = parseFloat(formData.budget);
      if (formData.start_date) payload.start_date = new Date(formData.start_date).toISOString();
      if (formData.end_date) payload.end_date = new Date(formData.end_date).toISOString();

      const response = await axios.post('/api/v1/campaigns/', payload, { headers });

      toast({
        title: t('crm.common.success'),
        description: 'Campaign created successfully',
      });

      navigate(`/dashboard/crm/campaigns/${response.data.id}`);
    } catch (error: any) {
      console.error('Error creating campaign:', error);
      toast({
        title: t('crm.common.error'),
        description: error.response?.data?.detail || 'Failed to create campaign',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/dashboard/crm/campaigns')}
          className="h-10 w-10"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
            {t('crm.campaigns.addCampaign')}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {t('crm.campaigns.subtitle')}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Campaign Type Selection */}
        <Card className="border-slate-200 dark:border-slate-700 dark:bg-slate-800">
          <CardHeader>
            <CardTitle className="text-lg font-semibold dark:text-white">
              {t('crm.campaigns.fields.type')}
            </CardTitle>
            <CardDescription className="dark:text-gray-400">
              {t('crm.campaigns.create.selectType')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {CAMPAIGN_TYPES.map((type) => {
                const Icon = type.icon;
                const isSelected = formData.campaign_type === type.value;
                return (
                  <div
                    key={type.value}
                    onClick={() => setFormData({ ...formData, campaign_type: type.value })}
                    className={cn(
                      "p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 hover:shadow-md",
                      isSelected
                        ? "border-orange-500 bg-orange-50 dark:bg-orange-900/20"
                        : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                    )}
                  >
                    <div className={cn(
                      "h-12 w-12 rounded-xl flex items-center justify-center mb-3",
                      isSelected
                        ? "bg-gradient-to-r from-orange-500 to-red-500"
                        : "bg-slate-100 dark:bg-slate-700"
                    )}>
                      <Icon className={cn("h-6 w-6", isSelected ? "text-white" : "text-slate-600 dark:text-slate-300")} />
                    </div>
                    <h4 className={cn("font-semibold mb-1", isSelected ? "text-orange-600 dark:text-orange-400" : "dark:text-white")}>
                      {t(`crm.campaigns.types.${type.labelKey}`)}
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t(`crm.campaigns.types.${type.descKey}`)}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Campaign Details */}
        <Card className="border-slate-200 dark:border-slate-700 dark:bg-slate-800">
          <CardHeader>
            <CardTitle className="text-lg font-semibold dark:text-white">
              {t('crm.campaigns.create.campaignDetails')}
            </CardTitle>
            <CardDescription className="dark:text-gray-400">
              {t('crm.campaigns.create.basicInfo')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  {t('crm.campaigns.fields.name')} <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder={t('crm.campaigns.create.namePlaceholder')}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="dark:bg-slate-900 dark:border-slate-600"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="goal_type">{t('crm.campaigns.create.goalType')}</Label>
                <Select
                  value={formData.goal_type}
                  onValueChange={(value) => setFormData({ ...formData, goal_type: value })}
                >
                  <SelectTrigger className="dark:bg-slate-900 dark:border-slate-600">
                    <SelectValue placeholder={t('crm.campaigns.create.selectGoalType')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="awareness">{t('crm.campaigns.goals.awareness')}</SelectItem>
                    <SelectItem value="engagement">{t('crm.campaigns.goals.engagement')}</SelectItem>
                    <SelectItem value="leads">{t('crm.campaigns.goals.leads')}</SelectItem>
                    <SelectItem value="conversions">{t('crm.campaigns.goals.conversions')}</SelectItem>
                    <SelectItem value="sales">{t('crm.campaigns.goals.sales')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">{t('crm.campaigns.fields.description')}</Label>
              <Textarea
                id="description"
                placeholder={t('crm.campaigns.create.descriptionPlaceholder')}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="dark:bg-slate-900 dark:border-slate-600"
              />
            </div>
          </CardContent>
        </Card>

        {/* Schedule & Budget */}
        <Card className="border-slate-200 dark:border-slate-700 dark:bg-slate-800">
          <CardHeader>
            <CardTitle className="text-lg font-semibold dark:text-white flex items-center gap-2">
              <Calendar className="h-5 w-5 text-orange-500" />
              {t('crm.campaigns.create.scheduleAndBudget')}
            </CardTitle>
            <CardDescription className="dark:text-gray-400">
              {t('crm.campaigns.create.setTimeline')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_date">{t('crm.campaigns.fields.startDate')}</Label>
                <Input
                  id="start_date"
                  type="datetime-local"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className="dark:bg-slate-900 dark:border-slate-600"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_date">{t('crm.campaigns.fields.endDate')}</Label>
                <Input
                  id="end_date"
                  type="datetime-local"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  className="dark:bg-slate-900 dark:border-slate-600"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="budget">{t('crm.campaigns.fields.budget')} ($)</Label>
                <Input
                  id="budget"
                  type="number"
                  placeholder="1000"
                  value={formData.budget}
                  onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                  className="dark:bg-slate-900 dark:border-slate-600"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="goal_value">{t('crm.campaigns.create.goalTarget')}</Label>
                <Input
                  id="goal_value"
                  type="number"
                  placeholder={t('crm.campaigns.create.goalPlaceholder')}
                  value={formData.goal_value}
                  onChange={(e) => setFormData({ ...formData, goal_value: e.target.value })}
                  className="dark:bg-slate-900 dark:border-slate-600"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/dashboard/crm/campaigns')}
            className="dark:bg-slate-800 dark:border-slate-600"
          >
            {t('crm.common.cancel')}
          </Button>
          <Button
            type="submit"
            disabled={loading || !formData.name || !formData.campaign_type}
            className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {t('crm.campaigns.create.creating')}
              </div>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {t('crm.campaigns.addCampaign')}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
