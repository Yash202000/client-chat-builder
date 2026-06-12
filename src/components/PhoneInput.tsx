import { useState, useMemo } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface Country {
  code: string;   // ISO 3166-1 alpha-2
  name: string;
  dial: string;   // e.g. "+91"
  flag: string;   // emoji flag
}

const COUNTRIES: Country[] = [
  // Top picks first
  { code: "IN", name: "India",          dial: "+91",  flag: "🇮🇳" },
  { code: "US", name: "United States",  dial: "+1",   flag: "🇺🇸" },
  { code: "GB", name: "United Kingdom", dial: "+44",  flag: "🇬🇧" },
  { code: "AU", name: "Australia",      dial: "+61",  flag: "🇦🇺" },
  { code: "CA", name: "Canada",         dial: "+1",   flag: "🇨🇦" },
  { code: "AE", name: "UAE",            dial: "+971", flag: "🇦🇪" },
  { code: "SG", name: "Singapore",      dial: "+65",  flag: "🇸🇬" },
  // Rest alphabetically
  { code: "AF", name: "Afghanistan",    dial: "+93",  flag: "🇦🇫" },
  { code: "AL", name: "Albania",        dial: "+355", flag: "🇦🇱" },
  { code: "DZ", name: "Algeria",        dial: "+213", flag: "🇩🇿" },
  { code: "AR", name: "Argentina",      dial: "+54",  flag: "🇦🇷" },
  { code: "AT", name: "Austria",        dial: "+43",  flag: "🇦🇹" },
  { code: "AZ", name: "Azerbaijan",     dial: "+994", flag: "🇦🇿" },
  { code: "BH", name: "Bahrain",        dial: "+973", flag: "🇧🇭" },
  { code: "BD", name: "Bangladesh",     dial: "+880", flag: "🇧🇩" },
  { code: "BE", name: "Belgium",        dial: "+32",  flag: "🇧🇪" },
  { code: "BR", name: "Brazil",         dial: "+55",  flag: "🇧🇷" },
  { code: "BG", name: "Bulgaria",       dial: "+359", flag: "🇧🇬" },
  { code: "KH", name: "Cambodia",       dial: "+855", flag: "🇰🇭" },
  { code: "CM", name: "Cameroon",       dial: "+237", flag: "🇨🇲" },
  { code: "CL", name: "Chile",          dial: "+56",  flag: "🇨🇱" },
  { code: "CN", name: "China",          dial: "+86",  flag: "🇨🇳" },
  { code: "CO", name: "Colombia",       dial: "+57",  flag: "🇨🇴" },
  { code: "HR", name: "Croatia",        dial: "+385", flag: "🇭🇷" },
  { code: "CY", name: "Cyprus",         dial: "+357", flag: "🇨🇾" },
  { code: "CZ", name: "Czech Republic", dial: "+420", flag: "🇨🇿" },
  { code: "DK", name: "Denmark",        dial: "+45",  flag: "🇩🇰" },
  { code: "EG", name: "Egypt",          dial: "+20",  flag: "🇪🇬" },
  { code: "ET", name: "Ethiopia",       dial: "+251", flag: "🇪🇹" },
  { code: "FI", name: "Finland",        dial: "+358", flag: "🇫🇮" },
  { code: "FR", name: "France",         dial: "+33",  flag: "🇫🇷" },
  { code: "GE", name: "Georgia",        dial: "+995", flag: "🇬🇪" },
  { code: "DE", name: "Germany",        dial: "+49",  flag: "🇩🇪" },
  { code: "GH", name: "Ghana",          dial: "+233", flag: "🇬🇭" },
  { code: "GR", name: "Greece",         dial: "+30",  flag: "🇬🇷" },
  { code: "HK", name: "Hong Kong",      dial: "+852", flag: "🇭🇰" },
  { code: "HU", name: "Hungary",        dial: "+36",  flag: "🇭🇺" },
  { code: "ID", name: "Indonesia",      dial: "+62",  flag: "🇮🇩" },
  { code: "IR", name: "Iran",           dial: "+98",  flag: "🇮🇷" },
  { code: "IQ", name: "Iraq",           dial: "+964", flag: "🇮🇶" },
  { code: "IE", name: "Ireland",        dial: "+353", flag: "🇮🇪" },
  { code: "IL", name: "Israel",         dial: "+972", flag: "🇮🇱" },
  { code: "IT", name: "Italy",          dial: "+39",  flag: "🇮🇹" },
  { code: "JP", name: "Japan",          dial: "+81",  flag: "🇯🇵" },
  { code: "JO", name: "Jordan",         dial: "+962", flag: "🇯🇴" },
  { code: "KZ", name: "Kazakhstan",     dial: "+7",   flag: "🇰🇿" },
  { code: "KE", name: "Kenya",          dial: "+254", flag: "🇰🇪" },
  { code: "KW", name: "Kuwait",         dial: "+965", flag: "🇰🇼" },
  { code: "LB", name: "Lebanon",        dial: "+961", flag: "🇱🇧" },
  { code: "MY", name: "Malaysia",       dial: "+60",  flag: "🇲🇾" },
  { code: "MX", name: "Mexico",         dial: "+52",  flag: "🇲🇽" },
  { code: "MA", name: "Morocco",        dial: "+212", flag: "🇲🇦" },
  { code: "NL", name: "Netherlands",    dial: "+31",  flag: "🇳🇱" },
  { code: "NZ", name: "New Zealand",    dial: "+64",  flag: "🇳🇿" },
  { code: "NG", name: "Nigeria",        dial: "+234", flag: "🇳🇬" },
  { code: "NO", name: "Norway",         dial: "+47",  flag: "🇳🇴" },
  { code: "OM", name: "Oman",           dial: "+968", flag: "🇴🇲" },
  { code: "PK", name: "Pakistan",       dial: "+92",  flag: "🇵🇰" },
  { code: "PE", name: "Peru",           dial: "+51",  flag: "🇵🇪" },
  { code: "PH", name: "Philippines",    dial: "+63",  flag: "🇵🇭" },
  { code: "PL", name: "Poland",         dial: "+48",  flag: "🇵🇱" },
  { code: "PT", name: "Portugal",       dial: "+351", flag: "🇵🇹" },
  { code: "QA", name: "Qatar",          dial: "+974", flag: "🇶🇦" },
  { code: "RO", name: "Romania",        dial: "+40",  flag: "🇷🇴" },
  { code: "RU", name: "Russia",         dial: "+7",   flag: "🇷🇺" },
  { code: "SA", name: "Saudi Arabia",   dial: "+966", flag: "🇸🇦" },
  { code: "RS", name: "Serbia",         dial: "+381", flag: "🇷🇸" },
  { code: "ZA", name: "South Africa",   dial: "+27",  flag: "🇿🇦" },
  { code: "KR", name: "South Korea",    dial: "+82",  flag: "🇰🇷" },
  { code: "ES", name: "Spain",          dial: "+34",  flag: "🇪🇸" },
  { code: "LK", name: "Sri Lanka",      dial: "+94",  flag: "🇱🇰" },
  { code: "SE", name: "Sweden",         dial: "+46",  flag: "🇸🇪" },
  { code: "CH", name: "Switzerland",    dial: "+41",  flag: "🇨🇭" },
  { code: "TW", name: "Taiwan",         dial: "+886", flag: "🇹🇼" },
  { code: "TZ", name: "Tanzania",       dial: "+255", flag: "🇹🇿" },
  { code: "TH", name: "Thailand",       dial: "+66",  flag: "🇹🇭" },
  { code: "TN", name: "Tunisia",        dial: "+216", flag: "🇹🇳" },
  { code: "TR", name: "Turkey",         dial: "+90",  flag: "🇹🇷" },
  { code: "UA", name: "Ukraine",        dial: "+380", flag: "🇺🇦" },
  { code: "UG", name: "Uganda",         dial: "+256", flag: "🇺🇬" },
  { code: "UZ", name: "Uzbekistan",     dial: "+998", flag: "🇺🇿" },
  { code: "VN", name: "Vietnam",        dial: "+84",  flag: "🇻🇳" },
  { code: "YE", name: "Yemen",          dial: "+967", flag: "🇾🇪" },
  { code: "ZM", name: "Zambia",         dial: "+260", flag: "🇿🇲" },
  { code: "ZW", name: "Zimbabwe",       dial: "+263", flag: "🇿🇼" },
];

