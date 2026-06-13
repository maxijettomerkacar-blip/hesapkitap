'use client';

import { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getUserRole, resolveSafeNextPath } from '@/lib/auth/roles';
import { createClient } from '@/lib/supabase/client';

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const subtitle = useMemo(() => {
    const next = searchParams.get('next');
    const portal = searchParams.get('portal');
    if (portal === 'motor' || next?.startsWith('/motor-yonetim')) {
      return 'Motor Operasyon Girişi';
    }
    return 'Admin Girişi';
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) {
      setError('Giriş başarısız. E-posta veya şifre hatalı.');
      setLoading(false);
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    const role = user ? getUserRole(user) : 'full';
    const nextPath = resolveSafeNextPath(searchParams.get('next'), role);
    router.push(nextPath);
    router.refresh();
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>MaxiHesaplama</h1>
        <p className="login-subtitle">{subtitle}</p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">E-posta</label>
            <input
              id="email"
              type="email"
              className="form-control"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Şifre</label>
            <input
              id="password"
              type="password"
              className="form-control"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>
          {error && <p className="login-error">{error}</p>}
          <button type="submit" className="btn btn-primary login-btn" disabled={loading}>
            {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
          </button>
        </form>
      </div>
    </div>
  );
}
