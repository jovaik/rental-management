'use client';

interface InvoiceStatusBadgeProps {
  status: string;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  PENDING: {
    label: 'Pendiente',
    className: 'bg-yellow-100 text-yellow-800',
  },
  PAID: {
    label: 'Pagada',
    className: 'bg-green-100 text-green-800',
  },
  CANCELLED: {
    label: 'Cancelada',
    className: 'bg-red-100 text-red-800',
  },
  REFUNDED: {
    label: 'Reembolsada',
    className: 'bg-purple-100 text-purple-800',
  },
};

export function InvoiceStatusBadge({ status }: InvoiceStatusBadgeProps) {
  const config = statusConfig[status] || {
    label: status,
    className: 'bg-gray-100 text-gray-800',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        config.className
      }`}
    >
      {config.label}
    </span>
  );
}
