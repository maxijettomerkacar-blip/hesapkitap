import type { Motor, MotorAssignment } from './types';

export function isAssignmentActiveOnDate(assignment: MotorAssignment, date: string): boolean {
  if (assignment.startDate > date) return false;
  if (assignment.endDate && assignment.endDate < date) return false;
  return true;
}

export function getActiveAssignmentsOnDate(
  assignments: MotorAssignment[],
  date: string,
): MotorAssignment[] {
  return assignments.filter((a) => isAssignmentActiveOnDate(a, date));
}

/** Motor o tarihte boşta mı (aktif atama yok)? */
export function getIdleMotors(
  motors: Motor[],
  assignments: MotorAssignment[],
  date: string,
): Motor[] {
  const activeMotorIds = new Set(
    getActiveAssignmentsOnDate(assignments, date).map((a) => a.motorId),
  );
  return motors.filter((m) => m.status === 'Aktif' && !activeMotorIds.has(m.id));
}

/** Kurye o tarihte hangi motorda? */
export function getCourierMotorOnDate(
  courierId: string,
  assignments: MotorAssignment[],
  date: string,
): MotorAssignment | undefined {
  return getActiveAssignmentsOnDate(assignments, date).find((a) => a.courierId === courierId);
}

export function getMotorAssignmentOnDate(
  motorId: string,
  assignments: MotorAssignment[],
  date: string,
): MotorAssignment | undefined {
  return getActiveAssignmentsOnDate(assignments, date).find((a) => a.motorId === motorId);
}
