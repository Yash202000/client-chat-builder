import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Contact } from '@/types';
import {
  Mail, Phone, Edit, Save, Calendar, Tag, Loader2, X,
  PanelLeftClose, Briefcase, Building2, MapPin, Globe,
  Linkedin, Instagram, Facebook, Copy, Check, ExternalLink,
  MessageCircle, Clock, Camera,
} from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import { useTranslation } from 'react-i18next';
import { useI18n } from '@/hooks/useI18n';
import { TagSelector } from '@/components/TagSelector';
import { EntityNotes } from '@/components/EntityNotes';
import { CallRecordingPlayer } from '@/components/CallRecordingPlayer';
import axios from 'axios';

interface ContactProfileProps {
  sessionId: string;
  onToggle?: () => void;
}

// Channel metadata
const CHANNEL_META: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  whatsapp: {
    label: 'WhatsApp',
    color: '#25D366',
    bg: '#dcfce7',
    icon: <MessageCircle className="h-3 w-3" />,
  },
  instagram: {
    label: 'Instagram',
    color: '#E1306C',
    bg: '#fce7f3',
    icon: <Instagram className="h-3 w-3" />,
  },
  facebook: {
    label: 'Facebook',
    color: '#1877F2',
    bg: '#dbeafe',
    icon: <Facebook className="h-3 w-3" />,
  },
  webchat: {
    label: 'Web Chat',
    color: '#6366f1',
    bg: '#ede9fe',
    icon: <Globe className="h-3 w-3" />,
  },
};

function getChannelMeta(channel?: string) {
  if (!channel) return null;
  return CHANNEL_META[channel.toLowerCase()] ?? {
    label: channel,
    color: '#64748b',
    bg: '#f1f5f9',
    icon: <MessageCircle className="h-3 w-3" />,
  };
}

import { getAvatarColor, getAvatarInitial } from '@/lib/avatarColor';

function getInitials(name?: string, email?: string): string {
  if (name) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return parts[0][0].toUpperCase();
  }
  if (email) return email[0].toUpperCase();
  return 'U';
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return '';
  }
}

// Tiny copy-to-clipboard hook
function useCopy(timeout = 1500) {
  const [copied, setCopied] = useState<string | null>(null);
  const copy = useCallback((text: string, key: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), timeout);
    });
  }, [timeout]);
  return { copied, copy };
}

