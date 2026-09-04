import { Post, Unit } from './dispatchTypes';

export const POST_DATA: Post[] = [
  { name: "Headquarters", lat: 34.51336, lon: -82.64857 },
  { name: "Homeland Park", lat: 34.466445, lon: -82.655534 },
  { name: "Honea Path", lat: 34.454311, lon: -82.405431 },
  { name: "Wren", lat: 34.711555, lon: -82.508775 },
  { name: "Iva", lat: 34.302234, lon: -82.665812 },
  { name: "Williamston", lat: 34.616254, lon: -82.490801 },
  { name: "Pendleton", lat: 34.648965, lon: -82.779594 },
  { name: "Powdersville", lat: 34.774842, lon: -82.487982 },
  { name: "TownVille", lat: 34.565139, lon: -82.889501 },
  { name: "Centerville", lat: 34.54565, lon: -82.696146 },
  { name: "Hopewell", lat: 34.596838, lon: -82.627933 },
  { name: "Rock Springs", lat: 34.497086, lon: -82.524082 },
  { name: "Pelzer", lat: 34.646821, lon: -82.481442 },
  { name: "Belton City", lat: 34.523138, lon: -82.49491 },
  { name: "Cedar Grove Baptist Church", lat: 34.57975, lon: -82.49765 },
  { name: "Autumn Oaks - P4", lat: 34.542947, lon: -82.630748 },
  { name: "81 & Concord Rd", lat: 34.597023, lon: -82.61643 },
  { name: "81 & Fred Dean", lat: 34.400605, lon: -82.687749 },
  { name: "28 & Welpine Rd", lat: 34.580313, lon: -82.715349 },
  { name: "BHP High School", lat: 34.47565, lon: -82.44456 },
  { name: "Northlake", lat: 34.561306, lon: -82.699203 },
  { name: "West Anderson - P5", lat: 34.50219, lon: -82.684357 },
  { name: "Zion", lat: 34.567274, lon: -82.805179 },
  { name: "7-11 @ Hwy 178", lat: 34.482687, lon: -82.603889 },
  { name: "White Plains", lat: 34.666843, lon: -82.515465 },
  { name: "252 & 413", lat: 34.475336, lon: -82.532951 },
  { name: "Slab Town Area", lat: 34.705128, lon: -82.620344 }
];

export const SECTOR_MAP: Record<string, string[]> = {
  "NE": ["Wren", "Powdersville", "Williamston", "Pelzer", "White Plains", "Slab Town Area"],
  "NW": ["Pendleton", "TownVille", "Zion", "Centerville", "28 & Welpine Rd"],
  "CENTRAL": ["Headquarters", "Rock Springs", "Hopewell", "Autumn Oaks - P4", "81 & Concord Rd", "Northlake", "7-11 @ Hwy 178", "Homeland Park"],
  "SE": ["Honea Path", "BHP High School", "252 & 413", "Belton City"],
  "SW": ["Iva", "Starr", "81 & Fred Dean"]
};

export const POSTING_PLAN: Record<number, string[]> = {
  1: ["Headquarters"],
  2: ["Headquarters", "Wren"],
  3: ["Headquarters", "Wren", "Iva"],
  4: ["Headquarters", "Wren", "Iva", "Pendleton"],
  5: ["Headquarters", "Wren", "Iva", "Pendleton", "Honea Path"],
  6: ["Headquarters", "Wren", "Iva", "Pendleton", "Honea Path", "Williamston"],
  7: ["Headquarters", "Wren", "Iva", "Pendleton", "Honea Path", "Williamston", "Powdersville"],
  8: ["Headquarters", "Wren", "Iva", "Pendleton", "Honea Path", "Williamston", "Powdersville", "Homeland Park"],
  9: ["Headquarters", "Wren", "Iva", "Pendleton", "Honea Path", "Williamston", "Powdersville", "Homeland Park", "TownVille"],
  10: ["Headquarters", "Wren", "Iva", "Pendleton", "Honea Path", "Williamston", "Powdersville", "Homeland Park", "TownVille", "Centerville"]
};

export const INITIAL_UNITS: Unit[] = [
  { id: "Med-0", home: "Headquarters" }, { id: "Med-1", home: "Headquarters" },
  { id: "Med-2", home: "Rock Springs" }, { id: "Med-3", home: "Homeland Park" },
  { id: "Med-4", home: "Williamston" }, { id: "Med-5", home: "Hopewell" },
  { id: "Med-6", home: "Iva" }, { id: "Med-7", home: "Pendleton" },
  { id: "Med-8", home: "TownVille" }, { id: "Med-9", home: "Centerville" },
  { id: "Med-10", home: "Headquarters" }, { id: "Med-11", home: "Headquarters" },
  { id: "Med-12", home: "Headquarters" }, { id: "Med-13", home: "Honea Path" },
  { id: "Med-14", home: "Powdersville" }, { id: "Med-15", home: "Wren" },
  { id: "Med-16", home: "Headquarters" }, { id: "Med-17", home: "Headquarters" },
  { id: "Med-18", home: "Headquarters" }, { id: "Med-19", home: "Headquarters" }
].map(u => ({ ...u, home: u.home || "Headquarters" }));

export const TRANSPORT_ADDRS: Record<string, string> = {
  "Med-0": "1009 N Fant St. Anderson, SC 29625",
  "Med-1": "1009 N Fant St. Anderson, SC 29625",
  "Med-2": "135 HWY 413, Belton SC 29627",
  "Med-3": "3228 S Main St, Anderson, SC 29624",
  "Med-4": "902 Anderson Dr. Williamston SC 29697",
  "Med-5": "2850 Concord Rd Anderson SC 29621",
  "Med-6": "9711 SC-81, Iva SC 29655",
  "Med-7": "108 N Depot St Pendleton SC 29670",
  "Med-8": "8508 SC-24 Townville SC 29689",
  "Med-9": "103 Construction Way Anderson SC 29625",
  "Med-10": "1009 N Fant St Anderson SC 29625",
  "Med-11": "1009 N Fant St Anderson SC 29625",
  "Med-12": "1009 N Fant St Anderson SC 29625",
  "Med-13": "6 Gaines Rd Honea Path SC 29654",
  "Med-14": "10600 Anderson Rd Easley SC 29642",
  "Med-15": "2209 SC-86 Piedmont SC 29673",
  "Med-16": "1009 N Fant St Anderson SC 29625",
  "Med-17": "1009 N Fant St Anderson SC 29625",
  "Med-18": "1009 N Fant St Anderson SC 29625",
  "Med-19": "1009 N Fant St Anderson SC 29625"
};

export const QRV_UNITS = [
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
