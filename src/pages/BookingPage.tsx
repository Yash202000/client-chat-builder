import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format, addDays, isBefore, startOfDay } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Clock, MapPin, User, CheckCircle, ChevronLeft } from "lucide-react";

const API = import.meta.env.VITE_API_URL ?? "";

interface BookingLink {
  id: number;
  slug: string;
  title: string;
  description?: string;
  location?: string;
  duration_minutes: number;
  timezone: string;
  max_advance_days: number;
  min_notice_hours: number;
  color?: string;
  is_active: boolean;
  owner_name?: string;
}

interface TimeSlot {
  start: string;
  end: string;
}

type Step = "date" | "time" | "form" | "confirm";

export default function BookingPage() {
  const { slug } = useParams<{ slug: string }>();
  const [step, setStep] = useState<Step>("date");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", notes: "" });
  const [bookedSlot, setBookedSlot] = useState<any>(null);

  const { data: link, isLoading, error } = useQuery<BookingLink>({
    queryKey: ["public-booking-link", slug],
    queryFn: async () => {
      const res = await fetch(`${API}/api/v1/booking-links/public/${slug}`);
      if (!res.ok) throw new Error("Booking link not found");
      return res.json();
    },
    enabled: !!slug,
  });

  const { data: slotsData, isFetching: loadingSlots } = useQuery<{ slots: TimeSlot[] }>({
    queryKey: ["booking-slots", slug, selectedDate && format(selectedDate, "yyyy-MM-dd")],
    queryFn: async () => {
      const d = format(selectedDate!, "yyyy-MM-dd");
      const res = await fetch(`${API}/api/v1/booking-links/public/${slug}/slots?date=${d}`);
      if (!res.ok) throw new Error("Failed to fetch slots");
      return res.json();
    },
    enabled: !!slug && !!selectedDate && step === "time",
  });

  const bookMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${API}/api/v1/booking-links/public/${slug}/book`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          start_time: selectedSlot!.start,
          booker_name: form.name,
          booker_email: form.email,
          booker_phone: form.phone || undefined,
          booker_notes: form.notes || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Booking failed");
      }
      return res.json();
    },
    onSuccess: (data) => {
      setBookedSlot(data);
      setStep("confirm");
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (error || !link) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-800">Booking Link Not Found</h2>
          <p className="text-gray-500 mt-2">This link may have been deactivated or doesn't exist.</p>
        </div>
      </div>
    );
  }

  if (!link.is_active) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-800">This booking link is no longer active.</h2>
        </div>
      </div>
    );
  }

  const accentColor = link.color || "#6366f1";
  const today = startOfDay(new Date());
  const maxDate = addDays(today, link.max_advance_days);

  const fmtTime = (iso: string) => {
    const d = new Date(iso + (iso.endsWith("Z") ? "" : "Z"));
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true });
  };

  const fmtDate = (iso: string) => {
    const d = new Date(iso + (iso.endsWith("Z") ? "" : "Z"));
    return d.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-start justify-center py-12 px-4">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="flex flex-col md:flex-row">
          {/* Left panel — booking details */}
          <div className="w-full md:w-72 bg-gray-50 border-r border-gray-100 p-6 flex-shrink-0">
            <div
              className="w-10 h-10 rounded-full mb-4"
              style={{ backgroundColor: accentColor }}
            />
            {link.owner_name && (
              <p className="text-sm text-gray-500 mb-1 flex items-center gap-1">
                <User className="w-3 h-3" /> {link.owner_name}
              </p>
            )}
            <h1 className="text-xl font-bold text-gray-900 mb-2">{link.title}</h1>
            {link.description && (
              <p className="text-sm text-gray-600 mb-4">{link.description}</p>
            )}
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400" />
                <span>{link.duration_minutes} minutes</span>
              </div>
              {link.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span>{link.location}</span>
                </div>
              )}
            </div>
            {step !== "date" && step !== "confirm" && (
              <div className="mt-6 text-sm text-gray-500">
                <button
                  className="flex items-center gap-1 text-indigo-600 hover:underline"
                  onClick={() => {
                    if (step === "form") setStep("time");
                    else if (step === "time") setStep("date");
                  }}
                >
                  <ChevronLeft className="w-3 h-3" /> Back
                </button>
              </div>
            )}
            {selectedDate && step !== "date" && step !== "confirm" && (
              <div className="mt-4 p-3 bg-white rounded-lg border border-gray-100 text-sm">
                <p className="font-medium text-gray-800">{format(selectedDate, "EEEE, MMMM d")}</p>
                {selectedSlot && (
                  <p className="text-gray-500 mt-1">
                    {fmtTime(selectedSlot.start)} – {fmtTime(selectedSlot.end)}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Right panel — steps */}
          <div className="flex-1 p-6">
            {/* Step: Date */}
            {step === "date" && (
              <div>
                <h2 className="text-base font-semibold text-gray-800 mb-4">Select a date</h2>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(d) => {
                    if (!d) return;
                    setSelectedDate(d);
                    setSelectedSlot(null);
                    setStep("time");
                  }}
                  disabled={(d) =>
                    isBefore(startOfDay(d), today) || isBefore(maxDate, startOfDay(d))
                  }
                  className="rounded-lg border-0"
                />
              </div>
            )}

            {/* Step: Time */}
            {step === "time" && selectedDate && (
              <div>
                <h2 className="text-base font-semibold text-gray-800 mb-1">
                  {format(selectedDate, "EEEE, MMMM d")}
                </h2>
                <p className="text-sm text-gray-500 mb-4">{link.timezone}</p>
                {loadingSlots ? (
                  <div className="flex justify-center py-10">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600" />
                  </div>
                ) : !slotsData?.slots.length ? (
                  <div className="text-center py-10 text-gray-500">
                    <p>No available slots on this day.</p>
                    <button
                      className="mt-2 text-indigo-600 hover:underline text-sm"
                      onClick={() => setStep("date")}
                    >
                      Choose another date
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2 max-h-80 overflow-y-auto pr-1">
                    {slotsData.slots.map((slot) => (
                      <button
                        key={slot.start}
                        onClick={() => {
                          setSelectedSlot(slot);
                          setStep("form");
                        }}
                        className="px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:border-indigo-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                        style={
                          selectedSlot?.start === slot.start
                            ? { borderColor: accentColor, color: accentColor, backgroundColor: `${accentColor}10` }
                            : {}
                        }
                      >
                        {fmtTime(slot.start)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Step: Form */}
            {step === "form" && selectedSlot && (
              <div>
                <h2 className="text-base font-semibold text-gray-800 mb-4">Enter your details</h2>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Jane Smith"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="jane@example.com"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone (optional)</Label>
                    <Input
                      id="phone"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="+1 555 000 0000"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="notes">Notes (optional)</Label>
                    <Textarea
                      id="notes"
                      value={form.notes}
                      onChange={(e) => setForm({ ...form, notes: e.target.value })}
                      placeholder="Anything you'd like to share before the meeting…"
                      className="mt-1"
                      rows={3}
                    />
                  </div>
                  {bookMutation.isError && (
                    <p className="text-sm text-red-600">
                      {(bookMutation.error as Error).message}
                    </p>
                  )}
                  <Button
                    className="w-full"
                    style={{ backgroundColor: accentColor, borderColor: accentColor }}
                    disabled={!form.name || !form.email || bookMutation.isPending}
                    onClick={() => bookMutation.mutate()}
                  >
                    {bookMutation.isPending ? "Booking…" : "Confirm Booking"}
                  </Button>
                </div>
              </div>
            )}

            {/* Step: Confirmation */}
            {step === "confirm" && bookedSlot && (
              <div className="flex flex-col items-center justify-center text-center py-8">
                <CheckCircle className="w-14 h-14 text-green-500 mb-4" />
                <h2 className="text-xl font-bold text-gray-900 mb-2">You're booked!</h2>
                <p className="text-gray-600 mb-6">
                  A confirmation has been sent to <strong>{form.email}</strong>.
                </p>
                <Separator className="w-full mb-4" />
                <div className="text-sm text-gray-700 space-y-1">
                  <p className="font-semibold text-gray-900">{link.title}</p>
                  <p>{fmtDate(bookedSlot.start_time)}</p>
                  <p>
                    {fmtTime(bookedSlot.start_time)} – {fmtTime(bookedSlot.end_time)}
                  </p>
                  {link.location && (
                    <p className="flex items-center justify-center gap-1 text-gray-500">
                      <MapPin className="w-3 h-3" /> {link.location}
                    </p>
                  )}
                </div>
                <Badge className="mt-4" variant="secondary">
                  {bookedSlot.status}
                </Badge>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
