import { Check } from 'lucide-react';

export function VerifiedBadge() {
  return (
    <div className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-blue-500 text-white ml-1 flex-shrink-0">
      <Check className="w-3 h-3" />
    </div>
  );
}
