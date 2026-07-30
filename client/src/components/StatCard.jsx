import clsx from 'clsx';

export default function StatCard({ label, value, icon: Icon, accent = 'primary' }) {
  const accentClasses = {
    primary: 'bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-400',
    green: 'bg-success-50 text-success-600 dark:bg-success-500/10 dark:text-success-400',
    amber: 'bg-warning-50 text-warning-600 dark:bg-warning-500/10 dark:text-warning-400',
    red: 'bg-danger-50 text-danger-600 dark:bg-danger-500/10 dark:text-danger-400',
  };

  return (
    <div className="card flex items-center gap-4 p-5 transition-shadow hover:shadow-md">
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
