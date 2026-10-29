import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import InventoryDetails from './warehouse/InventoryDetails';
import { warehouseApi } from './warehouse/api';
import type { StockMovement, WarehouseContainer } from './warehouse/types';

const INITIAL_SELECTION = 'A-01-L1';
const DigitalTwin = lazy(() => import('./warehouse/DigitalTwin'));

function App() {
  const [containers, setContainers] = useState<WarehouseContainer[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(INITIAL_SELECTION);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [activeAisle, setActiveAisle] = useState('ALL');
  const [submitting, setSubmitting] = useState(false);
  const [mutationMessage, setMutationMessage] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [historyKey, setHistoryKey] = useState(0);

  const selected = useMemo(() => containers.find((container) => container.shelfId === selectedId) ?? null, [containers, selectedId]);
  const aisles = useMemo(() => [...new Set(containers.map((container) => container.columnCode.split('-')[0]))].sort(), [containers]);
  const totalUnits = useMemo(() => containers.reduce((sum, container) => sum + container.currentStock, 0), [containers]);
  const averageOccupancy = useMemo(() => {
    const capacity = containers.reduce((sum, container) => sum + container.maxCapacity, 0);
    return capacity ? Math.round(totalUnits / capacity * 100) : 0;
  }, [containers, totalUnits]);
  const attentionCount = useMemo(() => containers.filter((container) => container.status === 'NEAR_CAPACITY' || container.status === 'CRITICAL' || container.status === 'EMPTY').length, [containers]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    warehouseApi.list().then((items) => {
      if (!active) return;
      setContainers(items);
      setSelectedId((current) => current && items.some((item) => item.shelfId === current) ? current : items[0]?.shelfId ?? null);
      setError('');
    }).catch((reason: unknown) => {
      if (active) setError(reason instanceof Error ? reason.message : 'Unable to load warehouse inventory.');
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [reloadKey]);

  useEffect(() => {
    if (!selectedId) { setMovements([]); return; }
    let active = true;
    setHistoryLoading(true);
    setMutationMessage(null);
    warehouseApi.movements(selectedId).then((items) => { if (active) setMovements(items); })
      .catch(() => { if (active) setMovements([]); })
      .finally(() => { if (active) setHistoryLoading(false); });
    return () => { active = false; };
  }, [selectedId, historyKey]);

  const changeStock = useCallback(async (type: 'add' | 'remove', quantity: number): Promise<boolean> => {
    if (!selected) return false;
    const shelfId = selected.shelfId;
    setSubmitting(true);
    setMutationMessage(null);
    try {
      const updated = type === 'add'
        ? await warehouseApi.addStock(shelfId, { quantity, note: 'Dashboard stock adjustment' })
        : await warehouseApi.removeStock(shelfId, { quantity, note: 'Dashboard stock adjustment' });
      setContainers((current) => current.map((container) => container.shelfId === updated.shelfId ? updated : container));
      setMutationMessage({ tone: 'success', text: `${type === 'add' ? 'Added' : 'Removed'} ${quantity} units. Inventory is synchronized.` });
      setHistoryKey((current) => current + 1);
      return true;
    } catch (reason) {
      setMutationMessage({ tone: 'error', text: reason instanceof Error ? reason.message : 'Stock update failed. Please retry.' });
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [selected]);

  function findContainer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = search.trim().toLowerCase();
    if (!query) return;
    const match = containers.find((container) => container.shelfId.toLowerCase() === query || container.columnCode.toLowerCase() === query)
      ?? containers.find((container) => container.shelfId.toLowerCase().includes(query) || container.product.name.toLowerCase().includes(query) || container.product.sku.toLowerCase().includes(query));
    if (match) { setSelectedId(match.shelfId); setSearch(''); }
    else setMutationMessage({ tone: 'error', text: `No container or product matches “${search.trim()}”.` });
  }

  return <div className="racksy-app">
    <aside className="sidebar">
      <a className="brand" href="#top" aria-label="Racksy home"><span className="brand-mark"><i /><i /><i /><i /></span><span>racksy<span className="brand-dot">.</span></span></a>
      <div className="workspace-label">WORKSPACE</div>
      <div className="facility-switcher"><span className="facility-icon">N</span><span className="facility-copy"><strong>North Hub</strong><small>Warehouse · Live model</small></span><span className="chevron">⌄</span></div>
      <div className="workspace-label nav-label">OPERATIONS</div>
      <nav className="primary-nav" aria-label="Main navigation">
        <a href="#overview" className="nav-item"><span className="nav-icon">▦</span>Overview</a>
        <a href="#inventory" className="nav-item"><span className="nav-icon">▤</span>Inventory <span className="nav-count">{containers.length || '—'}</span></a>
        <a href="#warehouse" className="nav-item active" aria-current="page"><span className="nav-icon">⌘</span>Warehouse twin</a>
        <a href="#movement-history" className="nav-item"><span className="nav-icon">↗</span>Movements</a>
      </nav>
      <div className="sidebar-bottom"><div className={`connection-card ${error ? 'disconnected' : loading ? 'connecting' : ''}`}><i /><span><strong>{error ? 'API unavailable' : loading ? 'Connecting…' : 'Inventory synchronized'}</strong><small>{error ? 'Retry connection to continue' : loading ? 'Loading database records' : 'PostgreSQL source of truth'}</small></span></div><div className="user-button"><span className="avatar">WM</span><span className="user-copy"><strong>Warehouse manager</strong><small>Operations</small></span></div></div>
    </aside>

    <main className="main-area" id="top">
      <header className="topbar"><div className="breadcrumbs"><span>Operations</span><span className="crumb-slash">/</span><strong>Warehouse twin</strong></div><div className="topbar-right"><span className="api-badge"><i className={!loading && !error ? 'online' : ''} />{error ? 'OFFLINE' : loading ? 'SYNCING' : 'LIVE API'}</span><span className="top-date">DEMO / NORTH HUB</span></div></header>
      <div className="page-content">
        <section className="page-heading" id="overview"><div><div className="eyebrow"><span className="live-dot" /> SMART WAREHOUSING SYSTEM <span className="eyebrow-separator">·</span> DIGITAL TWIN</div><h1>Warehouse twin</h1><p>Explore inventory by location. Select any container to inspect or adjust stock.</p></div><form className="warehouse-search" onSubmit={findContainer}><span>⌕</span><input aria-label="Search container or product" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search shelf, SKU or product" /><button type="submit">Find</button></form></section>

        <section className="metrics" aria-label="Inventory overview">
          <article className="metric-card"><div className="metric-label">Storage utilization<span className="metric-mark">◩</span></div><div className="metric-bottom"><strong>{loading ? '—' : averageOccupancy}<span>%</span></strong><span className="metric-subtext">Weighted by capacity</span></div><div className="metric-track"><i style={{ width: `${loading ? 0 : averageOccupancy}%` }} /></div></article>
          <article className="metric-card"><div className="metric-label">Storage locations<span className="metric-mark">▤</span></div><div className="metric-bottom"><strong>{loading ? '—' : containers.length}<span className="metric-unit">/ {aisles.length * 15 || 15}</span></strong><span className="metric-subtext">{aisles.length || 1} aisle{aisles.length === 1 ? '' : 's'} · five columns each</span></div><div className="metric-footnote"><span className="tiny-teal-dot" /> Click a container to select</div></article>
          <article className="metric-card"><div className="metric-label">Units on hand<span className="metric-mark">▧</span></div><div className="metric-bottom"><strong>{loading ? '—' : totalUnits.toLocaleString()}</strong><span className="metric-subtext">Database inventory total</span></div><div className="metric-footnote"><span className="tiny-teal-dot" /> Persisted by the warehouse API</div></article>
          <article className="metric-card attention-card"><div className="metric-label">Attention required<span className="metric-mark warning">!</span></div><div className="metric-bottom"><strong>{loading ? '—' : String(attentionCount).padStart(2, '0')}</strong><span className="metric-subtext">Empty or near capacity</span></div><div className="metric-footnote attention-footnote"><span className="attention-line" /> Review highlighted containers</div></article>
        </section>

        {error && <div className="api-error-banner" role="alert"><span className="error-symbol">!</span><span><strong>Warehouse API is unavailable</strong><small>{error}</small></span><button type="button" onClick={() => setReloadKey((value) => value + 1)}>Retry</button></div>}

        <section className="workspace" id="warehouse">
          <div className="scene-card">
            <div className="scene-topline"><div><div className="scene-title">Warehouse model <span className="scene-live"><i />{loading ? 'CONNECTING' : error ? 'OFFLINE' : 'LIVE INVENTORY'}</span></div><div className="scene-subtitle">{aisles.length || 1} aisle{aisles.length === 1 ? '' : 's'} <span>·</span> 5 columns each <span>·</span> 3 levels <span>·</span> {containers.length || 15} containers</div></div><div className="scene-tools"><span className="scene-hint"><i>↔</i> Drag to orbit <b>·</b> Scroll to zoom</span></div></div>
            <div className="aisle-toolbar" role="group" aria-label="Focus warehouse aisle"><span>VIEW</span><button type="button" className={activeAisle === 'ALL' ? 'active' : ''} onClick={() => setActiveAisle('ALL')}>All aisles</button>{aisles.map((aisle) => <button type="button" key={aisle} className={activeAisle === aisle ? 'active' : ''} onClick={() => { setActiveAisle(aisle); const firstContainer = containers.find((container) => container.columnCode.startsWith(`${aisle}-`)); if (firstContainer) setSelectedId(firstContainer.shelfId); }}>Aisle {aisle}</button>)}</div>
            <div className="scene-stage">
              <Suspense fallback={<div className="scene-overlay"><span className="loading-ring" /><strong>Preparing the 3D warehouse</strong></div>}>
                <DigitalTwin containers={containers} selectedId={selectedId} hoveredId={hoveredId} onSelect={setSelectedId} onHover={setHoveredId} activeAisle={activeAisle} />
              </Suspense>
              {loading && <div className="scene-overlay"><span className="loading-ring" /><strong>Connecting to warehouse database</strong><small>Loading the 15 inventory records</small></div>}
              {!loading && !error && containers.length === 0 && <div className="scene-overlay empty-overlay"><strong>No containers found</strong><small>The selected data source contains no warehouse locations.</small></div>}
              {error && <div className="scene-overlay error-overlay"><strong>Inventory data unavailable</strong><small>The rack is ready; connect the API to load product containers.</small></div>}
              <div className="scene-compass"><span>N</span><b>↑</b></div>
              <div className="scene-legend"><span><i className="legend-empty" />Available space</span><span><i className="legend-normal" />Occupied inventory</span><span><i className="legend-warning" />Near capacity</span><span><i className="legend-critical" />Critical / full</span></div>
            </div>
            <div className="scene-bottomline"><span><i className="bottom-status" /> {error ? 'Waiting for API connection' : loading ? 'Loading database state…' : 'Visual fill recalculated from stock and capacity'}</span><span className="scale-note">Instanced product boxes · camera orbit / zoom / pan</span></div>
          </div>
          <InventoryDetails container={selected} movements={movements} historyLoading={historyLoading} submitting={submitting} mutationMessage={mutationMessage} onStockChange={changeStock} />
        </section>

        <footer className="page-footer"><span>Racksy Warehouse Intelligence <span className="footer-dot">·</span> React Three Fiber / PostgreSQL</span><span>Changes are persisted to the warehouse database.</span></footer>
      </div>
    </main>
  </div>;
}

export default App;
