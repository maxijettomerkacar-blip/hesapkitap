'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Courier } from '@/lib/types';

interface CourierComboboxProps {
  couriers: Courier[];
  value: string;
  onChange: (name: string, courierId: string | null) => void;
  label?: string;
  id?: string;
  compact?: boolean;
  placeholder?: string;
}

export function CourierCombobox({
  couriers,
  value,
  onChange,
  label = 'Kurye (Şoför)',
  id = 'courierCombo',
  compact = false,
  placeholder = 'Listeden seçin veya yazın...',
}: CourierComboboxProps) {
  const [input, setInput] = useState(value);
  const listId = `${id}-list`;

  useEffect(() => {
    setInput(value);
  }, [value]);

  const activeNames = useMemo(
    () => couriers.filter((c) => c.isActive).map((c) => c.name),
    [couriers],
  );

  const handleInput = (text: string) => {
    setInput(text);
    const match = couriers.find((c) => c.name.toLowerCase() === text.trim().toLowerCase());
    onChange(text, match?.id ?? null);
  };

  return (
    <div className={compact ? 'courier-combo-compact' : 'form-group'}>
      {!compact && <label htmlFor={id}>{label}</label>}
      <input
        id={id}
        list={listId}
        className="form-control"
        value={input}
        onChange={(e) => handleInput(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
      />
      <datalist id={listId}>
        {activeNames.map((name) => (
          <option key={name} value={name} />
        ))}
      </datalist>
      {!compact && (
        <span className="field-hint">Mevcut kurye seçilebilir veya yeni isim yazılabilir</span>
      )}
    </div>
  );
}
