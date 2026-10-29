import { useState } from 'react';
import type { StockMovement, WarehouseContainer } from './types';

interface InventoryDetailsProps {
  container: WarehouseContainer | null;
  movements: StockMovement[];
  historyLoading: boolean;
  submitting: boolean;
  mutationMessage: { tone: 'success' | 'error'; text: string } | null;
  onStockChange: (type: 'add' | 'remove', quantity: number) => Promise<boolean>;
}

export default function InventoryDetails({ container, movements, historyLoading, submitting, mutationMessage, onStockChange }: InventoryDetailsProps) {
  const [quantity, setQuantity] = useState('');
  const [inputError, setInputError] = useState('');

  async function submit(type: 'add' | 'remove') {
    if (!container) return;
    const parsed = Number(quantity);
    if (!Number.isInteger(parsed) || parsed <= 0) {
      setInputError('Enter a whole quantity greater than zero.');
      return;
    }
    if (type === 'remove' && parsed > container.currentStock) {
      setInputError(`Only ${container.currentStock} units are currently in this container.`);
      return;
    }
    if (type === 'add' && parsed > container.availableCapacity) {
      setInputError(`Only ${container.availableCapacity} units of capacity are available.`);
      return;
    }
    setInputError('');
    if (await onStockChange(type, parsed)) setQuantity('');
  }

  if (!container) return <aside className="details-panel details-empty"><div className="empty-detail-icon">⌖</div><strong>Select a container</strong><span>Click a glass storage bin to inspect product and inventory details.</span></aside>;

  const tone = container.currentStock === 0 ? 'empty' : container.status.toLowerCase().replace('_', '-');
  return <aside className="details-panel" aria-live="polite">
    <div className="details-heading">
      <div><span className="section-kicker">SELECTED CONTAINER</span><h2>{container.columnCode}-L{container.level}</h2></div>
      <span className={`status-chip ${tone}`}><i />{container.status.replace('_', ' ')}</span>
    </div>
    <div className="product-identity">
      <div className="product-symbol">{container.currentStock === 0 ? '∅' : container.product.category === 'Electronics' ? '⌘' : '▧'}</div>
      <div className="product-name-block"><span>{container.product.category}</span><strong>{container.product.name}</strong><small>SKU · {container.product.sku}</small></div>
    </div>

    <section className="capacity-section">
      <div className="capacity-title"><span>Storage occupancy</span><b>{container.occupancyPercentage.toFixed(0)}%</b></div>
      <div className="capacity-meter"><i className={tone} style={{ width: `${Math.min(100, container.occupancyPercentage)}%` }} /></div>
      <div className="capacity-scale"><span>0</span><span>{container.maxCapacity} units capacity</span><span>100%</span></div>
      {container.currentStock === 0 && <div className="empty-state-note">This container is empty and ready for replenishment.</div>}
    </section>

    <div className="inventory-stats">
      <div><span>Current stock</span><strong>{container.currentStock.toLocaleString()} <small>units</small></strong></div>
      <div><span>Max capacity</span><strong>{container.maxCapacity.toLocaleString()} <small>units</small></strong></div>
      <div><span>Available</span><strong>{container.availableCapacity.toLocaleString()} <small>units</small></strong></div>
      <div><span>Column / level</span><strong>{container.columnCode} <small>· L{container.level}</small></strong></div>
    </div>

    <div className="details-divider" />
    <section className="stock-editor">
      <div className="section-heading-row"><h3>Adjust stock</h3><span>API validated</span></div>
      <label htmlFor="stock-quantity">Quantity</label>
      <input id="stock-quantity" inputMode="numeric" pattern="[0-9]*" min="1" step="1" type="number" value={quantity} onChange={(event) => { setQuantity(event.target.value); setInputError(''); }} placeholder="Enter units" disabled={submitting} />
      {inputError && <p className="form-feedback error">{inputError}</p>}
      {!inputError && mutationMessage && <p className={`form-feedback ${mutationMessage.tone}`}>{mutationMessage.text}</p>}
      <div className="stock-actions">
        <button className="stock-button add" type="button" disabled={submitting || !quantity} onClick={() => void submit('add')}><span>＋</span> Add stock</button>
        <button className="stock-button remove" type="button" disabled={submitting || !quantity} onClick={() => void submit('remove')}><span>−</span> Remove</button>
      </div>
      <p className="stock-help">Changes are checked and recorded by the warehouse API.</p>
    </section>

    <div className="details-divider history-divider" />
    <section className="movement-section" id="movement-history">
      <div className="section-heading-row"><h3>Stock movement</h3><span>RECENT ACTIVITY</span></div>
      {historyLoading ? <div className="history-loading"><i /> Loading movement history</div> : movements.length === 0 ? <div className="history-empty">No stock movement has been recorded.</div> : <div className="movement-list">
        {movements.slice(0, 5).map((movement) => <article className="movement-row" key={movement.id}>
          <span className={`movement-icon ${movement.type.toLowerCase()}`}>{movement.type === 'ADD' ? '↓' : '↑'}</span>
          <span className="movement-copy"><strong>{movement.type === 'ADD' ? 'Stock received' : 'Stock removed'}</strong><small>{movement.note || 'Inventory adjustment'} · {new Date(movement.occurredAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</small></span>
          <span className={`movement-quantity ${movement.type.toLowerCase()}`}>{movement.type === 'ADD' ? '+' : '−'}{movement.quantity}</span>
        </article>)}
      </div>}
    </section>
  </aside>;
}
