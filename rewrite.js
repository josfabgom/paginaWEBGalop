const fs = require('fs');
let appjs = fs.readFileSync('app.js', 'utf8');

// Find where DATOS_INCRUSTADOS array ends
const startOfDatos = appjs.indexOf('const DATOS_INCRUSTADOS = [');
const endOfDatos = appjs.indexOf('];', startOfDatos) + 2;

// We need to keep IMAGENES_INCRUSTADAS which is right after DATOS_INCRUSTADOS
// Wait, the logic is:
// const DATOS_INCRUSTADOS = [...]; const IMAGENES_INCRUSTADAS = {...}; let LOGO_INCRUSTADO = "...";
// We want to remove DATOS_INCRUSTADOS and the `if (DATOS_INCRUSTADOS.length > 0) { ... }` block.
// To make it robust, let's just use regex.

let newAppJs = appjs.replace(/const DATOS_INCRUSTADOS = \[[\s\S]*?\];/m, 'let DATOS_INCRUSTADOS = [];');

// Now find the init block: if (DATOS_INCRUSTADOS.length > 0) { ... }
newAppJs = newAppJs.replace(/if \(DATOS_INCRUSTADOS\.length > 0\) \{[\s\S]*?renderizarProductos\(\);\s*\}/, `
  function fetchCatalog() {
    fetch('/api/catalog')
        .then(r => r.json())
        .then(data => {
            if(data.success && data.items && data.items.length > 0) {
                document.body.classList.add('has-data');
                productosGlobales = data.items;
                mapaImagenes = IMAGENES_INCRUSTADAS;
                logoBase64 = LOGO_INCRUSTADO;
                vendedor = {
                    nombre: data.settings?.vendedorNombre || VENDEDOR_INCRUSTADO.nombre,
                    cargo: data.settings?.vendedorRol || VENDEDOR_INCRUSTADO.cargo,
                    telefono: data.settings?.vendedorPhone || VENDEDOR_INCRUSTADO.telefono,
                    email: data.settings?.vendedorEmail || VENDEDOR_INCRUSTADO.email
                };
                prepararGuardado();
                renderizarSeccionVendedor();
                renderizarFiltrosYBotones();
                renderizarProductos();
            }
        });
  }
  fetchCatalog();
`);

fs.writeFileSync('app.js', newAppJs);
console.log('app.js rewritten');
