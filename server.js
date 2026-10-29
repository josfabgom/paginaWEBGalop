const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const DEFAULT_PORT = parseInt(process.env.PORT, 10) || 3000;
const PUBLIC_DIR = __dirname;
const PRODUCTOS_FILE = path.join(PUBLIC_DIR, 'productos.json');
const SETTINGS_FILE = path.join(PUBLIC_DIR, 'settings.json');
const CLIENTES_FILE = path.join(PUBLIC_DIR, 'clientes.json');
const CONTENT_FILE = path.join(PUBLIC_DIR, 'landing_content.json');
const AUTH_FILE = path.join(PUBLIC_DIR, 'auth.json');
const SISTEMAS_FILE = path.join(PUBLIC_DIR, 'sistemas.json');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf'
};

function getAuth() {
  const defaultAuth = { password: 'galop2026', sessions: [] };
  try {
    if (fs.existsSync(AUTH_FILE)) {
      const data = JSON.parse(fs.readFileSync(AUTH_FILE, 'utf8'));
      return { ...defaultAuth, ...data };
    }
  } catch (err) {
    console.error("Error al leer auth.json:", err.message);
  }
  return defaultAuth;
}

function saveAuth(data) {
  fs.writeFileSync(AUTH_FILE, JSON.stringify(data, null, 2), 'utf8');
}

function getContent() {
  const defaultContent = {
    topBar: {
      whatsappText: "+54 9 376 522-4717",
      whatsappNumber: "5493765224717",
      email: "galopsrl@gmail.com",
      horario: "Posadas, Misiones · Lun a Vie 8:00 - 18:00 hs"
    },
    hero: {
      tag: "Insumos Comerciales & Servicio Técnico Homologado",
      titulo: "Soluciones Integrales en Insumos y Equipamiento para tu Comercio o Empresa",
      subtitulo: "Proveemos rollos térmicos, tóner de alta calidad, papelería y equipamiento para puntos de venta. Brindamos servicio técnico calificado en impresoras fiscales, térmicas y lectores.",
      btnCatalogo: "🛍️ Explorar Catálogo de Insumos",
      btnService: "🔧 Solicitar Servicio Técnico"
    },
    contacto: {
      telefono: "+54 9 376 522-4717",
      whatsapp: "5493765224717",
      email: "galopsrl@gmail.com",
      direccion: "Posadas, Misiones, Argentina",
      tituloBanner: "¿Listo para optimizar los insumos o reparar tus equipos?",
      descBanner: "Comunicate hoy mismo con nuestro equipo de atención comercial para recibir una cotización a medida o coordinar el ingreso de tu equipo a soporte técnico."
    }
  };
  try {
    if (fs.existsSync(CONTENT_FILE)) {
      return JSON.parse(fs.readFileSync(CONTENT_FILE, 'utf8'));
    }
  } catch (err) {
    console.error("Error al leer landing_content.json:", err.message);
  }
  return defaultContent;
}

function saveContent(data) {
  fs.writeFileSync(CONTENT_FILE, JSON.stringify(data, null, 2), 'utf8');
}

function isSessionValid(token) {
  if (!token) return false;
  const auth = getAuth();
  return Array.isArray(auth.sessions) && auth.sessions.includes(token);
}

function getRequestToken(req) {
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }
  const customHeader = req.headers['x-admin-token'];
  if (customHeader) return String(customHeader).trim();

  const cookie = req.headers['cookie'];
  if (cookie) {
    const match = cookie.match(/galop_session=([^;]+)/);
    if (match) return match[1].trim();
  }
  return null;
}

function getSettings() {
  const defaultSettings = {
    vendedorNombre: "GaLop S.R.L.",
    vendedorRol: "Ventas - Servicio Tecnico",
    vendedorPhone: "5493765224717",
    vendedorEmail: "galopsrl@gmail.com",
    categoriaInicial: "TODOS"
  };

  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const data = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'));
      return { ...defaultSettings, ...data };
    }
  } catch (err) {
    console.error("Error al leer settings.json:", err.message);
  }
  return defaultSettings;
}

function saveSettings(settings) {
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf8');
}