// Top picks shown separately before the full list
const TOP_CODES = ["IN", "US", "GB", "AU", "CA", "AE", "SG"];

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
  inputClassName?: string;
  placeholder?: string;
  id?: string;
}

export function PhoneInput({
  value,
  onChange,
  disabled,
  className,
  inputClassName,
  placeholder = "000 000 0000",
  id,
}: PhoneInputProps) {
  const [open, setOpen] = useState(false);

  // Parse stored value into dial code + number
  const { country, localNumber } = useMemo(() => {
    const match = COUNTRIES.find((c) => value.startsWith(c.dial));
    if (match) {
      return { country: match, localNumber: value.slice(match.dial.length).trimStart() };
    }
    return { country: COUNTRIES[0], localNumber: value };
  }, [value]);

  const handleCountrySelect = (c: Country) => {
    onChange(`${c.dial} ${localNumber}`.trim());
    setOpen(false);
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const num = e.target.value.replace(/[^\d\s\-().]/g, "");
    onChange(`${country.dial} ${num}`.trim());
  };

  const topCountries = COUNTRIES.filter((c) => TOP_CODES.includes(c.code));
  const otherCountries = COUNTRIES.filter((c) => !TOP_CODES.includes(c.code));

  return (
    <div className={cn("flex h-11 w-full rounded-xl border border-input bg-background shadow-sm overflow-hidden focus-within:ring-1 focus-within:ring-violet-500 focus-within:border-violet-500", className)}>
      {/* Country picker trigger */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            role="combobox"
            disabled={disabled}
            className="flex items-center gap-1.5 h-full px-3 rounded-none border-r border-input bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 shrink-0 font-normal"
          >
            <span className="text-lg leading-none">{country.flag}</span>
            <span className="text-sm text-slate-600 dark:text-slate-300">{country.dial}</span>
            <ChevronsUpDown className="h-3 w-3 text-slate-400 shrink-0" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-0" align="start">
          <Command>
            <CommandInput placeholder="Search country..." />
            <CommandList className="max-h-60">
              <CommandEmpty>No country found.</CommandEmpty>
              <CommandGroup heading="Popular">
                {topCountries.map((c) => (
                  <CommandItem
                    key={c.code}
                    value={`${c.name} ${c.dial}`}
                    onSelect={() => handleCountrySelect(c)}
                    className="gap-2 cursor-pointer"
                  >
                    <span className="text-base">{c.flag}</span>
                    <span className="flex-1 text-sm">{c.name}</span>
                    <span className="text-xs text-slate-400">{c.dial}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandGroup heading="All countries">
                {otherCountries.map((c) => (
                  <CommandItem
                    key={c.code}
                    value={`${c.name} ${c.dial}`}
                    onSelect={() => handleCountrySelect(c)}
                    className="gap-2 cursor-pointer"
                  >
                    <span className="text-base">{c.flag}</span>
                    <span className="flex-1 text-sm">{c.name}</span>
                    <span className="text-xs text-slate-400">{c.dial}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Number input */}
      <input
        id={id}
        type="tel"
        placeholder={placeholder}
        value={localNumber}
        onChange={handleNumberChange}
        disabled={disabled}
        className={cn(
          "flex-1 min-w-0 px-3 text-sm bg-transparent outline-none placeholder:text-slate-400 dark:text-white disabled:opacity-50",
          inputClassName
        )}
      />
    </div>
  );
}
