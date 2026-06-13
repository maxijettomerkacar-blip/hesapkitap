'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { computeDashboardTotals, groupByRegion } from '@/lib/aggregates';
import { createClient } from '@/lib/supabase/client';
import { fetchMotors } from '@/lib/supabase/queries-motor';
import {
  addRegion,
  ensureInitialData,
  fetchBusinesses,
  fetchHesapTarihi,
  fetchRegions,
  fetchTableEntries,
  saveHesapTarihi,
} from '@/lib/supabase/queries';
import { todayISO } from '@/lib/formatters';
import type { Business, TableEntry } from '@/lib/types';
import { createDefaultTableEntry } from '@/lib/types';
import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { DashboardTable } from '@/components/dashboard/DashboardTable';
import { EntryDrawer } from '@/components/dashboard/EntryDrawer';
import { KpiBar } from '@/components/dashboard/KpiBar';
import { MotorAlertWidget } from '@/components/dashboard/MotorAlertWidget';
import { RegionFilter } from '@/components/RegionFilter';
import { useToast } from '@/components/ui/Toast';
import type { Motor } from '@/lib/types';

export function DashboardApp() {
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null);
  const getSupabase = () => {
    if (!supabaseRef.current) supabaseRef.current = createClient();
    return supabaseRef.current;
  };
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [tableData, setTableData] = useState<Record<string, TableEntry>>({});
  const [regions, setRegions] = useState<string[]>([]);
  const [motors, setMotors] = useState<Motor[]>([]);
  const [activeRegionFilter, setActiveRegionFilter] = useState('Tümü');
  const [searchQuery, setSearchQuery] = useState('');
  const [hesapTarihi, setHesapTarihi] = useState(todayISO());
  const [editingBusiness, setEditingBusiness] = useState<Business | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = getSupabase();
      await ensureInitialData(supabase);
      const [biz, entries, regs, tarih, motorList] = await Promise.all([
        fetchBusinesses(supabase),
        fetchTableEntries(supabase),
        fetchRegions(supabase),
        fetchHesapTarihi(supabase),
        fetchMotors(supabase).catch(() => [] as Motor[]),
      ]);
      setBusinesses(biz);
      setTableData(entries);
      setRegions(regs);
      setHesapTarihi(tarih || todayISO());
      setMotors(motorList);
    } catch (e) {
      console.error(e);
      showToast('Veriler yüklenirken hata oluştu.', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredBusinesses = useMemo(() => {
    let list =
      activeRegionFilter === 'Tümü'
        ? businesses
        : businesses.filter((b) => b.region === activeRegionFilter);
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter((b) => b.name.toLowerCase().includes(q));
    }
    return [...list].sort((a, b) => a.name.localeCompare(b.name, 'tr', { sensitivity: 'base' }));
  }, [businesses, activeRegionFilter, searchQuery]);

  const aggregateRows = useMemo(
    () =>
      filteredBusinesses.map((business) => ({
        business,
        entry: tableData[business.id] ?? createDefaultTableEntry(business.id),
      })),
    [filteredBusinesses, tableData],
  );

  const totals = useMemo(() => computeDashboardTotals(aggregateRows), [aggregateRows]);
  const regionTotals = useMemo(() => groupByRegion(aggregateRows), [aggregateRows]);

  const handleHesapTarihiChange = async (value: string) => {
    setHesapTarihi(value);
    try {
      await saveHesapTarihi(getSupabase(), value);
    } catch (e) {
      console.error(e);
      showToast('Hesap tarihi kaydedilemedi.', 'error');
    }
  };

  const handleAddRegion = async (name: string) => {
    try {
      await addRegion(getSupabase(), name);
      setRegions((prev) => [...prev, name].sort((a, b) => a.localeCompare(b, 'tr')));
      showToast('Bölge eklendi.', 'success');
    } catch (e) {
      console.error(e);
      showToast('Bölge eklenemedi.', 'error');
    }
  };

  if (loading) {
    return (
      <DashboardShell>
        <p className="loading-text">Yükleniyor...</p>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell hesapTarihi={hesapTarihi} onHesapTarihiChange={handleHesapTarihiChange}>
      <MotorAlertWidget motors={motors} />

      <KpiBar
        totals={totals}
        regionTotals={regionTotals}
        hesapTarihi={hesapTarihi}
        activeRegion={activeRegionFilter}
      />

      <RegionFilter
        regions={regions}
        activeRegion={activeRegionFilter}
        onSelect={setActiveRegionFilter}
        onAddRegion={handleAddRegion}
      />

      <div className="dashboard-search-bar">
        <input
          type="search"
          className="form-control"
          placeholder="İşletme ara..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          aria-label="İşletme ara"
        />
      </div>

      <DashboardTable
        businesses={filteredBusinesses}
        tableData={tableData}
        onEdit={setEditingBusiness}
      />

      {editingBusiness && (
        <EntryDrawer
          open={!!editingBusiness}
          business={editingBusiness}
          initialEntry={tableData[editingBusiness.id] ?? createDefaultTableEntry(editingBusiness.id)}
          hesapTarihi={hesapTarihi}
          regions={regions}
          onClose={() => setEditingBusiness(null)}
          onSaved={(entry) => {
            setTableData((prev) => ({ ...prev, [entry.businessId]: entry }));
          }}
          onBusinessUpdated={(updated) => {
            setBusinesses((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
            setEditingBusiness(updated);
          }}
          onBusinessDeleted={(id) => {
            setBusinesses((prev) => prev.filter((b) => b.id !== id));
            setTableData((prev) => {
              const next = { ...prev };
              delete next[id];
              return next;
            });
            setEditingBusiness(null);
          }}
        />
      )}
    </DashboardShell>
  );
}
