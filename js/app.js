// ═══════════════════════════════════════════════════════════════
//  Inventario Radiografía — App SPA Core (Routing, Tema, Toasts)
// ═══════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', async () => {
  await window.getSupabaseConfig();
  initTheme();
  initRouter();
});

// --- TEMA (Oscuro / Claro) ---
function initTheme() {
  const themeBtn = document.getElementById('theme-toggle');
  const themeIcon = document.getElementById('theme-icon');
  const root = document.documentElement;

  const moonIconPath = '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>';
  const sunIconPath = '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>';

  const currentTheme = localStorage.getItem('theme') || 'light';
  root.setAttribute('data-theme', currentTheme);
  if (themeIcon) {
    themeIcon.innerHTML = currentTheme === 'light' ? moonIconPath : sunIconPath;
  }

  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      const newTheme = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
      root.setAttribute('data-theme', newTheme);
      localStorage.setItem('theme', newTheme);
      
      themeBtn.classList.remove('theme-spin');
      void themeBtn.offsetWidth; // trigger reflow
      themeBtn.classList.add('theme-spin');
      
      setTimeout(() => {
        if (themeIcon) {
          themeIcon.innerHTML = newTheme === 'light' ? moonIconPath : sunIconPath;
        }
        // Siempre recargar la página para refrescar los fondos y recapturar las tarjetas LiquidGL
        window.location.reload();
      }, 100);
    });
  }
}

// --- NOTIFICACIONES (Toasts) ---
window.showToast = function(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;

  const iconSvg = type === 'error' 
    ? '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--error)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>'
    : '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--success)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>';

  toast.innerHTML = `
    ${iconSvg}
    <span style="color: var(--text-main); font-weight: 500; font-size: 0.95rem;">${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 5000);
};

function initRouter() {
  window.addEventListener('hashchange', handleRoute);
  handleRoute();
}

function handleRoute() {
  const routes = {
    '#login': { render: window.renderLogin, auth: false },
    '#registro': { render: window.renderRegistro, auth: false },
    '#admin': { render: window.renderDashboardAdmin, auth: true, roles: ['administrador', 'superusuario'] },
    '#trabajador': { render: window.renderDashboardTrabajador, auth: true },
    '#personal': { render: window.renderGestionPersonal, auth: true, roles: ['administrador', 'superusuario'] }
  };

  const hash = window.location.hash || '#login';
  const route = routes[hash];
  const container = document.getElementById('app');
  
  if (!container) return;

  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  // Redirección si está autenticado pero intenta ir a login/registro
  if (token && user && (hash === '#login' || hash === '#registro')) {
    if (['administrador', 'superusuario'].includes(user.role)) {
      window.location.hash = '#admin';
    } else {
      window.location.hash = '#trabajador';
    }
    return;
  }

  // Comprobar requerimientos de autenticación
  if (route && route.auth && (!token || !user)) {
    window.location.hash = '#login';
    return;
  }

  // Comprobar requerimientos de rol
  if (route && route.roles && !route.roles.includes(user.role)) {
    window.location.hash = user.role === 'trabajador' ? '#trabajador' : '#admin';
    showToast('Acceso denegado: permisos insuficientes.', 'error');
    return;
  }

  // Renderizar la vista
  if (route && typeof route.render === 'function') {
    renderNavbar();
    container.innerHTML = '<div style="text-align: center; margin: 4rem;"><div class="spinner">Cargando...</div></div>';
    route.render(container);
  } else {
    // Ruta no encontrada
    window.location.hash = '#login';
  }
}

// --- NAVBAR RENDERING ---
function renderNavbar() {
  const nav = document.getElementById('navbar');
  if (!nav) return;

  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  if (!token || !user) {
    nav.innerHTML = `
      <div class="nav-bubble title-bubble liquidGL login-mode">
        INVENTARIO RADIOGRAFÍA
      </div>
    `;
    initNavbarLiquidGL();
    return;
  }

  const isAdmin = ['administrador', 'superusuario'].includes(user.role);
  const currentHash = window.location.hash || '#login';

  nav.innerHTML = `
    <div class="nav-bubble title-bubble liquidGL">
      INVENTARIO RADIOGRAFÍA
    </div>
    <div class="nav-bubble links-bubble liquidGL">
      ${isAdmin ? `
        <a href="#admin" class="${currentHash === '#admin' ? 'active' : ''}">
          <span class="desktop-text">Panel Admin</span><span class="mobile-text">Panel</span>
        </a>
        <a href="#personal" class="${currentHash === '#personal' ? 'active' : ''}">
          <span class="desktop-text">Personal</span><span class="mobile-text">Personal</span>
        </a>
        <a href="#trabajador" class="${currentHash === '#trabajador' ? 'active' : ''}">
          <span class="desktop-text">Actualización de Inventario</span><span class="mobile-text">Stock</span>
        </a>
      ` : `
        <a href="#trabajador" class="${currentHash === '#trabajador' ? 'active' : ''}">
          <span class="desktop-text">Comprobantes</span><span class="mobile-text">Comprobantes</span>
        </a>
      `}
    </div>
    <div class="nav-bubble user-bubble liquidGL">
      <span class="user-badge">@${user.username}</span>
      <a href="#" id="logout-btn" title="Cerrar sesión">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle;"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
      </a>
    </div>
  `;

  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      logout();
    });
  }

  initNavbarLiquidGL();
}

function initNavbarLiquidGL() {
  if (window.liquidGL) {
    try {
      window.liquidGL(".nav-bubble.liquidGL, #theme-toggle.liquidGL", {
        refraction: 0.02,
        bevelDepth: 0.05,
        bevelWidth: 0.1,
        frost: 0,
        shadow: true,
        specular: false
      });
    } catch (e) {
      console.warn("LiquidGL error on navbar:", e);
    }
  }
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.hash = '#login';
  showToast('Sesión cerrada correctamente.', 'success');
}

window.navigate = function(hash) {
  window.location.hash = hash;
};

window.recaptureLiquidGL = function() {
  if (window.__liquidGLRenderer__) {
    setTimeout(() => {
      window.__liquidGLRenderer__._capturing = false;
      window.__liquidGLRenderer__.captureSnapshot();
    }, 150);
  }
};
