import { describe, expect, it, afterEach } from 'vitest';
import {
  getDefaultPathForRole,
  getUserRole,
  isPathAllowedForMotorOps,
  resolveSafeNextPath,
} from './roles';

describe('getUserRole', () => {
  const original = process.env.MOTOR_OPS_EMAILS;

  afterEach(() => {
    if (original === undefined) delete process.env.MOTOR_OPS_EMAILS;
    else process.env.MOTOR_OPS_EMAILS = original;
  });

  it('uses app_metadata role when set', () => {
    expect(getUserRole({ app_metadata: { role: 'motor_ops' } })).toBe('motor_ops');
    expect(getUserRole({ app_metadata: { role: 'full' } })).toBe('full');
  });

  it('falls back to MOTOR_OPS_EMAILS env list', () => {
    process.env.MOTOR_OPS_EMAILS = 'Ops@Example.com, other@test.com';
    expect(getUserRole({ email: 'ops@example.com' })).toBe('motor_ops');
    expect(getUserRole({ email: 'admin@example.com' })).toBe('full');
  });

  it('defaults to full access', () => {
    delete process.env.MOTOR_OPS_EMAILS;
    expect(getUserRole({ email: 'anyone@example.com' })).toBe('full');
  });
});

describe('motor_ops route guard', () => {
  it('allows only motor ops paths', () => {
    expect(isPathAllowedForMotorOps('/motor-yonetim')).toBe(true);
    expect(isPathAllowedForMotorOps('/login')).toBe(true);
    expect(isPathAllowedForMotorOps('/auth/callback')).toBe(true);
    expect(isPathAllowedForMotorOps('/')).toBe(false);
    expect(isPathAllowedForMotorOps('/dashboard')).toBe(false);
    expect(isPathAllowedForMotorOps('/dashboard/motors')).toBe(false);
  });

  it('redirects motor_ops users to motor page by default', () => {
    expect(getDefaultPathForRole('motor_ops')).toBe('/motor-yonetim');
    expect(getDefaultPathForRole('full')).toBe('/');
  });

  it('sanitizes next paths for motor_ops', () => {
    expect(resolveSafeNextPath('/dashboard', 'motor_ops')).toBe('/motor-yonetim');
    expect(resolveSafeNextPath('/motor-yonetim', 'motor_ops')).toBe('/motor-yonetim');
    expect(resolveSafeNextPath('https://evil.com', 'full')).toBe('/');
    expect(resolveSafeNextPath('/dashboard/motors', 'full')).toBe('/dashboard/motors');
  });
});
