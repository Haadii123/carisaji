import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SQL_FILE_PATH = path.resolve(__dirname, '../../database/carisaji.sql');

function unescapeSqlString(raw) {
  let out = '';
  for (let i = 0; i < raw.length; i += 1) {
    const ch = raw[i];
    if (ch === '\\' && i + 1 < raw.length) {
      const next = raw[i + 1];
      if (next === 'n') out += '\n';
      else if (next === 'r') out += '\r';
      else if (next === 't') out += '\t';
      else out += next;
      i += 1;
    } else if (ch === "'" && raw[i + 1] === "'") {
      out += "'";
      i += 1;
    } else {
      out += ch;
    }
  }
  return out;
}

function parseTupleValues(tupleStr) {
  const values = [];
  let i = 0;
  const len = tupleStr.length;

  while (i < len) {
    while (i < len && /[\s,]/.test(tupleStr[i])) i += 1;
    if (i >= len) break;

    if (tupleStr[i] === "'") {
      i += 1;
      let buf = '';
      while (i < len) {
        const ch = tupleStr[i];
        if (ch === '\\' && i + 1 < len) {
          buf += ch + tupleStr[i + 1];
          i += 2;
        } else if (ch === "'" && tupleStr[i + 1] === "'") {
          buf += "''";
          i += 2;
        } else if (ch === "'") {
          i += 1;
          break;
        } else {
          buf += ch;
          i += 1;
        }
      }
      values.push(unescapeSqlString(buf));
    } else {
      let token = '';
      while (i < len && tupleStr[i] !== ',') {
        token += tupleStr[i];
        i += 1;
      }
      const trimmed = token.trim();
      if (trimmed.toUpperCase() === 'NULL') {
        values.push(null);
      } else if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
        values.push(Number(trimmed));
      } else {
        values.push(trimmed);
      }
    }
  }

  return values;
}

function extractTuples(valuesSection) {
  const tuples = [];
  let i = 0;
  const len = valuesSection.length;

  while (i < len) {
    if (valuesSection[i] === '(') {
      i += 1;
      let buf = '';
      let inString = false;
      while (i < len) {
        const ch = valuesSection[i];
        if (inString) {
          if (ch === '\\' && i + 1 < len) {
            buf += ch + valuesSection[i + 1];
            i += 2;
            continue;
          }
          if (ch === "'" && valuesSection[i + 1] === "'") {
            buf += "''";
            i += 2;
            continue;
          }
          if (ch === "'") {
            inString = false;
          }
          buf += ch;
          i += 1;
        } else {
          if (ch === "'") {
            inString = true;
            buf += ch;
            i += 1;
          } else if (ch === ')') {
            i += 1;
            break;
          } else {
            buf += ch;
            i += 1;
          }
        }
      }
      tuples.push(parseTupleValues(buf));
    } else {
      i += 1;
    }
  }

  return tuples;
}

export function parseCarisajiSql(sqlContent) {
  const tables = {
    users: [],
    restaurants: [],
    menus: [],
    reviews: [],
    orders: [],
    order_items: [],
  };

  const insertRegex =
    /INSERT INTO\s+`?(\w+)`?\s*\(([^)]+)\)\s*VALUES\s*([\s\S]*?);(?=\s*(?:--|\n|$|CREATE|INSERT|SET|DROP|USE))/gi;

  let match;
  while ((match = insertRegex.exec(sqlContent)) !== null) {
    const tableName = match[1];
    if (!Object.prototype.hasOwnProperty.call(tables, tableName)) continue;

    const columns = match[2]
      .split(',')
      .map((col) => col.trim().replace(/^`|`$/g, ''));
    const tuples = extractTuples(match[3]);

    for (const rowValues of tuples) {
      const row = {};
      columns.forEach((col, idx) => {
        row[col] = rowValues[idx] ?? null;
      });
      tables[tableName].push(row);
    }
  }

  return tables;
}

let cachedStore = null;

export function getSqlFallbackStore() {
  if (cachedStore) return cachedStore;

  const empty = {
    users: [],
    restaurants: [],
    menus: [],
    reviews: [],
    orders: [],
    order_items: [],
  };

  try {
    const sqlText = fs.readFileSync(SQL_FILE_PATH, 'utf8');
    cachedStore = parseCarisajiSql(sqlText);
  } catch (err) {
    console.warn('Gagal membaca database/carisaji.sql:', err.message);
    cachedStore = empty;
  }

  return cachedStore;
}

export function nextAutoId(rows, idField) {
  if (!Array.isArray(rows) || rows.length === 0) return 1;
  return Math.max(...rows.map((r) => Number(r[idField]) || 0)) + 1;
}
