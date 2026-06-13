'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/Toast';

interface MotorOpsPasswordModalProps {
  open: boolean;
  onClose: () => void;
}

export function MotorOpsPasswordModal({ open, onClose }: MotorOpsPasswordModalProps) {
  const { showToast } = useToast();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const handleClose = () => {
    setNewPassword('');
    setConfirmPassword('');
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      showToast('Şifre en az 8 karakter olmalı.', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('Şifreler eşleşmiyor.', 'error');
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setLoading(false);

    if (error) {
      showToast('Şifre güncellenemedi.', 'error');
      return;
    }

    showToast('Şifreniz güncellendi.', 'success');
    handleClose();
  };

  return (
    <div className="modal-overlay active drawer-stack-modal" role="dialog" aria-modal="true">
      <div className="modal-content-wrapper modal-sm">
        <div className="modal-header">
          <h2>Şifre Değiştir</h2>
          <button type="button" className="modal-close-button" onClick={handleClose} aria-label="Kapat">
            ✕
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label htmlFor="newPassword">Yeni şifre</label>
              <input
                id="newPassword"
                type="password"
                className="form-control"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
                required
                minLength={8}
              />
            </div>
            <div className="form-group">
              <label htmlFor="confirmPassword">Yeni şifre (tekrar)</label>
              <input
                id="confirmPassword"
                type="password"
                className="form-control"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                required
                minLength={8}
              />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={handleClose}>
              İptal
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Kaydediliyor...' : 'Şifreyi Güncelle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
