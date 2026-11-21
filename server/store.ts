import fs from 'fs';
import path from 'path';
import { AcademicDatabase } from '../src/types/academic';
import { SEED_DATABASE } from './seedData';

const DATA_DIR = path.resolve(process.cwd(), '.data');
const DB_PATH = path.join(DATA_DIR, 'doba_academic_db.json');

let memoryDb: AcademicDatabase | null = null;

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export function loadDb(): AcademicDatabase {
  if (memoryDb) {
    return memoryDb;
  }
  try {
    ensureDataDir();
    if (fs.existsSync(DB_PATH)) {
      const raw = fs.readFileSync(DB_PATH, 'utf-8');
      memoryDb = JSON.parse(raw) as AcademicDatabase;
      return memoryDb;
    }
  } catch (err) {
    console.warn('Reinitializing database from seed data:', err);
  }
  memoryDb = JSON.parse(JSON.stringify(SEED_DATABASE)) as AcademicDatabase;
  saveDb(memoryDb);
  return memoryDb;
}

export function saveDb(db: AcademicDatabase): void {
  memoryDb = db;
  try {
    ensureDataDir();
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to persist database:', err);
  }
}

export function formatFrenchDate(date = new Date()): string {
  const months = [
    'janvier',
    'février',
    'mars',
    'avril',
    'mai',
    'juin',
    'juillet',
    'août',
    'septembre',
    'octobre',
    'novembre',
    'décembre',
  ];
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

export function formatFrenchTime(date = new Date()): string {
  const monthsShort = [
    'janv.',
    'févr.',
    'mars',
    'avr.',
    'mai',
    'juin',
    'juil.',
    'août',
    'sept.',
    'oct.',
    'nov.',
    'déc.',
  ];
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${date.getDate()} ${monthsShort[date.getMonth()]} ${date.getFullYear()} · ${hh}:${mm}`;
}
