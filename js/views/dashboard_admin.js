// Vista Dashboard Administrador
window.renderDashboardAdmin = async function(container) {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isSuper = user.role === 'superusuario';
  let chartInstance = null;

  container.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; flex-wrap: wrap; gap: 1rem;">
        <h2>Panel de Administración</h2>
        <div style="display: flex; gap: 1rem; align-items: center; flex-wrap: wrap;">
            ${isSuper ? `
            <button id="btn-eliminar-todo" class="btn" style="background: transparent; border: 1px solid #ef4444; border-radius: 20px; color: #ef4444; font-weight: 600; cursor: pointer;">
                Eliminar Datos
            </button>
            <button id="btn-generar-datos" class="btn" style="background: transparent; border: 1px solid var(--text-main); border-radius: 20px; color: var(--text-main); font-weight: 600; cursor: pointer;">
                Generar Datos Prueba
            </button>
            ` : ''}
            <button id="btn-exportar" class="btn" style="display: inline-flex; align-items: center; gap: 0.5rem; text-decoration: none;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                Exportar Reporte a Excel (Mensual)
            </button>
        </div>
    </div>

    <!-- Sección de Gráfico / Analíticas -->
    <div class="card">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
            <h3 style="margin: 0;">Análisis de Ingresos y Egresos</h3>
            <div style="display: flex; gap: 1rem; align-items: center;">
                <select id="chartTimeFilter" class="pill-filter" style="background: var(--bg); color: var(--text-main); border: 1px solid var(--border-color); border-radius: 20px; padding: 0.5rem 1rem; outline: none; font-weight: 500; cursor: pointer;">
                    <option value="week" selected>Semanas</option>
                    <option value="month">Meses</option>
                    <option value="year">Años</option>
                </select>
                <select id="chartFormatFilter" class="pill-filter" style="background: var(--bg); color: var(--text-main); border: 1px solid var(--border-color); border-radius: 20px; padding: 0.5rem 1rem; outline: none; font-weight: 500; cursor: pointer;">
                    <option value="">Todos los Formatos</option>
                    <option value="DI-HL">DI-HL</option>
                    <option value="HR-U">HR-U</option>
                </select>
            </div>
        </div>
        <div style="width: 100%; max-height: 350px; margin: 1.5rem 0;">
            <canvas id="inventoryChart"></canvas>
        </div>

        <!-- Fila Superior: DI-HL -->
        <h4 style="margin-top: 1.5rem; margin-bottom: 0.5rem; color: var(--text-muted); text-transform: uppercase; font-size: 0.85rem; letter-spacing: 1px;">Formato DI-HL</h4>
        <div id="dihl-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 1.5rem; margin-bottom: 2rem;">
            <div style="text-align: center; color: var(--text-muted); padding: 1rem;">Cargando inventario DI-HL...</div>
        </div>

        <!-- Fila Inferior: HR-U -->
        <h4 style="margin-top: 2.5rem; margin-bottom: 0.5rem; color: var(--text-muted); text-transform: uppercase; font-size: 0.85rem; letter-spacing: 1px;">Formato HR-U</h4>
        <div id="hru-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 1.5rem;">
            <div style="text-align: center; color: var(--text-muted); padding: 1rem;">Cargando inventario HR-U...</div>
        </div>
    </div>

    <!-- Transacciones Pendientes -->
    <div class="card" id="pending-transactions-card">
        <h3>Transacciones Pendientes (Ingresos y Egresos)</h3>
        <div id="pending-list" style="margin-top: 1rem;">
            <div style="color: var(--text-muted); text-align: center; padding: 1rem;">Buscando pendientes...</div>
        </div>
    </div>

    <!-- Asignar Pedido -->
    <div class="card">
        <h3>Asignar Pedido / Orden de Salida</h3>
        <p style="color: var(--text-muted); margin-bottom: 1.5rem; margin-top: 0;">Delega una tarea estructurada de extracción a un trabajador de la planta.</p>
        <form id="asignar-pedido-form">
            <div class="form-control" style="background: transparent; border: none; padding: 0; box-shadow: none;">
                <label style="font-weight: 700; color: var(--primary);">1. Seleccionar Trabajador a Cargo</label>
                <select id="select-trabajador" class="form-control" required style="margin-bottom: 2rem; cursor: pointer;">
                    <option value="">Cargando trabajadores...</option>
                </select>
            </div>
            
            <label style="font-weight: 700; color: var(--primary);">2. Formatos a Despachar (Seleccione tamaños múltiples)</label>
            <div style="display: flex; gap: 1rem; flex-wrap: wrap; margin-bottom: 1rem; background: var(--card-bg); padding: 1.5rem; border: 1px solid var(--border-color); border-radius: 12px;">
                <label class="cb-label-styled"><input type="checkbox" name="tamanos_pedido" value="14x14"> 14x14</label>
                <label class="cb-label-styled"><input type="checkbox" name="tamanos_pedido" value="14x17"> 14x17</label>
                <label class="cb-label-styled"><input type="checkbox" name="tamanos_pedido" value="10x14"> 10x14</label>
                <label class="cb-label-styled"><input type="checkbox" name="tamanos_pedido" value="10x12"> 10x12</label>
            </div>
            
            <div id="pedido-sizes-blocks">
                ${[
                  {val: '14x14', label: '14x14'},
                  {val: '14x17', label: '14x17'},
                  {val: '10x14', label: '10x14'},
                  {val: '10x12', label: '10x12'}
                ].map(t => `
                  <div id="block_pedido_${t.val}" style="display: none; margin-bottom: 1.5rem; padding: 1.5rem; background: var(--card-bg); border-radius: 0 12px 12px 0; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.03); border: 1px solid var(--border-color); border-left: 4px solid var(--secondary);">
                      <h3 style="margin-top: 0; color: var(--primary); font-size: 1.1rem;">Cantidades para placa ${t.label}</h3>
                      <div style="display: flex; gap: 1rem; margin-bottom: 1.5rem;">
                          <label class="cb-label-styled" style="padding: 0.4rem 1rem; font-size: 0.95rem; border: 1px solid var(--border-color); border-radius: 6px;">
                              <input type="checkbox" name="formatos_pedido_${t.val}" value="DI-HL"> Formato DI-HL
                          </label>
                          <label class="cb-label-styled" style="padding: 0.4rem 1rem; font-size: 0.95rem; border: 1px solid var(--border-color); border-radius: 6px;">
                              <input type="checkbox" name="formatos_pedido_${t.val}" value="HR-U"> Formato HR-U
                          </label>
                      </div>
                      
                      ${['DI-HL', 'HR-U'].map(f => `
                        <div id="inputs_pedido_${t.val}_${f}" style="display: none; background: rgba(148, 163, 184, 0.05); padding: 1.5rem; border-radius: 8px; margin-bottom: 1rem; border: 1px dashed var(--border-color);">
                            <strong style="color: var(--primary); font-size: 1.1rem; display: block; margin-bottom: 1rem;">Requerimiento ${f}</strong>
                            
                            <label style="font-size: 0.9rem; font-weight: 600;">Seleccione de qué lote (Fecha Venc.) descontar</label>
                            <select id="vencimiento_pedido_${t.val}_${f}" class="form-control" style="margin-bottom: 1rem; cursor: pointer;">
                                <option value="">Cargando stock de lotes...</option>
                            </select>
            
                            <div style="display: flex; gap: 1rem;">
                                <div style="flex: 1;">
                                    <label style="font-size: 0.9rem;">Bultos (Cajas x 5)</label>
                                    <input type="number" id="bultos_pedido_${t.val}_${f}" min="0" placeholder="0" class="form-control" style="margin-bottom: 0;">
                                </div>
                                <div style="flex: 1;">
                                    <label style="font-size: 0.9rem;">Cajas Sueltas</label>
                                    <input type="number" id="cajas_pedido_${t.val}_${f}" min="0" placeholder="0" class="form-control" style="margin-bottom: 0;">
                                </div>
                            </div>
                        </div>
                      `).join('')}
                  </div>
                `).join('')}
            </div>

            <button type="submit" class="btn" style="width: 100%; font-size: 1.1rem; margin-top: 1rem; font-weight: 800; background-color: var(--primary);">Delegar Tarea de Extracción</button>
        </form>
    </div>

    <!-- Historial de Movimientos -->
    <div class="card">
        <h3>Historial de Movimientos Recientes</h3>
        <div style="display: flex; gap: 1rem; margin-top: 1rem; flex-wrap: wrap; background: rgba(148, 163, 184, 0.05); padding: 1rem; border-radius: 6px; border: 1px solid var(--border-color);">
            <input type="date" id="filterTableFecha" style="background: var(--bg); color: var(--text-main); border: 1px solid var(--border-color); border-radius: 4px; padding: 0.5rem; outline: none; flex: 1; min-width: 140px;" title="Filtrar por Fecha">
            
            <select id="filterTableFormato" style="background: var(--bg); color: var(--text-main); border: 1px solid var(--border-color); border-radius: 4px; padding: 0.5rem; outline: none; flex: 1; min-width: 140px; cursor: pointer;">
                <option value="">Cualquier Formato</option>
                <option value="DI-HL">DI-HL</option>
                <option value="HR-U">HR-U</option>
            </select>
            
            <select id="filterTableTamano" style="background: var(--bg); color: var(--text-main); border: 1px solid var(--border-color); border-radius: 4px; padding: 0.5rem; outline: none; flex: 1; min-width: 140px; cursor: pointer;">
                <option value="">Cualquier Tamaño</option>
                <option value="14x14">14x14</option>
                <option value="14x17">14x17</option>
                <option value="10x14 (26x36)">10x14 (26x36)</option>
                <option value="10x12">10x12</option>
            </select>
            
            <input type="date" id="filterTableVenc" style="background: var(--bg); color: var(--text-main); border: 1px solid var(--border-color); border-radius: 4px; padding: 0.5rem; outline: none; flex: 1; min-width: 140px;" title="Filtrar por Vencimiento">
            
            <button id="btn-aplicar-filtros" style="background: var(--text-main); color: var(--bg-gradient-1); border: none; padding: 0.5rem 1.5rem; border-radius: 4px; cursor: pointer; font-weight: 600;">Filtrar</button>
            <button id="btn-limpiar-filtros" style="background: transparent; color: var(--text-main); border: 1px solid var(--border-color); padding: 0.5rem 1.5rem; border-radius: 4px; cursor: pointer; font-weight: 600;">Limpiar</button>
        </div>

        <div style="overflow-x: auto; margin-top: 1.5rem;">
            <table style="width: 100%; border-collapse: collapse; font-size: 0.95rem; min-width: 600px;">
                <thead>
                    <tr style="border-bottom: 2px solid var(--border-color); text-align: left;">
                        <th style="padding: 0.5rem;">Fecha</th>
                        <th style="padding: 0.5rem;">Operación</th>
                        <th style="padding: 0.5rem;">Tamaño</th>
                        <th style="padding: 0.5rem;">Formato</th>
                        <th style="padding: 0.5rem;">Fecha Venc.</th>
                        <th style="padding: 0.5rem;">Cajas</th>
                        <th style="padding: 0.5rem;">Autorizado por</th>
                        <th style="padding: 0.5rem; text-align: right;">Acciones</th>
                    </tr>
                </thead>
                <tbody id="historial-tbody">
                    <tr><td colspan="8" style="padding: 1rem; text-align: center; color: var(--text-muted);">Cargando historial...</td></tr>
                </tbody>
            </table>
        </div>
    </div>
  `;

  // Variables de datos
  let inventoryData = [];
  let approvedTransactions = [];
  let workers = [];

  // --- LOGICA DE EVENTOS (Asignar Pedido UI) ---
  const checkboxesTamanos = container.querySelectorAll('input[name="tamanos_pedido"]');
  checkboxesTamanos.forEach(cb => {
    cb.addEventListener('change', () => {
      const size = cb.value;
      const block = document.getElementById(`block_pedido_${size}`);
      block.style.display = cb.checked ? 'block' : 'none';

      if (!cb.checked) {
        // Desmarcar formatos
        const formatsCbs = block.querySelectorAll(`input[name="formatos_pedido_${size}"]`);
        formatsCbs.forEach(fcb => {
          fcb.checked = false;
          fcb.dispatchEvent(new Event('change'));
        });
      }
    });
  });

  const formatsCbs = container.querySelectorAll('input[name^="formatos_pedido_"]');
  formatsCbs.forEach(fcb => {
    fcb.addEventListener('change', () => {
      const size = fcb.name.split('_')[2];
      const format = fcb.value;
      const divInputs = document.getElementById(`inputs_pedido_${size}_${format}`);
      divInputs.style.display = fcb.checked ? 'block' : 'none';

      if (fcb.checked) {
        populateLotesSelect(size, format);
      } else {
        document.getElementById(`bultos_pedido_${size}_${format}`).value = 0;
        document.getElementById(`cajas_pedido_${size}_${format}`).value = 0;
      }
    });
  });

  function populateLotesSelect(size, format) {
    const select = document.getElementById(`vencimiento_pedido_${size}_${format}`);
    if (!select) return;

    // Traducir label
    const mappedLabels = {
      '14x14': '14x14',
      '14x17': '14x17',
      '10x14': '10x14 (26x36)',
      '10x12': '10x12'
    };
    const tLabel = mappedLabels[size] || size;

    const filtered = inventoryData.filter(item => item.tamano_placa === tLabel && item.formato === format && item.cantidad_cajas > 0);
    
    if (filtered.length === 0) {
      select.innerHTML = '<option value="">Sin Stock Disponible</option>';
      return;
    }

    select.innerHTML = filtered.map(item => `
      <option value="${item.fecha_vencimiento || ''}">Lote Venc: ${item.fecha_vencimiento || 'N/A'} (Disp: ${item.cantidad_cajas} cajas)</option>
    `).join('');
  }

  // --- CARGAR DATOS ---
  await fetchAllData();

  async function fetchAllData() {
    try {
      // 1. Obtener inventario
      inventoryData = await window.api.get('/inventory');
      renderInventory();

      // 2. Obtener pendientes
      const pendingTxs = await window.api.get('/transactions?type=pending');
      renderPending(pendingTxs);

      // 3. Obtener aprobadas
      approvedTransactions = await window.api.get('/transactions?type=approved&limit=100');
      renderHistory(approvedTransactions);
      renderChart(approvedTransactions);

      // 4. Obtener trabajadores
      workers = await window.api.get('/users');
      populateWorkers(workers);

      window.recaptureLiquidGL();
    } catch (err) {
      console.error(err);
      window.showToast('Error al conectar con la base de datos: ' + err.message, 'error');
      window.recaptureLiquidGL();
    }
  }

  // --- RENDERIZADO INVENTARIO ---
  function renderInventory() {
    const dihlGrid = document.getElementById('dihl-grid');
    const hruGrid = document.getElementById('hru-grid');

    const mappedSizes = ['14x14', '14x17', '10x14 (26x36)', '10x12'];
    
    // Agrupar inventario
    const getGroupedHtml = (formato) => {
      const itemsFormato = inventoryData.filter(i => i.formato === formato);
      
      let html = '';
      mappedSizes.forEach(size => {
        const lotes = itemsFormato.filter(i => i.tamano_placa === size && i.cantidad_cajas > 0);
        const totalCajas = lotes.reduce((acc, current) => acc + current.cantidad_cajas, 0);

        if (totalCajas === 0 && lotes.length === 0) return; // ocultar vacíos

        html += `
          <div class="inv-card" style="background: var(--input-bg); border: 1px solid var(--border-color); border-top: 4px solid var(--primary-btn); padding: 1.5rem; border-radius: 12px; transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s; cursor: pointer; display: flex; flex-direction: column; gap: 0.5rem;">
              <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                  <span style="font-size: 1.25rem; font-weight: 800; color: var(--text-main);">${size}</span>
                  <span style="font-size: 0.75rem; font-weight: 700; background: var(--text-main); color: var(--bg-gradient-1); padding: 0.2rem 0.6rem; border-radius: 20px; letter-spacing: 0.5px;">${formato}</span>
              </div>
              
              <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px dashed var(--border-color);">
                  <div style="font-size: 2rem; font-weight: 900; color: var(--primary); line-height: 1;">${totalCajas}</div>
                  <div style="font-size: 0.85rem; font-weight: 600; color: #64748b; margin-top: 0.3rem;">Cajas Totales en Stock</div>

                  <div style="margin-top: 0.8rem; font-size: 0.85rem; color: var(--text-main);">
                      <strong style="display:block; margin-bottom:0.3rem; color: var(--text-muted);">Desglose Lotes (Vencimiento):</strong>
                      ${lotes.map(l => {
                        const b = Math.floor(l.cantidad_cajas / 5);
                        const c = l.cantidad_cajas % 5;
                        let text = '';
                        if (b > 0 && c > 0) {
                          text = `${b} bl y ${c} cj (${l.cantidad_cajas} cj)`;
                        } else if (b > 0) {
                          text = `${b} bl (${l.cantidad_cajas} cj)`;
                        } else {
                          text = `${c} cj`;
                        }
                        return `
                          <div style="background: rgba(148, 163, 184, 0.1); padding: 0.3rem 0.6rem; border-radius: 6px; margin-bottom: 0.2rem; display: flex; justify-content: space-between; font-weight: 600; font-size: 0.8rem; gap: 0.5rem; flex-wrap: wrap;">
                              <span>${l.fecha_vencimiento || 'N/A'}</span>
                              <strong style="color: var(--primary);">${text}</strong>
                          </div>
                        `;
                      }).join('')}
                  </div>
              </div>
          </div>
        `;
      });

      return html || `<div style="grid-column: 1 / -1; padding: 2rem; text-align: center; color: var(--text-muted); border: 1px dashed var(--border-color); border-radius: 12px; background: rgba(148, 163, 184, 0.05);">No hay inventario registrado para ${formato}.</div>`;
    };

    dihlGrid.innerHTML = getGroupedHtml('DI-HL');
    hruGrid.innerHTML = getGroupedHtml('HR-U');


  }

  // --- RENDERIZADO TRANSACCIONES PENDIENTES ---
  function renderPending(pendingTxs) {
    const list = document.getElementById('pending-list');
    if (!pendingTxs || pendingTxs.length === 0) {
      list.innerHTML = `
        <div style="background: rgba(34, 197, 94, 0.1); border: 1px solid var(--success); padding: 1rem; border-radius: 6px; color: var(--success); margin-top: 1rem; font-weight: 500;">
            No hay transacciones pendientes de validación en este lote en este momento. ¡Todo está al día!
        </div>
      `;
      return;
    }

    // Agrupar pendientes por lote (imagen_path o lote ficticio)
    const lotes = {};
    pendingTxs.forEach(tx => {
      const loteId = tx.imagen_path || `tx_${tx.id}`;
      if (!lotes[loteId]) {
        lotes[loteId] = {
          fecha: new Date(tx.fecha),
          tipo: tx.tipo,
          user: tx.user,
          imagen_path: tx.imagen_path,
          items: []
        };
      }
      lotes[loteId].items.push(tx);
    });

    list.innerHTML = '';

    Object.entries(lotes).forEach(([loteId, lote]) => {
      const div = document.createElement('div');
      div.style.cssText = 'border: 1px solid var(--border-color); border-radius: 8px; padding: 1.5rem; background: var(--input-bg); margin-bottom: 1.5rem;';
      
      const fotoUrl = lote.imagen_path ? window.getFileUrl(lote.imagen_path) : '';
      const fechaFormatted = lote.fecha.toLocaleString('es-ES', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: true
      });

      div.innerHTML = `
        <div style="display: flex; justify-content: space-between; margin-bottom: 1rem; border-bottom: 1px solid var(--border-color); padding-bottom: 1rem; flex-wrap: wrap; gap: 1rem;">
            <div>
                <strong style="color: var(--primary); font-size: 1.1rem;">
                    ${lote.tipo.toUpperCase()} registrado por ${lote.user ? `@${lote.user.username}` : 'Desconocido'}
                </strong>
                <div style="color: #64748b; margin-top: 0.2rem;">${fechaFormatted}</div>
            </div>
            ${fotoUrl ? `
            <div>
                <a href="${fotoUrl}" target="_blank" style="color: var(--text-main); font-weight: 700; text-decoration: none; border-bottom: 1px solid var(--text-main); padding-bottom: 2px;">
                    Ver Foto / Comprobante
                </a>
            </div>
            ` : ''}
        </div>
        
        <div style="margin-bottom: 1.5rem;">
            <strong style="display: block; margin-bottom: 0.5rem; color: var(--text-main);">Detalle de Items:</strong>
            <ul style="list-style-type: none; padding: 0; margin: 0; display: grid; gap: 0.5rem;">
                ${lote.items.map(tx => {
                  const bultos = Math.floor(tx.cantidad_cajas / 5);
                  const cajas = tx.cantidad_cajas % 5;
                  return `
                    <li style="background: var(--card-bg); padding: 0.5rem 1rem; border-radius: 6px; border: 1px dashed var(--border-color); display: flex; justify-content: space-between; flex-wrap: wrap; gap: 0.5rem;">
                        <span>Producto: <span style="font-weight: 700;">${tx.tamano_placa} (${tx.formato})</span></span>
                        <span>Cantidad: <span style="font-weight: 800; color: var(--text-main);">${tx.cantidad_cajas} cajas</span> 
                            <span style="opacity: 0.7; font-size: 0.9em;">(aprox: ${bultos} bultos y ${cajas} cajas)</span>
                        </span>
                    </li>
                  `;
                }).join('')}
            </ul>
        </div>

        <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
            <button class="btn btn-aprobar-lote" style="background-color: var(--text-main); color: var(--bg-gradient-1); font-weight: 800;">Confirmar e Ingresar Lote</button>
            <button class="btn btn-rechazar-lote" style="background-color: transparent; border: 1px solid var(--text-muted); color: var(--text-main); font-weight: 600;">Rechazar Lote Completo</button>
        </div>
      `;

      // Event Listeners
      div.querySelector('.btn-aprobar-lote').addEventListener('click', async () => {
        try {
          await window.api.put('/transactions?action=validate_batch', { lote_id: loteId, accion: 'aprobar' });
          window.showToast('Lote aprobado y stock actualizado.', 'success');
          fetchAllData();
        } catch (e) {
          window.showToast(e.message, 'error');
        }
      });

      div.querySelector('.btn-rechazar-lote').addEventListener('click', async () => {
        if (confirm('¿Seguro quieres rechazar y descartar este lote completo?')) {
          try {
            await window.api.put('/transactions?action=validate_batch', { lote_id: loteId, accion: 'rechazar' });
            window.showToast('Lote rechazado y descartado.', 'success');
            fetchAllData();
          } catch (e) {
            window.showToast(e.message, 'error');
          }
        }
      });

      list.appendChild(div);
    });
  }

  // --- RENDERIZADO HISTORIAL ---
  function renderHistory(txs) {
    const tbody = document.getElementById('historial-tbody');
    if (!txs || txs.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" style="padding: 1rem; text-align: center; color: var(--text-muted);">No hay movimientos registrados.</td></tr>`;
      return;
    }

    tbody.innerHTML = '';

    txs.forEach(tx => {
      const tr = document.createElement('tr');
      tr.className = 'historial-row';
      tr.style.cssText = 'border-bottom: 1px solid var(--border-color);';
      tr.dataset.fecha = tx.fecha.split('T')[0];
      tr.dataset.formato = tx.formato;
      tr.dataset.tamano = tx.tamano_placa;
      tr.dataset.vencimiento = tx.fecha_vencimiento || '';

      const fechaFormatted = new Date(tx.fecha).toLocaleString('es-ES', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: true
      });

      const badgBg = tx.tipo === 'ingreso' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(249, 115, 22, 0.1)';
      const badgCol = tx.tipo === 'ingreso' ? 'var(--success, #22c55e)' : 'var(--warning, #f97316)';

      tr.innerHTML = `
        <td style="padding: 0.5rem; color: #64748b;">${fechaFormatted}</td>
        <td style="padding: 0.5rem;">
            <span style="font-weight: 800; font-size: 0.85rem; letter-spacing: 0.5px; border-radius: 4px; padding: 0.2rem 0.5rem; background: ${badgBg}; color: ${badgCol}; border: 1px solid ${badgCol};">
                ${tx.tipo.toUpperCase()}
            </span>
        </td>
        <td style="padding: 0.5rem;">${tx.tamano_placa}</td>
        <td style="padding: 0.5rem;">${tx.formato}</td>
        <td style="padding: 0.5rem; font-weight: 600;">${tx.fecha_vencimiento || 'N/A'}</td>
        <td style="padding: 0.5rem;">${tx.cantidad_cajas} cajas</td>
        <td style="padding: 0.5rem;">@${tx.admin ? tx.admin.username : 'Sistema'}</td>
        <td style="padding: 0.5rem; text-align: right;">
            <button class="btn-eliminar-tx" style="background: transparent; border: 1px solid #ef4444; color: #ef4444; padding: 0.2rem 0.5rem; border-radius: 4px; cursor: pointer; font-size: 0.8rem; font-weight: 600;">Eliminar</button>
        </td>
      `;

      tr.querySelector('.btn-eliminar-tx').addEventListener('click', async () => {
        if (confirm('¿Estás seguro de que deseas eliminar este registro? Esto revertirá el impacto en el inventario actual.')) {
          try {
            await window.api.del(`/transactions?tx_id=${tx.id}`);
            window.showToast('Movimiento eliminado y stock restaurado.', 'success');
            fetchAllData();
          } catch (e) {
            window.showToast(e.message, 'error');
          }
        }
      });

      tbody.appendChild(tr);
    });
  }

  // --- TRABAJADORES SELECT ---
  function populateWorkers(usersList) {
    const select = document.getElementById('select-trabajador');
    const filtrados = usersList.filter(u => u.role === 'trabajador' && u.status === 'activo');
    
    if (filtrados.length === 0) {
      select.innerHTML = '<option value="">No hay trabajadores aprobados activos</option>';
      return;
    }

    select.innerHTML = '<option value="">Seleccione un trabajador de la lista...</option>' + 
      filtrados.map(w => `<option value="${w.id}">@${w.username}</option>`).join('');
  }

  // --- FILTROS DE HISTORIAL ---
  window.applyTableFilters = function() {
    const fFecha = document.getElementById('filterTableFecha').value;
    const fFormato = document.getElementById('filterTableFormato').value;
    const fTamano = document.getElementById('filterTableTamano').value;
    const fVenc = document.getElementById('filterTableVenc').value;
    
    document.querySelectorAll('.historial-row').forEach(row => {
        let matchFecha = fFecha === "" || row.dataset.fecha === fFecha;
        let matchFormato = fFormato === "" || row.dataset.formato === fFormato;
        let matchTamano = fTamano === "" || row.dataset.tamano === fTamano;
        let matchVenc = fVenc === "" || row.dataset.vencimiento === fVenc;
        
        if (matchFecha && matchFormato && matchTamano && matchVenc) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
  };

  window.resetTableFilters = function() {
    document.getElementById('filterTableFecha').value = '';
    document.getElementById('filterTableFormato').value = '';
    document.getElementById('filterTableTamano').value = '';
    document.getElementById('filterTableVenc').value = '';
    window.applyTableFilters();
  };

  document.getElementById('btn-aplicar-filtros').addEventListener('click', window.applyTableFilters);
  document.getElementById('btn-limpiar-filtros').addEventListener('click', window.resetTableFilters);

  // --- SUBMIT ASIGNAR PEDIDO ---
  const orderForm = document.getElementById('asignar-pedido-form');
  orderForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const trabajador_id = document.getElementById('select-trabajador').value;
    const items = [];

    const sizes = ['14x14', '14x17', '10x14', '10x12'];
    sizes.forEach(size => {
      const block = document.getElementById(`block_pedido_${size}`);
      if (block && block.style.display !== 'none') {
        const formats = ['DI-HL', 'HR-U'];
        formats.forEach(f => {
          const divInputs = document.getElementById(`inputs_pedido_${size}_${f}`);
          if (divInputs && divInputs.style.display !== 'none') {
            const vencimiento = document.getElementById(`vencimiento_pedido_${size}_${f}`).value;
            const bultos = parseInt(document.getElementById(`bultos_pedido_${size}_${f}`).value) || 0;
            const cajas = parseInt(document.getElementById(`cajas_pedido_${size}_${f}`).value) || 0;
            const total = (bultos * 5) + cajas;

            if (total > 0) {
              items.push({
                tamano_placa: size,
                formato: f,
                fecha_vencimiento: vencimiento,
                cantidad_cajas: total
              });
            }
          }
        });
      }
    });

    if (items.length === 0) {
      window.showToast('Debe especificar cantidades mayores que 0 en los formatos asignados.', 'error');
      return;
    }

    const submitBtn = orderForm.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Asignando...';

    try {
      const res = await window.api.post('/assign-order', { trabajador_id, items });
      window.showToast(res.message, 'success');
      
      // Resetear
      orderForm.reset();
      checkboxesTamanos.forEach(cb => {
        cb.checked = false;
        cb.dispatchEvent(new Event('change'));
      });

      // Si hay URL de WhatsApp, abrirla
      if (res.whatsapp_url) {
        window.open(res.whatsapp_url, '_blank');
      }

      fetchAllData();
    } catch (err) {
      window.showToast(err.message, 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Delegar Tarea de Extracción';
    }
  });

  // --- ACCIONES SUPERUSUARIO ---
  if (isSuper) {
    document.getElementById('btn-eliminar-todo').addEventListener('click', async () => {
      if (confirm('⚠️ ATENCIÓN: ¿Seguro que deseas ELIMINAR todo el inventario y el historial transaccional de la clínica? Esta acción es irreversible.')) {
        try {
          const res = await window.api.post('/seed', { action: 'delete_all' });
          window.showToast(res.message, 'success');
          fetchAllData();
        } catch (e) {
          window.showToast(e.message, 'error');
        }
      }
    });

    document.getElementById('btn-generar-datos').addEventListener('click', async () => {
      try {
        const res = await window.api.post('/seed', { action: 'generate' });
        window.showToast(res.message, 'success');
        fetchAllData();
      } catch (e) {
        window.showToast(e.message, 'error');
      }
    });
  }

  // --- EXPORTAR EXCEL ---
  document.getElementById('btn-exportar').addEventListener('click', async () => {
    const btn = document.getElementById('btn-exportar');
    btn.disabled = true;
    btn.textContent = 'Exportando...';
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/export-excel', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Error al exportar Excel');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Reporte_Ventas_Inventario_${new Date().toISOString().slice(0, 7).replace('-', '_')}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      window.showToast('Reporte Excel descargado.', 'success');
    } catch (e) {
      window.showToast(e.message, 'error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg> Exportar Reporte a Excel (Mensual)`;
    }
  });

  // --- GRÁFICOS (Chart.js) ---

  function renderChart(txsList) {
    const chartCtx = document.getElementById('inventoryChart').getContext('2d');
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const textColor = isDark ? '#f8fafc' : '#1e293b';
    const gridColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';

    const timeFilter = document.getElementById('chartTimeFilter').value;
    const formatFilter = document.getElementById('chartFormatFilter').value;

    // Filtrar transacciones aprobadas por formato si aplica
    let filteredTxs = txsList.filter(tx => tx.estado === 'aprobada');
    if (formatFilter) {
      filteredTxs = filteredTxs.filter(tx => tx.formato === formatFilter);
    }

    // Agrupar
    const getGroupKey = (dateStr) => {
      const date = new Date(dateStr);
      if (timeFilter === 'year') {
        return date.getFullYear().toString();
      } else if (timeFilter === 'month') {
        return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0');
      } else { // Semanas
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay()||7));
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
        const weekNo = Math.ceil(( ( (d - yearStart) / 86400000) + 1)/7);
        return d.getUTCFullYear() + '-Sem ' + String(weekNo).padStart(2, '0');
      }
    };

    filteredTxs.forEach(tx => { tx.groupKey = getGroupKey(tx.fecha); });
    const groupKeys = [...new Set(filteredTxs.map(tx => tx.groupKey))].sort();

    const ingresosData = groupKeys.map(gk => {
      return filteredTxs.filter(tx => tx.groupKey === gk && tx.tipo === 'ingreso')
                        .reduce((sum, tx) => sum + tx.cantidad_cajas, 0);
    });

    const egresosData = groupKeys.map(gk => {
      return filteredTxs.filter(tx => tx.groupKey === gk && tx.tipo === 'egreso')
                        .reduce((sum, tx) => sum + tx.cantidad_cajas, 0);
    });

    if (chartInstance) {
      chartInstance.destroy();
    }

    chartInstance = new Chart(chartCtx, {
      type: 'line',
      data: {
        labels: groupKeys.length ? groupKeys : ['Sin Datos'],
        datasets: [
          {
            label: 'Ingresos (Cajas)',
            data: ingresosData.length ? ingresosData : [0],
            backgroundColor: isDark ? 'rgba(34, 197, 94, 0.3)' : 'rgba(34, 197, 94, 0.2)',
            borderColor: '#22c55e',
            borderWidth: 2,
            fill: true,
            tension: 0.4
          },
          {
            label: 'Egresos (Cajas)',
            data: egresosData.length ? egresosData : [0],
            backgroundColor: isDark ? 'rgba(249, 115, 22, 0.3)' : 'rgba(249, 115, 22, 0.2)',
            borderColor: '#f97316',
            borderWidth: 2,
            fill: true,
            tension: 0.4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: textColor } }
        },
        scales: {
          y: { ticks: { color: textColor, stepSize: 1 }, grid: { color: gridColor }, beginAtZero: true },
          x: { ticks: { color: textColor }, grid: { display: false } }
        }
      }
    });

    window.myChart = chartInstance;
  }

  document.getElementById('chartTimeFilter').addEventListener('change', () => renderChart(approvedTransactions));
  document.getElementById('chartFormatFilter').addEventListener('change', () => renderChart(approvedTransactions));
};
