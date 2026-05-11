import { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';

export interface HierarchyTypeData {
  id: number;
  name: string;
}
export interface HierarchyNodeData {
  id: number;
  name: string;
  code: string;
  type_id: number;
  path: string;
}

interface Props {
  /** Currently selected node codes */
  value: string[];
  onChange: (codes: string[]) => void;
  hierarchyTypes: HierarchyTypeData[];
  hierarchyNodes: HierarchyNodeData[];
  /** Optional: only show certain type IDs */
  typeFilter?: number[];
}

export default function HierarchyNodePicker({
  value,
  onChange,
  hierarchyTypes,
  hierarchyNodes,
  typeFilter,
}: Props) {
  const [expandedTypeId, setExpandedTypeId] = useState<number | null>(null);
  const [search, setSearch] = useState('');

  const selectedSet = new Set(value);
  const types = typeFilter
    ? hierarchyTypes.filter(t => typeFilter.includes(t.id))
    : hierarchyTypes;

  const toggle = (code: string) => {
    if (selectedSet.has(code)) {
      onChange(value.filter(c => c !== code));
    } else {
      onChange([...value, code]);
    }
  };

  const removeAll = (typeId: number) => {
    const typeCodes = new Set(hierarchyNodes.filter(n => n.type_id === typeId).map(n => n.code));
    onChange(value.filter(c => !typeCodes.has(c)));
  };

  if (types.length === 0) {
    return (
      <p className="text-xs text-muted-foreground italic">
        No hierarchy types found. Run the hierarchy seed first.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {types.map(ht => {
        const typeNodes = hierarchyNodes.filter(n => n.type_id === ht.id);
        const selectedInType = value.filter(code => typeNodes.some(n => n.code === code));
        const isExpanded = expandedTypeId === ht.id;

        const filtered = typeNodes.filter(
          n =>
            search === '' ||
            n.name.toLowerCase().includes(search.toLowerCase()) ||
            n.code.toLowerCase().includes(search.toLowerCase())
        );

        return (
          <div key={ht.id} className="rounded-lg border border-input overflow-hidden">
            {/* Type header */}
            <div className="flex items-center gap-2 px-2.5 py-1.5 bg-muted/40">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide flex-1">
                {ht.name}
                {selectedInType.length > 0 && (
                  <span className="ml-1.5 text-primary normal-case font-normal">
                    ({selectedInType.length} selected)
                  </span>
                )}
              </span>
              {selectedInType.length > 0 && (
                <button
                  type="button"
                  className="text-[10px] text-muted-foreground hover:text-destructive transition-colors mr-1"
                  onClick={() => removeAll(ht.id)}
                >
                  Clear
                </button>
              )}
              <button
                type="button"
                className={`h-5 w-5 flex items-center justify-center rounded transition-colors text-muted-foreground ${
                  isExpanded ? 'bg-primary/10 text-primary' : 'hover:bg-accent'
                }`}
                onClick={() => {
                  setSearch('');
                  setExpandedTypeId(isExpanded ? null : ht.id);
                }}
              >
                {isExpanded ? <X className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
              </button>
            </div>

            {/* Selected chips */}
            {selectedInType.length > 0 && (
              <div className="flex flex-wrap gap-1.5 px-2.5 py-2">
                {selectedInType.map(code => {
                  const node = typeNodes.find(n => n.code === code);
                  return (
                    <span
                      key={code}
                      className="inline-flex items-center gap-1 pl-2 pr-1 py-0.5 rounded-full text-[11px] bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                    >
                      {node?.name ?? code}
                      <button
                        type="button"
                        className="hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5 transition-colors"
                        onClick={() => toggle(code)}
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </span>
                  );
                })}
              </div>
            )}

            {/* Inline picker */}
            {isExpanded && (
              <div className="border-t border-input">
                <div className="flex items-center gap-2 px-2 py-1.5 border-b border-input">
                  <Input
                    placeholder="Search nodes…"
                    className="h-6 text-xs border-0 shadow-none focus-visible:ring-0 px-0 bg-transparent flex-1"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    autoFocus
                  />
                  {search && (
                    <button
                      type="button"
                      className="text-[10px] text-muted-foreground hover:text-foreground"
                      onClick={() => setSearch('')}
                    >
                      Clear
                    </button>
                  )}
                </div>

                <div className="max-h-48 overflow-y-auto">
                  {filtered.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-3">No nodes found</p>
                  ) : (
                    filtered.map(n => {
                      const depth = n.path ? n.path.split('.').length - 1 : 0;
                      const isSelected = selectedSet.has(n.code);
                      return (
                        <label
                          key={n.id}
                          className={`flex items-center gap-2 px-2 py-1.5 cursor-pointer text-xs hover:bg-accent transition-colors ${
                            isSelected ? 'bg-accent/50' : ''
                          }`}
                        >
                          <input
                            type="checkbox"
                            className="h-3.5 w-3.5 shrink-0 accent-primary"
                            checked={isSelected}
                            onChange={() => toggle(n.code)}
                          />
                          <span
                            className="flex items-center gap-1 flex-1 min-w-0"
                            style={{ paddingLeft: `${depth * 10}px` }}
                          >
                            {depth > 0 && (
                              <span className="text-muted-foreground text-[10px] shrink-0">└</span>
                            )}
                            <span className="truncate">{n.name}</span>
                            <span className="text-muted-foreground shrink-0 text-[10px]">
                              ({n.code})
                            </span>
                          </span>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}

      {value.length === 0 && (
        <p className="text-xs text-muted-foreground italic text-center py-1">
          No nodes selected — expand a type above to pick nodes.
        </p>
      )}
    </div>
  );
}
