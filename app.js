
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
    const CATEGORIA_INICIAL = "TODOS";
    const FECHA_CATALOGO = "10/10/2026";
    let storageKey = '';
    function prepararGuardado() {
        if (!productosGlobales.length) return;
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
        if(categoria==='OFERTAS') return Boolean(producto.esOferta);
        const cat=normalizarCategoria(producto.categoria);
        const elegido=normalizarCategoria(categoria);
        return cat===elegido || cat.startsWith(elegido+' ') || cat.startsWith(elegido+' -') || cat.startsWith(elegido+':');
    }
    function dibujarCategorias() {
        const panel=document.getElementById('categories-panel');
        const botones=document.getElementById('category-buttons');
        botones.replaceChildren();panel.style.display='block';
        const listaCats = [...CATEGORIAS];
        if (productosGlobales.some(p => p.esOferta)) {
            listaCats.splice(1, 0, {id:'OFERTAS', icono:'🔥'});
        }
        listaCats.forEach(c=>{
            const b=document.createElement('button');b.type='button';b.className='category-btn'+(categoriaActiva===c.id?' active':'')+(c.id==='OFERTAS'?' cat-oferta':'');
            b.textContent=c.icono+' '+c.id;b.setAttribute('aria-pressed',String(categoriaActiva===c.id));
            b.addEventListener('click',()=>{categoriaActiva=c.id;dibujarCategorias();filtrarProductos();});botones.appendChild(b);
        });
    }
    function filtrarProductos() {
        const q=document.getElementById('search').value.trim().toLocaleLowerCase('es');
        const filtrados=productosGlobales.filter(p=>coincideCategoria(p,categoriaActiva) && (!q || [p.descripcion,p.codigo,p.categoria,p.esOferta?'oferta':''].some(v=>String(v).toLocaleLowerCase('es').includes(q))));
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
                actualizarBotonFlotante();
            }
        });


      let toastTimeout = null;
      function mostrarToast(mensaje) {
          const toast = document.getElementById('cart-toast');
          if (!toast) return;
          toast.innerHTML = mensaje + ' <button onclick="abrirResumen()">Ver 🛒</button>';
          toast.classList.add('show');
          clearTimeout(toastTimeout);
          toastTimeout = setTimeout(() => toast.classList.remove('show'), 3500);
      }

      function crearCardProducto(p) {
        const esOferta = Boolean(p.esOferta);
        const textoOferta = p.textoOferta || '🔥 OFERTA';
        const card = document.createElement('div');
        card.className = 'card' + (esOferta ? ' is-oferta' : '');
        const fotos = [mapaImagenes[String(p.codigo).toLowerCase()], mapaImagenes[String(p.codigo).toLowerCase()+'_2']].filter(Boolean);
        const src = fotos[0] || ""; 
        const cant = carrito[p.codigo] || 0;
        const precioDisplay = p.precio && p.precio !== 'Consultar' ? (p.precio.startsWith('$') ? p.precio : '$' + p.precio) : 'Consultar';

        let controlsHtml = '';
        if (cant > 0) {
            controlsHtml = `<div class='cart-controls active' id='ctrl-${p.codigo}'><button class='btn-qty' onclick="cambiarCantidad('${p.codigo}', -1)" title="Restar 1">−</button><div class='qty-display'><span class='qty-val' id='qty-${p.codigo}'>${cant}</span><span class='qty-label'>en cotización</span></div><button class='btn-qty' onclick="cambiarCantidad('${p.codigo}', 1)" title="Sumar 1">+</button></div>`;
        } else {
            controlsHtml = `<button class='btn-add-to-quote' id='btn-add-${p.codigo}' onclick="cambiarCantidad('${p.codigo}', 1)">🛒 Agregar a cotización</button>`;
        }

        const badgeHtml = esOferta ? `<div class='badge-oferta'><span>${textoOferta}</span></div>` : '';

        card.innerHTML = `<div class='img-container'>${badgeHtml}<img src='${src}' style='${src ? "" : "display:none;"}' alt='${p.descripcion}'><div style='${src ? "display:none;" : "display:block;"} color:#94a3b8; font-weight:bold; font-size:14px;'>📦 Sin Foto</div></div><div class='card-body'><h3>${p.descripcion}</h3><div class='card-meta-row'><span class='code'>Cód: ${p.codigo}</span><span class='price ${esOferta ? "price-oferta" : ""}'>${precioDisplay}</span></div><div class='cart-action-box box-${p.codigo}' id='box-${p.codigo}'>${controlsHtml}</div></div>`;
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
        return card;
      }

      function dibujarProductos(prods) {
        const container = document.getElementById('catalog-sections'); container.innerHTML = '';
        if(!prods.length) {const aviso=document.createElement('div');aviso.className='category-empty';aviso.textContent='No hay productos en esta categoría todavía. Probá otra sección o el botón TODOS.';container.appendChild(aviso);return;}

        const searchQuery = document.getElementById('search').value.trim();

        // Si estamos en TODOS y sin búsqueda, mostrar sección destacada arriba con las ofertas
        if (categoriaActiva === 'TODOS' && !searchQuery) {
            const ofertas = prods.filter(p => p.esOferta);
            if (ofertas.length > 0) {
                const seccionOfertas = document.createElement('div');
                seccionOfertas.innerHTML = '<div class="categoria-titulo titulo-ofertas">🔥 OFERTAS DESTACADAS</div>';
                const gridOfertas = document.createElement('div');
                gridOfertas.className = 'grid';
                ofertas.forEach(p => {
                    gridOfertas.appendChild(crearCardProducto(p));
                });
                seccionOfertas.appendChild(gridOfertas);
                container.appendChild(seccionOfertas);
            }
        }

        // Si el usuario seleccionó la categoría OFERTAS
        if (categoriaActiva === 'OFERTAS') {
            const seccion = document.createElement('div');
            seccion.innerHTML = '<div class="categoria-titulo titulo-ofertas">🔥 PRODUCTOS EN OFERTA</div>';
            const grid = document.createElement('div');
            grid.className = 'grid';
            prods.forEach(p => {
                grid.appendChild(crearCardProducto(p));
            });
            seccion.appendChild(grid);
            container.appendChild(seccion);
            return;
        }

        const grupos = {}; 
        prods.forEach(p => { 
            if (!grupos[p.categoria]) grupos[p.categoria] = []; 
            grupos[p.categoria].push(p); 
        });

        for (const cat in grupos) {
            const seccion = document.createElement('div'); 
            seccion.innerHTML = '<div class="categoria-titulo">' + cat + '</div>';
            const grid = document.createElement('div'); 
            grid.className = 'grid';
            // Ordenar para mostrar las ofertas primero dentro de cada categoría
            grupos[cat].sort((a,b) => (b.esOferta ? 1 : 0) - (a.esOferta ? 1 : 0));
            grupos[cat].forEach(p => {
                grid.appendChild(crearCardProducto(p));
            });
            seccion.appendChild(grid); 
            container.appendChild(seccion);
        }
      }

    function abrirFoto(src,nombre){document.getElementById('photo-large').src=src;document.getElementById('photo-caption').textContent=nombre;document.getElementById('photo-overlay').classList.add('open');}
    function cerrarFoto(){document.getElementById('photo-overlay').classList.remove('open');document.getElementById('photo-large').removeAttribute('src');}
    document.getElementById('photo-close').addEventListener('click',cerrarFoto);
    document.getElementById('photo-overlay').addEventListener('click',e=>{if(e.target.id==='photo-overlay')cerrarFoto();});
    document.addEventListener('keydown',e=>{if(e.key==='Escape')cerrarFoto();});

    window.cambiarCantidad = function(codigo, cambio) {
        const codStr = String(codigo).trim();
        const p = productosGlobales.find(item => String(item.codigo).trim() === codStr);
        let actual = carrito[codStr] || 0;
        let nuevo = actual + cambio;
        if (nuevo < 0) nuevo = 0;
        
        if (nuevo === 0) {
            delete carrito[codStr];
        } else {
            carrito[codStr] = nuevo;
            if (cambio > 0 && p) {
                mostrarToast('✅ Agregado: ' + p.descripcion);
            }
        }
        
        guardarSeleccion();
        actualizarBotonFlotante();
        actualizarCardControles(codStr);
    };

    function actualizarCardControles(codigo) {
        const boxes = document.querySelectorAll('.box-' + codigo);
        if (!boxes.length) return;
        const cant = carrito[codigo] || 0;
        let controlsHtml = '';
        if (cant > 0) {
            controlsHtml = `<div class='cart-controls active' id='ctrl-${codigo}'><button class='btn-qty' onclick="cambiarCantidad('${codigo}', -1)" title="Restar 1">−</button><div class='qty-display'><span class='qty-val' id='qty-${codigo}'>${cant}</span><span class='qty-label'>en cotización</span></div><button class='btn-qty' onclick="cambiarCantidad('${codigo}', 1)" title="Sumar 1">+</button></div>`;
        } else {
            controlsHtml = `<button class='btn-add-to-quote' id='btn-add-${codigo}' onclick="cambiarCantidad('${codigo}', 1)">🛒 Agregar a cotización</button>`;
        }
        boxes.forEach(b => {
            b.innerHTML = controlsHtml;
        });
    }

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
        const cliente = document.getElementById('cart-client-name')?.value.trim() || '';
        const nota = document.getElementById('cart-client-note')?.value.trim() || '';

        let mensaje = '📋 *SOLICITUD DE COTIZACIÓN - GaLop S.R.L.*\n';
        if (vendedor && vendedor.nombre) mensaje += '👤 *Atención:* ' + vendedor.nombre + '\n';
        if (cliente) mensaje += '🏢 *Cliente / Empresa:* ' + cliente + '\n';
        if (nota) mensaje += '📝 *Nota:* ' + nota + '\n';
        mensaje += '📅 *Fecha:* ' + new Date().toLocaleDateString('es-AR') + '\n\n';
        mensaje += '*DETALLE DE PRODUCTOS:* \n';

        let i = 1;
        let totalItems = 0;
        productosGlobales.forEach(p => {
            const cant = carrito[p.codigo];
            if (cant) {
                totalItems += cant;
                const precioTxt = p.precio && p.precio !== 'Consultar' ? (p.precio.startsWith('$') ? p.precio : '$' + p.precio) : 'Consultar';
                mensaje += i + ') *' + p.descripcion + '*\n';
                mensaje += '   • Código: ' + p.codigo + '\n';
                mensaje += '   • Cantidad: ' + cant + ' unidad(es)\n';
                if (precioTxt !== 'Consultar') mensaje += '   • Precio ref: ' + precioTxt + '\n';
                mensaje += '\n';
                i++;
            }
        });

        mensaje += '📊 *Total solicitado:* ' + (i - 1) + ' producto(s) · ' + totalItems + ' unidades\n\n';
        mensaje += '¿Podrían informarme cotización formal, disponibilidad y formas de pago y entrega? ¡Muchas gracias!';
        return mensaje;
    }

    function abrirResumen() {
        document.getElementById('cart-overlay').classList.add('open');
        dibujarResumen();
        const dialog = document.querySelector('.cart-dialog');
        if (dialog) dialog.focus();
    }

    function cerrarResumen() {
        document.getElementById('cart-overlay').classList.remove('open');
    }

    function cambiarCantidadResumen(codigo, delta) {
        const nueva = Math.max(0, (carrito[codigo] || 0) + delta);
        if (nueva === 0) delete carrito[codigo]; else carrito[codigo] = nueva;
        guardarSeleccion();
        actualizarBotonFlotante();
        actualizarCardControles(codigo);
        dibujarResumen();
    }

    function dibujarResumen() {
        const lista = document.getElementById('cart-items');
        lista.replaceChildren();
        let unidades = 0, articulos = 0, totalEstimado = 0, tienePrecios = false;

        productosGlobales.forEach(p => {
            const cantidad = carrito[p.codigo] || 0;
            if (!cantidad) return;
            unidades += cantidad;
            articulos++;

            const precioNum = parseFloat(String(p.precio || '').replace(/[^0-9.]/g, ''));
            let subtotalTexto = 'A cotizar';
            if (!isNaN(precioNum) && precioNum > 0) {
                tienePrecios = true;
                const sub = precioNum * cantidad;
                totalEstimado += sub;
                subtotalTexto = '$' + sub.toLocaleString('es-AR');
            }

            const fotos = [mapaImagenes[String(p.codigo).toLowerCase()], mapaImagenes[String(p.codigo).toLowerCase() + '_2']].filter(Boolean);
            const fotoUrl = fotos[0] || '';

            const fila = document.createElement('div');
            fila.className = 'cart-item';

            const imgDiv = document.createElement('div');
            imgDiv.className = 'cart-item-img';
            if (fotoUrl) {
                imgDiv.innerHTML = `<img src="${fotoUrl}" alt="${p.descripcion}">`;
            } else {
                imgDiv.innerHTML = `<span style="font-size:20px;">📦</span>`;
            }

            const info = document.createElement('div');
            info.className = 'cart-item-info';
            const nombre = document.createElement('div');
            nombre.className = 'cart-item-name';
            nombre.textContent = p.descripcion;
            const meta = document.createElement('div');
            meta.className = 'cart-item-meta';
            meta.innerHTML = `<span class="cart-item-code">Cód: ${p.codigo}</span> <span class="cart-item-price">${subtotalTexto !== 'A cotizar' ? 'Subtotal: ' + subtotalTexto : 'Precio a cotizar'}</span>`;
            info.append(nombre, meta);

            const controles = document.createElement('div');
            controles.className = 'cart-item-controls';
            const menos = document.createElement('button');
            menos.type = 'button';
            menos.textContent = '−';
            menos.setAttribute('aria-label', 'Quitar una unidad');
            menos.onclick = () => cambiarCantidadResumen(p.codigo, -1);
            const numero = document.createElement('span');
            numero.className = 'cart-qty-badge';
            numero.textContent = cantidad;
            const mas = document.createElement('button');
            mas.type = 'button';
            mas.textContent = '+';
            mas.setAttribute('aria-label', 'Agregar una unidad');
            mas.onclick = () => cambiarCantidadResumen(p.codigo, 1);
            const quitar = document.createElement('button');
            quitar.type = 'button';
            quitar.textContent = '🗑️';
            quitar.className = 'remove';
            quitar.title = 'Eliminar de cotización';
            quitar.onclick = () => cambiarCantidadResumen(p.codigo, -(carrito[p.codigo] || 0));

            controles.append(menos, numero, mas, quitar);
            fila.append(imgDiv, info, controles);
            lista.appendChild(fila);
        });

        let totalHtml = `<span>${articulos} producto(s) · ${unidades} unidad(es)</span>`;
        if (tienePrecios && totalEstimado > 0) {
            totalHtml += `<span style="color:#166534;font-size:15px;font-weight:800;">Total est: $${totalEstimado.toLocaleString('es-AR')}</span>`;
        }
        document.getElementById('cart-total').innerHTML = totalHtml;
        document.getElementById('cart-send').disabled = !unidades;
        document.getElementById('cart-clear').disabled = !unidades;

        if (!unidades) {
            const aviso = document.createElement('div');
            aviso.style.padding = '30px 15px';
            aviso.style.textAlign = 'center';
            aviso.style.color = '#64748b';
            aviso.innerHTML = '🛒 <strong>Tu cotización está vacía</strong><br><span style="font-size:13px;">Explorá el catálogo y agregá artículos con el botón "Agregar a cotización".</span>';
            lista.appendChild(aviso);
        }
    }

    document.getElementById('cart-clear')?.addEventListener('click', () => {
        if (!Object.keys(carrito).length) return;
        if (!confirm('¿Querés vaciar todos los productos de tu cotización?')) return;
        const codigos = Object.keys(carrito);
        carrito = {};
        guardarSeleccion();
        codigos.forEach(c => actualizarCardControles(c));
        actualizarBotonFlotante();
        dibujarResumen();
    });

    document.getElementById('cart-close')?.addEventListener('click', cerrarResumen);
    document.getElementById('cart-back')?.addEventListener('click', cerrarResumen);
    document.getElementById('cart-overlay')?.addEventListener('click', e => { if (e.target.id === 'cart-overlay') cerrarResumen(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') cerrarResumen(); });

    document.getElementById('cart-send')?.addEventListener('click', () => {
        if (!Object.keys(carrito).length) return;
        abrirWhatsApp(crearMensajePedido());
    });

    document.getElementById('cart-copy')?.addEventListener('click', () => {
        if (!Object.keys(carrito).length) return;
        const texto = crearMensajePedido();
        navigator.clipboard.writeText(texto).then(() => {
            mostrarToast('📋 ¡Resumen copiado al portapapeles!');
        }).catch(() => {
            alert('Texto de cotización:\n\n' + texto);
        });
    });

    document.getElementById('nav-cart-btn')?.addEventListener('click', abrirResumen);

    function actualizarBotonFlotante() {
        const total = Object.values(carrito).reduce((sum, cant) => sum + cant, 0);

        const navBadge = document.getElementById('nav-cart-badge');
        if (navBadge) navBadge.textContent = total;

        let boton = document.getElementById('wa-pedido');
        if (!boton) {
            boton = document.createElement('button');
            boton.type = 'button';
            boton.id = 'wa-pedido';
            boton.className = 'whatsapp-float';
            document.body.appendChild(boton);
        }

        if (total > 0 && vendedor) {
            boton.style.display = 'flex';
            boton.innerHTML = `<span>🛒 Cotizar pedido (${total})</span> <span style="font-size:18px;">💬</span>`;
            boton.onclick = abrirResumen;
            boton.classList.remove('pulse');
            void boton.offsetWidth;
            boton.classList.add('pulse');
        } else {
            boton.style.display = 'none';
        }
    }

    document.getElementById('search').addEventListener('input', function(e) {
        filtrarProductos();
    });

    window.abrirResumen = abrirResumen;
    window.cerrarResumen = cerrarResumen;
