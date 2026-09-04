/// <reference types="vite/client" />
export const MAPBOX_TOKEN = (process.env.VITE_MAPBOX_TOKEN as string) || (import.meta.env.VITE_MAPBOX_TOKEN as string) || 'pk.eyJ1Ijoic25kankxOTg2IiwiYSI6ImNtbnluNTlhajAzdTcyc3BvZnA2dHFlc2IifQ.i12KqohChX4CmRWYY3rrqA';

export const API_LIMIT = 10000;
export const COUNTER_API = "";

export interface Unit {
  name: string;
  addr: string;
  distance?: number;
  duration?: number;
}

export const TRANSPORT_UNITS: Unit[] = [
  { name: "Med-0", addr: "1009 N Fant St. Anderson, SC 29625" },
  { name: "Med-1", addr: "1009 N Fant St. Anderson, SC 29625" },
  { name: "Med-2", addr: "135 HWY 413, Belton SC 29627" },
  { name: "Med-3", addr: "3228 S Main St, Anderson, SC 29624" },
  { name: "Med-4", addr: "902 Anderson Dr. Williamston SC 29697" },
  { name: "Med-5", addr: "2850 Concord Rd Anderson SC 29621" },
  { name: "Med-6", addr: "9711 SC-81, Iva SC 29655" },
  { name: "Med-7", addr: "108 N Depot St Pendleton SC 29670" },
  { name: "Med-8", addr: "8508 SC-24 Townville SC 29689" },
  { name: "Med-9", addr: "103 Construction Way Anderson SC 29625" },
  { name: "Med-10", addr: "1009 N Fant St Anderson SC 29625" },
  { name: "Med-11", addr: "1009 N Fant St Anderson SC 29625" },
  { name: "Med-12", addr: "1009 N Fant St Anderson SC 29625" },
  { name: "Med-13", addr: "6 Gaines Rd Honea Path SC 29654" },
  { name: "Med-14", addr: "10600 Anderson Rd Easley SC 29642" },
  { name: "Med-15", addr: "2209 SC-86 Piedmont SC 29673" },
  { name: "Med-16", addr: "1009 N Fant St Anderson SC 29625" },
  { name: "Med-17", addr: "1009 N Fant St Anderson SC 29625" },
  { name: "Med-18", addr: "1009 N Fant St Anderson SC 29625" },
  { name: "Med-19", addr: "1009 N Fant St Anderson SC 29625" }
];

export const QRV_UNITS: Unit[] = [
  { name: "A-5",  addr: "103 Construction Way Anderson SC 29625" },
  { name: "A-8",  addr: "1009 N Fant St Anderson SC 29625" },
  { name: "ALS-2", addr: "5321 US-76 Pendleton SC 29670" },
  { name: "ALS-3", addr: "3228 S Main St Anderson SC 29624" },
  { name: "ALS-4", addr: "7715 SC-81 Starr SC 29684" },
  { name: "ALS-6", addr: "101 Main St Pelzer SC 29669" },
  { name: "ALS-7", addr: "10600 Anderson Rd Easley SC 29642" },
  { name: "ALS-11", addr: "5125 Dobbins Bridge Rd Anderson SC 29626" },
  { name: "ALS-12", addr: "1 Holmes St Belton SC 29627" },
  { name: "ALS-17", addr: "316 Hattons Ford Rd Townville SC 29689" },
  { name: "ALS-19", addr: "1058 Martin Rd Anderson SC 29621" },
  { name: "ALS-21", addr: "1118 Trail Rd Honea Path SC 29654" },
  { name: "ALS-23", addr: "1416 Due West Hwy Anderson SC 29621" },
  { name: "ALS-24", addr: "2209 SC-86 Piedmont SC 29673" },
  { name: "ALS-27", addr: "3738 SC-187 Anderson SC 29626" }
];
