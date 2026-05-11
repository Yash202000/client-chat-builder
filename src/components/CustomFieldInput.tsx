import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { X, MapPin, Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CustomFieldDefinition {
  id: number;
  name: string;
  label: string;
  field_type: string;
  options?: { value: string; label: string; color?: string }[];
  required?: boolean;
  is_active?: boolean;
  group_name?: string;
}

export interface HierarchyNodeOption {
  id: number;
  name: string;
  code: string;
  type_id: number;
  path: string;
}

interface CustomFieldInputProps {
  definition: CustomFieldDefinition;
  value: any;
  onChange: (value: any) => void;
  users?: { id: number; full_name?: string; email: string }[];
  hierarchyNodes?: HierarchyNodeOption[];
  className?: string;
}

export function CustomFieldInput({ definition, value, onChange, users = [], hierarchyNodes = [], className }: CustomFieldInputProps) {
  const { field_type, options = [] } = definition;
  const [nodePickerOpen, setNodePickerOpen] = useState(false);

  if (field_type === "textarea") {
    return (
      <Textarea
        className={cn("resize-none", className)}
        rows={3}
        value={value ?? ""}
        onChange={e => onChange(e.target.value)}
      />
    );
  }

  if (field_type === "number" || field_type === "decimal") {
    return (
      <Input
        type="number"
        step={field_type === "decimal" ? "0.01" : "1"}
        className={className}
        value={value ?? ""}
        onChange={e => onChange(e.target.value === "" ? null : Number(e.target.value))}
      />
    );
  }

  if (field_type === "boolean") {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Checkbox
          id={`cf_${definition.name}`}
          checked={!!value}
          onCheckedChange={checked => onChange(!!checked)}
        />
        <Label htmlFor={`cf_${definition.name}`} className="font-normal text-sm cursor-pointer">
          {value ? "Yes" : "No"}
        </Label>
      </div>
    );
  }

  if (field_type === "date") {
    return (
      <Input
        type="date"
        className={className}
        value={value ?? ""}
        onChange={e => onChange(e.target.value || null)}
      />
    );
  }

  if (field_type === "datetime") {
    return (
      <Input
        type="datetime-local"
        className={className}
        value={value ?? ""}
        onChange={e => onChange(e.target.value || null)}
      />
    );
  }

  if (field_type === "dropdown") {
    return (
      <Select value={value ?? "__none__"} onValueChange={v => onChange(v === "__none__" ? null : v)}>
        <SelectTrigger className={className}>
          <SelectValue placeholder="Select…" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__none__">— None —</SelectItem>
          {options.map(opt => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.color && (
                <span
                  className="inline-block w-2 h-2 rounded-full mr-1.5"
                  style={{ backgroundColor: opt.color }}
                />
              )}
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  if (field_type === "multi_select") {
    const selected: string[] = Array.isArray(value) ? value : [];
    const toggle = (v: string) => {
      if (selected.includes(v)) onChange(selected.filter(s => s !== v));
      else onChange([...selected, v]);
    };
    return (
      <div className={cn("space-y-1", className)}>
        {options.map(opt => (
          <label key={opt.value} className="flex items-center gap-2 text-sm cursor-pointer hover:text-foreground">
            <Checkbox
              checked={selected.includes(opt.value)}
              onCheckedChange={() => toggle(opt.value)}
            />
            {opt.color && (
              <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: opt.color }} />
            )}
            {opt.label}
          </label>
        ))}
        {selected.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1">
            {selected.map(v => {
              const opt = options.find(o => o.value === v);
              return (
                <Badge key={v} variant="secondary" className="text-xs gap-1">
                  {opt?.label ?? v}
                  <button type="button" onClick={() => toggle(v)} className="hover:text-destructive">
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  if (field_type === "user_picker") {
    return (
      <Select
        value={value ? String(value) : "__none__"}
        onValueChange={v => onChange(v === "__none__" ? null : parseInt(v))}
      >
        <SelectTrigger className={className}>
          <SelectValue placeholder="Select user…" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__none__">— None —</SelectItem>
          {users.map(u => (
            <SelectItem key={u.id} value={String(u.id)}>
              {u.full_name || u.email}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  if (field_type === "hierarchy_node") {
    // options[0].value holds the hierarchy_type_id as string
    const typeId = options[0]?.value ? parseInt(options[0].value) : null;
    const nodes = typeId ? hierarchyNodes.filter(n => n.type_id === typeId) : hierarchyNodes;
    const selected = nodes.find(n => n.code === value);
    return (
      <Popover open={nodePickerOpen} onOpenChange={setNodePickerOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" role="combobox" className={cn("w-full justify-between font-normal text-sm h-9", className)}>
            <span className="truncate">{selected ? selected.name : <span className="text-muted-foreground">Select node…</span>}</span>
            <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-0" align="start">
          <Command>
            <CommandInput placeholder="Search…" className="h-8 text-xs" />
            <CommandList>
              <CommandEmpty>No nodes found.</CommandEmpty>
              <CommandGroup>
                <CommandItem value="__none__" onSelect={() => { onChange(null); setNodePickerOpen(false); }} className="text-xs">
                  <Check className={cn("mr-2 h-3.5 w-3.5", !value ? "opacity-100" : "opacity-0")} />
                  — None —
                </CommandItem>
              </CommandGroup>
              <CommandGroup heading={options[0]?.label ?? 'Nodes'}>
                {nodes.map(n => (
                  <CommandItem key={n.id} value={`${n.name} ${n.code}`} onSelect={() => { onChange(n.code); setNodePickerOpen(false); }} className="text-xs">
                    <Check className={cn("mr-2 h-3.5 w-3.5", value === n.code ? "opacity-100" : "opacity-0")} />
                    <span className="flex-1">{n.name}</span>
                    <code className="text-muted-foreground font-mono text-[10px] ml-2">{n.code}</code>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    );
  }

  if (field_type === "coordinates") {
    const coords = value && typeof value === "object" ? value : { lat: "", lng: "" };
    return (
      <div className={cn("flex gap-2 items-center", className)}>
        <div className="flex-1 relative">
          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-mono">Lat</span>
          <Input
            type="number"
            step="0.000001"
            min={-90}
            max={90}
            className="pl-8 text-sm"
            placeholder="e.g. 18.9217"
            value={coords.lat ?? ""}
            onChange={e => onChange({ ...coords, lat: e.target.value === "" ? null : parseFloat(e.target.value) })}
          />
        </div>
        <div className="flex-1 relative">
          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-mono">Lng</span>
          <Input
            type="number"
            step="0.000001"
            min={-180}
            max={180}
            className="pl-9 text-sm"
            placeholder="e.g. 72.8347"
            value={coords.lng ?? ""}
            onChange={e => onChange({ ...coords, lng: e.target.value === "" ? null : parseFloat(e.target.value) })}
          />
        </div>
      </div>
    );
  }

  // text, email, phone, url, and fallback
  const inputType = field_type === "email" ? "email" : field_type === "url" ? "url" : field_type === "phone" ? "tel" : "text";
  return (
    <Input
      type={inputType}
      className={className}
      value={value ?? ""}
      onChange={e => onChange(e.target.value || null)}
    />
  );
}

// Display-only: render a custom field value as a readable string
export function formatCustomFieldValue(
  value: any,
  definition?: CustomFieldDefinition
): string {
  if (value === null || value === undefined || value === "") return "—";
  if (!definition) return String(value);
  const { field_type, options = [] } = definition;
  if (field_type === "boolean") return value ? "Yes" : "No";
  if (field_type === "dropdown") {
    const opt = options.find(o => o.value === String(value));
    return opt?.label ?? String(value);
  }
  if (field_type === "multi_select") {
    const arr = Array.isArray(value) ? value : [];
    return arr.map(v => options.find(o => o.value === v)?.label ?? v).join(", ") || "—";
  }
  if (field_type === "date" || field_type === "datetime") {
    try { return new Date(value).toLocaleDateString(); } catch { return String(value); }
  }
  if (field_type === "hierarchy_node") {
    // value is a node code; just return it (caller can resolve to name if they have nodes)
    return String(value);
  }
  if (field_type === "coordinates") {
    if (value && typeof value === "object" && value.lat != null && value.lng != null) {
      return `${Number(value.lat).toFixed(6)}, ${Number(value.lng).toFixed(6)}`;
    }
    return "—";
  }
  return String(value);
}

// Render coordinates as a clickable map link
export function CoordinatesDisplay({ value }: { value: any }) {
  if (!value || typeof value !== "object" || value.lat == null || value.lng == null) {
    return <span className="text-muted-foreground">—</span>;
  }
  const lat = Number(value.lat).toFixed(6);
  const lng = Number(value.lng).toFixed(6);
  const mapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;
  return (
    <a
      href={mapsUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
    >
      <MapPin className="h-3.5 w-3.5" />
      {lat}, {lng}
    </a>
  );
}
