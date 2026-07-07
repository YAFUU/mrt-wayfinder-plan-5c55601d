import type { LineId } from "@/types/mrt";

export type SupportedMapLineId = Extract<LineId, "blue" | "purple" | "yellow" | "pink">;

export type LatLngPoint = { lat: number; lng: number };

export type MrtStationCoordinate = {
  id: string;
  line: SupportedMapLineId;
  latitude: number;
  longitude: number;
  coordinateSource: string;
  coordinateConfidence: "verified";
};

const source = "OpenStreetMap station geometry; Google Places cross-check";
const p = (line: SupportedMapLineId, latitude: number, longitude: number): MrtStationCoordinate => ({
  id: "",
  line,
  latitude,
  longitude,
  coordinateSource: source,
  coordinateConfidence: "verified",
});

export const MRT_MAP_LINE_SEQUENCES = {
  blue: ["BL01", "BL02", "BL03", "BL04", "BL05", "BL06", "BL07", "BL08", "BL09", "BL10", "BL11", "BL12", "BL13", "BL14", "BL15", "BL16", "BL17", "BL18", "BL19", "BL20", "BL21", "BL22", "BL23", "BL24", "BL25", "BL26", "BL27", "BL28", "BL29", "BL30", "BL31", "BL32", "BL33", "BL34", "BL35", "BL36", "BL37", "BL38"],
  purple: ["PP01", "PP02", "PP03", "PP04", "PP05", "PP06", "PP07", "PP08", "PP09", "PP10", "PP11", "PP12", "PP13", "PP14", "PP15", "PP16"],
  yellow: ["YL01", "YL02", "YL03", "YL04", "YL05", "YL06", "YL07", "YL08", "YL09", "YL10", "YL11", "YL12", "YL13", "YL14", "YL15", "YL16", "YL17", "YL18", "YL19", "YL20", "YL21", "YL22", "YL23"],
  pink: ["PK01", "PK02", "PK03", "PK04", "PK05", "PK06", "PK07", "PK08", "PK30", "PK09", "PK10", "PK11", "PK12", "PK13", "PK14", "PK15", "PK16", "PK17", "PK18", "PK19", "PK20", "PK21", "PK22", "PK23", "PK24", "PK25", "PK26", "PK27", "PK28", "PK29"],
} satisfies Record<SupportedMapLineId, string[]>;

