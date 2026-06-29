// Vista de Login
window.renderLogin = function(container) {
  container.innerHTML = `
    <div style="max-width: 400px; margin: 4rem auto;">
        <div class="card">
            <h2 style="margin-top: 0; margin-bottom: 2rem; text-align: center; color: var(--primary);">Iniciar Sesión</h2>
            <form id="login-form">
                <label>Usuario</label>
                <input type="text" id="username" class="form-control" autocomplete="off" required>
                
                <label>Contraseña</label>
                <input type="password" id="password" class="form-control" required>
                
                <button type="submit" class="btn" style="width: 100%; margin-top: 1rem;">Ingresar al Sistema</button>
            </form>

            <div style="text-align: center; margin-top: 1.5rem; font-size: 0.95rem; border-top: 1px solid var(--border-color); padding-top: 1rem;">
                <p style="color: #64748b; margin-bottom: 0.5rem;">¿Nuevo en la plataforma?</p>
                <a href="#registro" class="btn" style="background-color: var(--primary); color: #ffffff; text-decoration: none; display: inline-block; padding: 0.5rem 1rem; width: 100%; box-sizing: border-box;">Solicitar Acceso como Trabajador</a>
                
                <p style="margin-top: 1.5rem; color: #64748b; font-size: 0.85rem;">¿Olvidaste tu contraseña o usuario?<br> <strong style="color: var(--error);">Solicita un Reset de Clave al Administrador</strong> para recuperarlo de inmediato mediante su panel personal.</p>
            </div>
        </div>
    </div>
  `;



  // Event listener para el formulario
  const form = document.getElementById('login-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;

    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Autenticando...';

    try {
      const response = await window.api.post('/auth-login', { username, password });
      
      // Guardar sesión
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));

      window.showToast('Sesión iniciada exitosamente.', 'success');

      // Redirigir según rol
      if (['administrador', 'superusuario'].includes(response.user.role)) {
        window.location.hash = '#admin';
      } else {
        window.location.hash = '#trabajador';
      }
    } catch (error) {
      window.showToast(error.message || 'Error de credenciales.', 'error');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Ingresar al Sistema';
    }
  });
  window.recaptureLiquidGL();
};
