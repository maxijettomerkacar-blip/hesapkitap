export type AppUserRole = 'full' | 'motor_ops';

export const MOTOR_OPS_PATH = '/motor-yonetim';
export const DEFAULT_FULL_PATH = '/';

export const MOTOR_OPS_ALLOWED_PREFIXES = ['/motor-yonetim', '/login', '/auth'] as const;

type RoleUser = {
  email?: string | null;
  app_metadata?: Record<string, unknown>;
};

export function getMotorOpsEmailAllowlist(): string[] {
  const raw = process.env.MOTOR_OPS_EMAILS ?? '';
  return raw
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function getUserRole(user: RoleUser): AppUserRole {
  const metaRole = user.app_metadata?.role;
  if (metaRole === 'motor_ops' || metaRole === 'full') {
    return metaRole;
  }

  const email = user.email?.toLowerCase();
  if (email && getMotorOpsEmailAllowlist().includes(email)) {
    return 'motor_ops';
  }

  return 'full';
}

export function isPathAllowedForMotorOps(pathname: string): boolean {
  return MOTOR_OPS_ALLOWED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export function getDefaultPathForRole(role: AppUserRole): string {
  return role === 'motor_ops' ? MOTOR_OPS_PATH : DEFAULT_FULL_PATH;
}

export function resolveSafeNextPath(next: string | null | undefined, role: AppUserRole): string {
  const fallback = getDefaultPathForRole(role);
  if (!next || !next.startsWith('/') || next.startsWith('//')) {
    return fallback;
  }
  if (role === 'motor_ops' && !next.startsWith(MOTOR_OPS_PATH)) {
    return MOTOR_OPS_PATH;
  }
  return next;
}
