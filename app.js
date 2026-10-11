
    // --- PARTE 1 COMPLETA ---
     let DATOS_INCRUSTADOS = []; const IMAGENES_INCRUSTADAS = {
  "10011": "/assets/images/10011.jpeg",
  "10040": "/assets/images/10040.jpeg",
  "10041": "/assets/images/10041.jpeg",
  "10043": "/assets/images/10043.jpeg",
  "10063": "/assets/images/10063.jpeg",
  "10072": "/assets/images/10072.jpeg",
  "10078": "/assets/images/10078.jpeg",
  "10235": "/assets/images/10235.jpeg",
  "10236": "/assets/images/10236.jpeg",
  "10280": "/assets/images/10280.jpeg",
  "10333": "/assets/images/10333.jpeg",
  "10334": "/assets/images/10334.jpeg",
  "10335": "/assets/images/10335.jpeg",
  "10336": "/assets/images/10336.jpeg",
  "10341": "/assets/images/10341.jpeg",
  "10345": "/assets/images/10345.jpeg",
  "10346": "/assets/images/10346.jpeg",
  "10347": "/assets/images/10347.jpeg",
  "10348": "/assets/images/10348.jpeg",
  "10349": "/assets/images/10349.jpeg",
  "10351": "/assets/images/10351.jpeg",
  "10352": "/assets/images/10352.jpeg",
  "10353": "/assets/images/10353.jpeg",
  "10363": "/assets/images/10363.jpeg",
  "10383": "/assets/images/10383.jpeg",
  "10345_2": "/assets/images/10345_2.jpeg",
  "10346_2": "/assets/images/10346_2.jpeg",
  "10347_2": "/assets/images/10347_2.jpeg",
  "10348_2": "/assets/images/10348_2.jpeg",
  "10349_2": "/assets/images/10349_2.jpeg",
  "10351_2": "/assets/images/10351_2.jpeg",
  "10352_2": "/assets/images/10352_2.jpeg",
  "10353_2": "/assets/images/10353_2.jpeg",
  "10363_2": "/assets/images/10363_2.jpeg",
  "10383_2": "/assets/images/10383_2.jpeg"
}; let LOGO_INCRUSTADO = "/assets/images/logo.png"; const VENDEDOR_INCRUSTADO = {"nombre":"LOPEZ DARIO JAVIER","cargo":"Ventas - Servicio Tecnico","email":"galopsrl@gmail.com","telefono":"5493765224717"};
    let productosGlobales = [], mapaImagenes = {}, logoBase64 = "", carrito = {};
    let vendedor = VENDEDOR_INCRUSTADO;
    const CATEGORIA_INICIAL = "TECNOLOGÍA";
    const FECHA_CATALOGO = "10/10/2026";
    let storageKey = '';
    function prepararGuardado() {
        if (!DATOS_INCRUSTADOS.length) return;
        const identificador = JSON.stringify([vendedor?.telefono, productosGlobales.map(p=>p.codigo)]);
        let hash=2166136261;
        for(let i=0;i<identificador.length;i++){hash^=identificador.charCodeAt(i);hash=Math.imul(hash,16777619);}
        storageKey='galop_seleccion_'+(hash>>>0).toString(16);
        try {
            const guardado=JSON.parse(localStorage.getItem(storageKey)||'{}');
            const codigos=new Set(productosGlobales.map(p=>String(p.codigo)));
            carrito={};
            for(const [codigo,cantidad] of Object.entries(guardado)) if(codigos.has(codigo)&&Number.isInteger(cantidad)&&cantidad>0&&cantidad<=99999) carrito[codigo]=cantidad;
        } catch(e) {carrito={};}
        actualizarBotonFlotante();
    }
    function guardarSeleccion() {if(!storageKey)return;try {localStorage.setItem(storageKey,JSON.stringify(carrito));}catch(e){/* Navegador sin almacenamiento */}}
    function mostrarFecha() {if(FECHA_CATALOGO)document.getElementById('catalog-date').textContent='📅 Catálogo actualizado: '+FECHA_CATALOGO;}

    const CATEGORIAS = [{id:'TODOS', icono:'▦'}, {id:'ROLLOS', icono:'🧾'}, {id:'TÓNER', icono:'🖨️'}, {id:'TECNOLOGÍA', icono:'💻'}, {id:'LIBRERÍA', icono:'📚'}];
    let categoriaActiva = CATEGORIA_INICIAL;
    function normalizarCategoria(valor) {return String(valor||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toUpperCase();}
    function coincideCategoria(producto, categoria) {
        if(categoria==='TODOS') return true;
        const cat=normalizarCategoria(producto.categoria);
        const elegido=normalizarCategoria(categoria);
        return cat===elegido || cat.startsWith(elegido+' ') || cat.startsWith(elegido+' -') || cat.startsWith(elegido+':');
    }
    function dibujarCategorias() {
        const panel=document.getElementById('categories-panel');
        const botones=document.getElementById('category-buttons');
        botones.replaceChildren();panel.style.display='block';
        CATEGORIAS.forEach(c=>{
            const b=document.createElement('button');b.type='button';b.className='category-btn'+(categoriaActiva===c.id?' active':'');
            b.textContent=c.icono+' '+c.id;b.setAttribute('aria-pressed',String(categoriaActiva===c.id));
            b.addEventListener('click',()=>{categoriaActiva=c.id;dibujarCategorias();filtrarProductos();});botones.appendChild(b);
        });
    }
    function filtrarProductos() {
        const q=document.getElementById('search').value.trim().toLocaleLowerCase('es');
        const filtrados=productosGlobales.filter(p=>coincideCategoria(p,categoriaActiva) && (!q || [p.descripcion,p.codigo,p.categoria].some(v=>String(v).toLocaleLowerCase('es').includes(q))));
        dibujarProductos(filtrados);
    }
    const statusDiv = document.getElementById('status');

    fetch('/api/catalog')
        .then(r => r.json())
        .then(data => {
            if(data.success && data.items && data.items.length > 0) {
                document.body.classList.add('has-data');
                productosGlobales = data.items;
                mapaImagenes = IMAGENES_INCRUSTADAS;
                data.items.forEach(item => {
                    if (item.foto1) mapaImagenes[String(item.codigo).toLowerCase()] = item.foto1;
                });
                logoBase64 = LOGO_INCRUSTADO;
                if (logoBase64) document.getElementById('logo-place').innerHTML = "<img src='" + logoBase64 + "'>";
                
                // Override Vendedor info with settings if available
                if (data.settings) {
                    if (data.settings.vendedorNombre) VENDEDOR_INCRUSTADO.nombre = data.settings.vendedorNombre;
                    if (data.settings.vendedorRol) VENDEDOR_INCRUSTADO.cargo = data.settings.vendedorRol;
                    if (data.settings.vendedorPhone) VENDEDOR_INCRUSTADO.telefono = data.settings.vendedorPhone;
                }
                
                document.getElementById('search').disabled = false; 
                prepararGuardado(); 
                dibujarCategorias(); 
                filtrarProductos(); 
                mostrarVendedor(); 
                mostrarFecha();
            }
        });

    document.getElementById('logo-file').addEventListener('change', function(e) {
        const file = e.target.files[0]; if (!file) return; const reader = new FileReader();
        reader.onload = function(evt) { logoBase64 = evt.target.result; document.getElementById('logo-place').innerHTML = "<img src='" + logoBase64 + "'>"; };
        reader.readAsDataURL(file);
    });

    document.getElementById('btn-run').addEventListener('click', function() {
        const csvInput = document.getElementById('csv-file'), imgInput = document.getElementById('img-files');
        const nombre = document.getElementById('seller-name').value.trim();
        const cargo = document.getElementById('seller-role').value.trim();
        const email = document.getElementById('seller-email').value.trim();
        const telefono = document.getElementById('seller-phone').value.replace(/\D/g,'');
        if (!nombre) { alert('Ingresá el nombre del vendedor.'); return; }
        if (!/^\d{10,15}$/.test(telefono)) { alert('Ingresá un WhatsApp válido con código de país, por ejemplo 5493765224717.'); return; }
        if (email && !document.getElementById('seller-email').checkValidity()) { alert('Revisá el correo electrónico.'); return; }
        vendedor = {nombre, cargo, email, telefono};
        categoriaActiva = document.getElementById('default-category').value;
        if (!csvInput.files.length) { alert("Por favor, selecciona primero el archivo .csv."); return; }
        statusDiv.innerHTML = "⚙️ [LOG] Empaquetando fotos en memoria pura...";
        mapaImagenes = {}; let total = imgInput.files.length, proc = 0;
        if (total === 0) { procesarCSV(csvInput.files[0]); } else {
            Array.from(imgInput.files).forEach(f => {
                const reader = new FileReader(); let nom = f.name.toLowerCase().replace('.jpeg', '').replace('.jpg', '').trim();
                reader.onload = function(evt) { mapaImagenes[nom] = evt.target.result; proc++; if (proc === total) { statusDiv.innerHTML = "✅ [LOG] Fotos listas. Leyendo Excel..."; procesarCSV(csvInput.files[0]); } };
                reader.readAsDataURL(f);
            });
        }
    });

    function procesarCSV(file) {
        const reader = new FileReader();
        reader.onload = function(evt) {
            try {
                const filas = evt.target.result.split('\n'); productosGlobales = []; let cat = "General";
                statusDiv.innerHTML += "<br>📊 [LOG] Analizando " + filas.length + " líneas...";
                for (let i = 0; i < filas.length; i++) {
                    const linea = filas[i].trim(); if (!linea) continue;
                    let c = linea.indexOf(';') !== -1 ? linea.split(';') : linea.split(',');
                    if(!c || c.length < 1) continue;
                    
                    // SEPARADOR INDEPENDIENTE: Fuerza la lectura de la celda 0 y la celda 1 por separado
                    let c0 = c[0] ? String(c[0]).replace(/"/g, '').trim() : ''; 
                    let c1 = c[1] ? String(c[1]).replace(/"/g, '').trim() : '';
                    
                    if (c0 === "CATÁLOGO DE PRODUCTOS" || c0.toLowerCase().includes("listado") || c0.toLowerCase().includes("código") || c0.toLowerCase().includes("codigo") || c1.toLowerCase().includes("descrip")) continue;
                    if (c0 && !c1) { cat = c0; statusDiv.innerHTML += "<br>📂 [LOG] Categoría: " + cat; continue; }
                    if (c0 && c1) productosGlobales.push({ codigo: c0, descripcion: c1, categoria: cat });
                }
                if (productosGlobales.length > 0) {
                    statusDiv.style.color = "#16a34a"; statusDiv.innerHTML += "<br>🎉 [LOG] ¡Éxito! " + productosGlobales.length + " artículos cargados.";
                    document.getElementById('search').disabled = false; document.getElementById('btn-run').style.display = "none"; document.getElementById('btn-export').style.display = "block";
                    dibujarCategorias(); filtrarProductos(); mostrarVendedor();
                } else { statusDiv.style.color = "#dc2626"; statusDiv.innerHTML += "<br>❌ [ERROR] No se encontraron filas válidas en el CSV."; }
            } catch (err) { statusDiv.style.color = "#dc2626"; statusDiv.innerHTML += "<br>💥 [ERROR CRÍTICO] Falla en lectura: " + err.message; }
        };
        reader.readAsText(file, 'ISO-8859-1');
    }

    
    // --- CONTINÚA EN LA PARTE 3 ---
      function dibujarProductos(prods) {
        const container = document.getElementById('catalog-sections'); container.innerHTML = '';
        if(!prods.length) {const aviso=document.createElement('div');aviso.className='category-empty';aviso.textContent='No hay productos en esta categoría todavía. Probá otra sección o el botón TODOS.';container.appendChild(aviso);return;}
        const grupos = {}; prods.forEach(p => { if (!grupos[p.categoria]) grupos[p.categoria] = []; grupos[p.categoria].push(p); });
        for (const cat in grupos) {
            const seccion = document.createElement('div'); seccion.innerHTML = '<div class="categoria-titulo">' + cat + '</div>';
            const grid = document.createElement('div'); grid.className = 'grid';
            grupos[cat].forEach(p => {
                const card = document.createElement('div'); card.className = 'card';
                const fotos = [mapaImagenes[String(p.codigo).toLowerCase()], mapaImagenes[String(p.codigo).toLowerCase()+'_2']].filter(Boolean);
                const src = fotos[0] || ""; const cant = carrito[p.codigo] || 0;
                card.innerHTML = `<div class='img-container'><img src='${src}' style='${src ? "" : "display:none;"}'><div style='${src ? "display:none;" : "display:block;"} color:#94a3b8; font-weight:bold; font-size:14px;'>📦 Sin Foto</div></div><div class='card-body'><h3>${p.descripcion}</h3><div class='code'>Cód: ${p.codigo}</div><div class='price'>Consultar</div><div class='cart-controls'><button class='btn-qty' onclick="cambiarCantidad('${p.codigo}', -1)">-</button><input type='text' id='qty-${p.codigo}' class='qty-input' value='${cant}' readonly><button class='btn-qty' onclick="cambiarCantidad('${p.codigo}', 1)">+</button></div></div>`;
                if(fotos.length){
                    const cont=card.querySelector('.img-container'), foto=cont.querySelector('img'); let indice=0;
                    foto.classList.add('zoomable');foto.title='Ver imagen ampliada';foto.alt=p.descripcion;
                    foto.addEventListener('click',()=>abrirFoto(fotos[indice],p.descripcion));
                    if(fotos.length>1){
                        const miniaturas=document.createElement('div');miniaturas.className='photo-thumbnails';
                        const botones=[];
                        const actualizar=()=>{
                            foto.src=fotos[indice];
                            botones.forEach((boton,i)=>{
                                boton.classList.toggle('active',i===indice);
                                boton.setAttribute('aria-pressed',String(i===indice));
                            });
                        };
                        fotos.forEach((srcFoto,i)=>{
                            const boton=document.createElement('button');
                            boton.type='button';boton.className='photo-thumb';
                            boton.setAttribute('aria-label','Ver fotografía '+(i+1)+' de '+fotos.length);
                            const mini=document.createElement('img');mini.src=srcFoto;mini.alt='';
                            boton.appendChild(mini);
                            boton.addEventListener('click',()=>{indice=i;actualizar();});
                            miniaturas.appendChild(boton);botones.push(boton);
                        });
                        cont.insertAdjacentElement('afterend',miniaturas);
                        actualizar();
                    }
                }
                grid.appendChild(card);
            });
            seccion.appendChild(grid); container.appendChild(seccion);
        }
    }

    function abrirFoto(src,nombre){document.getElementById('photo-large').src=src;document.getElementById('photo-caption').textContent=nombre;document.getElementById('photo-overlay').classList.add('open');}
    function cerrarFoto(){document.getElementById('photo-overlay').classList.remove('open');document.getElementById('photo-large').removeAttribute('src');}
    document.getElementById('photo-close').addEventListener('click',cerrarFoto);
    document.getElementById('photo-overlay').addEventListener('click',e=>{if(e.target.id==='photo-overlay')cerrarFoto();});
    document.addEventListener('keydown',e=>{if(e.key==='Escape')cerrarFoto();});
    window.cambiarCantidad = function(codigo, cambio) {
        let input = document.getElementById("qty-" + codigo); let valor = parseInt(input.value) + cambio; if (valor < 0) valor = 0; input.value = valor;
        if (valor === 0) { delete carrito[codigo]; } else { carrito[codigo] = valor; }
        guardarSeleccion(); actualizarBotonFlotante();
    };

    function waUrl(mensaje) {
        const numero = String(vendedor?.telefono || '').replace(/\D/g, '');
        if (!numero) return '';
        return 'https://api.whatsapp.com/send?phone=' + numero + '&text=' + encodeURIComponent(mensaje);
    }
    function abrirWhatsApp(mensaje) {
        const url = waUrl(mensaje);
        if (!url) { alert('No hay un número de WhatsApp configurado.'); return; }
        window.open(url, '_blank', 'noopener,noreferrer');
    }
    function mostrarVendedor() {
        if (!vendedor) return;
        const tarjeta = document.getElementById('seller-card');
        tarjeta.replaceChildren(); tarjeta.style.display='block';
        const titulo=document.createElement('h2'); titulo.textContent=vendedor.nombre; tarjeta.appendChild(titulo);
        for (const dato of [vendedor.cargo, '📍 Herrera 4480 · CP (3300) Posadas - Misiones', '📱 WhatsApp: +' + vendedor.telefono, vendedor.email ? '✉️ ' + vendedor.email : '']) {
            if (!dato) continue; const p=document.createElement('p'); p.textContent=dato; tarjeta.appendChild(p);
        }
        const acciones=document.createElement('div'); acciones.className='seller-actions';
        const links=[['💬 Contactar al vendedor','contact','Hola, ' + vendedor.nombre + '. Quisiera hacer una consulta sobre el catálogo de GaLop S.R.L.'],['🔧 Solicitar servicio técnico','service','Hola, GaLop S.R.L. Necesito solicitar servicio técnico. Mi nombre es: _____. El equipo es: _____. El problema es: _____.']];
        for (const [texto,clase,mensaje] of links) {const link=document.createElement('a');link.className=clase;link.textContent=texto;link.href=waUrl(mensaje);link.target='_blank';link.rel='noopener noreferrer';link.addEventListener('click', function(e) { e.preventDefault(); abrirWhatsApp(mensaje); });acciones.appendChild(link);}
        tarjeta.appendChild(acciones);
    }
    function crearMensajePedido() {
        let mensaje='📋 *SOLICITUD DE COTIZACIÓN - GaLop S.R.L.*\nVendedor: '+vendedor.nombre+'\n\n';
        productosGlobales.forEach(p=>{if(carrito[p.codigo]) mensaje+='📦 *'+p.descripcion+'*\n   • Código: '+p.codigo+'\n   • Cantidad: '+carrito[p.codigo]+' unidad(es)\n\n';});
        return mensaje+'¿Podrían informarme los precios, la disponibilidad y las condiciones comerciales de estos productos? Muchas gracias.';
    }
    function abrirResumen() {
        if (!Object.keys(carrito).length) return;
        document.getElementById('cart-overlay').classList.add('open');
        dibujarResumen();
        document.querySelector('.cart-dialog').focus();
    }
    function cerrarResumen() {document.getElementById('cart-overlay').classList.remove('open');}
    function cambiarCantidadResumen(codigo, delta) {
        const nueva=Math.max(0,(carrito[codigo]||0)+delta);
        if(nueva===0) delete carrito[codigo]; else carrito[codigo]=nueva;
        const visible=document.getElementById('qty-'+codigo);
        if(visible) visible.value=nueva;
        guardarSeleccion();actualizarBotonFlotante();dibujarResumen();
    }
    function dibujarResumen() {
        const lista=document.getElementById('cart-items');lista.replaceChildren();
        let unidades=0, articulos=0;
        productosGlobales.forEach(p=>{
            const cantidad=carrito[p.codigo]||0;if(!cantidad)return;
            unidades+=cantidad;articulos++;
            const fila=document.createElement('div');fila.className='cart-item';
            const info=document.createElement('div');
            const nombre=document.createElement('div');nombre.className='cart-item-name';nombre.textContent=p.descripcion;
            const codigo=document.createElement('div');codigo.className='cart-item-code';codigo.textContent='Código: '+p.codigo;
            info.append(nombre,codigo);
            const controles=document.createElement('div');controles.className='cart-item-controls';
            const menos=document.createElement('button');menos.type='button';menos.textContent='−';menos.setAttribute('aria-label','Quitar una unidad');menos.onclick=()=>cambiarCantidadResumen(p.codigo,-1);
            const numero=document.createElement('strong');numero.textContent=cantidad;
            const mas=document.createElement('button');mas.type='button';mas.textContent='+';mas.setAttribute('aria-label','Agregar una unidad');mas.onclick=()=>cambiarCantidadResumen(p.codigo,1);
            const quitar=document.createElement('button');quitar.type='button';quitar.textContent='×';quitar.className='remove';quitar.title='Eliminar producto';quitar.onclick=()=>cambiarCantidadResumen(p.codigo,-(carrito[p.codigo]||0));
            controles.append(menos,numero,mas,quitar);fila.append(info,controles);lista.appendChild(fila);
        });
        document.getElementById('cart-total').textContent=articulos+' producto(s) diferente(s) · '+unidades+' unidad(es) en total';
        document.getElementById('cart-send').disabled=!unidades;
        document.getElementById('cart-clear').disabled=!unidades;
        if(!unidades){const aviso=document.createElement('p');aviso.textContent='Todavía no seleccionaste productos de interés.';lista.appendChild(aviso);}
    }
    document.getElementById('cart-clear').addEventListener('click',()=>{if(!Object.keys(carrito).length)return;if(!confirm('¿Querés quitar todos los productos seleccionados?'))return;carrito={};guardarSeleccion();filtrarProductos();actualizarBotonFlotante();dibujarResumen();});
    document.getElementById('cart-close').addEventListener('click',cerrarResumen);
    document.getElementById('cart-back').addEventListener('click',cerrarResumen);
    document.getElementById('cart-overlay').addEventListener('click',e=>{if(e.target.id==='cart-overlay')cerrarResumen();});
    document.addEventListener('keydown',e=>{if(e.key==='Escape')cerrarResumen();});
    document.getElementById('cart-send').addEventListener('click',()=>{
        if(!Object.keys(carrito).length||!vendedor)return;
        abrirWhatsApp(crearMensajePedido());
    });
    function actualizarBotonFlotante() {
        const total=Object.values(carrito).reduce((sum,cantidad)=>sum+cantidad,0);
        let boton=document.getElementById('wa-pedido');
        if(!boton){boton=document.createElement('button');boton.type='button';boton.id='wa-pedido';boton.className='whatsapp-float';document.body.appendChild(boton);}
        boton.style.display=total&&vendedor?'flex':'none';
        boton.textContent='📋 Ver productos seleccionados ('+total+')';
        boton.onclick=abrirResumen;
    }

    document.getElementById('search').addEventListener('input', function(e) {
        filtrarProductos();
    });

    document.getElementById('btn-export').addEventListener('click', function() {
        const copia = document.documentElement.cloneNode(true);
        copia.querySelector('#wa-pedido')?.remove();
        copia.querySelector('#cart-overlay')?.classList.remove('open');
        copia.querySelector('#photo-overlay')?.classList.remove('open');
        copia.querySelector('#photo-large')?.removeAttribute('src');
        const itemsCopia=copia.querySelector('#cart-items');if(itemsCopia)itemsCopia.replaceChildren();
        const tarjetaCopia = copia.querySelector('#seller-card');
        if (tarjetaCopia) { tarjetaCopia.innerHTML = ''; tarjetaCopia.style.display = 'none'; }
        const panelCopia=copia.querySelector('#categories-panel'); if(panelCopia) {panelCopia.style.display='none';panelCopia.querySelector('#category-buttons').innerHTML='';}
        const html = copia.outerHTML;
        let final = html.replace('const DATOS_INCRUSTADOS = [];', 'const DATOS_INCRUSTADOS = ' + JSON.stringify(productosGlobales) + ';');
        final = final.replace('const IMAGENES_INCRUSTADAS = {};', 'const IMAGENES_INCRUSTADAS = ' + JSON.stringify(mapaImagenes) + ';');
        final = final.replace('let LOGO_INCRUSTADO = "";', 'let LOGO_INCRUSTADO = ' + JSON.stringify(logoBase64) + ';');
        final = final.replace("const CATEGORIA_INICIAL = 'LIBRERÍA';",'const CATEGORIA_INICIAL = '+JSON.stringify(categoriaActiva)+';');
        final = final.replace("const FECHA_CATALOGO = '';",'const FECHA_CATALOGO = '+JSON.stringify(new Date().toLocaleDateString('es-AR',{day:'2-digit',month:'2-digit',year:'numeric'}))+';');
        final = final.replace('const VENDEDOR_INCRUSTADO = null;', 'const VENDEDOR_INCRUSTADO = ' + JSON.stringify(vendedor).replace(/</g, '\\u003c') + ';');
        const blob = new Blob([final], { type: 'text/html;charset=utf-8' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'catalogo_final_con_fotos.html'; a.click();
    });
