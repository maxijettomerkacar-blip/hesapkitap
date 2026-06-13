import type { SupabaseClient } from '@supabase/supabase-js';
import type { Courier, Motor, MotorMaintenance } from '../types';

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
}

export async function deleteCourier(supabase: SupabaseClient, id: string): Promise<void> {
  const { error } = await supabase.from('couriers').delete().eq('id', id);
  if (error) throw error;
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
}

export async function deleteMotor(supabase: SupabaseClient, id: string): Promise<void> {
  const { error } = await supabase.from('motors').delete().eq('id', id);
  if (error) throw error;
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
  });
  if (error) throw error;
}

export async function deleteMotorMaintenance(
  supabase: SupabaseClient,
  id: string,
): Promise<void> {
  const { error } = await supabase.from('motor_maintenance').delete().eq('id', id);
  if (error) throw error;
}

export async function fetchMaintenanceCostTotal(
  supabase: SupabaseClient,
  motorId?: string,
): Promise<number> {
  let query = supabase.from('motor_maintenance').select('cost');
  if (motorId) query = query.eq('motor_id', motorId);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).reduce((sum, row) => sum + Number((row as { cost: number }).cost), 0);
}
