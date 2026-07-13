import { Loader2 } from 'lucide-react';
import clsx from 'clsx';

export default function Spinner({ className, size = 20 }) {
  return <Loader2 className={clsx('animate-spin text-primary-600', className)} size={size} />;
}