// Read-only field row with optional copy and external link
function FieldRow({
  icon,
  value,
  copyKey,
  href,
  onCopy,
  copied,
}: {
  icon: React.ReactNode;
  value?: string | null;
  copyKey?: string;
  href?: string;
  onCopy?: (text: string, key: string) => void;
  copied?: string | null;
}) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-2.5 py-1.5 group">
      <span className="mt-0.5 flex-shrink-0 text-muted-foreground">{icon}</span>
      <span className="flex-1 text-xs text-foreground break-all leading-snug">{value}</span>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
        {onCopy && copyKey && (
          <button
            onClick={() => onCopy(value, copyKey)}
            className="h-5 w-5 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted"
            title="Copy"
          >
            {copied === copyKey ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
          </button>
        )}
        {href && (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="h-5 w-5 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted"
            title="Open"
          >
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
    </div>
  );
}

// Section header
function SectionHeader({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-1.5 px-4 pt-3 pb-1.5">
      <span className="text-muted-foreground/60">{icon}</span>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">{label}</p>
    </div>
  );
}

export const ContactProfile: React.FC<ContactProfileProps> = ({ sessionId, onToggle }) => {
  const { t } = useTranslation();
  const { isRTL } = useI18n();
  const queryClient = useQueryClient();
  const { playSuccessSound } = useNotifications();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<Contact>>({});
  const [tagIds, setTagIds] = useState<number[]>([]);
  const { authFetch } = useAuth();
  const { copied, copy } = useCopy();

  const { data: contact, isLoading } = useQuery<Contact | null>({
    queryKey: ['contact', sessionId],
    queryFn: async () => {
      const response = await authFetch(`/api/v1/contacts/by_session/${sessionId}`);
      if (!response.ok) {
        if (response.status === 404) throw new Error('Session not found');
        throw new Error('Failed to fetch contact');
      }
      return response.json();
    },
    enabled: !!sessionId,
    retry: false,
  });

  useEffect(() => {
    if (contact) {
      setFormData(contact);
      setTagIds(contact.tags?.map(t => t.id) ?? []);
    } else {
      setFormData({});
      setTagIds([]);
    }
  }, [contact]);

  const updateMutation = useMutation({
    mutationFn: (data: Partial<Contact>) =>
      authFetch(`/api/v1/contacts/${contact!.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(res => { if (!res.ok) throw new Error('Failed to update'); return res.json(); }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact', sessionId] });
      toast({ title: t('conversations.contact.toasts.success'), variant: 'success', description: t('conversations.contact.toasts.contactUpdated') });
      playSuccessSound();
      setIsEditing(false);
    },
    onError: (e: Error) => toast({ title: t('conversations.contact.toasts.error'), description: e.message, variant: 'destructive' }),
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    if (contact?.id) updateMutation.mutate(formData);
  };

  const handleTagsChange = async (newTagIds: number[]) => {
    if (!contact?.id) return;
    const prev = [...tagIds];
    setTagIds(newTagIds);
    try {
      const token = localStorage.getItem('accessToken');
      const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
      const toAdd = newTagIds.filter(id => !prev.includes(id));
      const toRemove = prev.filter(id => !newTagIds.includes(id));
      for (const id of toAdd) await axios.post(`/api/v1/tags/${id}/assign`, { contact_ids: [contact.id] }, { headers });
      for (const id of toRemove) await axios.post(`/api/v1/tags/${id}/unassign`, { contact_ids: [contact.id] }, { headers });
      queryClient.invalidateQueries({ queryKey: ['contact', sessionId] });
      toast({ title: t('conversations.contact.toasts.success'), description: t('crm.tags.updated'), variant: 'success' });
    } catch {
      setTagIds(prev);
      toast({ title: t('conversations.contact.toasts.error'), description: t('crm.tags.saveError'), variant: 'destructive' });
    }
  };

  const channelMeta = getChannelMeta(contact?.channel);
  const avatarName = contact?.name || contact?.email || '';
  const avatarColorClass = getAvatarColor(avatarName);
  const avatarInitial = avatarName ? getAvatarInitial(avatarName) : getInitials(contact?.name, contact?.email);

  const waLink = contact?.phone_number && contact.channel === 'whatsapp'
    ? `https://wa.me/${contact.phone_number.replace(/\D/g, '')}`
    : null;

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center app-surface border border-border rounded-xl">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          <p className="text-xs text-muted-foreground">Loading…</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="h-full flex flex-col app-surface border border-border rounded-xl overflow-hidden"
    >
      {/* ── Top bar ───────────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 flex items-center justify-between px-3 pt-3 pb-2">
        <div className="flex items-center gap-2">
          {onToggle && (
            <button
              onClick={onToggle}
              className="h-6 w-6 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <PanelLeftClose className="h-3.5 w-3.5" />
            </button>
          )}
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
            {t('conversations.contact.title')}
          </p>
        </div>

        <AnimatePresence mode="wait">
          {isEditing ? (
            <motion.div key="edit-actions" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-1.5">
              <button
                onClick={() => { setIsEditing(false); setFormData(contact ?? {}); }}
                className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={handleSave}
                disabled={updateMutation.isPending}
                className="h-7 px-2.5 rounded-md flex items-center gap-1.5 bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors disabled:opacity-60"
              >
                {updateMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                {updateMutation.isPending ? t('conversations.contact.saving') : t('conversations.contact.save')}
              </button>
            </motion.div>
          ) : (
            <motion.button
              key="edit-btn"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEditing(true)}
              className="h-7 px-2.5 rounded-md flex items-center gap-1.5 border border-border text-muted-foreground text-xs hover:text-foreground hover:bg-muted transition-colors"
            >
              <Edit className="h-3 w-3" />
              {t('conversations.contact.edit')}
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* ── Scrollable body ───────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">

        {/* Avatar hero block */}
        <div className="flex flex-col items-center px-4 pt-2 pb-4 border-b border-border/60">
          {/* Avatar with channel badge */}
          <div className="relative mb-3 group/avatar">
            {contact?.profile_picture_url ? (
              <img
                src={contact.profile_picture_url}
                alt={contact.name || 'Contact'}
                className="h-16 w-16 rounded-full object-cover shadow-md ring-2 ring-border ring-offset-2 ring-offset-card"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = 'none';
                  (e.currentTarget.nextElementSibling as HTMLElement | null)?.style.setProperty('display', 'flex');
                }}
              />
            ) : null}
            <div
              className={`h-16 w-16 rounded-full ${avatarColorClass} items-center justify-center shadow-md font-bold text-xl select-none`}
              style={{ display: contact?.profile_picture_url ? 'none' : 'flex' }}
            >
              {avatarInitial}
            </div>

            {/* Set photo button — opens edit mode */}
            {contact && (
              <button
                onClick={() => setIsEditing(true)}
                title="Set profile photo URL"
                className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity"
              >
                <Camera className="h-4 w-4 text-white" />
              </button>
            )}

            {channelMeta && (
              <span
                className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full flex items-center justify-center shadow-sm border-2 border-card"
                style={{ backgroundColor: channelMeta.color, color: 'white' }}
                title={channelMeta.label}
              >
                {channelMeta.icon}
              </span>
            )}
          </div>

          {/* Name */}
          {isEditing ? (
            <Input
              name="name"
              value={formData.name || ''}
              onChange={handleInputChange}
              className="h-8 text-sm font-semibold text-center rounded-lg bg-background border-border mb-1 max-w-[180px]"
              placeholder={t('conversations.contact.namePlaceholder')}
            />
          ) : (
            <h3 className="text-[15px] font-semibold text-foreground leading-tight mb-1 text-center">
              {contact?.name || t('conversations.contact.unknownContact')}
            </h3>
          )}

          {/* Channel badge */}
          {channelMeta && (
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium"
              style={{ backgroundColor: channelMeta.bg, color: channelMeta.color }}
            >
              {channelMeta.icon}
              {channelMeta.label}
            </span>
          )}

          {/* Quick actions */}
          {contact && (
            <div className="flex items-center gap-2 mt-3">
              {waLink && (
                <a
                  href={waLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white shadow-sm hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: '#25D366' }}
                >
                  <MessageCircle className="h-3 w-3" />
                  Open in WhatsApp
                </a>
              )}
            </div>
          )}
        </div>

        {/* Anonymous user notice */}
        {!contact && (
          <div className="mx-4 mt-3 p-3 bg-primary/5 border border-primary/20 rounded-lg">
            <p className="text-xs text-foreground/80 leading-relaxed">
              <span className="font-semibold text-foreground">Anonymous visitor</span> — the AI will collect contact details during the conversation.
            </p>
          </div>
        )}

        {contact && (
          <>
            {/* ── Contact Info ─────────────────────────────────────────── */}
            <SectionHeader icon={<Mail className="h-3 w-3" />} label="Contact Info" />
            <div className="px-4 pb-1">
              {isEditing ? (
                <div className="space-y-2">
                  <div>
                    <label className="text-[10px] text-muted-foreground mb-1 block">Email</label>
                    <Input name="email" type="email" value={formData.email || ''} onChange={handleInputChange}
                      className="h-7 text-xs rounded-md bg-background border-border" placeholder="email@example.com" />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground mb-1 block">Phone</label>
                    <Input name="phone_number" value={formData.phone_number || ''} onChange={handleInputChange}
                      className="h-7 text-xs rounded-md bg-background border-border" placeholder="+1 555 000 0000" />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground mb-1 block">Profile Picture URL</label>
                    <Input name="profile_picture_url" value={formData.profile_picture_url || ''} onChange={handleInputChange}
                      className="h-7 text-xs rounded-md bg-background border-border" placeholder="https://..." />
                  </div>
                </div>
              ) : (
                <>
                  <FieldRow
                    icon={<Mail className="h-3.5 w-3.5" />}
                    value={contact.email}
                    copyKey="email"
                    onCopy={copy}
                    copied={copied}
                  />
                  <FieldRow
                    icon={<Phone className="h-3.5 w-3.5" />}
                    value={contact.phone_number}
                    copyKey="phone"
                    href={waLink ?? undefined}
                    onCopy={copy}
                    copied={copied}
                  />
                </>
              )}
            </div>

            {/* ── Profile ──────────────────────────────────────────────── */}
            <SectionHeader icon={<Briefcase className="h-3 w-3" />} label="Profile" />
            <div className="px-4 pb-1 border-t border-border/40 pt-1">
              {isEditing ? (
                <div className="space-y-2">
                  {[
                    { name: 'job_title', label: 'Job Title', placeholder: 'e.g. Product Manager' },
                    { name: 'company_name', label: 'Company', placeholder: 'e.g. Acme Inc.' },
                    { name: 'location', label: 'Location', placeholder: 'e.g. New York, USA' },
                    { name: 'website', label: 'Website', placeholder: 'https://example.com' },
                  ].map(field => (
                    <div key={field.name}>
                      <label className="text-[10px] text-muted-foreground mb-1 block">{field.label}</label>
                      <Input
                        name={field.name}
                        value={(formData as any)[field.name] || ''}
                        onChange={handleInputChange}
                        className="h-7 text-xs rounded-md bg-background border-border"
                        placeholder={field.placeholder}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  <FieldRow icon={<Briefcase className="h-3.5 w-3.5" />} value={contact.job_title} />
                  <FieldRow icon={<Building2 className="h-3.5 w-3.5" />} value={contact.company_name} />
                  <FieldRow icon={<MapPin className="h-3.5 w-3.5" />} value={contact.location} />
                  <FieldRow
                    icon={<Globe className="h-3.5 w-3.5" />}
                    value={contact.website}
                    href={contact.website}
                    copyKey="website"
                    onCopy={copy}
                    copied={copied}
                  />
                  {!contact.job_title && !contact.company_name && !contact.location && !contact.website && (
                    <p className="text-[11px] text-muted-foreground/50 py-1">No profile info yet</p>
                  )}
                </>
              )}
            </div>

            {/* ── Social Links ──────────────────────────────────────────── */}
            {(contact.linkedin_url || contact.instagram_handle || contact.facebook_url || isEditing) && (
              <>
                <SectionHeader icon={<Globe className="h-3 w-3" />} label="Social" />
                <div className="px-4 pb-1 border-t border-border/40 pt-1">
                  {isEditing ? (
                    <div className="space-y-2">
                      {[
                        { name: 'linkedin_url', label: 'LinkedIn URL', placeholder: 'https://linkedin.com/in/...' },
                        { name: 'instagram_handle', label: 'Instagram Handle', placeholder: '@handle' },
                        { name: 'facebook_url', label: 'Facebook URL', placeholder: 'https://facebook.com/...' },
                      ].map(field => (
                        <div key={field.name}>
                          <label className="text-[10px] text-muted-foreground mb-1 block">{field.label}</label>
                          <Input
                            name={field.name}
                            value={(formData as any)[field.name] || ''}
                            onChange={handleInputChange}
                            className="h-7 text-xs rounded-md bg-background border-border"
                            placeholder={field.placeholder}
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <>
                      <FieldRow
                        icon={<Linkedin className="h-3.5 w-3.5" />}
                        value={contact.linkedin_url}
                        href={contact.linkedin_url}
                        copyKey="linkedin"
                        onCopy={copy}
                        copied={copied}
                      />
                      <FieldRow
                        icon={<Instagram className="h-3.5 w-3.5" />}
                        value={contact.instagram_handle}
                        copyKey="instagram"
                        onCopy={copy}
                        copied={copied}
                      />
                      <FieldRow
                        icon={<Facebook className="h-3.5 w-3.5" />}
                        value={contact.facebook_url}
                        href={contact.facebook_url}
                        copyKey="facebook"
                        onCopy={copy}
                        copied={copied}
                      />
                    </>
                  )}
                </div>
              </>
            )}

            {/* ── Conversation Info ─────────────────────────────────────── */}
            <SectionHeader icon={<Clock className="h-3 w-3" />} label="Conversation" />
            <div className="px-4 pb-2 border-t border-border/40 pt-1 space-y-1">
              {contact.lifecycle_stage && (
                <div className="flex items-center justify-between py-1">
                  <span className="text-[11px] text-muted-foreground">Stage</span>
                  <span className="text-[11px] font-medium capitalize bg-muted px-2 py-0.5 rounded-full">
                    {contact.lifecycle_stage}
                  </span>
                </div>
              )}
              {contact.lead_source && (
                <div className="flex items-center justify-between py-1">
                  <span className="text-[11px] text-muted-foreground">Source</span>
                  <span className="text-[11px] font-medium capitalize">{contact.lead_source}</span>
                </div>
              )}
              {contact.created_at && (
                <div className="flex items-center justify-between py-1">
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> Joined
                  </span>
                  <span className="text-[11px] text-foreground/70">{formatDate(contact.created_at)}</span>
                </div>
              )}
              {contact.last_contacted_at && (
                <div className="flex items-center justify-between py-1">
                  <span className="text-[11px] text-muted-foreground">Last contacted</span>
                  <span className="text-[11px] text-foreground/70">{formatDate(contact.last_contacted_at)}</span>
                </div>
              )}
            </div>

            {/* ── Tags ─────────────────────────────────────────────────── */}
            <div className="border-t border-border/60">
              <SectionHeader icon={<Tag className="h-3 w-3" />} label={t('crm.tags.title')} />
              <div className="px-4 pb-3">
                <TagSelector
                  entityType="contact"
                  selectedTagIds={tagIds}
                  onTagsChange={handleTagsChange}
                  disabled={!isEditing && tagIds.length === 0}
                />
                {!isEditing && tagIds.length === 0 && (
                  <p className="text-xs text-muted-foreground/50 mt-1">{t('crm.tags.noTags')}</p>
                )}
              </div>
            </div>

            {/* ── Notes ────────────────────────────────────────────────── */}
            {contact.id && (
              <div className="border-t border-border/60">
                <EntityNotes contactId={contact.id} compact />
              </div>
            )}

            {/* ── Voice Call Recordings ─────────────────────────────── */}
            <CallRecordingPlayer sessionId={sessionId} />
          </>
        )}

        <div className="h-6" />
      </div>
    </motion.div>
  );
};
