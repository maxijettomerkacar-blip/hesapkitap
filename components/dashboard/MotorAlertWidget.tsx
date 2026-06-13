'use client';

import Link from 'next/link';
import { countMotorsWithAlerts } from '@/lib/motor-alerts';
import type { Motor } from '@/lib/types';

interface MotorAlertWidgetProps {
  motors: Motor[];
}

export function MotorAlertWidget({ motors }: MotorAlertWidgetProps) {
  const count = countMotorsWithAlerts(motors);
  if (count === 0) return null;

  return (
    <div className={`motor-alert-widget ${count > 0 ? 'motor-alert-widget--danger' : ''}`}>
      <span>
        <strong>{count}</strong> motor için muayene/sigorta uyarısı var.
      </span>
      <Link href="/dashboard/motors" className="btn btn-warning btn-sm">
        Motorları Gör
      </Link>
    </div>
  );
}
