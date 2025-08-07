import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface FormField {
  name: string;
  label: string;
  type: string;
}

interface WidgetFormProps {
  fields: FormField[];
  onSubmit: (data: Record<string, any>) => void;
  primaryColor: string;
  darkMode: boolean;
}

export const WidgetForm = ({ fields, onSubmit, primaryColor, darkMode }: WidgetFormProps) => {
  const { register, handleSubmit, formState: { errors } } = useForm();

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-3">
      {fields.map((field) => (
        <div key={field.name}>
          <Label
            htmlFor={field.name}
            className={cn(darkMode ? 'text-gray-300' : 'text-gray-700')}
          >
            {field.label}
          </Label>
          <Input
            id={field.name}
            type={field.type || 'text'}
            {...register(field.name, { required: true })}
            className={cn(
              'mt-1 w-full',
              darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-black'
            )}
          />
          {errors[field.name] && <p className="text-red-500 text-xs mt-1">This field is required.</p>}
        </div>
      ))}
      <Button type="submit" style={{ backgroundColor: primaryColor }} className="w-full text-white">
        Submit
      </Button>
    </form>
  );
};
