import type { Business } from './types';
import { generateId } from './formatters';

export const DEFAULT_REGIONS = ['İskele', 'Barbaros'] as const;

export const BARBAROS_BUSINESSES = [
  'Acıktım Tantuni',
  'Asil Balık',
  'Baba Pizza',
  'Bahar Fastfood',
  'Gaziantep Güneşi',
  'Kuytu Fastfood',
  'NFC BURGER',
  'No42 Papağan',
  'North Bear Burger',
  'Osmanoğlu Izgara',
  'Paketçim',
  'Papağan Pastanesi',
  'Pisa Pizza',
  'PUFİ PANCO',
  'Sevgi Sokak Lezzetleri',
  'Taşra Kumpir',
  'Urfa Kebap',
  'WaffleDore',
] as const;

export const ISKELE_BUSINESSES = [
  '232 Macaroni',
  'Adıyaman Çiğköfte',
  'Ateş Döner',
  'Ateş Döner 2',
  'Ayvalık Tostçusu',
  'Behnar Ev Yemekleri',
  'Bombacı',
  'Bozcaada Büfe',
  'Bunbi',
  'Bülent Börekçilik',
  'Crespo Burger',
  'Doğan Pastanesi İskele',
  'Elliza Makarna',
  'Eqo Döner',
  'Hanımzade',
  'HS Hotdog',
  'I Love Fish',
  'Lahmacun Time 2',
  'Loresima',
  'Maya Gözleme Evi',
  'MiniPan',
  'Papağan Döner',
  'Tado Döner',
  'Tencere Kazan Köfte',
  'Vira Balık',
  'Walpurga',
] as const;

export function createSeedBusinesses(): Business[] {
  const businesses: Business[] = [];

  BARBAROS_BUSINESSES.forEach((name) => {
    businesses.push({
      id: generateId(),
      name,
      normalFee: 0,
      distantFee: 0,
      vat: 0,
      region: 'Barbaros',
    });
  });

  ISKELE_BUSINESSES.forEach((name) => {
    businesses.push({
      id: generateId(),
      name,
      normalFee: 0,
      distantFee: 0,
      vat: 0,
      region: 'İskele',
    });
  });

  return businesses;
}

export function mergeSeedWithExisting(
  existing: Business[],
  seed: Business[],
): Business[] {
  const findMatch = (name: string) =>
    existing.find(
      (b) =>
        b.name.toLowerCase().includes(name.toLowerCase()) ||
        name.toLowerCase().includes(b.name.toLowerCase()),
    );

  return seed.map((item) => {
    const old = findMatch(item.name);
    if (old) {
      return { ...old, name: item.name, region: item.region };
    }
    return item;
  });
}
