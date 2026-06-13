'use client';

import { BusinessModal } from '@/components/BusinessModal';
import type { Business } from '@/lib/types';

interface BusinessSettingsModalProps {
  open: boolean;
  business: Business | null;
  regions: string[];
  onClose: () => void;
  onSave: (business: Business) => void;
}

export function BusinessSettingsModal(props: BusinessSettingsModalProps) {
  return <BusinessModal {...props} overlayClassName="drawer-stack-modal" />;
}
