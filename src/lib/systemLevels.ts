
export interface StrategicPost {
  name: string;
  address: string;
  lat: number;
  lon: number;
}

export const MASTER_POSTS: Record<string, StrategicPost> = {
  "Medshore HQ": { name: "Medshore HQ", address: "1009 N Fant St", lat: 34.5136613, lon: -82.6486386 },
  "Anderson FD Sta 1": { name: "Anderson FD Sta 1", address: "400 S McDuffie St", lat: 34.475643, lon: -82.6375393 },
  "Liberty Hwy": { name: "Liberty Hwy", address: "Liberty Hwy @ I85", lat: 34.5795478, lon: -82.7139504 },
  "Rock Springs": { name: "Rock Springs", address: "135 SC-413", lat: 34.4970557, lon: -82.5237544 },
  "West Anderson": { name: "West Anderson", address: "Hwy 24 at Hwy 28 Bypass", lat: 34.5020956, lon: -82.6837893 },
  "White Plains": { name: "White Plains", address: "Hwy 29 at Easley Hwy", lat: 34.6670365, lon: -82.5153237 },
  "SC-28 & Welpine Rd": { name: "SC-28 & Welpine Rd", address: "4686 Clemson Blvd", lat: 34.5805626, lon: -82.7153295 },
  "Westgate": { name: "Westgate", address: "4396 SC-24", lat: 34.5116259, lon: -82.7567951 },
  "Redi Mart": { name: "Redi Mart", address: "6731 SC-81", lat: 34.4005721, lon: -82.6875786 },
  "Whitefield": { name: "Whitefield", address: "4000 US-29", lat: 34.5738408, lon: -82.5501061 },
  "Whitefield FD": { name: "Whitefield FD", address: "4000 Hwy 29 N", lat: 34.5738408, lon: -82.5501061 },
  "Homeland Park": { name: "Homeland Park", address: "3299 S Main St", lat: 34.46718628, lon: -82.65578639 },
  "Honea Path": { name: "Honea Path", address: "6 Gaines Rd", lat: 34.45442718, lon: -82.40514863 },
  "Wren": { name: "Wren", address: "2209 SC-86", lat: 34.7114341, lon: -82.5089313 },
  "Iva": { name: "Iva", address: "9715 SC-81", lat: 34.3021246, lon: -82.6655711 },
  "Centerville": { name: "Centerville", address: "103 Construction Way", lat: 34.5457262, lon: -82.695841 },
  "Williamston": { name: "Williamston", address: "902 Anderson Dr", lat: 34.6163175, lon: -82.49073195 },
  "Pendleton Station": { name: "Pendleton Station", address: "111 N Depot St", lat: 34.64900461, lon: -82.78013693 },
  "Powdersville": { name: "Powdersville", address: "10600 Anderson Rd", lat: 34.7747891, lon: -82.4877423 },
  "Townville": { name: "Townville", address: "8508 SC-24", lat: 34.5651501, lon: -82.8895488 },
  "Hopewell": { name: "Hopewell", address: "2850 Concord Rd", lat: 34.596524, lon: -82.6278652 },
  "Anmed North Campus": { name: "Anmed North Campus", address: "2000 E Greenville St", lat: 34.5451661, lon: -82.6286774 },
  "Medshore HQ 2": { name: "Medshore HQ (Unit 2)", address: "1009 N Fant St", lat: 34.5136613, lon: -82.6486386 }
};

export const LEVEL_POSTS: Record<number, string[]> = {
  1: ["Medshore HQ"],
  2: ["Anderson FD Sta 1", "Liberty Hwy"],
  3: ["Rock Springs", "West Anderson", "White Plains"],
  4: ["Rock Springs", "West Anderson", "White Plains", "SC-28 & Welpine Rd"],
  5: ["Rock Springs", "White Plains", "SC-28 & Welpine Rd", "Westgate", "Redi Mart"],
  6: ["Rock Springs", "White Plains", "Whitefield", "Westgate", "Redi Mart", "Liberty Hwy"],
  7: ["Rock Springs", "White Plains", "SC-28 & Welpine Rd", "Westgate", "Redi Mart", "Medshore HQ", "Whitefield FD"],
  8: ["Rock Springs", "Homeland Park", "Honea Path", "Wren", "Iva", "Westgate", "Williamston", "Pendleton Station"],
  9: ["Rock Springs", "Homeland Park", "Honea Path", "Wren", "Iva", "Westgate", "Williamston", "Pendleton Station", "Powdersville"],
  10: ["Rock Springs", "Homeland Park", "Honea Path", "Wren", "Iva", "Centerville", "Williamston", "Pendleton Station", "Powdersville", "Townville"],
  11: ["Rock Springs", "Homeland Park", "Honea Path", "Wren", "Iva", "Centerville", "Williamston", "Pendleton Station", "Powdersville", "Townville", "Medshore HQ"],
  12: ["Rock Springs", "Homeland Park", "Honea Path", "Wren", "Iva", "Centerville", "Williamston", "Pendleton Station", "Powdersville", "Townville", "Medshore HQ", "Hopewell"],
  13: ["Rock Springs", "Homeland Park", "Honea Path", "Wren", "Iva", "Centerville", "Williamston", "Pendleton Station", "Powdersville", "Townville", "Medshore HQ", "Hopewell", "Anmed North Campus"],
  14: ["Rock Springs", "Homeland Park", "Honea Path", "Wren", "Iva", "Centerville", "Williamston", "Pendleton Station", "Powdersville", "Townville", "Medshore HQ", "Hopewell", "Anmed North Campus", "Westgate"],
  15: ["Rock Springs", "Homeland Park", "Honea Path", "Wren", "Iva", "Centerville", "Williamston", "Pendleton Station", "Powdersville", "Townville", "Medshore HQ", "Hopewell", "Anmed North Campus", "West Anderson", "SC-28 & Welpine Rd"],
  16: ["Rock Springs", "Homeland Park", "Honea Path", "Wren", "Iva", "Centerville", "Williamston", "Pendleton Station", "Powdersville", "Townville", "Medshore HQ", "Hopewell", "Anmed North Campus", "West Anderson", "SC-28 & Welpine Rd", "Whitefield"],
  17: ["Rock Springs", "Homeland Park", "Honea Path", "Wren", "Iva", "Centerville", "Williamston", "Pendleton Station", "Powdersville", "Townville", "Medshore HQ", "Hopewell", "Anmed North Campus", "West Anderson", "SC-28 & Welpine Rd", "Whitefield", "Medshore HQ 2"]
};

