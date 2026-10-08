import React, { useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  BENGALURU_MAP_CONFIG,
  LIVE_DEPOTS,
  LIVE_MACHINES,
  LIVE_TECHNICIANS,
  LIVE_ROUTES,
  LiveTechnician,
  LiveMachineLocation,
  LiveDepot,
} from '../data/liveOperationsData';

export interface LiveOperationsMapProps {
  height?: string;
  filter?: string; // 'ALL' | 'ON_SITE' | 'EN_ROUTE' | 'DELAYED' | 'AVAILABLE' | 'ON_BREAK'
}

export const LiveOperationsMap: React.FC<LiveOperationsMapProps> = ({
  height = '360px',
  filter = 'ALL',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const techLayerRef = useRef<L.LayerGroup | null>(null);
  const routesLayerRef = useRef<L.LayerGroup | null>(null);
  const staticLayerRef = useRef<L.LayerGroup | null>(null);

  // Helper to create technician pill marker
  const createTechnicianMarker = (tech: LiveTechnician) => {
    return L.divIcon({
      className: 'morphix-marker-tech',
      html: `
        <div style="
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #ffffff;
          border: 2px solid ${tech.color};
          border-radius: 9999px;
          padding: 3px 9px 3px 4px;
          box-shadow: 0 4px 14px rgba(15, 23, 42, 0.2);
          cursor: pointer;
          transform: translate(-50%, -50%);
          white-space: nowrap;
          user-select: none;
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        ">
          <div style="
            width: 22px;
            height: 22px;
            border-radius: 50%;
            background: ${tech.badgeBg};
            color: ${tech.color};
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 11px;
            font-weight: 800;
          ">${tech.avatarInitials}</div>
          <div style="line-height: 1.15; text-align: left;">
            <div style="font-size: 11px; font-weight: 800; color: #0f172a;">${tech.code}</div>
            <div style="font-size: 9.5px; font-weight: 600; color: ${tech.color};">${tech.statusLabel}</div>
          </div>
        </div>
      `,
      iconSize: [0, 0],
      iconAnchor: [0, 0],
    });
  };

  // Helper to create machine marker
  const createMachineMarker = (machine: LiveMachineLocation) => {
    const isRisk = machine.slaStatus === 'AT_RISK';
    const borderCol = isRisk ? '#ef4444' : '#f59e0b';

    return L.divIcon({
      className: 'morphix-marker-machine',
      html: `
        <div style="
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #0f172a;
          border: 2px solid ${borderCol};
          border-radius: 8px;
          padding: 3px 8px;
          box-shadow: 0 4px 14px rgba(15, 23, 42, 0.28);
          cursor: pointer;
          transform: translate(-50%, -50%);
          white-space: nowrap;
          user-select: none;
        ">
          <span style="font-size: 13px;">🏭</span>
          <div style="line-height: 1.15; text-align: left;">
            <div style="font-size: 11px; font-weight: 800; color: #ffffff;">${machine.machineCode}</div>
            <div style="font-size: 9px; font-weight: 700; color: ${isRisk ? '#f87171' : '#fbbf24'};">${isRisk ? 'High SLA Risk' : 'Active Service'}</div>
          </div>
        </div>
      `,
      iconSize: [0, 0],
      iconAnchor: [0, 0],
    });
  };

  // Helper to create depot marker
  const createDepotMarker = (depot: LiveDepot) => {
    return L.divIcon({
      className: 'morphix-marker-depot',
      html: `
        <div style="
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #312e81;
          border: 2px solid #818cf8;
          border-radius: 8px;
          padding: 3px 8px;
          box-shadow: 0 4px 14px rgba(49, 46, 129, 0.35);
          cursor: pointer;
          transform: translate(-50%, -50%);
          white-space: nowrap;
          user-select: none;
        ">
          <span style="font-size: 13px;">🏢</span>
          <div style="line-height: 1.15; text-align: left;">
            <div style="font-size: 10.5px; font-weight: 800; color: #ffffff;">${depot.name}</div>
            <div style="font-size: 9px; font-weight: 600; color: #c7d2fe;">Spares Depot</div>
          </div>
        </div>
      `,
      iconSize: [0, 0],
      iconAnchor: [0, 0],
    });
  };

  // Helper popup HTML templates
  const getTechPopupContent = (tech: LiveTechnician) => {
    return `
      <div style="font-family: inherit; min-width: 210px; color: #0f172a; padding: 2px;">
        <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #f1f5f9; padding-bottom: 8px; margin-bottom: 8px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-weight: 800; font-size: 14px; color: #0f172a;">${tech.code}</span>
            <span style="font-weight: 600; font-size: 13px; color: #475569;">${tech.name}</span>
          </div>
          <span style="font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 4px; background: ${tech.badgeBg}; color: ${tech.color};">
            ${tech.status.replace('_', ' ')}
          </span>
        </div>
        <div style="display: flex; flex-direction: column; gap: 6px; font-size: 11.5px;">
          ${tech.serviceMachineCode ? `
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #64748b; font-weight: 500;">Assigned Service:</span>
              <span style="font-weight: 700; color: #0284c7;">${tech.serviceMachineCode}</span>
            </div>
          ` : ''}
          ${tech.eta ? `
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #64748b; font-weight: 500;">ETA:</span>
              <span style="font-weight: 700; color: #0f172a;">⏱️ ${tech.eta}</span>
            </div>
          ` : ''}
          <div style="display: flex; justify-content: space-between; gap: 8px;">
            <span style="color: #64748b; font-weight: 500;">Expertise:</span>
            <span style="font-weight: 600; color: #334155; text-align: right;">${tech.primarySkill}</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: #64748b; font-weight: 500;">Direct Contact:</span>
            <span style="font-weight: 600; color: #2563eb;">${tech.phone}</span>
          </div>
        </div>
      </div>
    `;
  };

  const getMachinePopupContent = (machine: LiveMachineLocation) => {
    const isRisk = machine.slaStatus === 'AT_RISK';
    return `
      <div style="font-family: inherit; min-width: 230px; color: #0f172a; padding: 2px;">
        <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #f1f5f9; padding-bottom: 8px; margin-bottom: 8px;">
          <div>
            <div style="font-weight: 800; font-size: 13.5px; color: #0f172a;">${machine.machineCode}</div>
            <div style="font-size: 10px; color: #64748b; font-weight: 500;">Req: ${machine.serviceRequestId}</div>
          </div>
          <span style="font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 4px; background: ${isRisk ? '#fee2e2' : '#fef3c7'}; color: ${isRisk ? '#dc2626' : '#d97706'};">
            ${isRisk ? '⚠️ High SLA Risk' : 'Active Service'}
          </span>
        </div>
        <div style="display: flex; flex-direction: column; gap: 6px; font-size: 11.5px;">
          <div>
            <span style="color: #64748b; font-weight: 500;">Reported Issue:</span>
            <div style="font-weight: 600; color: #334155; margin-top: 2px;">${machine.issue}</div>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: #64748b; font-weight: 500;">SLA Deadline:</span>
            <span style="font-weight: 700; color: #dc2626;">${machine.slaDeadline}</span>
          </div>
          ${machine.assignedTechCode ? `
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #64748b; font-weight: 500;">Assigned Tech:</span>
              <span style="font-weight: 700; color: #0284c7;">${machine.assignedTechCode} (${machine.assignedTechName})</span>
            </div>
          ` : ''}
          <div style="margin-top: 4px; padding-top: 4px; border-top: 1px dashed #e2e8f0; font-size: 10.5px; color: #64748b;">
            📍 ${machine.facilityName}
          </div>
        </div>
      </div>
    `;
  };

  const getDepotPopupContent = (depot: LiveDepot) => {
    return `
      <div style="font-family: inherit; min-width: 230px; color: #0f172a; padding: 2px;">
        <div style="border-bottom: 1px solid #f1f5f9; padding-bottom: 8px; margin-bottom: 8px;">
          <div style="font-weight: 800; font-size: 13.5px; color: #312e81;">🏢 ${depot.name}</div>
          <div style="font-size: 10px; color: #64748b; font-weight: 500;">${depot.type}</div>
        </div>
        <div style="display: flex; flex-direction: column; gap: 6px; font-size: 11.5px;">
          <div>
            <span style="color: #64748b; font-weight: 500;">Spares Inventory Highlights:</span>
            <ul style="margin: 4px 0 0 16px; padding: 0; color: #334155; font-size: 11px;">
              ${depot.inventoryHighlights.map((item) => `<li>${item}</li>`).join('')}
            </ul>
          </div>
          <div style="display: flex; justify-content: space-between; margin-top: 4px;">
            <span style="color: #64748b; font-weight: 500;">Dispatch Transit:</span>
            <span style="font-weight: 700; color: #4338ca;">⏱️ ${depot.etaToActiveSites}</span>
          </div>
          <div style="font-size: 10px; color: #64748b; margin-top: 2px;">
            📍 ${depot.address}
          </div>
        </div>
      </div>
    `;
  };

  // Render or update dynamic layers (technicians + routes based on filter)
  const renderDynamicLayers = useCallback((currentFilter: string) => {
    if (!techLayerRef.current || !routesLayerRef.current) return;

    techLayerRef.current.clearLayers();
    routesLayerRef.current.clearLayers();

    // 1. Filter technicians
    const filteredTechs = LIVE_TECHNICIANS.filter((tech) => {
      if (currentFilter === 'ALL') return true;
      return tech.status === currentFilter;
    });

    const activeTechCodes = new Set(filteredTechs.map((t) => t.code));

    // 2. Add technician markers
    filteredTechs.forEach((tech) => {
      const marker = L.marker([tech.lat, tech.lng], {
        icon: createTechnicianMarker(tech),
      });
      marker.bindPopup(getTechPopupContent(tech), {
        maxWidth: 280,
        className: 'morphix-map-popup',
      });
      techLayerRef.current?.addLayer(marker);
    });

    // 3. Add routes corresponding to visible technicians
    LIVE_ROUTES.forEach((route) => {
      if (activeTechCodes.has(route.techCode)) {
        const polyline = L.polyline(route.coordinates, {
          color: route.color,
          weight: 4,
          opacity: 0.85,
          dashArray: route.dashArray,
          lineJoin: 'round',
        });
        routesLayerRef.current?.addLayer(polyline);
      }
    });
  }, []);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    // Centered around Bengaluru, Karnataka, India
    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: false,
      minZoom: BENGALURU_MAP_CONFIG.minZoom,
      maxZoom: BENGALURU_MAP_CONFIG.maxZoom,
    }).setView(BENGALURU_MAP_CONFIG.center, BENGALURU_MAP_CONFIG.defaultZoom);

    mapInstanceRef.current = map;

    // Real OpenStreetMap geographic tiles with full streets, roads, and Bengaluru landmarks
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      subdomains: ['a', 'b', 'c'],
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    // Initialize layer groups
    const staticGroup = L.layerGroup().addTo(map);
    const routesGroup = L.layerGroup().addTo(map);
    const techGroup = L.layerGroup().addTo(map);

    staticLayerRef.current = staticGroup;
    routesLayerRef.current = routesGroup;
    techLayerRef.current = techGroup;

    // Add static Depot markers
    LIVE_DEPOTS.forEach((depot) => {
      const marker = L.marker([depot.lat, depot.lng], {
        icon: createDepotMarker(depot),
      });
      marker.bindPopup(getDepotPopupContent(depot), {
        maxWidth: 300,
        className: 'morphix-map-popup',
      });
      staticGroup.addLayer(marker);
    });

    // Add static Machine markers
    LIVE_MACHINES.forEach((machine) => {
      const marker = L.marker([machine.lat, machine.lng], {
        icon: createMachineMarker(machine),
      });
      marker.bindPopup(getMachinePopupContent(machine), {
        maxWidth: 290,
        className: 'morphix-map-popup',
      });
      staticGroup.addLayer(marker);
    });

    // Render initial dynamic technicians and routes
    renderDynamicLayers(filter);

    // Ensure map tiles and container size are calculated immediately
    const handleResize = () => {
      map.invalidateSize();
    };
    window.addEventListener('resize', handleResize);

    requestAnimationFrame(() => {
      map.invalidateSize();
    });

    const resizeTimer = setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimer);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update dynamic layers when filter prop changes
  useEffect(() => {
    renderDynamicLayers(filter);
  }, [filter, renderDynamicLayers]);

  // Handler to fit service bounds
  const handleFitBounds = () => {
    if (!mapInstanceRef.current) return;
    const allCoords: [number, number][] = [
      ...LIVE_DEPOTS.map((d) => [d.lat, d.lng] as [number, number]),
      ...LIVE_MACHINES.map((m) => [m.lat, m.lng] as [number, number]),
      ...LIVE_TECHNICIANS.map((t) => [t.lat, t.lng] as [number, number]),
    ];
    if (allCoords.length > 0) {
      mapInstanceRef.current.fitBounds(L.latLngBounds(allCoords), {
        padding: [35, 35],
        maxZoom: 13,
      });
    }
  };

  const handleResetCenter = () => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.setView(BENGALURU_MAP_CONFIG.center, BENGALURU_MAP_CONFIG.defaultZoom);
  };

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height,
        borderRadius: '12px',
        overflow: 'hidden',
        border: '1px solid #e2e8f0',
      }}
    >
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />

      {/* Floating Map Controls (Zoom In, Zoom Out, Reset Bounds) */}
      <div
        style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          background: '#ffffff',
          borderRadius: '8px',
          padding: '4px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.15)',
          border: '1px solid #cbd5e1',
        }}
      >
        <button
          onClick={() => mapInstanceRef.current?.zoomIn()}
          title="Zoom In"
          style={{
            width: '28px',
            height: '28px',
            fontWeight: 800,
            fontSize: '15px',
            color: '#1e293b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '4px',
            backgroundColor: '#f8fafc',
            cursor: 'pointer',
            transition: 'background-color 0.15s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#e2e8f0')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
        >
          +
        </button>
        <button
          onClick={() => mapInstanceRef.current?.zoomOut()}
          title="Zoom Out"
          style={{
            width: '28px',
            height: '28px',
            fontWeight: 800,
            fontSize: '15px',
            color: '#1e293b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '4px',
            backgroundColor: '#f8fafc',
            cursor: 'pointer',
            transition: 'background-color 0.15s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#e2e8f0')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
        >
          −
        </button>
        <button
          onClick={handleFitBounds}
          title="Fit Service Area"
          style={{
            width: '28px',
            height: '28px',
            fontWeight: 700,
            fontSize: '13px',
            color: '#1e293b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '4px',
            backgroundColor: '#f8fafc',
            cursor: 'pointer',
            borderTop: '1px solid #e2e8f0',
            paddingTop: '2px',
            transition: 'background-color 0.15s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#e2e8f0')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
        >
          ⛶
        </button>
      </div>

      {/* Floating Legend */}
      <div
        style={{
          position: 'absolute',
          bottom: '12px',
          left: '12px',
          zIndex: 1000,
          background: 'rgba(255, 255, 255, 0.94)',
          backdropFilter: 'blur(8px)',
          borderRadius: '8px',
          padding: '8px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '5px',
          fontSize: '11px',
          color: '#334155',
          fontWeight: 600,
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          border: '1px solid #cbd5e1',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#0284c7', display: 'inline-block' }}></span>
          <span>Technicians</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444', display: 'inline-block' }}></span>
          <span>Service Locations</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
          <span style={{ fontSize: '12px', lineHeight: 1 }}>🏭</span>
          <span>Machines</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
          <span style={{ fontSize: '12px', lineHeight: 1 }}>🏢</span>
          <span>Depots</span>
        </div>
      </div>
    </div>
  );
};
