import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface InteractiveLiveMapProps {
  siteLat: number;
  siteLng: number;
  siteName: string;
  siteAddress?: string;
  machineName: string;
  machineCode?: string;
  techLat?: number;
  techLng?: number;
  techName?: string;
  techCode?: string;
  distanceKm?: number;
  status?: string;
  height?: string;
}

export const InteractiveLiveMap: React.FC<InteractiveLiveMapProps> = ({
  siteLat,
  siteLng,
  siteName,
  siteAddress,
  machineName,
  machineCode,
  techLat,
  techLng,
  techName,
  techCode,
  distanceKm,
  status = 'ASSIGNED',
  height = '420px',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Destroy existing instance if any
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const defaultLat = siteLat || 42.3314;
    const defaultLng = siteLng || -83.0458;

    // Create map
    const map = L.map(mapContainerRef.current, {
      zoomControl: true,
      attributionControl: false,
    }).setView([defaultLat, defaultLng], 13);

    mapInstanceRef.current = map;

    // Real OpenStreetMap geographic tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      subdomains: ['a', 'b', 'c'],
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    // Custom Industrial Factory Pin
    const factoryIcon = L.divIcon({
      className: 'custom-factory-marker',
      html: `
        <div style="
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: linear-gradient(135deg, #0ea5e9, #0284c7);
          box-shadow: 0 0 15px rgba(14, 165, 233, 0.6), 0 4px 6px rgba(0,0,0,0.4);
          border: 2px solid #ffffff;
          font-size: 20px;
          cursor: pointer;
        ">
          🏭
          <div style="
            position: absolute;
            bottom: -6px;
            width: 8px;
            height: 8px;
            background: #0284c7;
            transform: rotate(45deg);
          "></div>
        </div>
      `,
      iconSize: [44, 44],
      iconAnchor: [22, 44],
      popupAnchor: [0, -44],
    });

    // Custom Technician Pin
    const techIcon = L.divIcon({
      className: 'custom-tech-marker',
      html: `
        <div style="
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: linear-gradient(135deg, #10b981, #059669);
          box-shadow: 0 0 15px rgba(16, 185, 129, 0.7), 0 4px 6px rgba(0,0,0,0.4);
          border: 2px solid #ffffff;
          font-size: 20px;
          cursor: pointer;
          animation: pulse 2s infinite;
        ">
          👷‍♂️
          <div style="
            position: absolute;
            bottom: -6px;
            width: 8px;
            height: 8px;
            background: #059669;
            transform: rotate(45deg);
          "></div>
        </div>
      `,
      iconSize: [44, 44],
      iconAnchor: [22, 44],
      popupAnchor: [0, -44],
    });

    const latLngs: L.LatLngExpression[] = [];

    // Add Factory/Site Marker
    const siteMarker = L.marker([defaultLat, defaultLng], { icon: factoryIcon }).addTo(map);
    siteMarker.bindPopup(`
      <div style="font-family: inherit; font-size: 13px; color: #0f172a; padding: 4px;">
        <strong style="color: #0284c7; font-size: 14px;">📍 Customer Site</strong><br/>
        <b>${siteName}</b><br/>
        <span style="color: #64748b;">${siteAddress || ''}</span><br/>
        <div style="margin-top: 6px; padding: 4px 8px; background: #e0f2fe; border-radius: 4px; font-weight: 600;">
          Machine: ${machineName} (${machineCode || ''})
        </div>
      </div>
    `);
    latLngs.push([defaultLat, defaultLng]);

    // Add Technician Marker if coords provided
    if (techLat && techLng) {
      const techMarker = L.marker([techLat, techLng], { icon: techIcon }).addTo(map);
      techMarker.bindPopup(`
        <div style="font-family: inherit; font-size: 13px; color: #0f172a; padding: 4px;">
          <strong style="color: #059669; font-size: 14px;">👷‍♂️ Allocated Expert</strong><br/>
          <b>${techName || 'Specialist'} (${techCode || 'TECH'})</b><br/>
          <span style="color: #64748b;">Live Status: ${status}</span><br/>
          <div style="margin-top: 6px; padding: 4px 8px; background: #d1fae5; border-radius: 4px; font-weight: 600;">
            Distance: ${distanceKm ? `${distanceKm.toFixed(1)} km away` : 'Nearby'}
          </div>
        </div>
      `);
      latLngs.push([techLat, techLng]);

      // Draw route connecting Technician and Site
      const routeLine = L.polyline(
        [
          [techLat, techLng],
          [defaultLat, defaultLng],
        ],
        {
          color: '#0284c7',
          weight: 4,
          opacity: 0.8,
          dashArray: '8, 8',
        }
      ).addTo(map);

      // Fit bounds to show both markers nicely
      map.fitBounds(L.latLngBounds(latLngs), { padding: [50, 50], maxZoom: 15 });
    } else {
      map.setView([defaultLat, defaultLng], 14);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [siteLat, siteLng, siteName, machineName, techLat, techLng, techName, distanceKm, status]);

  const estMins = distanceKm ? Math.max(5, Math.round(distanceKm * 1.5 + 8)) : 15;

  return (
    <div style={{ position: 'relative', width: '100%', borderRadius: '12px', overflow: 'hidden', border: '1px solid #334155' }}>
      {/* Live Map Overlay Header */}
      <div
        style={{
          position: 'absolute',
          top: '12px',
          left: '12px',
          zIndex: 1000,
          background: 'rgba(15, 23, 42, 0.90)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(56, 189, 248, 0.3)',
          borderRadius: '8px',
          padding: '8px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          color: '#f8fafc',
          boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
        }}
      >
        <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#10b981', boxShadow: '0 0 8px #10b981' }}></span>
        <div>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8', fontWeight: 600 }}>
            Live Dispatch Radar
          </div>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc' }}>
            {techName ? `${techName} ➔ ${siteName}` : `Site: ${siteName}`}
          </div>
        </div>
        {distanceKm !== undefined && (
          <div
            style={{
              marginLeft: '8px',
              padding: '4px 10px',
              background: 'rgba(14, 165, 233, 0.2)',
              border: '1px solid #0ea5e9',
              borderRadius: '6px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '10px', color: '#38bdf8', fontWeight: 600 }}>PROXIMITY</div>
            <div style={{ fontSize: '12px', fontWeight: 800, color: '#ffffff' }}>
              {distanceKm.toFixed(1)} km ({estMins}m ETA)
            </div>
          </div>
        )}
      </div>

      {/* Map Canvas */}
      <div ref={mapContainerRef} style={{ width: '100%', height, minHeight: '320px', background: '#0a0f1d' }} />

      {/* Legend Footer */}
      <div
        style={{
          position: 'absolute',
          bottom: '12px',
          right: '12px',
          zIndex: 1000,
          background: 'rgba(15, 23, 42, 0.90)',
          backdropFilter: 'blur(8px)',
          border: '1px solid #334155',
          borderRadius: '6px',
          padding: '6px 10px',
          display: 'flex',
          gap: '12px',
          fontSize: '11px',
          color: '#cbd5e1',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span>🏭</span> Service Location
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span>👷‍♂️</span> Expert Technician
        </span>
      </div>
    </div>
  );
};
