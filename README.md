# Smart City · WebGIS Genangan Banjir — Revisi

Project ini merupakan revisi dari `Tugas_1_Webgis.zip`.

## Default

Saat halaman pertama dibuka:

**Kota Singkawang — Kalimantan Barat**

Semua layer genangan 1,0 m sampai 4,0 m ditampilkan.

## Fitur

- Dropdown daerah:
  - Kota Singkawang
  - Kota Pontianak
- Layer genangan:
  - 1,0 m
  - 1,5 m
  - 2,0 m
  - 2,5 m
  - 3,0 m
  - 3,5 m
  - 4,0 m
- 4,0 m berada pada pane paling bawah.
- Toggle setiap layer genangan.
- Tampilkan semua.
- Sembunyikan semua.
- Slider transparansi.
- Simulasi kenaikan air 1,0 → 4,0 m.
- Latitude / Longitude mengikuti posisi kursor.
- Zoom level live.
- Legenda lengkap.
- Statistik luas genangan.
- Layer pendukung dinamis sesuai data yang tersedia.
- Pilihan OpenStreetMap / OSM Humanitarian.
- Tidak membutuhkan SQL/database.
- Tidak menggunakan Google Fonts.
- Data utama tetap berupa Shapefile `.shp`.

## Layer Pendukung

### Singkawang

- Batas Administrasi  
  `ADMINISTRASI_Singkawang.shp`
- Administrasi Kecamatan  
  `ADMINISTRASIKECAMATAN_Singkwang.shp`
- Sungai / Badan Air  
  `SUNGAI_AR_Singkawang.shp`
- Jaringan Sungai  
  `SUNGAI_LN_SIngkawang.shp`

### Pontianak

- Batas Kota  
  `Batas_Wilayah_Pontianak.shp`
- Batas Kecamatan  
  `Batas_Kecamatan_Pontianak.shp`
- Administrasi Kecamatan  
  `Admin_Kecamatan_Pontianak.shp`
- Poligon Kota  
  `Poligon_Kota_Pontianak.shp`
- Sungai / Badan Air  
  `Sungai_Besar_Pontianak(1).shp`
- Jaringan Sungai  
  `Sungai_Pontianak.shp`

Pontianak layer pendukung berasal dari koordinat UTM WGS84 Zone 49S.
`shp-reader.js` mengubah koordinat tersebut ke WGS84 secara otomatis saat
ditampilkan di Leaflet.

## Nama File Genangan yang Dipakai

### Singkawang

- `Genangan_1m_Singkawang.shp`
- `Genangan_1.5m_Singkawang.shp`
- `Genangan_2m_Singkawang.shp`
- `Genangan_2.5_Singkawang.shp`
- `Genangan_3m_Singkawang.shp`
- `Genangan_3.5m_Singkawang.shp`
- `Genangan_4_Singkawang.shp`

### Pontianak

- `Genangann_1m_Pontianak.shp`
- `Genangann_1.5m_Pontianak.shp`
- `Genangann_2m_Pontianak.shp`
- `Genangann_2.5m_Pontianak.shp`
- `Genangann_3m_Pontianak.shp`
- `Genangann_3.5m_Pontianak.shp`
- `Genangann_4m_Pontianak.shp`

Nama di `config.js` sudah dibuat sama persis dengan nama file di folder data.

## Luas Genangan

Nilai luas yang ditampilkan pada legenda/statistik dihitung dari geometri
Shapefile yang diberikan, menggunakan WGS84/geodesic area, lalu ditampilkan
dalam km².

## Menjalankan

1. Extract ZIP.
2. Buka folder `Tugas_1_Webgis_Revisi` di VS Code.
3. Jalankan `index.html` dengan **Live Server**.
4. Buka melalui Chrome.

Jangan membuka `index.html` dengan `file://` karena browser dapat memblokir
`fetch()` file `.shp`.


## Update UI/UX Putih-Biru

Versi ini mempertahankan seluruh data dan fitur dari revisi sebelumnya,
namun UI/UX diubah menjadi gaya modern putih-biru.

Perubahan:
- Sidebar putih dengan aksen biru.
- Toolbar peta putih.
- Legenda putih.
- Tombol simulasi biru modern.
- Kartu "Simulasi Aktif" ditambahkan di sidebar.
- Kartu aktif berubah otomatis berdasarkan layer genangan yang sedang tampil.
- Latitude, Longitude, dan level Zoom dipindahkan ke toolbar atas di samping Basemap.
- Coordinate bar bawah dihapus.
- Seluruh fungsi Shapefile, simulasi, layer pendukung, transparansi,
  tampil/sembunyikan semua, statistik luas, dan default Singkawang tetap dipertahankan.
