// Clima pelo Open-Meteo (ADR 0004): cidade do .env (padrão São Vicente, SP), cache de 30 min,
// sem chave e sem geolocalização por IP. Horas em "YYYY-MM-DDTHH:MM" local da cidade (timezone=auto).
import { config } from '../../config';
import { plain } from '../../lib/html';
import { cachedJson, getJson } from '../../lib/net';
import type { IconName } from '../../ui/icons';

export interface Weather {
  place: string;
  temp: number; feels: number; humidity: number; wind: number;
  code: number; day: boolean;
  high: number; low: number;
  sunrise: string; sunset: string;
  hours: Array<{ time: string; temp: number; code: number; day: boolean }>;
}

interface Geo { results?: Array<{ latitude: number; longitude: number; name: string; admin1?: string; country_code?: string }> }
interface Forecast {
  current: { time: string; temperature_2m: number; apparent_temperature: number; relative_humidity_2m: number; wind_speed_10m: number; weather_code: number; is_day: number };
  hourly: { time: string[]; temperature_2m: number[]; weather_code: number[]; is_day: number[] };
  daily: { temperature_2m_max: number[]; temperature_2m_min: number[]; sunrise: string[]; sunset: string[] };
}

const HALF_HOUR = 1800000;
const HOURS_SHOWN = 5;
const city = config.city || 'São Vicente, São Paulo';
const listeners: Array<(w: Weather | null, stale: boolean) => void> = [];
let current: Weather | null = null;
let currentStale = false;

export const getWeather = (): { weather: Weather | null; stale: boolean } => ({ weather: current, stale: currentStale });
export const cityName = (): string => (current ? current.place : city.split(',')[0].trim());
export function onWeather(cb: (w: Weather | null, stale: boolean) => void): void { listeners.push(cb); }


/** "São Vicente, São Paulo": o nome sozinho acha cidades de outros países/estados, então o estado desempata. */
interface Place { latitude: number; longitude: number; name: string }

function locate(): Promise<Place> {
  const parts = city.split(',');
  const name = parts[0].trim();
  const state = plain(parts.slice(1).join(',').trim());
  return getJson<Geo>(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=10&language=pt&format=json`).then((geo) => {
    const found = geo.results || [];
    const hit = found.filter((r) => state && plain(r.admin1 || '').indexOf(state) >= 0)[0] || found.filter((r) => r.country_code === 'BR')[0] || found[0];
    if (!hit) throw new Error('Cidade não encontrada');
    return hit;
  });
}

/** Coordenadas da cidade: guardadas por 30 dias, o geocoding só roda ao trocar `CITY`. */
function place(): Promise<Place> {
  return new Promise((resolve, reject) => {
    let done = false;
    cachedJson(`tvos.geo.${plain(city)}`, 30 * 86400000, locate, (p) => { if (!done) { done = true; resolve(p); } }).catch(reject);
  });
}

function load(): Promise<Weather> {
  return place().then((where) =>
    getJson<Forecast>('https://api.open-meteo.com/v1/forecast'
      + `?latitude=${where.latitude}&longitude=${where.longitude}`
      + '&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code,is_day'
      + '&hourly=temperature_2m,weather_code,is_day&daily=temperature_2m_max,temperature_2m_min,sunrise,sunset'
      + '&forecast_days=2&timezone=auto').then((f): Weather => {
      const hour = f.current.time.slice(0, 13);
      const start = Math.max(0, f.hourly.time.findIndex((t) => t.slice(0, 13) >= hour));
      return {
        place: where.name,
        temp: f.current.temperature_2m, feels: f.current.apparent_temperature, humidity: f.current.relative_humidity_2m, wind: f.current.wind_speed_10m,
        code: f.current.weather_code, day: f.current.is_day === 1,
        high: f.daily.temperature_2m_max[0], low: f.daily.temperature_2m_min[0],
        sunrise: f.daily.sunrise[0].slice(11, 16), sunset: f.daily.sunset[0].slice(11, 16),
        hours: f.hourly.time.slice(start, start + HOURS_SHOWN).map((t, i) => ({ time: t.slice(11, 13), temp: f.hourly.temperature_2m[start + i], code: f.hourly.weather_code[start + i], day: f.hourly.is_day[start + i] === 1 })),
      };
    }));
}

/** WMO weather_code → texto pt-BR e ícone. */
export function describe(code: number, day: boolean): { text: string; icon: IconName } {
  if (code === 0) return { text: 'Céu limpo', icon: day ? 'sun' : 'moon' };
  if (code === 1) return { text: 'Poucas nuvens', icon: day ? 'sun' : 'moon' };
  if (code === 2) return { text: 'Parcialmente nublado', icon: day ? 'partly' : 'cloud' };
  if (code === 3) return { text: 'Nublado', icon: 'cloud' };
  if (code === 45 || code === 48) return { text: 'Neblina', icon: 'fog' };
  if (code >= 51 && code <= 57) return { text: 'Garoa', icon: 'rain' };
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return { text: code >= 80 ? 'Pancadas de chuva' : 'Chuva', icon: 'rain' };
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return { text: 'Neve', icon: 'snow' };
  return { text: 'Tempestade', icon: 'storm' };
}

export function refreshWeather(): void {
  const key = `tvos.w.${plain(city)}`;
  cachedJson(key, HALF_HOUR, load, (weather, stale) => {
    current = weather;
    currentStale = stale;
    listeners.forEach((cb) => cb(weather, stale));
  }).catch(() => listeners.forEach((cb) => cb(current, currentStale)));
}

export function initWeather(): void {
  refreshWeather();
  window.setInterval(refreshWeather, HALF_HOUR);
}
