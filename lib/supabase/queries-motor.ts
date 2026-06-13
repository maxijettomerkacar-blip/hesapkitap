import type { SupabaseClient } from '@supabase/supabase-js';
import { generateId } from '../formatters';
import type {
  Courier,
  Motor,
  MotorAssignment,
  MotorMaintenance,
} from '../types';
import { logMotorAudit } from './motor-audit';

type DbCourier = {
  id: string;
  name: string;
  phone: string;
  region: string;
  is_active: boolean;
  notes: string;
};

type DbMotor = {
  id: string;
  plate: string;
  brand: string;
  model: string;
  courier_id: string | null;
  region: string;
  inspection_date: string | null;
  insurance_expiry: string | null;
  status: string;
  odometer_km: number;
  notes: string;
  couriers?: { name: string } | null;
};

type DbMaintenance = {
  id: string;
  motor_id: string;
  service_date: string;
  service_type: string;
  cost: number;
  odometer_km: number;
  description: string;
  next_due_date: string | null;
  receipt_url?: string;
  receipt_path?: string;
};

type DbAssignment = {
  id: string;
  motor_id: string;
  courier_id: string;
  start_date: string;
  end_date: string | null;
  notes: string;
  created_by: string;
  updated_by: string;
  created_at: string;
  motors?: { plate: string } | null;
  couriers?: { name: string } | null;
};

function mapCourier(row: DbCourier): Courier {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone ?? '',
    region: row.region ?? '',
    isActive: row.is_active,
    notes: row.notes ?? '',
  };
}

function mapMotor(row: DbMotor): Motor {
  return {
    id: row.id,
    plate: row.plate,
    brand: row.brand ?? '',
    model: row.model ?? '',
    courierId: row.courier_id,
    courierName: row.couriers?.name ?? null,
    region: row.region ?? '',
    inspectionDate: row.inspection_date,
    insuranceExpiry: row.insurance_expiry,
    status: row.status as Motor['status'],
    odometerKm: Number(row.odometer_km),
    notes: row.notes ?? '',
  };
}

function mapMaintenance(row: DbMaintenance): MotorMaintenance {
  return {
    id: row.id,
    motorId: row.motor_id,
    serviceDate: row.service_date,
    serviceType: row.service_type,
    cost: Number(row.cost),
    odometerKm: Number(row.odometer_km),
    description: row.description ?? '',
    nextDueDate: row.next_due_date,
    receiptUrl: row.receipt_url ?? '',
    receiptPath: row.receipt_path ?? '',
  };
}

function mapAssignment(row: DbAssignment): MotorAssignment {
  return {
    id: row.id,
    motorId: row.motor_id,
    courierId: row.courier_id,
    motorPlate: row.motors?.plate,
    courierName: row.couriers?.name,
    startDate: row.start_date,
    endDate: row.end_date,
    notes: row.notes ?? '',
    createdBy: row.created_by ?? '',
    updatedBy: row.updated_by ?? '',
    createdAt: row.created_at,
  };
}

export async function fetchCouriers(supabase: SupabaseClient): Promise<Courier[]> {
  const { data, error } = await supabase
    .from('couriers')
    .select('*')
    .order('name', { ascending: true });
  if (error) throw error;
  return (data as DbCourier[]).map(mapCourier);
}