const rawCoordinates = {
  BL01: p("blue", 13.7108774, 100.4094849), BL02: p("blue", 13.7119437, 100.4223368), BL03: p("blue", 13.7129105, 100.434326), BL04: p("blue", 13.7155591, 100.4454508), BL05: p("blue", 13.7202698, 100.4570233), BL06: p("blue", 13.7246179, 100.4650788), BL07: p("blue", 13.7296466, 100.4740422), BL08: p("blue", 13.7401714, 100.4707092), BL09: p("blue", 13.7558013, 100.4693198), BL10: p("blue", 13.7631986, 100.4724058), BL11: p("blue", 13.777382, 100.4852556), BL12: p("blue", 13.7838726, 100.4933267), BL13: p("blue", 13.7924113, 100.5048882), BL14: p("blue", 13.7989803, 100.5097864), BL15: p("blue", 13.8064027, 100.5210095), BL16: p("blue", 13.8061627, 100.5307752), BL17: p("blue", 13.8023925, 100.5410464), BL18: p("blue", 13.7979484, 100.5478837), BL19: p("blue", 13.8029643, 100.5532845), BL20: p("blue", 13.8128808, 100.5614634), BL21: p("blue", 13.806503, 100.5728701), BL22: p("blue", 13.7989706, 100.5745537), BL23: p("blue", 13.7894884, 100.5740801), BL24: p("blue", 13.7786878, 100.5735662), BL25: p("blue", 13.7662418, 100.5700446), BL26: p("blue", 13.7578166, 100.5652774), BL27: p("blue", 13.7491853, 100.5634165), BL28: p("blue", 13.7373948, 100.5613401), BL29: p("blue", 13.7226725, 100.5599134), BL30: p("blue", 13.7221264, 100.5543696), BL31: p("blue", 13.7256066, 100.5457249), BL32: p("blue", 13.7291982, 100.5370702), BL33: p("blue", 13.7320608, 100.5301206), BL34: p("blue", 13.7375708, 100.517135), BL35: p("blue", 13.7422095, 100.5099097), BL36: p("blue", 13.7469811, 100.5023028), BL37: p("blue", 13.7443259, 100.4946239), BL38: p("blue", 13.7383645, 100.4857002),
  PP01: p("purple", 13.8924338, 100.4082161), PP02: p("purple", 13.8810117, 100.409287), PP03: p("purple", 13.8746749, 100.4193624), PP04: p("purple", 13.8757677, 100.4338011), PP05: p("purple", 13.876607, 100.4449359), PP06: p("purple", 13.8748084, 100.4559653), PP07: p("purple", 13.8705112, 100.4666922), PP08: p("purple", 13.8702897, 100.4801284), PP09: p("purple", 13.865961, 100.4940765), PP10: p("purple", 13.8616527, 100.5046524), PP11: p("purple", 13.8601736, 100.5130671), PP12: p("purple", 13.8485312, 100.5147152), PP13: p("purple", 13.8395295, 100.5149681), PP14: p("purple", 13.8298636, 100.526496), PP15: p("purple", 13.820081, 100.5324581), PP16: p("purple", 13.8060902, 100.5308491),
  YL01: p("yellow", 13.8069826, 100.5747847), YL02: p("yellow", 13.8001638, 100.5841952), YL03: p("yellow", 13.7944253, 100.5944302), YL04: p("yellow", 13.7870921, 100.6075731), YL05: p("yellow", 13.7837002, 100.6136576), YL06: p("yellow", 13.7783677, 100.6231602), YL07: p("yellow", 13.7746334, 100.6298421), YL08: p("yellow", 13.7690755, 100.6397685), YL09: p("yellow", 13.7618191, 100.6455722), YL10: p("yellow", 13.7504111, 100.6447881), YL11: p("yellow", 13.7361482, 100.6411384), YL12: p("yellow", 13.7252705, 100.6417798), YL13: p("yellow", 13.7110971, 100.6441957), YL14: p("yellow", 13.7011219, 100.6464727), YL15: p("yellow", 13.6908637, 100.6471028), YL16: p("yellow", 13.6766379, 100.6461707), YL17: p("yellow", 13.6676858, 100.6450683), YL18: p("yellow", 13.6549747, 100.6421608), YL19: p("yellow", 13.6434906, 100.6362735), YL20: p("yellow", 13.6331023, 100.6301104), YL21: p("yellow", 13.6298427, 100.622688), YL22: p("yellow", 13.6367271, 100.6098956), YL23: p("yellow", 13.6450158, 100.5966038),
  PK01: p("pink", 13.8597221, 100.5181159), PK02: p("pink", 13.8626592, 100.5206536), PK03: p("pink", 13.8741356, 100.5163213), PK04: p("pink", 13.8892782, 100.5105744), PK05: p("pink", 13.8985658, 100.5070888), PK06: p("pink", 13.906199, 100.505395), PK07: p("pink", 13.9064956, 100.515577), PK08: p("pink", 13.9041584, 100.5292604), PK09: p("pink", 13.8974279, 100.5484467), PK10: p("pink", 13.8933037, 100.5601498), PK11: p("pink", 13.8907652, 100.5673522), PK12: p("pink", 13.8875764, 100.5757143), PK13: p("pink", 13.8840791, 100.5826859), PK14: p("pink", 13.879939, 100.5892957), PK15: p("pink", 13.8743621, 100.5972049), PK16: p("pink", 13.8709544, 100.6026204), PK17: p("pink", 13.8627961, 100.617815), PK18: p("pink", 13.8583122, 100.6261305), PK19: p("pink", 13.855015, 100.6322263), PK20: p("pink", 13.8492636, 100.6428787), PK21: p("pink", 13.845267, 100.6502444), PK22: p("pink", 13.8406246, 100.6587866), PK23: p("pink", 13.8337874, 100.6675745), PK24: p("pink", 13.8244533, 100.6772099), PK25: p("pink", 13.8165312, 100.685651), PK26: p("pink", 13.8127236, 100.702937), PK27: p("pink", 13.812694, 100.7126294), PK28: p("pink", 13.8125125, 100.7258382), PK29: p("pink", 13.80847, 100.73266), PK30: p("pink", 13.9005741, 100.5400085),
} satisfies Record<string, MrtStationCoordinate>;

export const stationCoordinatesById = Object.fromEntries(
  Object.entries(rawCoordinates).map(([id, value]) => [id, { ...value, id }]),
) as Record<string, MrtStationCoordinate>;

export function stationPointById(stationId: string): LatLngPoint | null {
  const coordinate = stationCoordinatesById[stationId];
  if (!coordinate) return null;
  return { lat: coordinate.latitude, lng: coordinate.longitude };
}

export function pathForStationIds(stationIds: string[]): LatLngPoint[] {
  return stationIds.map(stationPointById).filter((point): point is LatLngPoint => Boolean(point));
}

export function pathForLine(lineId: SupportedMapLineId): LatLngPoint[] {
  return pathForStationIds(MRT_MAP_LINE_SEQUENCES[lineId]);
}

export function pathForRouteStationIds(stationIds: string[], lineId: SupportedMapLineId): LatLngPoint[] {
  if (stationIds.length < 2) return pathForStationIds(stationIds);
  const sequence = MRT_MAP_LINE_SEQUENCES[lineId];
  const startIndex = sequence.indexOf(stationIds[0]);
  const endIndex = sequence.indexOf(stationIds[stationIds.length - 1]);
  if (startIndex < 0 || endIndex < 0) return pathForStationIds(stationIds);
  const ids = startIndex <= endIndex ? sequence.slice(startIndex, endIndex + 1) : sequence.slice(endIndex, startIndex + 1).reverse();
  return pathForStationIds(ids);
}

export function isSupportedMapLineId(lineId: LineId): lineId is SupportedMapLineId {
  return lineId === "blue" || lineId === "purple" || lineId === "yellow" || lineId === "pink";
}
