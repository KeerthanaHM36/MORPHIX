import React, { useState, useEffect } from 'react';
import { inventoryAPI, sparePartsAPI, sitesAPI } from '../services/api';
import { Inventory, SparePart, Site } from '../types';

export const InventoryPage: React.FC = () => {
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [parts, setParts] = useState<SparePart[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [selectedSiteId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [invData, partsData, sitesData] = await Promise.all([
        inventoryAPI.list({ site_id: selectedSiteId || undefined }),
        sparePartsAPI.list(),
        sitesAPI.list(),
      ]);
      setInventory(invData);
      setParts(partsData);
      setSites(sitesData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrapper">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a' }}>
            Spare Parts & Site Inventory
          </h1>
          <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
            Material availability tracking, reserved allocations & supply chain buffering
          </p>
        </div>
      </div>

      {/* Filter by Site */}
      <div className="card" style={{ marginBottom: 20, padding: '14px 20px', display: 'flex', gap: 16 }}>
        <div>
          <label style={{ fontSize: '0.75rem', color: '#475569', fontWeight: 600, display: 'block', marginBottom: 4 }}>Filter by Facility / Site</label>
          <select
            value={selectedSiteId}
            onChange={(e) => setSelectedSiteId(e.target.value)}
            className="form-select"
            style={{ width: 260, padding: '6px 10px', fontSize: '0.85rem' }}
          >
            <option value="">All Sites</option>
            {sites.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="card">
        <h3 className="card-title" style={{ marginBottom: 14, color: '#0f172a' }}>Site Stock Allocations</h3>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Part Code</th>
                <th>Part Description</th>
                <th>Site Facility</th>
                <th>Available Qty</th>
                <th>Reserved Qty</th>
                <th>Reorder Level</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: 30, color: '#64748b' }}>
                    Loading inventory data...
                  </td>
                </tr>
              ) : inventory.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: 30, color: '#64748b' }}>
                    No inventory records found for selected filter.
                  </td>
                </tr>
              ) : (
                inventory.map((item) => {
                  const isLow = item.quantity <= item.reorder_level;
                  return (
                    <tr key={item.id}>
                      <td className="font-mono" style={{ fontWeight: 700, color: '#0284c7' }}>
                        {item.part_code}
                      </td>
                      <td>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{item.part_name}</div>
                      </td>
                      <td style={{ fontSize: '0.85rem', color: '#475569' }}>{item.site_name}</td>
                      <td className="font-mono" style={{ fontWeight: 700, color: isLow ? '#ef4444' : '#10b981' }}>
                        {item.quantity} units
                      </td>
                      <td className="font-mono" style={{ color: '#d97706', fontWeight: 600 }}>
                        {item.reserved_quantity} units
                      </td>
                      <td className="font-mono" style={{ color: '#64748b' }}>
                        {item.reorder_level} units
                      </td>
                      <td>
                        {isLow ? (
                          <span className="badge badge-warning">Low Stock</span>
                        ) : (
                          <span className="badge badge-success">Nominal</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