export async function upsertCourier(supabase: SupabaseClient, courier: Courier): Promise<void> {
  const { error } = await supabase.from('couriers').upsert({
    id: courier.id,
    name: courier.name,
    phone: courier.phone,
    region: courier.region,
    is_active: courier.isActive,
    notes: courier.notes,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
  await logMotorAudit(supabase, {
    entityType: 'courier',
    entityId: courier.id,
    action: 'upsert',
    summary: `Kurye kaydedildi: ${courier.name}`,
    details: { name: courier.name, region: courier.region, isActive: courier.isActive },
  });
}

export async function deleteCourier(supabase: SupabaseClient, id: string): Promise<void> {
  const { error } = await supabase.from('couriers').delete().eq('id', id);
  if (error) throw error;
  await logMotorAudit(supabase, {
    entityType: 'courier',
    entityId: id,
    action: 'delete',
    summary: 'Kurye silindi',
  });
}

/** İsimle kurye bul veya yeni oluştur (operasyon sayfası combobox) */
export async function findOrCreateCourierByName(
  supabase: SupabaseClient,
  name: string,
  region = '',
): Promise<Courier> {
  const trimmed = name.trim();
  const existing = (await fetchCouriers(supabase)).find(
    (c) => c.name.toLowerCase() === trimmed.toLowerCase(),
  );
  if (existing) return existing;

  const courier: Courier = {
    id: generateId(),
    name: trimmed,
    phone: '',
    region,
    isActive: true,
    notes: '',
  };
  await upsertCourier(supabase, courier);
  return courier;
}

export async function fetchMotors(supabase: SupabaseClient): Promise<Motor[]> {
  const { data, error } = await supabase
    .from('motors')
    .select('*, couriers(name)')
    .order('plate', { ascending: true });
  if (error) throw error;
  return (data as DbMotor[]).map(mapMotor);
}

export async function upsertMotor(supabase: SupabaseClient, motor: Motor): Promise<void> {
  const { error } = await supabase.from('motors').upsert({
    id: motor.id,
    plate: motor.plate,
    brand: motor.brand,
    model: motor.model,
    courier_id: motor.courierId,
    region: motor.region,
    inspection_date: motor.inspectionDate || null,
    insurance_expiry: motor.insuranceExpiry || null,
    status: motor.status,
    odometer_km: motor.odometerKm,
    notes: motor.notes,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
  await logMotorAudit(supabase, {
    entityType: 'motor',
    entityId: motor.id,
    action: 'upsert',
    summary: `Motor kaydedildi: ${motor.plate}`,
    details: { plate: motor.plate, courierId: motor.courierId },
  });
}

export async function deleteMotor(supabase: SupabaseClient, id: string): Promise<void> {
  const { error } = await supabase.from('motors').delete().eq('id', id);
  if (error) throw error;
  await logMotorAudit(supabase, {
    entityType: 'motor',
    entityId: id,
    action: 'delete',
    summary: 'Motor silindi',
  });
}

export async function fetchAllMaintenance(
  supabase: SupabaseClient,
  dateFrom?: string,
  dateTo?: string,
): Promise<MotorMaintenance[]> {
  let query = supabase.from('motor_maintenance').select('*').order('service_date', { ascending: false });
  if (dateFrom) query = query.gte('service_date', dateFrom);
  if (dateTo) query = query.lte('service_date', dateTo);
  const { data, error } = await query;
  if (error) throw error;
  return (data as DbMaintenance[]).map(mapMaintenance);
}

export async function fetchMotorMaintenance(
  supabase: SupabaseClient,
  motorId: string,
): Promise<MotorMaintenance[]> {
  const { data, error } = await supabase
    .from('motor_maintenance')
    .select('*')
    .eq('motor_id', motorId)
    .order('service_date', { ascending: false });
  if (error) throw error;
  return (data as DbMaintenance[]).map(mapMaintenance);
}

export async function insertMotorMaintenance(
  supabase: SupabaseClient,
  record: MotorMaintenance,
): Promise<void> {
  const { error } = await supabase.from('motor_maintenance').insert({
    id: record.id,
    motor_id: record.motorId,
    service_date: record.serviceDate,
    service_type: record.serviceType,
    cost: record.cost,
    odometer_km: record.odometerKm,
    description: record.description,
    next_due_date: record.nextDueDate || null,
    receipt_url: record.receiptUrl ?? '',
    receipt_path: record.receiptPath ?? '',
  });
  if (error) throw error;
  await logMotorAudit(supabase, {
    entityType: 'maintenance',
    entityId: record.id,
    action: 'create',
    summary: `Bakım kaydı: ${record.serviceDate} · ${record.cost} ₺`,
    details: { motorId: record.motorId, cost: record.cost, hasReceipt: !!record.receiptUrl },
  });
}

export async function updateMotorMaintenanceReceipt(
  supabase: SupabaseClient,
  id: string,
  receiptUrl: string,
  receiptPath: string,
): Promise<void> {
  const { error } = await supabase
    .from('motor_maintenance')
    .update({ receipt_url: receiptUrl, receipt_path: receiptPath })
    .eq('id', id);
  if (error) throw error;
}

export async function deleteMotorMaintenance(
  supabase: SupabaseClient,
  id: string,
): Promise<void> {
  const { error } = await supabase.from('motor_maintenance').delete().eq('id', id);
  if (error) throw error;
  await logMotorAudit(supabase, {
    entityType: 'maintenance',
    entityId: id,
    action: 'delete',
    summary: 'Bakım kaydı silindi',
  });
}

export async function fetchMaintenanceCostTotal(
  supabase: SupabaseClient,
  motorId?: string,
  dateFrom?: string,
  dateTo?: string,
): Promise<number> {
  let query = supabase.from('motor_maintenance').select('cost, service_date');
  if (motorId) query = query.eq('motor_id', motorId);
  if (dateFrom) query = query.gte('service_date', dateFrom);
  if (dateTo) query = query.lte('service_date', dateTo);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).reduce((sum, row) => sum + Number((row as { cost: number }).cost), 0);
}

export async function fetchMotorAssignments(supabase: SupabaseClient): Promise<MotorAssignment[]> {
  const { data, error } = await supabase
    .from('motor_assignments')
    .select('*, motors(plate), couriers(name)')
    .order('start_date', { ascending: false });
  if (error) throw error;
  return (data as DbAssignment[]).map(mapAssignment);
}

export async function insertMotorAssignment(
  supabase: SupabaseClient,
  assignment: MotorAssignment,
): Promise<void> {
  const user = await import('./motor-audit').then((m) => m.getMotorAuditUser(supabase));
  const { error } = await supabase.from('motor_assignments').insert({
    id: assignment.id,
    motor_id: assignment.motorId,
    courier_id: assignment.courierId,
    start_date: assignment.startDate,
    end_date: assignment.endDate,
    notes: assignment.notes,
    created_by: user.email,
    updated_by: user.email,
  });
  if (error) throw error;
  await logMotorAudit(supabase, {
    entityType: 'assignment',
    entityId: assignment.id,
    action: 'create',
    summary: `Atama: ${assignment.startDate}${assignment.endDate ? ` → ${assignment.endDate}` : ' (devam)'}`,
    details: {
      motorId: assignment.motorId,
      courierId: assignment.courierId,
      startDate: assignment.startDate,
      endDate: assignment.endDate,
    },
    user,
  });
}

export async function updateMotorAssignment(
  supabase: SupabaseClient,
  assignment: MotorAssignment,
): Promise<void> {
  const user = await import('./motor-audit').then((m) => m.getMotorAuditUser(supabase));
  const { error } = await supabase
    .from('motor_assignments')
    .update({
      motor_id: assignment.motorId,
      courier_id: assignment.courierId,
      start_date: assignment.startDate,
      end_date: assignment.endDate,
      notes: assignment.notes,
      updated_by: user.email,
      updated_at: new Date().toISOString(),
    })
    .eq('id', assignment.id);
  if (error) throw error;
  await logMotorAudit(supabase, {
    entityType: 'assignment',
    entityId: assignment.id,
    action: 'update',
    summary: `Atama güncellendi: ${assignment.startDate}${assignment.endDate ? ` → ${assignment.endDate}` : ''}`,
    details: assignment as unknown as Record<string, unknown>,
    user,
  });
}

/** Yeni atama: önceki açık atamayı kapat, motor.courier_id güncelle */
export async function assignCourierToMotor(
  supabase: SupabaseClient,
  motorId: string,
  courierId: string,
  startDate: string,
  endDate: string | null = null,
  notes = '',
): Promise<MotorAssignment> {
  const assignments = await fetchMotorAssignments(supabase);
  const prevEndStr = () => {
    const d = new Date(startDate);
    d.setDate(d.getDate() - 1);
    return d.toISOString().slice(0, 10);
  };

  for (const a of assignments.filter((x) => x.motorId === motorId && !x.endDate)) {
    await updateMotorAssignment(supabase, { ...a, endDate: prevEndStr() });
  }
  for (const a of assignments.filter((x) => x.courierId === courierId && !x.endDate && x.motorId !== motorId)) {
    await updateMotorAssignment(supabase, { ...a, endDate: prevEndStr() });
  }

  const newAssignment: MotorAssignment = {
    id: generateId(),
    motorId,
    courierId,
    startDate,
    endDate,
    notes,
    createdBy: '',
    updatedBy: '',
  };
  await insertMotorAssignment(supabase, newAssignment);

  const motors = await fetchMotors(supabase);
  const motor = motors.find((m) => m.id === motorId);
  if (motor) {
    await upsertMotor(supabase, { ...motor, courierId });
  }

  return newAssignment;
}

export async function createMotorWithPlate(
  supabase: SupabaseClient,
  plate: string,
  region: string,
): Promise<Motor> {
  const motor: Motor = {
    id: generateId(),
    plate: plate.trim().toUpperCase(),
    brand: '',
    model: '',
    courierId: null,
    region,
    inspectionDate: null,
    insuranceExpiry: null,
    status: 'Aktif',
    odometerKm: 0,
    notes: '',
  };
  await upsertMotor(supabase, motor);
  return motor;
}