function getProducts() {
  try {
    if (fs.existsSync(PRODUCTOS_FILE)) {
      return JSON.parse(fs.readFileSync(PRODUCTOS_FILE, 'utf8'));
    }
  } catch (err) {
    console.error("Error al leer productos.json:", err.message);
  }
  return [];
}

function saveProducts(products) {
  fs.writeFileSync(PRODUCTOS_FILE, JSON.stringify(products, null, 2), 'utf8');
}

function getClients() {
  try {
    if (fs.existsSync(CLIENTES_FILE)) {
      return JSON.parse(fs.readFileSync(CLIENTES_FILE, 'utf8'));
    }
  } catch (err) {
    console.error("Error al leer clientes.json:", err.message);
  }
  return [];
}

function saveClients(clients) {
  fs.writeFileSync(CLIENTES_FILE, JSON.stringify(clients, null, 2), 'utf8');
}

function getSistemas() {
  try {
    if (fs.existsSync(SISTEMAS_FILE)) {
      return JSON.parse(fs.readFileSync(SISTEMAS_FILE, 'utf8'));
    }
  } catch (err) {
    console.error("Error al leer sistemas.json:", err.message);
  }
  return [];
}

function saveSistemas(sistemas) {
  fs.writeFileSync(SISTEMAS_FILE, JSON.stringify(sistemas, null, 2), 'utf8');
}

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 20 * 1024 * 1024) { // 20MB limit
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res, statusCode, data, extraHeaders = {}) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Admin-Token',
    ...extraHeaders
  });
  res.end(JSON.stringify(data));
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  let pathname = decodeURIComponent(parsedUrl.pathname);

  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Admin-Token'
    });
    return res.end();
  }

  // --- AUTH APIS ---
  if (pathname === '/api/gestionq/login' && req.method === 'POST') {
    try {
      const body = await parseJsonBody(req);
      const auth = getAuth();
      const enteredPassword = String(body.password || '').trim();
      const enteredEmail = String(body.email || '').trim().toLowerCase();

      // Permitir login con la contraseña del sistema o demo galop2026
      if (!enteredPassword || (enteredPassword !== auth.password && enteredPassword !== 'galop2026')) {
        return sendJson(res, 401, { success: false, error: 'Credenciales incorrectas' });
      }

      const token = 'glp_' + Date.now() + '_' + Math.random().toString(36).substring(2, 10);
      auth.sessions = Array.isArray(auth.sessions) ? auth.sessions : [];
      auth.sessions.push(token);
      if (auth.sessions.length > 20) auth.sessions = auth.sessions.slice(-20);
      saveAuth(auth);

      const callbackUrl = body.callbackUrl || '/dashboard';
      return sendJson(res, 200, { 
        success: true, 
        token,
        redirectUrl: callbackUrl
      }, {
        'Set-Cookie': `galop_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000`
      });
    } catch (e) {
      return sendJson(res, 500, { success: false, error: e.message });
    }
  }

  if (pathname === '/api/auth/login' && req.method === 'POST') {
    try {
      const body = await parseJsonBody(req);
      const auth = getAuth();
      const enteredPassword = String(body.password || '').trim();
      if (!enteredPassword || enteredPassword !== auth.password) {
        return sendJson(res, 401, { success: false, error: 'Contraseña incorrecta' });
      }
      const token = 'glp_' + Date.now() + '_' + Math.random().toString(36).substring(2, 10);
      auth.sessions = Array.isArray(auth.sessions) ? auth.sessions : [];
      auth.sessions.push(token);
      if (auth.sessions.length > 20) auth.sessions = auth.sessions.slice(-20);
      saveAuth(auth);

      return sendJson(res, 200, { success: true, token }, {
        'Set-Cookie': `galop_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000`
      });
    } catch (e) {
      return sendJson(res, 500, { success: false, error: e.message });
    }
  }

  if (pathname === '/api/auth/status' && req.method === 'GET') {
    const token = getRequestToken(req);
    const valid = isSessionValid(token);
    return sendJson(res, 200, { success: true, authenticated: valid });
  }

  if (pathname === '/api/auth/logout' && req.method === 'POST') {
    const token = getRequestToken(req);
    if (token) {
      const auth = getAuth();
      auth.sessions = (auth.sessions || []).filter(s => s !== token);
      saveAuth(auth);
    }
    return sendJson(res, 200, { success: true }, {
      'Set-Cookie': 'galop_session=; Path=/; HttpOnly; Max-Age=0'
    });
  }

  if (pathname === '/api/auth/change-password' && req.method === 'POST') {
    const token = getRequestToken(req);
    if (!isSessionValid(token)) {
      return sendJson(res, 401, { success: false, error: 'Acceso no autorizado' });
    }
    try {
      const body = await parseJsonBody(req);
      const auth = getAuth();
      const current = String(body.currentPassword || '').trim();
      const newPass = String(body.newPassword || '').trim();
      if (current !== auth.password) {
        return sendJson(res, 400, { success: false, error: 'La contraseña actual no es correcta' });
      }
      if (!newPass || newPass.length < 4) {
        return sendJson(res, 400, { success: false, error: 'La nueva contraseña debe tener al menos 4 caracteres' });
      }
      auth.password = newPass;
      saveAuth(auth);
      return sendJson(res, 200, { success: true });
    } catch (e) {
      return sendJson(res, 500, { success: false, error: e.message });
    }
  }

  // --- CONTENT CMS APIS (LANDING PAGE) ---
  if (pathname === '/api/content') {
    if (req.method === 'GET') {
      return sendJson(res, 200, { success: true, content: getContent() });
    }
    if (req.method === 'POST') {
      const token = getRequestToken(req);
      if (!isSessionValid(token)) {
        return sendJson(res, 401, { success: false, error: 'Acceso no autorizado al Portal Personal' });
      }
      try {
        const body = await parseJsonBody(req);
        const current = getContent();
        const updated = {
          ...current,
          topBar: { ...current.topBar, ...(body.topBar || {}) },
          hero: { ...current.hero, ...(body.hero || {}) },
          contacto: { ...current.contacto, ...(body.contacto || {}) }
        };
        saveContent(updated);
        return sendJson(res, 200, { success: true, content: updated });
      } catch (e) {
        return sendJson(res, 500, { success: false, error: e.message });
      }
    }
  }

  // --- API ROUTES ---
  if (pathname === '/api/catalog' && req.method === 'GET') {
    return sendJson(res, 200, {
      success: true,
      items: getProducts(),
      settings: getSettings()
    });
  }

  if (pathname === '/api/catalog/settings' && req.method === 'POST') {
    try {
      const body = await parseJsonBody(req);
      const current = getSettings();
      const updated = {
        ...current,
        vendedorNombre: body.vendedorNombre ?? current.vendedorNombre,
        vendedorRol: body.vendedorRol ?? current.vendedorRol,
        vendedorPhone: body.vendedorPhone ?? current.vendedorPhone,
        vendedorEmail: body.vendedorEmail ?? current.vendedorEmail,
        categoriaInicial: body.categoriaInicial ?? current.categoriaInicial
      };
      saveSettings(updated);
      return sendJson(res, 200, { success: true, settings: updated });
    } catch (e) {
      return sendJson(res, 500, { success: false, error: e.message });
    }
  }

  if (pathname === '/api/catalog/item') {
    if (req.method === 'POST') {
      try {
        const body = await parseJsonBody(req);
        const products = getProducts();
        const code = String(body.codigo || '').trim();
        if (!code) {
          return sendJson(res, 400, { success: false, error: "El código es obligatorio" });
        }

        const index = products.findIndex(p => String(p.codigo).toLowerCase() === code.toLowerCase() || (body.id && p.id === body.id));
        const item = {
          id: body.id || (index >= 0 ? products[index].id : 'item_' + Date.now()),
          codigo: code,
          descripcion: body.descripcion || 'Sin descripción',
          categoria: (body.categoria || 'LIBRERÍA').toUpperCase(),
          precio: body.precio || 'Consultar',
          foto1: body.foto1 || null,
          foto2: body.foto2 || null,
          esOferta: Boolean(body.esOferta),
          textoOferta: body.textoOferta || (body.esOferta ? '🔥 OFERTA' : null)
        };

        if (index >= 0) {
          products[index] = { ...products[index], ...item };
        } else {
          products.push(item);
        }

        saveProducts(products);
        return sendJson(res, 200, { success: true, item });
      } catch (e) {
        return sendJson(res, 500, { success: false, error: e.message });
      }
    }

    if (req.method === 'DELETE') {
      try {
        const idOrCode = String(parsedUrl.query.id || parsedUrl.query.codigo || '').trim().toLowerCase();
        if (!idOrCode) {
          return sendJson(res, 400, { success: false, error: "ID o código requerido" });
        }

        let products = getProducts();
        const initialLength = products.length;
        products = products.filter(p => p.id !== idOrCode && String(p.codigo).toLowerCase() !== idOrCode);

        saveProducts(products);
        return sendJson(res, 200, { success: true, deleted: initialLength !== products.length });
      } catch (e) {
        return sendJson(res, 500, { success: false, error: e.message });
      }
    }
  }

  if (pathname === '/api/catalog/sync' && req.method === 'POST') {
    try {
      const body = await parseJsonBody(req);
      if (!Array.isArray(body.items)) {
        return sendJson(res, 400, { success: false, error: "Formato inválido: se esperaba un array 'items'" });
      }

      const normalized = body.items.map((item, idx) => ({
        id: item.id || 'item_' + Date.now() + '_' + idx,
        codigo: String(item.codigo || '').trim(),
        descripcion: item.descripcion || '',
        categoria: (item.categoria || 'LIBRERÍA').toUpperCase(),
        precio: item.precio || 'Consultar',
        foto1: item.foto1 || null,
        foto2: item.foto2 || null,
        esOferta: Boolean(item.esOferta),
        textoOferta: item.textoOferta || (item.esOferta ? '🔥 OFERTA' : null)
      }));

      saveProducts(normalized);
      return sendJson(res, 200, { success: true, count: normalized.length });
    } catch (e) {
      return sendJson(res, 500, { success: false, error: e.message });
    }
  }

  // --- CLIENTS API ---
  if (pathname === '/api/clients') {
    if (req.method === 'GET') {
      return sendJson(res, 200, {
        success: true,
        clients: getClients()
      });
    }

    if (req.method === 'POST') {
      try {
        const body = await parseJsonBody(req);
        const name = String(body.nombre || '').trim();
        if (!name) {
          return sendJson(res, 400, { success: false, error: "El nombre del cliente es obligatorio" });
        }

        const clients = getClients();
        const id = body.id || 'cliente_' + Date.now();
        const index = clients.findIndex(c => c.id === id || c.nombre.toLowerCase() === name.toLowerCase());

        const clientData = {
          id: id,
          nombre: name,
          rubro: body.rubro || 'Comercio / Empresa',
          logo: body.logo || '/assets/images/logo.png',
          servicio: body.servicio || ''
        };

        if (index >= 0) {
          clients[index] = { ...clients[index], ...clientData };
        } else {
          clients.push(clientData);
        }

        saveClients(clients);
        return sendJson(res, 200, { success: true, client: clientData });
      } catch (e) {
        return sendJson(res, 500, { success: false, error: e.message });
      }
    }

    if (req.method === 'DELETE') {
      try {
        const id = String(parsedUrl.query.id || '').trim();
        if (!id) {
          return sendJson(res, 400, { success: false, error: "ID de cliente requerido" });
        }

        let clients = getClients();
        clients = clients.filter(c => c.id !== id);
        saveClients(clients);
        return sendJson(res, 200, { success: true });
      } catch (e) {
        return sendJson(res, 500, { success: false, error: e.message });
      }
    }
  }

  // --- SISTEMAS A MEDIDA API ---
  if (pathname === '/api/sistemas') {
    if (req.method === 'GET') {
      return sendJson(res, 200, {
        success: true,
        sistemas: getSistemas()
      });
    }

    if (req.method === 'POST') {
      const token = getRequestToken(req);
      if (!isSessionValid(token)) {
        return sendJson(res, 401, { success: false, error: 'Acceso no autorizado al Portal Personal' });
      }
      try {
        const body = await parseJsonBody(req);
        const title = String(body.titulo || '').trim();
        if (!title) {
          return sendJson(res, 400, { success: false, error: 'El título del sistema es obligatorio' });
        }

        const sistemas = getSistemas();
        const id = body.id || 'sistema_' + Date.now();
        const index = sistemas.findIndex(s => s.id === id);

        const sistemaData = {
          id: id,
          icono: body.icono || '💻',
          badge: body.badge || 'Software a Medida',
          titulo: title,
          descripcion: body.descripcion || '',
          features: Array.isArray(body.features) ? body.features.filter(Boolean) : [],
          btnText: body.btnText || 'Solicitar más información →',
          whatsappMsg: body.whatsappMsg || `Hola GaLop, quisiera consultar por el sistema de ${title}`,
          loginUrl: body.loginUrl || '',
          loginBtnText: body.loginBtnText || ''
        };

        if (index >= 0) {
          sistemas[index] = { ...sistemas[index], ...sistemaData };
        } else {
          sistemas.push(sistemaData);
        }

        saveSistemas(sistemas);
        return sendJson(res, 200, { success: true, sistema: sistemaData });
      } catch (e) {
        return sendJson(res, 500, { success: false, error: e.message });
      }
    }

    if (req.method === 'DELETE') {
      const token = getRequestToken(req);
      if (!isSessionValid(token)) {
        return sendJson(res, 401, { success: false, error: 'Acceso no autorizado al Portal Personal' });
      }
      try {
        const id = String(parsedUrl.query.id || '').trim();
        if (!id) {
          return sendJson(res, 400, { success: false, error: 'ID de sistema requerido' });
        }

        let sistemas = getSistemas();
        sistemas = sistemas.filter(s => s.id !== id);
        saveSistemas(sistemas);
        return sendJson(res, 200, { success: true });
      } catch (e) {
        return sendJson(res, 500, { success: false, error: e.message });
      }
    }
  }

  // --- ROUTE ALIASES ---
  if (pathname === '/' || pathname === '/landing' || pathname === '/inicio') {
    pathname = '/landing.html';
  } else if (pathname === '/productos' || pathname === '/catalogo') {
    pathname = '/index.html';
  } else if (pathname === '/catalog' || pathname === '/admin' || pathname === '/portal' || pathname === '/personal' || pathname === '/dashboard/catalog') {
    pathname = '/admin.html';
  } else if (pathname === '/login') {
    const callbackUrl = parsedUrl.query.callbackUrl || '';
    if (callbackUrl.includes('catalog') || callbackUrl.includes('admin')) {
      res.writeHead(302, { Location: '/admin.html' });
      return res.end();
    }
    pathname = '/login.html';
  } else if (pathname === '/dashboard') {
    pathname = '/dashboard.html';
  }

  // --- STATIC FILE SERVING ---
  const safePath = path.normalize(path.join(PUBLIC_DIR, pathname));
  if (!safePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end('Acceso denegado');
  }

  fs.stat(safePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      return res.end(`
        <div style="font-family: sans-serif; text-align: center; padding: 50px;">
          <h2>404 - Archivo no encontrado</h2>
          <p>No se encontró: <code>${pathname}</code></p>
          <a href="/">⬅ Volver al Inicio</a> | <a href="/productos">🛍️ Ver Catálogo</a>
        </div>
      `);
    }

    const ext = path.extname(safePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache'
    });

    const stream = fs.createReadStream(safePath);
    stream.pipe(res);
  });
});

function startServer(port) {
  server.listen(port, () => {
    console.log(`\n======================================================`);
    console.log(`🚀 SERVIDOR LOCAL GA LOP S.R.L. INICIADO EXITOSAMENTE`);
    console.log(`======================================================`);
    console.log(`📍 Portal Principal:        http://localhost:${port}/`);
    console.log(`🛍️ Catálogo de Productos:   http://localhost:${port}/productos`);
    console.log(`⚙️ Panel de Gestión (ABM):  http://localhost:${port}/catalog`);
    console.log(`🔌 API Catálogo:            http://localhost:${port}/api/catalog`);
    console.log(`======================================================\n`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`Puerto ${port} en uso, intentando con ${port + 1}...`);
      startServer(port + 1);
    } else {
      console.error("Error al iniciar el servidor:", err);
    }
  });
}

startServer(DEFAULT_PORT);
