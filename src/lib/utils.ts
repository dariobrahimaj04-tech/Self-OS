import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function currency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(value);
}

export function number(value: number, digits = 0) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: digits
  }).format(value);
}

export function percent(value: number) {
  return `${Math.round(value)}%`;
}

export function shortDate(value: string | Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric"
  }).format(new Date(value));
}

export function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function scoreTone(score: number, inverse = false) {
  const adjusted = inverse ? 11 - score : score;
  if (adjusted >= 8) return "text-evergreen bg-evergreen/10 border-evergreen/20";
  if (adjusted >= 5) return "text-gold bg-gold/10 border-gold/20";
  return "text-ember bg-ember/10 border-ember/20";
}

export function average(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function sum(values: number[]) {
  return values.reduce((total, value) => total + value, 0);
}
