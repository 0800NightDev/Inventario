// Vista de Gestión de Personal
window.renderGestionPersonal = async function(container) {
  container.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
        <h2>Gestión de Personal</h2>
    </div>
    <p style="color: #64748b; font-size: 1.05rem;">Aquí puedes autorizar/cancelar el registro de nuevos solicitantes validando si su Carnet y su status son íntegros, cambiar claves olvidadas de empleados y/o eliminarlos del sistema por completo.</p>
    
    <div id="usuarios-grid" style="display: grid; gap: 1.5rem; margin-top: 1.5rem;">
        <div style="text-align: center; padding: 2rem; color: var(--text-muted);">Cargando lista de personal...</div>
    </div>
  `;

  const grid = document.getElementById('usuarios-grid');

  try {
    const usuarios = await window.api.get('/users');
    renderGrid(usuarios);
  } catch (err) {
    grid.innerHTML = `<div style="color: var(--error); text-align: center; padding: 2rem;">Error al cargar personal: ${err.message}</div>`;
    window.recaptureLiquidGL();
  }

  function renderGrid(usuarios) {
    if (!usuarios || usuarios.length === 0) {
      grid.innerHTML = `
        <div style="background: rgba(59, 130, 246, 0.1); border: 1px solid var(--secondary); padding: 1.5rem; border-radius: 8px; color: var(--secondary); text-align: center; font-size: 1.1rem;">
            No hay empleados operativos en este momento ni listas de espera de trabajadores.
        </div>
      `;
      window.recaptureLiquidGL();
      return;
    }

    grid.innerHTML = '';

    usuarios.forEach(user => {
      const card = document.createElement('div');
      card.className = 'card';
      card.style.cssText = 'display: flex; gap: 1.5rem; align-items: flex-start; flex-wrap: wrap; position: relative; border: 1px solid var(--border-color);';

      const fotoUrl = user.foto_carnet ? window.getFileUrl(user.foto_carnet) : '';
      const fotoHtml = fotoUrl
        ? `<div style="flex-shrink: 0; width: 120px; height: 120px; border-radius: 8px; overflow: hidden; border: 3px solid ${user.status === 'activo' ? 'var(--success)' : 'var(--error)'}; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
             <img src="${fotoUrl}" alt="Foto carnet ${user.username}" style="width: 100%; height: 100%; object-fit: cover;">
           </div>`
        : `<div style="flex-shrink: 0; width: 120px; height: 120px; border-radius: 8px; background: #e2e8f0; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 2.5rem; color: #94a3b8; border: 3px solid #cbd5e1;">
             ${user.username[0].toUpperCase()}
           </div>`;

      card.innerHTML = `
        ${fotoHtml}
        
        <div style="flex: 1; min-width: 250px;">
            <h3 style="margin-top: 0; margin-bottom: 0.5rem; color: var(--primary);">
                @${user.username}
            </h3>
            <p style="margin: 0 0 1.5rem 0; color: #64748b; font-size: 1.05rem;">
                Rol Operativo: <strong>${user.role.charAt(0).toUpperCase() + user.role.slice(1)}</strong> &nbsp;|&nbsp; 
                WhatsApp: <strong>${user.whatsapp_number || 'Ninguno'}</strong> &nbsp;|&nbsp; 
                Estado: 
                <strong style="color: ${user.status === 'activo' ? 'var(--success)' : 'var(--error)'};">
                    ${user.status.toUpperCase()}
                </strong>
            </p>
            
            ${user.status === 'pendiente' ? `
            <div style="display: flex; gap: 0.75rem; flex-wrap: wrap;">
                <button class="btn btn-aprobar" style="background-color: var(--success); font-weight: bold; padding: 0.6rem 1.2rem;">Aprobar Cuenta Oficial</button>
            </div>
            ` : ''}
            
            <button class="btn-eliminar" style="position: absolute; top: 1rem; right: 1rem; background: none; border: none; cursor: pointer; color: var(--error); padding: 0.5rem; transition: transform 0.2s;" title="Borrar Empleado">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
            </button>
            
            ${user.status === 'activo' ? `
            <hr style="margin: 1.5rem 0 1rem 0; border: none; border-top: 1px solid var(--border-color);">
            <form class="form-reset" style="display: flex; gap: 0.5rem; align-items: stretch; max-width: 400px; margin-bottom: 0.8rem;">
                <input type="password" class="form-control input-pass" style="margin-bottom: 0;" placeholder="Ingresar nueva contraseña..." required>
                <button type="submit" class="btn" style="background-color: var(--primary); color: #ffffff; white-space: nowrap;">Resetear Clave</button>
            </form>
            <form class="form-whatsapp" style="display: flex; gap: 0.5rem; align-items: stretch; max-width: 400px;">
                <input type="tel" class="form-control input-wa" style="margin-bottom: 0;" placeholder="Editar WhatsApp..." value="${user.whatsapp_number || ''}" required>
                <button type="submit" class="btn" style="background-color: var(--success); color: #ffffff; white-space: nowrap;">Fijar Contacto</button>
            </form>
            ` : ''}
        </div>
      `;

      // Event listeners para la card
      const btnAprobar = card.querySelector('.btn-aprobar');
      if (btnAprobar) {
        btnAprobar.addEventListener('click', async () => {
          btnAprobar.disabled = true;
          try {
            await window.api.put('/users', { user_id: user.id, accion: 'aprobar' });
            window.showToast(`Usuario @${user.username} aprobado.`, 'success');
            // Recargar
            window.renderGestionPersonal(container);
          } catch (e) {
            window.showToast(e.message, 'error');
            btnAprobar.disabled = false;
          }
        });
      }

      const btnEliminar = card.querySelector('.btn-eliminar');
      btnEliminar.addEventListener('click', async () => {
        if (confirm(`¿Seguro quieres eliminar al usuario @${user.username} del sistema definitivamente? Esta acción no se puede deshacer.`)) {
          btnEliminar.disabled = true;
          try {
            await window.api.put('/users', { user_id: user.id, accion: 'eliminar' });
            window.showToast(`Usuario @${user.username} eliminado.`, 'success');
            window.renderGestionPersonal(container);
          } catch (e) {
            window.showToast(e.message, 'error');
            btnEliminar.disabled = false;
          }
        }
      });

      const formReset = card.querySelector('.form-reset');
      if (formReset) {
        formReset.addEventListener('submit', async (e) => {
          e.preventDefault();
          const passInput = formReset.querySelector('.input-pass');
          const value = passInput.value.trim();
          const btn = formReset.querySelector('button');

          btn.disabled = true;
          try {
            await window.api.put('/users', { user_id: user.id, accion: 'reset_password', value });
            window.showToast(`Contraseña de @${user.username} reestablecida.`, 'success');
            passInput.value = '';
          } catch (err) {
            window.showToast(err.message, 'error');
          } finally {
            btn.disabled = false;
          }
        });
      }

      const formWa = card.querySelector('.form-whatsapp');
      if (formWa) {
        formWa.addEventListener('submit', async (e) => {
          e.preventDefault();
          const waInput = formWa.querySelector('.input-wa');
          const value = waInput.value.trim();
          const btn = formWa.querySelector('button');

          btn.disabled = true;
          try {
            await window.api.put('/users', { user_id: user.id, accion: 'update_whatsapp', value });
            window.showToast(`Contacto de WhatsApp de @${user.username} fijado en: ${value}`, 'success');
          } catch (err) {
            window.showToast(err.message, 'error');
          } finally {
            btn.disabled = false;
          }
        });
      }

      grid.appendChild(card);
    });

    window.recaptureLiquidGL();
  }
};
