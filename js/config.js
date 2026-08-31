const FLOOD_COLORS = {
  1:   "#22c55e",
  1.5: "#84cc16",
  2:   "#fbbf24",
  2.5: "#f59e0b",
  3:   "#f97316",
  3.5: "#ef4444",
  4:   "#dc2626"
};

const REGIONS = {
  singkawang: {
    name: "Singkawang",
    typeLabel: "Kota",
    province: "Kalimantan Barat",
    center: [0.9060, 108.9872],
    zoom: 11,

    floodLayers: [
      {
        value: 1,
        label: "1,0 m",
        file: "data/singkawang/Genangan_1m_Singkawang.shp",
        color: FLOOD_COLORS[1],
        areaKm2: 1278.02
      },
      {
        value: 1.5,
        label: "1,5 m",
        file: "data/singkawang/Genangan_1.5m_Singkawang.shp",
        color: FLOOD_COLORS[1.5],
        areaKm2: 1318.08
      },
      {
        value: 2,
        label: "2,0 m",
        file: "data/singkawang/Genangan_2m_Singkawang.shp",
        color: FLOOD_COLORS[2],
        areaKm2: 1350.44
      },
      {
        value: 2.5,
        label: "2,5 m",
        file: "data/singkawang/Genangan_2.5_Singkawang.shp",
        color: FLOOD_COLORS[2.5],
        areaKm2: 1379.20
      },
      {
        value: 3,
        label: "3,0 m",
        file: "data/singkawang/Genangan_3m_Singkawang.shp",
        color: FLOOD_COLORS[3],
        areaKm2: 1402.91
      },
      {
        value: 3.5,
        label: "3,5 m",
        file: "data/singkawang/Genangan_3.5m_Singkawang.shp",
        color: FLOOD_COLORS[3.5],
        areaKm2: 1468.73
      },
      {
        value: 4,
        label: "4,0 m",
        file: "data/singkawang/Genangan_4_Singkawang.shp",
        color: FLOOD_COLORS[4],
        areaKm2: 1520.45
      }
    ],

    supportLayers: [
      {
        id: "batas-administrasi",
        label: "Batas Administrasi",
        legendLabel: "Batas Administrasi",
        file: "data/singkawang/ADMINISTRASI_Singkawang.shp",
        projection: { type: "wgs84" },
        defaultVisible: true,
        style: {
          color: "#38bdf8",
          weight: 2.2,
          opacity: 0.95,
          dashArray: "8 5",
          fillOpacity: 0
        }
      },
      {
        id: "administrasi-kecamatan",
        label: "Administrasi Kecamatan",
        legendLabel: "Administrasi Kecamatan",
        file: "data/singkawang/ADMINISTRASIKECAMATAN_Singkwang.shp",
        projection: { type: "wgs84" },
        defaultVisible: false,
        style: {
          color: "#94a3b8",
          weight: 1.4,
          opacity: 0.85,
          dashArray: "4 5",
          fillColor: "#64748b",
          fillOpacity: 0.03
        }
      },
      {
        id: "sungai-area",
        label: "Sungai / Badan Air",
        legendLabel: "Sungai / Badan Air",
        file: "data/singkawang/SUNGAI_AR_Singkawang.shp",
        projection: { type: "wgs84" },
        defaultVisible: false,
        style: {
          color: "#22d3ee",
          weight: 1.1,
          opacity: 0.95,
          fillColor: "#22d3ee",
          fillOpacity: 0.28
        }
      },
      {
        id: "sungai-garis",
        label: "Jaringan Sungai",
        legendLabel: "Jaringan Sungai",
        file: "data/singkawang/SUNGAI_LN_SIngkawang.shp",
        projection: { type: "wgs84" },
        defaultVisible: false,
        style: {
          color: "#67e8f9",
          weight: 1.25,
          opacity: 0.82,
          fillOpacity: 0
        }
      }
    ]
  },

  pontianak: {
    name: "Pontianak",
    typeLabel: "Kota",
    province: "Kalimantan Barat",
    center: [-0.0263, 109.3425],
    zoom: 13,

    floodLayers: [
      {
        value: 1,
        label: "1,0 m",
        file: "data/pontianak/Genangann_1m_Pontianak.shp",
        color: FLOOD_COLORS[1],
        areaKm2: 7.64
      },
      {
        value: 1.5,
        label: "1,5 m",
        file: "data/pontianak/Genangann_1.5m_Pontianak.shp",
        color: FLOOD_COLORS[1.5],
        areaKm2: 8.86
      },
      {
        value: 2,
        label: "2,0 m",
        file: "data/pontianak/Genangann_2m_Pontianak.shp",
        color: FLOOD_COLORS[2],
        areaKm2: 10.14
      },
      {
        value: 2.5,
        label: "2,5 m",
        file: "data/pontianak/Genangann_2.5m_Pontianak.shp",
        color: FLOOD_COLORS[2.5],
        areaKm2: 11.70
      },
      {
        value: 3,
        label: "3,0 m",
        file: "data/pontianak/Genangann_3m_Pontianak.shp",
        color: FLOOD_COLORS[3],
        areaKm2: 13.71
      },
      {
        value: 3.5,
        label: "3,5 m",
        file: "data/pontianak/Genangann_3.5m_Pontianak.shp",
        color: FLOOD_COLORS[3.5],
        areaKm2: 16.95
      },
      {
        value: 4,
        label: "4,0 m",
        file: "data/pontianak/Genangann_4m_Pontianak.shp",
        color: FLOOD_COLORS[4],
        areaKm2: 26.96
      }
    ],

    supportLayers: [
      {
        id: "batas-kota",
        label: "Batas Kota",
        legendLabel: "Batas Kota",
        file: "data/pontianak/Batas_Wilayah_Pontianak.shp",
        projection: { type: "utm", zone: 49, southern: true },
        defaultVisible: true,
        style: {
          color: "#38bdf8",
          weight: 2.3,
          opacity: 0.95,
          dashArray: "8 5",
          fillOpacity: 0
        }
      },
      {
        id: "batas-kecamatan",
        label: "Batas Kecamatan",
        legendLabel: "Batas Kecamatan",
        file: "data/pontianak/Batas_Kecamatan_Pontianak.shp",
        projection: { type: "utm", zone: 49, southern: true },
        defaultVisible: false,
        style: {
          color: "#94a3b8",
          weight: 1.35,
          opacity: 0.85,
          dashArray: "4 5",
          fillOpacity: 0
        }
      },
      {
        id: "administrasi-kecamatan",
        label: "Administrasi Kecamatan",
        legendLabel: "Administrasi Kecamatan",
        file: "data/pontianak/Admin_Kecamatan_Pontianak.shp",
        projection: { type: "utm", zone: 49, southern: true },
        defaultVisible: false,
        style: {
          color: "#a78bfa",
          weight: 1.15,
          opacity: 0.80,
          fillColor: "#8b5cf6",
          fillOpacity: 0.035
        }
      },
      {
        id: "poligon-kota",
        label: "Poligon Kota",
        legendLabel: "Poligon Kota",
        file: "data/pontianak/Poligon_Kota_Pontianak.shp",
        projection: { type: "utm", zone: 49, southern: true },
        defaultVisible: false,
        style: {
          color: "#60a5fa",
          weight: 1.4,
          opacity: 0.85,
          fillColor: "#3b82f6",
          fillOpacity: 0.035
        }
      },
      {
        id: "sungai-area",
        label: "Sungai / Badan Air",
        legendLabel: "Sungai / Badan Air",
        file: "data/pontianak/Sungai_Besar_Pontianak(1).shp",
        projection: { type: "utm", zone: 49, southern: true },
        defaultVisible: false,
        style: {
          color: "#22d3ee",
          weight: 1.1,
          opacity: 0.95,
          fillColor: "#22d3ee",
          fillOpacity: 0.28
        }
      },
      {
        id: "sungai-garis",
        label: "Jaringan Sungai",
        legendLabel: "Jaringan Sungai",
        file: "data/pontianak/Sungai_Pontianak.shp",
        projection: { type: "utm", zone: 49, southern: true },
        defaultVisible: false,
        style: {
          color: "#67e8f9",
          weight: 1.25,
          opacity: 0.82,
          fillOpacity: 0
        }
      }
    ]
  }
};

/*
 * Sesuai revisi:
 * saat website pertama dibuka, wilayah default adalah Singkawang.
 */
const DEFAULT_REGION = "singkawang";
const DEFAULT_FLOOD_OPACITY = 0.48;
