// Vista de Registro de Trabajador
window.renderRegistro = function(container) {
  container.innerHTML = `
    <div style="max-width: 450px; margin: 3rem auto;">
        <div class="card" style="padding: 2.5rem;">
            <h2 style="margin-top: 0; text-align: center; color: var(--primary);">Registrarse como Trabajador</h2>
            <p style="text-align: center; color: #64748b; font-size: 0.95rem; margin-bottom: 1.5rem;">Acceso restringido. Su cuenta deberá ser validada temporalmente mediante la aprobación de un Administrador logístico.</p>
            
            <form id="registro-form">
                <label>Nombre de Usuario</label>
                <input type="text" id="username" class="form-control" autocomplete="off" required>
                
                <label>Contraseña</label>
                <input type="password" id="password" class="form-control" required>
                
                <label>Número de WhatsApp (Notificaciones de Entrega)</label>
                <input type="tel" id="whatsapp_number" class="form-control" placeholder="+Ejemplo: 58412345678" required>
                
                <label>Foto Tipo Carnet Identificativo (Obligatorio)</label>
                <input type="file" id="foto_carnet" class="form-control" accept="image/jpeg, image/png" required style="cursor: pointer;">
                
                <button type="submit" class="btn" style="width: 100%; margin-top: 1rem; padding: 0.85rem; font-size: 1.05rem;">Solicitar Acceso</button>
            </form>
            
            <p style="text-align: center; margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid var(--border-color);">
                <a href="#login" style="color: var(--secondary); text-decoration: none; font-weight: 500;">&#8592; Volver al Login</a>
            </p>
        </div>
    </div>
  `;

  const form = document.getElementById('registro-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const whatsapp_number = document.getElementById('whatsapp_number').value.trim();
    const fileInput = document.getElementById('foto_carnet');

    if (!fileInput.files.length) {
      window.showToast('Debe seleccionar una foto de carnet.', 'error');
      return;
    }

    const file = fileInput.files[0];
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Enviando solicitud...';

    // Función para convertir archivo a base64
    const toBase64 = (file) => new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        // Extraer solo la parte base64 quitando el encabezado "data:*/*;base64,"
        const base64Str = reader.result.split(',')[1];
        resolve(base64Str);
      };
      reader.onerror = (error) => reject(error);
    });

    try {
      const base64Data = await toBase64(file);
      
      const payload = {
        username,
        password,
        whatsapp_number,
        foto_carnet: {
          name: file.name,
          type: file.type,
          data: base64Data
        }
      };

      const response = await window.api.post('/auth-register', payload);
      window.showToast(response.message || 'Registro exitoso. Espera la aprobación.', 'success');
      window.location.hash = '#login';
    } catch (error) {
      window.showToast(error.message || 'Error al procesar el registro.', 'error');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Solicitar Acceso';
    }
  });
  window.recaptureLiquidGL();
};
