// Vista Dashboard Trabajador (Comprobantes)
window.renderDashboardTrabajador = function(container) {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = ['administrador', 'superusuario'].includes(user.role);

  container.innerHTML = `
    <div id="pending-orders-container"></div>
    
    <div class="card">
        <h2>${isAdmin ? 'Actualización de Inventario' : 'Registro Libre de Mercancía'}</h2>
        <p>${isAdmin ? 'Registre las entradas y salidas de mercancía para actualizar el inventario.' : 'Complete los datos para generar un nuevo ingreso o egreso. Puede seleccionar dinámicamente múltiples tamaños y formatos para este lote a la vez.'}</p>
    
        <div class="card" style="max-width: 800px; margin: 2rem auto; border: 1px solid var(--border-color);">
            <form id="registro-operacion-form">
                <label>Tipo de Operación General</label>
                <select id="operacion-tipo" class="form-control" required style="margin-bottom: 2rem; cursor: pointer;">
                    <option value="ingreso">Ingreso de Mercancía</option>
                    <option value="egreso">Egreso / Despacho</option>
                </select>
        
                <div style="margin-bottom: 2rem; padding: 1.5rem; border: 1px solid var(--border-color); border-radius: 8px; background: var(--input-bg);">
                    <label style="font-weight: bold; color: var(--primary);">Fecha de Vencimiento de Lote (Opcional)</label>
                    <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.3rem; margin-bottom: 1rem;">Si este lote tiene fecha de expiración, indícala aquí.</p>
                    <input type="date" id="fecha_vencimiento" class="form-control" style="margin-bottom: 0; cursor: pointer;">
                </div>
        
                ${isAdmin ? `
                <div style="margin-bottom: 2rem; padding: 1.5rem; border: 1px dashed var(--border-color); border-radius: 8px; background: rgba(59, 130, 246, 0.05);">
                    <label style="font-weight: bold; color: var(--primary);">Fecha Manual (Solo Administradores)</label>
                    <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.3rem; margin-bottom: 1rem;">Si se deja en blanco, se usará la fecha actual automática. Utilice esto para registrar inventario previo a la creación del sistema.</p>
                    <div style="display: flex; gap: 1rem; flex-wrap: wrap; align-items: center;">
                        <input type="date" id="fecha_manual_dia" class="form-control" style="margin-bottom: 0; flex: 2; min-width: 150px; cursor: pointer;">
                        
                        <div style="display: flex; gap: 0.5rem; flex: 3; align-items: center; min-width: 200px;">
                            <select id="fecha_manual_hh" class="form-control" style="margin-bottom: 0; flex: 1; padding: 0.5rem; min-width: 65px; cursor: pointer;">
                                <option value="">Hora</option>
                                ${Array.from({length: 12}, (_, i) => `<option value="${String(i + 1).padStart(2, '0')}">${String(i + 1).padStart(2, '0')}</option>`).join('')}
                            </select>
                            <span style="font-weight: bold; color: var(--text-main);">:</span>
                            <select id="fecha_manual_mm" class="form-control" style="margin-bottom: 0; flex: 1; padding: 0.5rem; min-width: 65px; cursor: pointer;">
                                <option value="">Min</option>
                                ${Array.from({length: 12}, (_, i) => `<option value="${String(i * 5).padStart(2, '0')}">${String(i * 5).padStart(2, '0')}</option>`).join('')}
                            </select>
                            <select id="fecha_manual_ampm" class="form-control" style="margin-bottom: 0; flex: 1.2; padding: 0.5rem; min-width: 70px; cursor: pointer;">
                                <option value="AM">AM</option>
                                <option value="PM">PM</option>
                            </select>
                        </div>
                    </div>
                </div>
                ` : ''}
        
                <label style="font-weight: bold; color: var(--primary);">1. Elige los Tamaños de Placa que llegaron/saldrán (Múltiple Selección)</label>
                <div style="display: flex; gap: 1rem; flex-wrap: wrap; margin-bottom: 2rem; background: var(--card-bg); padding: 1.5rem; border: 1px solid var(--border-color); border-radius: 12px;">
                    <label class="cb-label-styled">
                        <input type="checkbox" name="tamanos" value="14x14"> 14x14
                    </label>
                    <label class="cb-label-styled">
                        <input type="checkbox" name="tamanos" value="14x17"> 14x17
                    </label>
                    <label class="cb-label-styled">
                        <input type="checkbox" name="tamanos" value="10x14"> 10x14 (26x36)
                    </label>
                    <label class="cb-label-styled">
                        <input type="checkbox" name="tamanos" value="10x12"> 10x12
                    </label>
                </div>
        
                <div id="tamanos-blocks-container">
                    ${[
                      {val: '14x14', label: '14x14'},
                      {val: '14x17', label: '14x17'},
                      {val: '10x14', label: '10x14 (26x36)'},
                      {val: '10x12', label: '10x12'}
                    ].map(t => `
                      <div id="block_${t.val}" class="size-block" style="display: none;">
                          <h3 style="margin-top: 0; color: var(--primary); font-size: 1.3rem;">Desglose para placa ${t.label}</h3>
              
                          <label style="font-weight: 600; margin-bottom: 1rem; display: block;">Formatos que vinieron en ${t.label}:</label>
                          <div style="display: flex; gap: 1rem; margin-bottom: 1.5rem;">
                              <label class="cb-label-styled" style="padding: 0.4rem 1rem; font-size: 0.95rem;">
                                  <input type="checkbox" name="formatos_${t.val}" value="DI-HL"> Formato DI-HL
                              </label>
                              <label class="cb-label-styled" style="padding: 0.4rem 1rem; font-size: 0.95rem;">
                                  <input type="checkbox" name="formatos_${t.val}" value="HR-U"> Formato HR-U
                              </label>
                          </div>
              
                          <div id="inputs_${t.val}_DI-HL" style="display: none; background: var(--input-bg); padding: 1.5rem; border-radius: 8px; margin-bottom: 1rem; border: 1px dashed var(--border-color);">
                              <strong style="color: var(--text-main); font-weight: 800; text-transform: uppercase; font-size: 1.1rem; display: block; margin-bottom: 1rem;">${t.label} (DI-HL):</strong>
                              <div style="display: flex; gap: 1.5rem;">
                                  <div style="flex: 1;"><label>Bultos Entregados</label><input type="number" id="bultos_${t.val}_DI-HL" min="0" value="0" class="form-control" style="margin-bottom: 0;"></div>
                                  <div style="flex: 1;"><label>Cajas Sueltas</label><input type="number" id="cajas_${t.val}_DI-HL" min="0" max="4" value="0" class="form-control" style="margin-bottom: 0;"></div>
                              </div>
                          </div>
              
                          <div id="inputs_${t.val}_HR-U" style="display: none; background: var(--input-bg); padding: 1.5rem; border-radius: 8px; margin-bottom: 1rem; border: 1px solid var(--border-color);">
                              <strong style="color: var(--text-main); font-weight: 800; text-transform: uppercase; font-size: 1.1rem; display: block; margin-bottom: 1rem;">${t.label} (HR-U):</strong>
                              <div style="display: flex; gap: 1.5rem;">
                                  <div style="flex: 1;"><label>Bultos Entregados</label><input type="number" id="bultos_${t.val}_HR-U" min="0" value="0" class="form-control" style="margin-bottom: 0;"></div>
                                  <div style="flex: 1;"><label>Cajas Sueltas</label><input type="number" id="cajas_${t.val}_HR-U" min="0" max="4" value="0" class="form-control" style="margin-bottom: 0;"></div>
                              </div>
                          </div>
                      </div>
                    `).join('')}
                </div>
        
                ${!isAdmin ? `
                <hr style="border: none; border-top: 1px solid var(--border-color); margin: 2rem 0;">
        
                <label style="font-weight: bold; color: var(--primary); font-size: 1.1rem;">2. Foto de Comprobante / Cargamento Oficial</label>
                <input type="file" id="foto-comprobante" class="form-control" accept="image/*" required style="margin-top: 0.5rem; cursor: pointer;">
                ` : ''}
                <p style="font-size: 0.95rem; color: var(--text-muted); margin-top: 1rem; margin-bottom: 1.5rem;">
                    Nota: Al registrar la operación, el sistema multiplicará bultos x 5 y separará automáticamente los bultos y cajas en unidades de stock.
                </p>
        
                <button type="submit" class="btn" style="width: 100%; padding: 1.2rem; font-size: 1.1rem; margin-top: 1rem;">
                    ${isAdmin ? 'Actualizar' : 'Registrar Operación Múltiple'}
                </button>
            </form>
        </div>
    </div>
  `;

  // --- LOGICA DE EVENTOS (Toggle Sizes y Formatos) ---
  const checkboxesTamanos = container.querySelectorAll('input[name="tamanos"]');
  checkboxesTamanos.forEach(cb => {
    cb.addEventListener('change', () => {
      const size = cb.value;
      const block = document.getElementById(`block_${size}`);
      const labelWrapper = cb.closest('.cb-label-styled');

      if (cb.checked) {
        block.style.display = 'block';
        block.classList.add('anim-expand');
        if (labelWrapper) {
          labelWrapper.style.borderColor = 'var(--text-main)';
          labelWrapper.style.fontWeight = '700';
        }
      } else {
        block.style.display = 'none';
        block.classList.remove('anim-expand');
        if (labelWrapper) {
          labelWrapper.style.borderColor = '';
          labelWrapper.style.fontWeight = '500';
        }
        // Desmarcar formatos hijos
        const formatosCbs = block.querySelectorAll(`input[name="formatos_${size}"]`);
        formatosCbs.forEach(fcb => {
          fcb.checked = false;
          const divInputs = document.getElementById(`inputs_${size}_${fcb.value}`);
          divInputs.style.display = 'none';
          document.getElementById(`bultos_${size}_${fcb.value}`).value = 0;
          document.getElementById(`cajas_${size}_${fcb.value}`).value = 0;
          const fLabelWrapper = fcb.closest('.cb-label-styled');
          if (fLabelWrapper) {
            fLabelWrapper.style.borderColor = '';
            fLabelWrapper.style.fontWeight = '500';
          }
        });
      }
    });
  });

  const allFormatCbs = container.querySelectorAll('input[name^="formatos_"]');
  allFormatCbs.forEach(fcb => {
    fcb.addEventListener('change', () => {
      const size = fcb.name.split('_')[1];
      const format = fcb.value;
      const divInputs = document.getElementById(`inputs_${size}_${format}`);
      const labelWrapper = fcb.closest('.cb-label-styled');

      if (fcb.checked) {
        divInputs.style.display = 'block';
        divInputs.classList.add('anim-expand');
        if (labelWrapper) {
          labelWrapper.style.borderColor = 'var(--text-main)';
          labelWrapper.style.fontWeight = '700';
        }
      } else {
        divInputs.style.display = 'none';
        divInputs.classList.remove('anim-expand');
        if (labelWrapper) {
          labelWrapper.style.borderColor = '';
          labelWrapper.style.fontWeight = '500';
        }
        document.getElementById(`bultos_${size}_${format}`).value = 0;
        document.getElementById(`cajas_${size}_${format}`).value = 0;
      }
    });
  });

  // --- CARGAR PEDIDOS PENDIENTES ---
  loadPendingOrders(user.id);

  // --- SUBMIT REGISTRO LIBRE ---
  const form = document.getElementById('registro-operacion-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const tipo = document.getElementById('operacion-tipo').value;
    const fecha_vencimiento = document.getElementById('fecha_vencimiento').value;
    
    let fecha_manual = null;
    if (isAdmin) {
      const fDia = document.getElementById('fecha_manual_dia').value;
      const fHh = document.getElementById('fecha_manual_hh').value;
      const fMm = document.getElementById('fecha_manual_mm').value;
      const fAmpm = document.getElementById('fecha_manual_ampm').value;

      if (fDia && fHh && fMm) {
        // Convertir formato AM/PM a militar
        let hh = parseInt(fHh);
        if (fAmpm === 'PM' && hh < 12) hh += 12;
        if (fAmpm === 'AM' && hh === 12) hh = 0;
        fecha_manual = `${fDia}T${String(hh).padStart(2, '0')}:${fMm}:00`;
      }
    }

    const items = [];
    const sizesSelected = Array.from(checkboxesTamanos).filter(cb => cb.checked).map(cb => cb.value);

    sizesSelected.forEach(size => {
      const formatosCbs = document.querySelectorAll(`input[name="formatos_${size}"]:checked`);
      formatosCbs.forEach(fcb => {
        const format = fcb.value;
        const bultos = parseInt(document.getElementById(`bultos_${size}_${format}`).value) || 0;
        const cajas = parseInt(document.getElementById(`cajas_${size}_${format}`).value) || 0;
        const totalCajas = (bultos * 5) + cajas;

        if (totalCajas > 0) {
          items.push({
            tamano_placa: size,
            formato: format,
            cantidad_cajas: totalCajas
          });
        }
      });
    });

    if (items.length === 0) {
      window.showToast('Error: Debes seleccionar al menos un formato y asignar una cantidad mayor que 0.', 'error');
      return;
    }

    const fileInput = document.getElementById('foto-comprobante');
    let fotoData = null;

    if (fileInput && fileInput.files && fileInput.files.length > 0) {
      const file = fileInput.files[0];
      const toBase64 = (f) => new Promise((res, rej) => {
        const reader = new FileReader();
        reader.readAsDataURL(f);
        reader.onload = () => res(reader.result.split(',')[1]);
        reader.onerror = (err) => rej(err);
      });

      try {
        const base64Str = await toBase64(file);
        fotoData = {
          name: file.name,
          type: file.type,
          data: base64Str
        };
      } catch (err) {
        window.showToast('Error al procesar la foto.', 'error');
        return;
      }
    } else if (!isAdmin) {
      window.showToast('Foto del lote comprobante obligatoria para trabajadores.', 'error');
      return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Procesando registro...';

    // Generar un id de imagen único o mandar la estructura base64
    let imagen_path = null;
    if (fotoData) {
      // Subimos primero la imagen para obtener un path si es necesario, o mandamos directo al backend
      // El backend de transactions acepta base64 si es confirmacion, pero para creación libre,
      // la creación libre en netlify/functions/transactions.js espera body.imagen_path o similar.
      // Espera, ¿cómo maneja transactions.js las fotos en handlePost?
      // Ah! En handlePost: "imagen_path: imagen_path || null".
      // Espérate, ¿la creación libre de transacciones en la Netlify Function sube la foto?
      // Revisemos transactions.js en handlePost:
      // No veo código de subida de imagen en handlePost! Solo guarda "imagen_path" string.
      // Ah! Eso significa que debemos subir la imagen primero, o que la función de registro espera la imagen.
      // Espera! Modifiquemos la función handlePost en transactions.js para que si recibe una estructura de archivo, la suba!
      // Pero antes de cambiar el backend, miremos si podemos subirla usando Supabase storage directo o si el backend_builder no lo implementó.
      // La Netlify function `auth-register.js` sube a Supabase storage.
      // ¿Tiene `transactions.js` la capacidad de subir fotos? No en `handlePost` original de backend_builder.
      // Vamos a arreglar `netlify/functions/transactions.js` para que acepte base64 en `handlePost` y lo suba a storage, de forma idéntica a `handleConfirmOrder`.
      // ¡Eso es súper fácil y robusto!
    }

    try {
      // Mandaremos el payload completo con la foto en base64 en el body para que el backend la suba.
      // Ajustemos la Netlify Function para que haga esto de manera nativa si recibe foto.
      const payload = {
        tipo,
        items,
        fecha_vencimiento,
        fecha_manual,
        foto: fotoData // Mandamos la foto aquí
      };

      const res = await window.api.post('/transactions?action=create', payload);
      window.showToast(res.message || 'Operación registrada con éxito.', 'success');
      
      // Resetear formulario
      form.reset();
      checkboxesTamanos.forEach(cb => {
        cb.checked = false;
        cb.dispatchEvent(new Event('change'));
      });
      if (fileInput) fileInput.value = '';

      loadPendingOrders(user.id);
    } catch (err) {
      window.showToast(err.message || 'Error al registrar la operación.', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = isAdmin ? 'Actualizar' : 'Registrar Operación Múltiple';
    }
  });
};

// --- FUNCIÓN PARA CARGAR PEDIDOS PENDIENTES ---
async function loadPendingOrders(userId) {
  const container = document.getElementById('pending-orders-container');
  if (!container) return;

  try {
    const pedidos = await window.api.get(`/transactions?type=assigned&user_id=${userId}`);
    
    if (!pedidos || pedidos.length === 0) {
      container.innerHTML = '';
      window.recaptureLiquidGL();
      return;
    }

    container.innerHTML = `
      <div class="card" style="border: 2px solid var(--primary-btn); background: rgba(59, 130, 246, 0.05); margin-bottom: 3rem;">
          <h2 style="color: var(--primary); margin-bottom: 0;">Pedidos a Entregar (Prioridad)</h2>
          <p style="color: var(--text-muted); margin-top: 0.3rem;">Tienes despachos asignados por la administración pendientes de confirmación fotográfica.</p>
          
          <div style="display: flex; flex-direction: column; gap: 1.5rem; margin-top: 1.5rem;" id="orders-list"></div>
      </div>
    `;

    const list = document.getElementById('orders-list');
    pedidos.forEach(p => {
      const div = document.createElement('div');
      div.style.cssText = 'background: var(--card-bg); border: 1px solid var(--border-color); border-radius: 12px; padding: 1.5rem; box-shadow: 0 4px 15px rgba(0,0,0,0.05);';
      
      const bultos = Math.floor(p.cantidad_cajas / 5);
      const cajas = p.cantidad_cajas % 5;
      const fechaFormateada = new Date(p.fecha).toLocaleString('es-ES', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: true
      });

      div.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items:flex-start; margin-bottom: 1rem; border-bottom: 1px dashed var(--border-color); padding-bottom: 1rem; flex-wrap: wrap; gap: 1rem;">
            <div>
                <span style="font-size: 1.2rem; font-weight: 800; color: var(--primary);">${p.tamano_placa}</span>
                <span style="font-size: 0.8rem; background: var(--text-main); color: var(--bg-gradient-1); padding: 0.2rem 0.6rem; border-radius: 20px; font-weight: 700; margin-left: 0.3rem;">${p.formato}</span>
                <div style="margin-top: 0.5rem; font-weight: 600; color: #64748b;">Asignado el ${fechaFormateada}</div>
            </div>
            <div style="text-align: right;">
                <div style="font-size: 1.5rem; font-weight: 900; color: var(--text-main);">${p.cantidad_cajas} Cajas Totales</div>
                <div style="font-size: 0.85rem; color: var(--text-muted); font-weight: 600;">(Aprox. ${bultos} bultos y ${cajas} sueltas)</div>
            </div>
        </div>
        
        <form class="confirm-order-form" data-id="${p.id}" style="display: flex; align-items: flex-end; gap: 1rem; flex-wrap: wrap;">
            <div style="flex: 1; min-width: 250px;">
                <label style="font-weight: 600; color: var(--primary); font-size: 0.95rem;">Foto Comprobante de Entrega Físico <span style="color: var(--error);">*</span></label>
                <input type="file" class="form-control foto-input" accept="image/*" required style="margin-bottom: 0; cursor: pointer;">
            </div>
            <button type="submit" class="btn" style="background-color: var(--secondary); color: #ffffff;">Confirmar Despacho</button>
        </form>
      `;

      list.appendChild(div);
    });

    // Event listener para confirmaciones
    const forms = list.querySelectorAll('.confirm-order-form');
    forms.forEach(f => {
      f.addEventListener('submit', async (e) => {
        e.preventDefault();
        const txId = f.dataset.id;
        const fileInput = f.querySelector('.foto-input');

        if (!fileInput.files.length) {
          window.showToast('Debe adjuntar una foto del comprobante físico.', 'error');
          return;
        }

        const file = fileInput.files[0];
        const submitBtn = f.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Confirmando...';

        const toBase64 = (file) => new Promise((res, rej) => {
          const r = new FileReader();
          r.readAsDataURL(file);
          r.onload = () => res(r.result.split(',')[1]);
          r.onerror = (err) => rej(err);
        });

        try {
          const base64Str = await toBase64(file);
          const payload = {
            tx_id: parseInt(txId),
            imagen_path: {
              name: file.name,
              type: file.type,
              data: base64Str
            }
          };

          await window.api.put('/transactions?action=confirm_order', payload);
          window.showToast('Pedido despachado y confirmado exitosamente.', 'success');
          loadPendingOrders(userId);
        } catch (err) {
          window.showToast(err.message || 'Error al confirmar despacho.', 'error');
          submitBtn.disabled = false;
          submitBtn.textContent = 'Confirmar Despacho';
        }
      });
    });
    window.recaptureLiquidGL();
  } catch (err) {
    console.error('Error cargando pedidos asignados:', err);
    window.recaptureLiquidGL();
  }
}
