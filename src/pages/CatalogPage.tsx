import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  ShoppingBag, Send, Search, Plus, Trash2, Package, AlertCircle, CheckCircle2,
} from 'lucide-react';
import { API_BASE_URL } from '@/config/api';
import { useToast } from '@/hooks/use-toast';

interface Product {
  id: string;
  retailer_id: string;
  name: string;
  description?: string;
  price?: string;
  sale_price?: string;
  currency?: string;
  image_url?: string;
  availability?: string;
  category?: string;
}

type SendMode = 'single' | 'multi' | null;

const AVAIL_COLORS: Record<string, string> = {
  in_stock: 'bg-green-100 text-green-700',
  out_of_stock: 'bg-red-100 text-red-700',
  preorder: 'bg-blue-100 text-blue-700',
};

export default function CatalogPage() {
  const { authFetch } = useAuth();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [sendMode, setSendMode] = useState<SendMode>(null);
  const [selected, setSelected] = useState<Product[]>([]);
  const [sendForm, setSendForm] = useState({
    phone: '',
    bodyText: 'Check out this product!',
    headerText: 'Our Products',
    footerText: '',
  });
  const [sections, setSections] = useState([{ title: 'Products', ids: [] as string[] }]);

  const { data, isLoading, refetch, isFetching, error } = useQuery<{ products: Product[]; total: number }>({
    queryKey: ['catalog-products'],
    queryFn: async () => {
      const res = await authFetch(`/api/v1/catalog/products?limit=100`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to fetch products');
      }
      return res.json();
    },
  });

  const products = data?.products ?? [];
  const filtered = products.filter(p =>
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.retailer_id?.toLowerCase().includes(search.toLowerCase()) ||
    p.category?.toLowerCase().includes(search.toLowerCase())
  );

  const sendSingle = useMutation({
    mutationFn: async () => {
      if (selected.length !== 1) throw new Error('Select exactly one product');
      const res = await authFetch(`/api/v1/catalog/message/single`, {
        method: 'POST',
        body: JSON.stringify({
          recipient_phone: sendForm.phone,
          product_retailer_id: selected[0].retailer_id,
          body_text: sendForm.bodyText,
          footer_text: sendForm.footerText || undefined,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).detail || 'Failed');
      return res.json();
    },
    onSuccess: (data) => {
      toast({ title: 'Product sent', description: `Message ID: ${data.message_id || '—'}` });
      setSendMode(null);
      setSelected([]);
    },
    onError: (err: any) => {
      toast({ title: 'Failed to send', description: err.message, variant: 'destructive' });
    },
  });

  const sendMulti = useMutation({
    mutationFn: async () => {
      const payload = {
        recipient_phone: sendForm.phone,
        header_text: sendForm.headerText,
        body_text: sendForm.bodyText,
        footer_text: sendForm.footerText || undefined,
        sections: sections
          .filter(s => s.ids.length > 0)
          .map(s => ({ title: s.title, product_retailer_ids: s.ids })),
      };
      if (!payload.sections.length) throw new Error('Add at least one product to a section');
      const res = await authFetch(`/api/v1/catalog/message/multi`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error((await res.json()).detail || 'Failed');
      return res.json();
    },
    onSuccess: (data) => {
      toast({ title: 'Catalog sent', description: `Message ID: ${data.message_id || '—'}` });
      setSendMode(null);
      setSelected([]);
      setSections([{ title: 'Products', ids: [] }]);
    },
    onError: (err: any) => {
      toast({ title: 'Failed to send', description: err.message, variant: 'destructive' });
    },
  });

  function toggleSelect(p: Product) {
    setSelected(prev =>
      prev.find(x => x.retailer_id === p.retailer_id)
        ? prev.filter(x => x.retailer_id !== p.retailer_id)
        : [...prev, p]
    );
  }

  function openSingle(p: Product) {
    setSelected([p]);
    setSendForm(f => ({ ...f, bodyText: `Check out ${p.name}!` }));
    setSendMode('single');
  }

  function openMulti() {
    setSections([{ title: 'Products', ids: selected.map(p => p.retailer_id) }]);
    setSendMode('multi');
  }

  const isSending = sendSingle.isPending || sendMulti.isPending;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-green-500" />
            WhatsApp Catalog
          </h1>
          <p className="text-sm text-gray-500 mt-1">Send product cards directly in WhatsApp conversations.</p>
        </div>
        <div className="flex items-center gap-2">
          {selected.length > 0 && (
            <Button size="sm" onClick={openMulti} className="bg-green-600 hover:bg-green-700 text-white">
              <Send className="w-4 h-4 mr-2" />
              Send {selected.length} Product{selected.length > 1 ? 's' : ''}
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            {isFetching ? 'Refreshing…' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-900/10">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-700 dark:text-red-400">Failed to load catalog</p>
              <p className="text-xs text-red-600 dark:text-red-500 mt-0.5">{(error as Error).message}</p>
              <p className="text-xs text-red-500 mt-1">Make sure <code className="font-mono">catalog_id</code> is set in your WhatsApp integration credentials.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search + selection bar */}
      <div className="flex gap-3 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input className="pl-9" placeholder="Search products…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {selected.length > 0 && (
          <button onClick={() => setSelected([])} className="text-xs text-gray-500 hover:text-red-500 transition-colors">
            Clear selection ({selected.length})
          </button>
        )}
      </div>

      {/* Product grid */}
      {isLoading ? (
        <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1,2,3,4,5,6,7,8].map(i => (
            <div key={i} className="h-52 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : !error && filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">{products.length === 0 ? 'No products found in your catalog.' : 'No products match your search.'}</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map(p => {
            const isSelected = !!selected.find(x => x.retailer_id === p.retailer_id);
            const availCls = AVAIL_COLORS[p.availability || ''] || 'bg-gray-100 text-gray-600';
            return (
              <Card
                key={p.retailer_id}
                onClick={() => toggleSelect(p)}
                className={`cursor-pointer transition-all hover:shadow-md ${isSelected ? 'ring-2 ring-green-500 shadow-md' : ''}`}
              >
                {/* Product image */}
                <div className="relative h-36 bg-gray-100 dark:bg-gray-800 rounded-t-xl overflow-hidden">
                  {p.image_url ? (
                    <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ShoppingBag className="w-10 h-10 text-gray-300" />
                    </div>
                  )}
                  {isSelected && (
                    <div className="absolute top-2 right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    </div>
                  )}
                  {p.availability && (
                    <Badge className={`absolute bottom-2 left-2 ${availCls} border-0 text-xs`}>
                      {p.availability.replace('_', ' ')}
                    </Badge>
                  )}
                </div>
                <CardContent className="p-3">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-100 line-clamp-1">{p.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{p.retailer_id}</p>
                  {(p.price || p.sale_price) && (
                    <div className="flex items-center gap-2 mt-1.5">
                      {p.sale_price && p.sale_price !== p.price ? (
                        <>
                          <span className="text-sm font-semibold text-green-600">{p.currency} {p.sale_price}</span>
                          <span className="text-xs text-gray-400 line-through">{p.currency} {p.price}</span>
                        </>
                      ) : (
                        <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{p.currency} {p.price}</span>
                      )}
                    </div>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full mt-2 h-7 text-xs"
                    onClick={e => { e.stopPropagation(); openSingle(p); }}
                  >
                    <Send className="w-3 h-3 mr-1" />
                    Send
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Single product send dialog */}
      <Dialog open={sendMode === 'single'} onOpenChange={open => !open && setSendMode(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Send Product: {selected[0]?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {selected[0]?.image_url && (
              <img src={selected[0].image_url} alt={selected[0].name} className="w-full h-40 object-cover rounded-lg" />
            )}
            <div className="space-y-1.5">
              <Label>Recipient phone (with country code)</Label>
              <Input placeholder="+1234567890" value={sendForm.phone} onChange={e => setSendForm(f => ({ ...f, phone: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Message body</Label>
              <Textarea value={sendForm.bodyText} onChange={e => setSendForm(f => ({ ...f, bodyText: e.target.value }))} rows={2} />
            </div>
            <div className="space-y-1.5">
              <Label>Footer (optional)</Label>
              <Input placeholder="e.g. Tap to view full details" value={sendForm.footerText} onChange={e => setSendForm(f => ({ ...f, footerText: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSendMode(null)}>Cancel</Button>
            <Button onClick={() => sendSingle.mutate()} disabled={!sendForm.phone || isSending}>
              <Send className="w-4 h-4 mr-2" />{isSending ? 'Sending…' : 'Send'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Multi-product send dialog */}
      <Dialog open={sendMode === 'multi'} onOpenChange={open => !open && setSendMode(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Send Catalog ({selected.length} products)</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Recipient phone</Label>
              <Input placeholder="+1234567890" value={sendForm.phone} onChange={e => setSendForm(f => ({ ...f, phone: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Header text</Label>
                <Input value={sendForm.headerText} onChange={e => setSendForm(f => ({ ...f, headerText: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Footer (optional)</Label>
                <Input placeholder="Optional footer" value={sendForm.footerText} onChange={e => setSendForm(f => ({ ...f, footerText: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Body text</Label>
              <Textarea value={sendForm.bodyText} onChange={e => setSendForm(f => ({ ...f, bodyText: e.target.value }))} rows={2} />
            </div>

            {/* Sections */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Sections</Label>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setSections(s => [...s, { title: `Section ${s.length + 1}`, ids: [] }])}
                >
                  <Plus className="w-3 h-3 mr-1" />Add section
                </Button>
              </div>
              {sections.map((section, si) => (
                <div key={si} className="p-3 border rounded-lg space-y-2">
                  <div className="flex items-center gap-2">
                    <Input
                      value={section.title}
                      onChange={e => {
                        const next = [...sections];
                        next[si] = { ...next[si], title: e.target.value };
                        setSections(next);
                      }}
                      placeholder="Section title"
                      className="h-8 text-sm"
                    />
                    {sections.length > 1 && (
                      <button onClick={() => setSections(s => s.filter((_, i) => i !== si))} className="text-red-400 hover:text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {selected.map(p => {
                      const inSection = section.ids.includes(p.retailer_id);
                      return (
                        <button
                          key={p.retailer_id}
                          type="button"
                          onClick={() => {
                            const next = [...sections];
                            next[si] = {
                              ...next[si],
                              ids: inSection
                                ? next[si].ids.filter(id => id !== p.retailer_id)
                                : [...next[si].ids, p.retailer_id],
                            };
                            setSections(next);
                          }}
                          className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${
                            inSection
                              ? 'bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400'
                          }`}
                        >
                          {p.name}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-xs text-gray-400">{section.ids.length} product{section.ids.length !== 1 ? 's' : ''} in section</p>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSendMode(null)}>Cancel</Button>
            <Button onClick={() => sendMulti.mutate()} disabled={!sendForm.phone || isSending}>
              <Send className="w-4 h-4 mr-2" />{isSending ? 'Sending…' : 'Send Catalog'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
