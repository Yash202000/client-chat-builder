import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from '@/hooks/useI18n';
import { useNotifications } from "@/hooks/useNotifications";
import { Role } from "@/types";
import { Mail, Copy, Check, Send, Link2, RefreshCw, Trash2, Clock, UserPlus, AlertCircle } from "lucide-react";
import { formatDistanceToNow } from 'date-fns';

interface InviteUserModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Invitation {
  id: number;
  email: string;
  role_id: number | null;
  role_name: string | null;
  expires_at: string;
  used_at: string | null;
  created_at: string;
  invitation_link?: string;
  invited_by_name: string | null;
  is_expired?: boolean;
}

export const InviteUserModal = ({ isOpen, onClose }: InviteUserModalProps) => {
  const { t, isRTL } = useI18n();
  const queryClient = useQueryClient();
  const { authFetch } = useAuth();
  const { playSuccessSound } = useNotifications();

  const [email, setEmail] = useState("");
  const [selectedRoleId, setSelectedRoleId] = useState<string>("");
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [lastCreatedInvitation, setLastCreatedInvitation] = useState<Invitation | null>(null);

  const { data: roles = [] } = useQuery<Role[]>({
    queryKey: ['roles'],
    queryFn: async () => {
      const response = await authFetch(`/api/v1/roles/`);
      if (!response.ok) throw new Error('Failed to fetch roles');
      return response.json();
    },
  });

  const { data: pendingInvitations = [], isLoading: isLoadingInvitations } = useQuery<Invitation[]>({
    queryKey: ['invitations'],
    queryFn: async () => {
      const response = await authFetch(`/api/v1/invitations/`);
      if (!response.ok) throw new Error('Failed to fetch invitations');
      return response.json();
    },
    enabled: isOpen,
  });

  const createInvitationMutation = useMutation({
    mutationFn: async (data: { email: string; role_id?: number }) => {
      const response = await authFetch(`/api/v1/invitations/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to create invitation');
      }
      return response.json();
    },
    onSuccess: (data: Invitation) => {
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
      toast({ title: t('common.success'), variant: 'success', description: t('invitations.toasts.invitationSent') });
      playSuccessSound();
      setLastCreatedInvitation(data);
      setEmail("");
      setSelectedRoleId("");
    },
    onError: (error: Error) => {
      toast({ title: t('common.error'), description: error.message, variant: 'destructive' });
    },
  });

  const resendInvitationMutation = useMutation({
    mutationFn: async (invitationId: number) => {
      const response = await authFetch(`/api/v1/invitations/${invitationId}/resend`, { method: 'POST' });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to resend invitation');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
      toast({ title: t('common.success'), variant: 'success', description: t('invitations.toasts.invitationResent') });
      playSuccessSound();
    },
    onError: (error: Error) => {
      toast({ title: t('common.error'), description: error.message, variant: 'destructive' });
    },
  });

  const revokeInvitationMutation = useMutation({
    mutationFn: async (invitationId: number) => {
      const response = await authFetch(`/api/v1/invitations/${invitationId}`, { method: 'DELETE' });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to revoke invitation');
      }
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
      toast({ title: t('common.success'), variant: 'success', description: t('invitations.toasts.invitationRevoked') });
      playSuccessSound();
    },
    onError: (error: Error) => {
      toast({ title: t('common.error'), description: error.message, variant: 'destructive' });
    },
  });

  const handleSendInvitation = () => {
    if (!email) return;
    const data: { email: string; role_id?: number } = { email };
    if (selectedRoleId) data.role_id = parseInt(selectedRoleId, 10);
    createInvitationMutation.mutate(data);
  };

  const handleCopyLink = (link: string) => {
    navigator.clipboard.writeText(link);
    setCopiedLink(link);
    toast({ title: t('common.success'), description: t('invitations.toasts.linkCopied') });
    setTimeout(() => setCopiedLink(null), 2000);
  };

  const handleClose = () => {
    setEmail("");
    setSelectedRoleId("");
    setLastCreatedInvitation(null);
    onClose();
  };

  useEffect(() => {
    if (isOpen) {
      setEmail("");
      setSelectedRoleId("");
      setLastCreatedInvitation(null);
    }
  }, [isOpen]);

  const getInitials = (email: string) => email.slice(0, 2).toUpperCase();

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        className="max-w-lg bg-card border-border flex flex-col gap-0 p-0 overflow-hidden"
        style={{ maxHeight: '85vh' }}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border flex-shrink-0">
          <DialogTitle className="text-foreground flex items-center gap-2.5 text-base font-semibold">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <UserPlus className="h-4 w-4 text-primary" />
            </div>
            {t('invitations.title')}
          </DialogTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Invite teammates by email — they'll receive a link to join your workspace.
          </p>
        </DialogHeader>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 min-h-0">

          {/* Invite Form */}
          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-3">
              <div>
                <Label htmlFor="invite-email" className="text-xs font-medium text-muted-foreground mb-1.5 block uppercase tracking-wider">
                  Email address
                </Label>
                <Input
                  id="invite-email"
                  type="email"
                  placeholder="colleague@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && email && handleSendInvitation()}
                  className="h-10 bg-background border-input text-foreground placeholder:text-muted-foreground focus-visible:ring-ring"
                />
              </div>
              <div>
                <Label htmlFor="invite-role" className="text-xs font-medium text-muted-foreground mb-1.5 block uppercase tracking-wider">
                  Role <span className="normal-case text-muted-foreground/60">(optional)</span>
                </Label>
                <Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
                  <SelectTrigger id="invite-role" className="h-10 bg-background border-input text-foreground">
                    <SelectValue placeholder="Select a role..." />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.id.toString()} className="text-foreground focus:bg-muted">
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              onClick={handleSendInvitation}
              disabled={!email || createInvitationMutation.isPending}
              className="w-full h-10 bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
            >
              {createInvitationMutation.isPending ? (
                <>
                  <div className={`animate-spin rounded-full h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground ${isRTL ? 'ml-2' : 'mr-2'}`} />
                  Sending...
                </>
              ) : (
                <>
                  <Send className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                  {t('invitations.sendButton')}
                </>
              )}
            </Button>

            {/* Invitation link banner */}
            {lastCreatedInvitation?.invitation_link && (
              <div className="rounded-lg border border-border bg-muted/50 p-3">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5">
                    <Check className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium text-foreground">
                      Invitation sent
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopyLink(lastCreatedInvitation.invitation_link!)}
                    className="h-7 text-xs border-border text-foreground hover:bg-muted"
                  >
                    {copiedLink === lastCreatedInvitation.invitation_link ? (
                      <><Check className="h-3 w-3 mr-1" />Copied</>
                    ) : (
                      <><Copy className="h-3 w-3 mr-1" />Copy link</>
                    )}
                  </Button>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground bg-background px-2.5 py-1.5 rounded border border-border">
                  <Link2 className="h-3 w-3 flex-shrink-0 text-primary" />
                  <span className="truncate font-mono">{lastCreatedInvitation.invitation_link}</span>
                </div>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="border-t border-border" />

          {/* Pending Invitations */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Pending Invitations
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-muted border border-border text-foreground font-medium tabular-nums">
                {pendingInvitations.length}
              </span>
            </div>

            {isLoadingInvitations ? (
              <div className="flex items-center justify-center py-8">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-muted-foreground/30 border-t-primary" />
                  <span className="text-sm">Loading...</span>
                </div>
              </div>
            ) : pendingInvitations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center mb-2">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">No pending invitations</p>
                <p className="text-xs text-muted-foreground/60 mt-0.5">Sent invites will appear here</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {pendingInvitations.map((invitation) => (
                  <div
                    key={invitation.id}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-colors ${
                      invitation.is_expired
                        ? 'bg-destructive/5 border-destructive/20'
                        : 'bg-card border-border'
                    }`}
                  >
                    {/* Avatar */}
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 ${
                      invitation.is_expired
                        ? 'bg-destructive/10 text-destructive'
                        : 'bg-primary/10 text-primary'
                    }`}>
                      {getInitials(invitation.email)}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-sm font-medium text-foreground truncate">
                          {invitation.email}
                        </span>
                        {invitation.is_expired && (
                          <span className="inline-flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded-full bg-destructive/10 text-destructive font-medium flex-shrink-0">
                            <AlertCircle className="h-2.5 w-2.5" />
                            Expired
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                        {invitation.role_name && (
                          <span className="font-medium">{invitation.role_name}</span>
                        )}
                        {invitation.role_name && <span>·</span>}
                        <span className="flex items-center gap-0.5">
                          <Clock className="h-2.5 w-2.5" />
                          {formatDistanceToNow(new Date(invitation.expires_at), { addSuffix: true })}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-0.5 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => resendInvitationMutation.mutate(invitation.id)}
                        disabled={resendInvitationMutation.isPending}
                        className="h-7 w-7 p-0 hover:bg-primary/10 rounded"
                        title="Resend invitation"
                      >
                        <RefreshCw className={`h-3.5 w-3.5 text-primary ${resendInvitationMutation.isPending ? 'animate-spin' : ''}`} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => revokeInvitationMutation.mutate(invitation.id)}
                        disabled={revokeInvitationMutation.isPending}
                        className="h-7 w-7 p-0 hover:bg-destructive/10 rounded"
                        title="Revoke invitation"
                      >
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="px-6 py-4 border-t border-border flex-shrink-0">
          <Button
            variant="outline"
            onClick={handleClose}
            className="w-full border-border text-foreground hover:bg-muted"
          >
            {t('common.close')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default InviteUserModal;
