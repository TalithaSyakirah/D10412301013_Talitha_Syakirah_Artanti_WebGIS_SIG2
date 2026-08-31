/**
 * SHP READER LOKAL
 * ================================================================
 * Membaca geometri langsung dari file .shp tanpa GeoJSON/database.
 *
 * Supported:
 *   3  = PolyLine
 *   5  = Polygon
 *   13 = PolyLineZ
 *   15 = PolygonZ
 *   23 = PolyLineM
 *   25 = PolygonM
 *
 * Pontianak layer pendukung menggunakan UTM WGS84 Zone 49S.
 * Layer genangan Pontianak dan seluruh data Singkawang memakai WGS84.
 */

(function () {
  "use strict";

  const SUPPORTED_LINE_TYPES = new Set([3, 13, 23]);
  const SUPPORTED_POLYGON_TYPES = new Set([5, 15, 25]);

  function utmToLonLat(easting, northing, zone, southern) {
    const a = 6378137.0;
    const eccSquared = 0.00669437999014;
    const k0 = 0.9996;

    let x = easting - 500000.0;
    let y = northing;

    if (southern) {
      y -= 10000000.0;
    }

    const eccPrimeSquared =
      eccSquared / (1.0 - eccSquared);

    const M = y / k0;

    const mu =
      M /
      (
        a *
        (
          1.0 -
          eccSquared / 4.0 -
          (3.0 * eccSquared * eccSquared) / 64.0 -
          (5.0 * eccSquared * eccSquared * eccSquared) / 256.0
        )
      );

    const e1 =
      (1.0 - Math.sqrt(1.0 - eccSquared)) /
      (1.0 + Math.sqrt(1.0 - eccSquared));

    const phi1Rad =
      mu +
      (3.0 * e1 / 2.0 - 27.0 * Math.pow(e1, 3) / 32.0) *
        Math.sin(2.0 * mu) +
      (21.0 * e1 * e1 / 16.0 - 55.0 * Math.pow(e1, 4) / 32.0) *
        Math.sin(4.0 * mu) +
      (151.0 * Math.pow(e1, 3) / 96.0) *
        Math.sin(6.0 * mu) +
      (1097.0 * Math.pow(e1, 4) / 512.0) *
        Math.sin(8.0 * mu);

    const N1 =
      a /
      Math.sqrt(
        1.0 -
        eccSquared *
          Math.sin(phi1Rad) *
          Math.sin(phi1Rad)
      );

    const T1 =
      Math.tan(phi1Rad) *
      Math.tan(phi1Rad);

    const C1 =
      eccPrimeSquared *
      Math.cos(phi1Rad) *
      Math.cos(phi1Rad);

    const R1 =
      a *
      (1.0 - eccSquared) /
      Math.pow(
        1.0 -
          eccSquared *
            Math.sin(phi1Rad) *
            Math.sin(phi1Rad),
        1.5
      );

    const D = x / (N1 * k0);

    let latitude =
      phi1Rad -
      (
        N1 *
        Math.tan(phi1Rad) /
        R1
      ) *
      (
        D * D / 2.0 -
        (
          5.0 +
          3.0 * T1 +
          10.0 * C1 -
          4.0 * C1 * C1 -
          9.0 * eccPrimeSquared
        ) *
          Math.pow(D, 4) /
          24.0 +
        (
          61.0 +
          90.0 * T1 +
          298.0 * C1 +
          45.0 * T1 * T1 -
          252.0 * eccPrimeSquared -
          3.0 * C1 * C1
        ) *
          Math.pow(D, 6) /
          720.0
      );

    const longitudeOrigin =
      (zone - 1.0) * 6.0 - 180.0 + 3.0;

    let longitude =
      (
        D -
        (1.0 + 2.0 * T1 + C1) *
          Math.pow(D, 3) /
          6.0 +
        (
          5.0 -
          2.0 * C1 +
          28.0 * T1 -
          3.0 * C1 * C1 +
          8.0 * eccPrimeSquared +
          24.0 * T1 * T1
        ) *
          Math.pow(D, 5) /
          120.0
      ) /
      Math.cos(phi1Rad);

    latitude =
      latitude * 180.0 / Math.PI;

    longitude =
      longitudeOrigin +
      longitude * 180.0 / Math.PI;

    return [longitude, latitude];
  }

  function transformPoint(point, projection) {
    if (!projection || projection.type === "wgs84") {
      return point;
    }

    if (projection.type === "utm") {
      return utmToLonLat(
        point[0],
        point[1],
        projection.zone,
        Boolean(projection.southern)
      );
    }

    throw new Error(
      `Projection tidak didukung: ${projection.type}`
    );
  }

  function ensureClosed(ring) {
    if (!ring.length) {
      return ring;
    }

    const first = ring[0];
    const last = ring[ring.length - 1];

    if (
      first[0] !== last[0] ||
      first[1] !== last[1]
    ) {
      ring.push([first[0], first[1]]);
    }

    return ring;
  }

  function signedArea(ring) {
    let area = 0;

    for (let i = 0; i < ring.length - 1; i += 1) {
      const a = ring[i];
      const b = ring[i + 1];

      area +=
        a[0] * b[1] -
        b[0] * a[1];
    }

    return area / 2;
  }

  function pointInRing(point, ring) {
    const x = point[0];
    const y = point[1];

    let inside = false;

    for (
      let i = 0, j = ring.length - 1;
      i < ring.length;
      j = i++
    ) {
      const xi = ring[i][0];
      const yi = ring[i][1];
      const xj = ring[j][0];
      const yj = ring[j][1];

      const intersects =
        (yi > y) !== (yj > y) &&
        x <
          ((xj - xi) * (y - yi)) /
            ((yj - yi) || Number.EPSILON) +
          xi;

      if (intersects) {
        inside = !inside;
      }
    }

    return inside;
  }

  function ringsToPolygons(rings) {
    const outers = [];
    const holes = [];

    rings.forEach((ring) => {
      const closed = ensureClosed(ring);

      if (closed.length < 4) {
        return;
      }

      /*
       * Shapefile specification:
       * outer ring clockwise, hole counter-clockwise.
       *
       * Dengan sumbu X/Y normal:
       * clockwise => signed area negatif.
       */
      if (signedArea(closed) < 0) {
        outers.push({
          outer: closed,
          holes: []
        });
      } else {
        holes.push(closed);
      }
    });

    /*
     * Beberapa software menulis orientasi ring berbeda.
     * Jika tidak ada outer yang terdeteksi, jangan buang geometri.
     */
    if (!outers.length) {
      return rings
        .filter((ring) => ring.length >= 4)
        .map((ring) => [ensureClosed(ring)]);
    }

    holes.forEach((hole) => {
      const sample = hole[0];

      const owner =
        outers.find(
          (polygon) =>
            pointInRing(sample, polygon.outer)
        );

      if (owner) {
        owner.holes.push(hole);
      } else {
        /*
         * Fallback aman agar ring tidak hilang.
         */
        outers.push({
          outer: [...hole].reverse(),
          holes: []
        });
      }
    });

    return outers.map(
      (polygon) => [
        polygon.outer,
        ...polygon.holes
      ]
    );
  }

  function readPartsAndPoints(
    view,
    contentOffset,
    projection
  ) {
    /*
     * Layout Polygon/Polyline:
     * shapeType 4 bytes
     * bbox      32 bytes
     * numParts   4 bytes
     * numPoints  4 bytes
     */
    let offset =
      contentOffset + 4 + 32;

    const numParts =
      view.getInt32(offset, true);

    const numPoints =
      view.getInt32(offset + 4, true);

    offset += 8;

    if (
      numParts <= 0 ||
      numPoints <= 0
    ) {
      return [];
    }

    const partStarts = [];

    for (let i = 0; i < numParts; i += 1) {
      partStarts.push(
        view.getInt32(offset + i * 4, true)
      );
    }

    offset += numParts * 4;

    const points =
      new Array(numPoints);

    for (let i = 0; i < numPoints; i += 1) {
      const pointOffset =
        offset + i * 16;

      const rawPoint = [
        view.getFloat64(pointOffset, true),
        view.getFloat64(pointOffset + 8, true)
      ];

      points[i] =
        transformPoint(
          rawPoint,
          projection
        );
    }

    const parts = [];

    for (let i = 0; i < numParts; i += 1) {
      const start = partStarts[i];

      const end =
        i + 1 < numParts
          ? partStarts[i + 1]
          : numPoints;

      const part =
        points.slice(start, end);

      if (part.length) {
        parts.push(part);
      }
    }

    return parts;
  }

  function parseRecord(
    view,
    contentOffset,
    projection
  ) {
    const shapeType =
      view.getInt32(contentOffset, true);

    if (shapeType === 0) {
      return null;
    }

    if (
      !SUPPORTED_LINE_TYPES.has(shapeType) &&
      !SUPPORTED_POLYGON_TYPES.has(shapeType)
    ) {
      throw new Error(
        `Shape type ${shapeType} belum didukung.`
      );
    }

    const parts =
      readPartsAndPoints(
        view,
        contentOffset,
        projection
      );

    if (!parts.length) {
      return null;
    }

    if (SUPPORTED_LINE_TYPES.has(shapeType)) {
      return {
        type: "Feature",
        properties: {},
        geometry:
          parts.length === 1
            ? {
                type: "LineString",
                coordinates: parts[0]
              }
            : {
                type: "MultiLineString",
                coordinates: parts
              }
      };
    }

    const polygons =
      ringsToPolygons(parts);

    if (!polygons.length) {
      return null;
    }

    return {
      type: "Feature",
      properties: {},
      geometry:
        polygons.length === 1
          ? {
              type: "Polygon",
              coordinates: polygons[0]
            }
          : {
              type: "MultiPolygon",
              coordinates: polygons
            }
    };
  }

  function parseShapefile(
    arrayBuffer,
    options = {}
  ) {
    const projection =
      options.projection || {
        type: "wgs84"
      };

    const view =
      new DataView(arrayBuffer);

    if (arrayBuffer.byteLength < 100) {
      throw new Error(
        "File SHP terlalu kecil atau rusak."
      );
    }

    const fileCode =
      view.getInt32(0, false);

    if (fileCode !== 9994) {
      throw new Error(
        "File bukan ESRI Shapefile yang valid."
      );
    }

    const headerShapeType =
      view.getInt32(32, true);

    if (
      !SUPPORTED_LINE_TYPES.has(headerShapeType) &&
      !SUPPORTED_POLYGON_TYPES.has(headerShapeType)
    ) {
      throw new Error(
        `Shape type ${headerShapeType} belum didukung.`
      );
    }

    const features = [];

    let offset = 100;

    while (
      offset + 8 <=
      arrayBuffer.byteLength
    ) {
      const contentLengthWords =
        view.getInt32(offset + 4, false);

      const contentLength =
        contentLengthWords * 2;

      const contentOffset =
        offset + 8;

      if (
        contentLength <= 0 ||
        contentOffset + contentLength >
          arrayBuffer.byteLength
      ) {
        break;
      }

      const feature =
        parseRecord(
          view,
          contentOffset,
          projection
        );

      if (feature) {
        features.push(feature);
      }

      offset =
        contentOffset + contentLength;
    }

    return {
      type: "FeatureCollection",
      features
    };
  }

  async function loadShapefile(
    url,
    options = {}
  ) {
    const response =
      await fetch(url);

    if (!response.ok) {
      throw new Error(
        `File tidak ditemukan (${response.status}): ${url}`
      );
    }

    const arrayBuffer =
      await response.arrayBuffer();

    return parseShapefile(
      arrayBuffer,
      options
    );
  }

  window.ShpReader = {
    loadShapefile,
    parseShapefile
  };
})();
