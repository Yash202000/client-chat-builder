import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { getPublicForm, submitPublicForm, CaptureForm, FormField } from '@/services/formService';

export default function PublicFormPage() {
  const { slug } = useParams<{ slug: string }>();
  const [form, setForm] = useState<CaptureForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!slug) return;
    getPublicForm(slug)
      .then(f => { setForm(f); setLoading(false); })
      .catch(() => { setNotFound(true); setLoading(false); });
  }, [slug]);

  const validate = (): boolean => {
    if (!form) return false;
    const errs: Record<string, string> = {};
    for (const field of form.fields as FormField[]) {
      if (field.required && !values[field.id]?.trim()) {
        errs[field.id] = `${field.label} is required`;
      }
      if (field.type === 'email' && values[field.id]) {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values[field.id])) {
          errs[field.id] = 'Enter a valid email address';
        }
      }
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form || !validate()) return;
    setSubmitting(true);
    try {
      const result = await submitPublicForm(slug!, values);
      setSuccessMessage(result.message ?? "Thank you! We'll be in touch.");
      setSubmitted(true);
      if (result.redirect_url) {
        setTimeout(() => window.location.href = result.redirect_url, 1500);
      }
    } catch {
      setErrors({ _form: 'Something went wrong. Please try again.' });
    } finally { setSubmitting(false); }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
    </div>
  );

  if (notFound) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <p className="text-lg font-medium text-gray-900">Form not found</p>
        <p className="text-sm text-gray-500 mt-1">This form may have been removed or is no longer active.</p>
      </div>
    </div>
  );

  const settings = form!.settings ?? {};
  const primary = (settings as any).primary_color ?? '#6366f1';

  if (submitted) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 max-w-md w-full text-center">
        <div className="h-14 w-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: `${primary}20` }}>
          <CheckCircle2 className="h-7 w-7" style={{ color: primary }} />
        </div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Submitted!</h2>
        <p className="text-sm text-gray-500">{successMessage}</p>
      </div>
    </div>
  );

  const fields = form!.fields as FormField[];

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-lg w-full">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-gray-900">{form!.name}</h1>
          {form!.description && <p className="text-sm text-gray-500 mt-1">{form!.description}</p>}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {fields.map(field => (
            <div key={field.id} className={field.width === 'half' ? 'w-1/2' : 'w-full'}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </label>

              {field.type === 'textarea' ? (
                <textarea
                  placeholder={field.placeholder}
                  value={values[field.id] ?? ''}
                  onChange={e => setValues(prev => ({ ...prev, [field.id]: e.target.value }))}
                  rows={4}
                  className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 transition-shadow resize-none ${
                    errors[field.id] ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 focus:ring-indigo-100'
                  }`}
                  style={{ '--tw-ring-color': `${primary}40` } as any}
                />
              ) : field.type === 'select' ? (
                <select
                  value={values[field.id] ?? ''}
                  onChange={e => setValues(prev => ({ ...prev, [field.id]: e.target.value }))}
                  className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none bg-white ${
                    errors[field.id] ? 'border-red-300' : 'border-gray-200'
                  }`}
                >
                  <option value="">{field.placeholder ?? 'Select…'}</option>
                  {field.options?.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              ) : field.type === 'checkbox' ? (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={values[field.id] === 'true'}
                    onChange={e => setValues(prev => ({ ...prev, [field.id]: e.target.checked ? 'true' : '' }))}
                    className="rounded border-gray-300 h-4 w-4"
                    style={{ accentColor: primary }}
                  />
                  <span className="text-sm text-gray-600">{field.placeholder ?? field.label}</span>
                </label>
              ) : (
                <input
                  type={field.type === 'email' ? 'email' : field.type === 'phone' ? 'tel' : 'text'}
                  placeholder={field.placeholder}
                  value={values[field.id] ?? ''}
                  onChange={e => setValues(prev => ({ ...prev, [field.id]: e.target.value }))}
                  className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 transition-shadow ${
                    errors[field.id] ? 'border-red-300 focus:ring-red-200' : 'border-gray-200'
                  }`}
                />
              )}

              {errors[field.id] && (
                <p className="text-xs text-red-500 mt-1">{errors[field.id]}</p>
              )}
            </div>
          ))}

          {errors._form && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{errors._form}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 rounded-lg text-white text-sm font-medium transition-opacity disabled:opacity-70 flex items-center justify-center gap-2 mt-2"
            style={{ backgroundColor: primary }}
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {(settings as any).submit_label ?? 'Submit'}
          </button>
        </form>
      </div>
    </div>
  );
}
