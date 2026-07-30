// Maps domain status values to the shared semantic badge classes
// (index.css) so the same status always renders the same color everywhere.
export const ATTENDANCE_STATUS_BADGE = {
  present: 'badge-success',
  late: 'badge-warning',
  half_day: 'badge-info',
  excused: 'badge-neutral',
  absent: 'badge-danger',
};

export const INVOICE_STATUS_BADGE = {
  pending: 'badge-neutral',
  partial: 'badge-warning',
  paid: 'badge-success',
  overdue: 'badge-danger',
  cancelled: 'badge-neutral',
};
