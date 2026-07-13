import clsx from 'clsx';

export default function StatCard({ label, value, icon: Icon, accent = 'primary' }) {
  const accentClasses = {
    primary: 'bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-400',
    green: 'bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400',
    red: 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400',
  };

  return (
    <div className="card flex items-center gap-4 p-5">
      {Icon && (
        <div className={clsx('flex h-11 w-11 items-center justify-center rounded-xl', accentClasses[accent])}>
          <Icon size={22} />
        </div>
      )}
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
        <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{value}</p>
      </div>
    </div>
  );
}
