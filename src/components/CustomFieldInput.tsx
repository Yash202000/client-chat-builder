import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
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

interface CustomFieldInputProps {
  definition: CustomFieldDefinition;
  value: any;
  onChange: (value: any) => void;
  users?: { id: number; full_name?: string; email: string }[];
  className?: string;
}

export function CustomFieldInput({ definition, value, onChange, users = [], className }: CustomFieldInputProps) {
  const { field_type, options = [] } = definition;

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
  return String(value);
}
