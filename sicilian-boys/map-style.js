// Ajuste de colores del mapa al estilo Uber: calles legibles en claro y en oscuro.
// Se aplica encima de los estilos "positron" (claro) y "dark" (oscuro) de OpenFreeMap.
// Lo usan el mapa en vivo y el script que genera las imágenes de la app del plan.
(function () {
  const minorWidth = ['interpolate', ['exponential', 1.55], ['zoom'], 13, 2.2, 16, 7, 20, 24];
  const pathWidth = ['interpolate', ['exponential', 1.2], ['zoom'], 13, 1.2, 20, 11];
  const DARK = {
    background: { 'background-color': '#141416' },
    landuse_residential: { 'fill-color': '#18181b' },
    landuse_park: { 'fill-color': '#15211a' },
    landcover_wood: { 'fill-color': '#15211a' },
    water: { 'fill-color': '#0e1a28' },
    waterway: { 'line-color': '#0e1a28' },
    building: { 'fill-color': '#1f1f23', 'fill-outline-color': '#2a2a2f' },
    'aeroway-runway': { 'line-color': '#2a2a2f' },
    'aeroway-taxiway': { 'line-color': '#26262b' },
    highway_path: { 'line-color': '#2e2e33', 'line-width': pathWidth },
    highway_minor: { 'line-color': '#3f3f46', 'line-width': minorWidth },
    highway_major_casing: { 'line-color': '#141416' },
    highway_major_inner: { 'line-color': '#5c5c64' },
    highway_major_subtle: { 'line-color': '#4a4a52' },
    highway_motorway_casing: { 'line-color': '#141416' },
    highway_motorway_inner: { 'line-color': '#76767e' },
    highway_motorway_subtle: { 'line-color': '#4a4a52' },
    railway: { 'line-color': '#2a2a2f' }, railway_minor: { 'line-color': '#2a2a2f' }, railway_transit: { 'line-color': '#2a2a2f' },
    railway_dashline: { 'line-color': '#141416' }, railway_minor_dashline: { 'line-color': '#141416' }, railway_transit_dashline: { 'line-color': '#141416' },
    highway_name_other: { 'text-color': '#c7c7cc', 'text-halo-color': '#141416', 'text-halo-width': 1.4 },
    highway_name_motorway: { 'text-color': '#d1d1d6' },
    water_name: { 'text-color': '#5b7ea3', 'text-halo-color': '#0e1a28' },
    place_other: { 'text-color': '#a1a1a8', 'text-halo-color': 'rgba(0,0,0,.85)' },
    place_suburb: { 'text-color': '#a1a1a8', 'text-halo-color': 'rgba(0,0,0,.85)' },
    place_village: { 'text-color': '#b4b4ba', 'text-halo-color': 'rgba(0,0,0,.85)' },
    place_town: { 'text-color': '#c7c7cc', 'text-halo-color': 'rgba(0,0,0,.85)' },
    place_city: { 'text-color': '#e5e5ea', 'text-halo-color': 'rgba(0,0,0,.85)' },
    place_city_large: { 'text-color': '#e5e5ea', 'text-halo-color': 'rgba(0,0,0,.85)' },
  };
  const LIGHT = {
    background: { 'background-color': '#ececec' },
    landuse_residential: { 'fill-color': '#e8e8e8' },
    park: { 'fill-color': '#d5e6d1' },
    landcover_wood: { 'fill-color': '#d0e2cc' },
    water: { 'fill-color': '#a9cbe6' },
    waterway: { 'line-color': '#a9cbe6' },
    building: { 'fill-color': '#dfdfdf', 'fill-outline-color': '#d4d4d4' },
    road_area_pier: { 'fill-color': '#ececec' }, road_pier: { 'line-color': '#ececec' },
    highway_path: { 'line-color': '#f7f7f8', 'line-width': pathWidth },
    highway_minor: { 'line-color': '#ffffff', 'line-width': minorWidth },
    highway_major_casing: { 'line-color': '#c7c7cc' },
    highway_major_inner: { 'line-color': '#ffffff' },
    highway_major_subtle: { 'line-color': '#c7c7cc' },
    highway_motorway_casing: { 'line-color': '#b4b4bb' },
    highway_motorway_inner: { 'line-color': '#ffffff' },
    highway_motorway_subtle: { 'line-color': '#c7c7cc' },
    'highway-name-path': { 'text-color': '#8e8e93', 'text-halo-color': '#ffffff' },
    'highway-name-minor': { 'text-color': '#48484a', 'text-halo-color': '#ffffff', 'text-halo-width': 1.4 },
    'highway-name-major': { 'text-color': '#2c2c2e', 'text-halo-color': '#ffffff', 'text-halo-width': 1.4 },
    water_name_point_label: { 'text-color': '#3d6b99' },
    water_name_line_label: { 'text-color': '#3d6b99' },
  };
  window.tuneMapStyle = function (map, dark) {
    const P = dark ? DARK : LIGHT;
    for (const [id, props] of Object.entries(P)) {
      if (!map.getLayer(id)) continue;
      for (const [k, v] of Object.entries(props)) { try { map.setPaintProperty(id, k, v); } catch (e) { /* propiedad no aplicable a esta capa */ } }
    }
  };
})();
