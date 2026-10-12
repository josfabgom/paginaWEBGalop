"use client";
import { useState, useEffect, useMemo } from "react";
import {
  Save,
  Upload,
  Edit,
  Trash2,
  Plus,
  X,
  FileSpreadsheet,
  Download,
  Search,
  CheckCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Flame
} from "lucide-react";
import * as XLSX from "xlsx";

export default function CatalogAdminPage() {
  const [settings, setSettings] = useState({
    vendedorNombre: "",
    vendedorRol: "",
    vendedorPhone: "",
    categoriaInicial: ""
  });
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("TODAS");
  const [showHelp, setShowHelp] = useState(true);

  // Modal state
  const [isModalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  const fetchAll = () => {
    fetch("/api/catalog")
      .then((r) => r.json())
      .then((d) => {
        if (d.settings) setSettings(d.settings);
        if (d.items) setItems(d.items);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const saveSettings = async () => {
    await fetch("/api/catalog/settings", {
      method: "POST",
      body: JSON.stringify(settings)
    });
    alert("Información de contacto guardada correctamente.");
  };

  const deleteItem = async (id: string) => {
    if (!confirm("¿Seguro que deseas eliminar este producto?")) return;
    await fetch("/api/catalog/item?id=" + id, { method: "DELETE" });
    fetchAll();
  };

  const saveItem = async (e: any) => {
    e.preventDefault();
    const payload = {
      ...editingItem,
      esOferta: Boolean(editingItem.esOferta),
      textoOferta: editingItem.esOferta ? (editingItem.textoOferta || "🔥 OFERTA") : null
    };

    const res = await fetch("/api/catalog/item", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.success) {
      setModalOpen(false);
      fetchAll();
    } else {
      alert("Error: " + data.error);
    }
  };

  // Carga masiva desde JSON
  const handleFileUpload = (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const text = evt.target?.result as string;
        const arr = JSON.parse(text);
        if (!Array.isArray(arr)) {
          alert("El archivo JSON debe contener un array [...] de productos.");
          return;
        }
        if (
          !confirm(
            `Se cargarán ${arr.length} productos desde el archivo JSON.\n¿Deseas reemplazar el catálogo actual?`
          )
        ) {
          return;
        }

        const normalized = arr.map((item: any) => {
          const isOferta = Boolean(
            item.esOferta ||
            item.oferta === true ||
            ["SI", "S", "1", "TRUE", "YES"].includes(String(item.oferta || "").toUpperCase())
          );
          return {
            ...item,
            esOferta: isOferta,
            textoOferta: item.textoOferta || (typeof item.oferta === "string" && !["SI", "S", "1", "TRUE", "NO", "0", "FALSE"].includes(item.oferta.toUpperCase()) ? item.oferta : isOferta ? "🔥 OFERTA" : null)
          };
        });

        const res = await fetch("/api/catalog/sync", {
          method: "POST",
          body: JSON.stringify({ items: normalized })
        });
        const data = await res.json();
        if (data.success) {
          alert(`¡Catálogo actualizado con éxito con ${data.count} productos!`);
          fetchAll();
        } else {
          alert("Error: " + data.error);
        }
      } catch (err: any) {
        alert("Error leyendo el archivo JSON: " + (err?.message || err));
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  // Carga masiva desde EXCEL (.xlsx, .xls, .csv)
  const handleExcelUpload = (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rawRows: any[] = XLSX.utils.sheet_to_json(ws, { defval: "" });

        if (!Array.isArray(rawRows) || rawRows.length === 0) {
          alert("El archivo Excel está vacío o no tiene filas válidas.");
          return;
        }

        // Mapeo flexible de encabezados (ignora mayúsculas, minúsculas y tildes)
        const mappedItems = rawRows
          .map((row) => {
            const getCol = (...names: string[]) => {
              for (const n of names) {
                if (
                  row[n] !== undefined &&
                  row[n] !== null &&
                  String(row[n]).trim() !== ""
                ) {
                  return String(row[n]).trim();
                }
              }
              const cleanKeys = Object.keys(row);
              for (const rk of cleanKeys) {
                const normRk = rk
                  .toLowerCase()
                  .normalize("NFD")
                  .replace(/[\u0300-\u036f]/g, "")
                  .trim();
                for (const n of names) {
                  const normN = n
                    .toLowerCase()
                    .normalize("NFD")
                    .replace(/[\u0300-\u036f]/g, "")
                    .trim();
                  if (
                    normRk === normN &&
                    row[rk] !== undefined &&
                    row[rk] !== null &&
                    String(row[rk]).trim() !== ""
                  ) {
                    return String(row[rk]).trim();
                  }
                }
              }
              return "";
            };

            const codigo = getCol("codigo", "código", "cod", "id", "sku", "articulo");
            const descripcion = getCol(
              "descripcion",
              "descripción",
              "detalle",
              "nombre",
              "producto"
            );
            const categoria =
              getCol("categoria", "categoría", "rubro", "seccion", "tipo") ||
              "LIBRERÍA";
            const precioRaw = getCol(
              "precio",
              "precio venta",
              "importe",
              "valor",
              "costo"
            );
            const precio = precioRaw
              ? precioRaw.startsWith("$")
                ? precioRaw
                : `$ ${precioRaw}`
              : "Consultar";
            const foto1 = getCol("foto1", "foto", "imagen", "foto_url", "url_foto");

            // Mapeo de la columna de oferta
            const ofertaRaw = getCol("oferta", "es_oferta", "esoferta", "promo", "promocion", "destacado", "descuento");
            const ofertaUpper = ofertaRaw.toUpperCase();
            const isTrueVal = ["SI", "S", "1", "TRUE", "VERDADERO", "YES", "Y"].includes(ofertaUpper);
            const isFalseVal = ["", "NO", "0", "FALSE", "FALSO", "N"].includes(ofertaUpper);
            const esOferta = isTrueVal || (!isFalseVal && ofertaRaw.length > 0);
            const textoOferta = isTrueVal ? "🔥 OFERTA" : (!isFalseVal && ofertaRaw.length > 0 ? ofertaRaw : null);

            return {
              codigo: codigo || Math.random().toString(36).substring(7),
              descripcion: descripcion || "Sin descripción",
              categoria: categoria.toUpperCase(),
              precio,
              foto1: foto1 || null,
              esOferta,
              textoOferta
            };
          })
          .filter((item) => item.descripcion !== "Sin descripción" || item.codigo);

        if (mappedItems.length === 0) {
          alert(
            "No se detectaron productos válidos. Asegúrate de que las columnas se llamen: codigo, descripcion, categoria, precio, oferta."
          );
          return;
        }

        const ofertasCount = mappedItems.filter((i) => i.esOferta).length;
        if (
          !confirm(
            `Se detectaron ${mappedItems.length} productos en la planilla Excel (${ofertasCount} en Oferta).\n¿Deseas reemplazar el catálogo con estos productos?`
          )
        ) {
          return;
        }

        const res = await fetch("/api/catalog/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items: mappedItems })
        });
        const data = await res.json();
        if (data.success) {
          alert(
            `¡Catálogo actualizado con éxito! Se cargaron ${data.count} productos (${ofertasCount} ofertas) desde Excel.`
          );
          fetchAll();
        } else {
          alert("Error al sincronizar catálogo: " + (data.error || "Desconocido"));
        }
      } catch (err: any) {
        alert("Error procesando el archivo Excel: " + (err?.message || err));
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = "";
  };

  // Descarga automática de la plantilla de Excel de ejemplo con columna de OFERTA
  const downloadExcelTemplate = () => {
    const templateRows = [
      {
        codigo: "10236",
        descripcion: "LECTOR DE MESA HASAR 3410",
        categoria: "TECNOLOGÍA Y COMPUTACIÓN",
        precio: "Consultar",
        oferta: "SI",
        foto1: "/assets/images/10236.jpeg"
      },
      {
        codigo: "10041",
        descripcion: "IMPRESORA TERMICA HASAR H-181",
        categoria: "TECNOLOGÍA Y COMPUTACIÓN",
        precio: "125000",
        oferta: "🔥 20% OFF",
        foto1: "/assets/images/10041.jpeg"
      },
      {
        codigo: "10333",
        descripcion: "SOBRES MANILA 2629 27X37X100 (OF)",
        categoria: "LIBRERÍA",
        precio: "Consultar",
        oferta: "NO",
        foto1: "/assets/images/10333.jpeg"
      },
      {
        codigo: "10345",
        descripcion: "TONER SP3710 - GTC",
        categoria: "TONER",
        precio: "18500",
        oferta: "NO",
        foto1: "/assets/images/10345.jpeg"
      },
      {
        codigo: "10011",
        descripcion: "ROLLOS TERMICOS 55X44 TOP",
        categoria: "ROLLOS",
        precio: "Consultar",
        oferta: "🔥 PROMO",
        foto1: "/assets/images/10011.jpeg"
      }
    ];

    const ws = XLSX.utils.json_to_sheet(templateRows);
    ws["!cols"] = [
      { wch: 14 }, // codigo
      { wch: 42 }, // descripcion
      { wch: 28 }, // categoria
      { wch: 15 }, // precio
      { wch: 15 }, // oferta
      { wch: 35 }  // foto1
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Productos");
    XLSX.writeFile(wb, "plantilla_catalogo_galop.xlsx");
  };

  const openModal = (item: any = null) => {
    setEditingItem(
      item || {
        codigo: "",
        descripcion: "",
        categoria: "LIBRERÍA",
        precio: "Consultar",
        foto1: "",
        esOferta: false,
        textoOferta: "🔥 OFERTA"
      }
    );
    setModalOpen(true);
  };

  // Filtrado de productos en la tabla
  const filteredItems = useMemo(() => {
    return items.filter((p) => {
      const matchCat =
        selectedCategory === "TODAS"
          ? true
          : selectedCategory === "OFERTAS"
          ? Boolean(p.esOferta)
          : String(p.categoria || "").toUpperCase() === selectedCategory;
      const term = searchTerm.toLowerCase().trim();
      const matchSearch =
        !term ||
        String(p.codigo || "").toLowerCase().includes(term) ||
        String(p.descripcion || "").toLowerCase().includes(term) ||
        String(p.categoria || "").toLowerCase().includes(term) ||
        (p.esOferta && "oferta".includes(term));
      return matchCat && matchSearch;
    });
  }, [items, selectedCategory, searchTerm]);

  const uniqueCategories = useMemo(() => {
    const set = new Set<string>();
    items.forEach((p) => {
      if (p.categoria) set.add(String(p.categoria).toUpperCase());
    });
    return Array.from(set);
  }, [items]);

  const totalOfertas = useMemo(() => {
    return items.filter((p) => p.esOferta).length;
  }, [items]);

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-500 font-medium animate-pulse">
        Cargando catálogo de GaLop S.R.L....
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Encabezado de la página */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Autogestión de Catálogo
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Administra los productos, precios, ofertas y datos visibles en la web pública de GaLop S.R.L.
          </p>
        </div>
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-slate-200 text-slate-800 px-4 py-2 rounded-lg hover:bg-slate-300 font-semibold text-sm flex items-center gap-2 transition"
        >
          ⬅ Volver a la página principal
        </a>
      </div>

      {/* GUÍA DE FORMATO PARA EXCEL Y JSON (Visible y explicativa) */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div
          onClick={() => setShowHelp(!showHelp)}
          className="p-5 bg-gradient-to-r from-blue-50/80 via-indigo-50/50 to-white flex items-center justify-between cursor-pointer select-none border-b border-slate-200/80 hover:bg-blue-50/90 transition"
        >
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 text-white p-2 rounded-lg shadow-sm">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                Formato para Cargar Productos (Excel o JSON)
                <span className="text-xs bg-blue-100 text-blue-700 font-semibold px-2 py-0.5 rounded-full">
                  Guía Oficial
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Haz clic aquí para {showHelp ? "ocultar" : "ver"} los nombres de columnas, ofertas y ejemplos de carga
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                downloadExcelTemplate();
              }}
              className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3.5 py-2 rounded-lg shadow-sm transition"
              title="Descargar archivo Excel listo para rellenar"
            >
              <Download className="w-3.5 h-3.5" />
              Descargar Plantilla Excel (.xlsx)
            </button>
            <div className="text-slate-400 p-1">
              {showHelp ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </div>
          </div>
        </div>

        {showHelp && (
          <div className="p-6 space-y-4 text-sm text-slate-700 bg-white">
            <p className="text-slate-600">
              Para subir tu listado de productos de forma masiva, la planilla de Excel (o archivo JSON) debe tener
              los siguientes encabezados en la <strong>fila 1</strong>:
            </p>

            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <th className="p-2.5">Columna</th>
                    <th className="p-2.5">¿Obligatorio?</th>
                    <th className="p-2.5">Descripción</th>
                    <th className="p-2.5">Ejemplo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr className="hover:bg-slate-50">
                    <td className="p-2.5 font-mono font-semibold text-blue-700">codigo</td>
                    <td className="p-2.5 font-bold text-emerald-700">Sí</td>
                    <td className="p-2.5 text-slate-600">Código único o SKU identificador del producto.</td>
                    <td className="p-2.5 font-mono text-slate-800">10236</td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="p-2.5 font-mono font-semibold text-blue-700">descripcion</td>
                    <td className="p-2.5 font-bold text-emerald-700">Sí</td>
                    <td className="p-2.5 text-slate-600">Nombre completo y especificaciones del producto.</td>
                    <td className="p-2.5 text-slate-800">LECTOR DE MESA HASAR 3410</td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="p-2.5 font-mono font-semibold text-blue-700">categoria</td>
                    <td className="p-2.5 font-bold text-emerald-700">Sí</td>
                    <td className="p-2.5 text-slate-600">
                      Rubro: <code className="bg-slate-100 px-1 py-0.5 rounded text-blue-800 font-semibold">LIBRERÍA</code>,{" "}
                      <code className="bg-slate-100 px-1 py-0.5 rounded text-blue-800 font-semibold">TECNOLOGÍA Y COMPUTACIÓN</code>,{" "}
                      <code className="bg-slate-100 px-1 py-0.5 rounded text-blue-800 font-semibold">TONER</code>, o{" "}
                      <code className="bg-slate-100 px-1 py-0.5 rounded text-blue-800 font-semibold">ROLLOS</code>.
                    </td>
                    <td className="p-2.5 font-mono text-slate-800">TECNOLOGÍA Y COMPUTACIÓN</td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="p-2.5 font-mono font-semibold text-blue-700">precio</td>
                    <td className="p-2.5 text-slate-500">Opcional</td>
                    <td className="p-2.5 text-slate-600">
                      Importe en pesos (ej: <code>1500</code> o <code>$ 1.500</code>). Si se deja en blanco, figurará como{" "}
                      <em>&quot;Consultar&quot;</em>.
                    </td>
                    <td className="p-2.5 font-mono text-slate-800">$ 1.500 o Consultar</td>
                  </tr>
                  <tr className="hover:bg-amber-50/50 bg-amber-50/20">
                    <td className="p-2.5 font-mono font-bold text-amber-800 flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5 text-amber-600" /> oferta
                    </td>
                    <td className="p-2.5 text-slate-500">Opcional</td>
                    <td className="p-2.5 text-slate-600">
                      Pon <code className="bg-amber-100 text-amber-900 font-bold px-1 rounded">SI</code> para activar la cinta de oferta, o escribe un texto como <code className="bg-amber-100 text-amber-900 font-bold px-1 rounded">20% OFF</code> o <code className="bg-amber-100 text-amber-900 font-bold px-1 rounded">PROMO</code>. Pon <code>NO</code> o déjalo vacío para producto normal.
                    </td>
                    <td className="p-2.5 font-mono text-amber-800 font-bold">SI  /  20% OFF  /  NO</td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="p-2.5 font-mono font-semibold text-blue-700">foto1</td>
                    <td className="p-2.5 text-slate-500">Opcional</td>
                    <td className="p-2.5 text-slate-600">
                      Ruta local a la imagen o URL directa web (ej: <code>/assets/images/10236.jpeg</code>).
                    </td>
                    <td className="p-2.5 font-mono text-slate-800">/assets/images/10236.jpeg</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800 flex items-start gap-2">
              <span className="text-base">💡</span>
              <div>
                <strong>Consejo:</strong> Te recomendamos presionar el botón <strong>&quot;Descargar Plantilla Excel (.xlsx)&quot;</strong> arriba a la derecha. Ya viene con la columna de oferta y ejemplos reales cargados para que solo tengas que reemplazar las filas con tus productos.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Información de Contacto del Vendedor */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h2 className="text-lg font-bold mb-4 text-slate-900 flex items-center gap-2">
          <span>👤</span> Información de Contacto (Vendedor Asignado)
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre del Vendedor</label>
            <input
              type="text"
              className="w-full border border-slate-300 rounded-lg p-2.5 text-slate-900 bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              value={settings.vendedorNombre}
              onChange={(e) => setSettings({ ...settings, vendedorNombre: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">WhatsApp (con código de país, ej: 5493765224717)</label>
            <input
              type="text"
              className="w-full border border-slate-300 rounded-lg p-2.5 text-slate-900 bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              value={settings.vendedorPhone}
              onChange={(e) => setSettings({ ...settings, vendedorPhone: e.target.value })}
            />
          </div>
        </div>
        <button
          onClick={saveSettings}
          className="mt-4 bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 font-semibold text-sm inline-flex items-center gap-2 shadow-sm transition"
        >
          <Save className="w-4 h-4" /> Guardar Contacto
        </button>
      </div>

      {/* Tabla y Gestión de Productos */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-4">
        {/* Barra de herramientas superior */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-slate-900">
                Listado de Productos ({items.length})
              </h2>
              {totalOfertas > 0 && (
                <span className="bg-amber-100 text-amber-800 border border-amber-300 text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                  <Flame className="w-3.5 h-3.5 text-amber-600" /> {totalOfertas} en Oferta
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Agrega productos individualmente o sube tu catálogo completo en Excel o JSON.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            {/* Botón Nuevo Producto */}
            <button
              onClick={() => openModal()}
              className="bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-emerald-700 font-semibold text-xs sm:text-sm shadow-sm transition"
            >
              <Plus className="w-4 h-4" /> Nuevo Producto
            </button>

            {/* Botón Subir EXCEL */}
            <label className="bg-emerald-800 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-emerald-900 cursor-pointer font-semibold text-xs sm:text-sm shadow-sm transition">
              <FileSpreadsheet className="w-4 h-4 text-emerald-300" /> Subir Excel (.xlsx / .csv)
              <input
                type="file"
                accept=".xlsx, .xls, .csv"
                className="hidden"
                onChange={handleExcelUpload}
              />
            </label>

            {/* Botón Subir JSON */}
            <label className="bg-slate-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-slate-800 cursor-pointer font-semibold text-xs sm:text-sm shadow-sm transition">
              <Upload className="w-4 h-4" /> Subir JSON
              <input type="file" accept=".json" className="hidden" onChange={handleFileUpload} />
            </label>
          </div>
        </div>

        {/* Buscador y Filtro por Categoría */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por código, descripción, categoría o 'oferta'..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 bg-white focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="sm:w-72">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full py-2 px-3 border border-slate-300 rounded-lg text-sm text-slate-900 bg-white focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="TODAS">Todas las categorías ({items.length})</option>
              {totalOfertas > 0 && (
                <option value="OFERTAS" className="font-bold text-amber-700">
                  🔥 Solo Ofertas y Destacados ({totalOfertas})
                </option>
              )}
              {uniqueCategories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tabla de Productos */}
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-semibold">
                <th className="p-3 w-16">Foto</th>
                <th className="p-3 w-24">Cód.</th>
                <th className="p-3">Descripción</th>
                <th className="p-3 w-36">Categoría</th>
                <th className="p-3 w-28">Precio</th>
                <th className="p-3 w-28 text-center">Estado</th>
                <th className="p-3 w-24 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    No se encontraron productos que coincidan con la búsqueda.
                  </td>
                </tr>
              ) : (
                filteredItems.slice(0, 100).map((item) => (
                  <tr key={item.id || item.codigo} className={`hover:bg-slate-50/80 transition ${item.esOferta ? "bg-amber-50/30" : ""}`}>
                    <td className="p-2.5">
                      {item.foto1 ? (
                        <div className="relative w-10 h-10">
                          <img
                            src={item.foto1}
                            alt={item.descripcion}
                            className="w-10 h-10 object-cover rounded-md border border-slate-200 shadow-sm"
                          />
                          {item.esOferta && (
                            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-600 text-[9px] text-white font-bold" title="En Oferta">
                              🔥
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="w-10 h-10 bg-slate-100 rounded-md flex items-center justify-center text-xs text-slate-400 border border-slate-200">
                          📦
                        </div>
                      )}
                    </td>
                    <td className="p-2.5 font-mono text-xs font-semibold text-slate-800">
                      {item.codigo}
                    </td>
                    <td className="p-2.5 font-medium text-slate-900 max-w-md">
                      <div className="flex items-center flex-wrap gap-1.5">
                        <span>{item.descripcion}</span>
                        {item.esOferta && (
                          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-gradient-to-r from-red-600 to-amber-600 text-white shadow-sm">
                            <Flame className="w-2.5 h-2.5" />
                            {item.textoOferta || "OFERTA"}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-2.5">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                        {item.categoria}
                      </span>
                    </td>
                    <td className="p-2.5 font-semibold text-emerald-800">
                      {item.precio || "Consultar"}
                    </td>
                    <td className="p-2.5 text-center">
                      {item.esOferta ? (
                        <span className="inline-block text-[11px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md border border-amber-300">
                          🔥 Oferta
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">Regular</span>
                      )}
                    </td>
                    <td className="p-2.5 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openModal(item)}
                          className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition"
                          title="Editar producto"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteItem(item.id)}
                          className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-md transition"
                          title="Eliminar producto"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {filteredItems.length > 100 && (
          <div className="text-xs text-slate-500 pt-1 text-center">
            Mostrando los primeros 100 productos de {filteredItems.length}. Usa el buscador para filtrar rápidamente.
          </div>
        )}
      </div>

      {/* Modal para Crear o Editar Producto */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto border border-slate-200">
            <div className="flex justify-between items-center mb-5 border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">
                {editingItem.id ? "Editar Producto" : "Nuevo Producto"}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={saveItem} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Código *
                </label>
                <input
                  required
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-slate-900 bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm font-mono"
                  placeholder="Ej: 10236"
                  value={editingItem.codigo}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, codigo: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Descripción *
                </label>
                <input
                  required
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-slate-900 bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  placeholder="Ej: LECTOR DE MESA HASAR 3410"
                  value={editingItem.descripcion}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, descripcion: e.target.value })
                  }
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Categoría *
                  </label>
                  <select
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-slate-900 bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    value={editingItem.categoria}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, categoria: e.target.value })
                    }
                  >
                    <option value="LIBRERÍA">LIBRERÍA</option>
                    <option value="TECNOLOGÍA Y COMPUTACIÓN">TECNOLOGÍA Y COMPUTACIÓN</option>
                    <option value="TONER">TONER</option>
                    <option value="ROLLOS">ROLLOS</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Precio (Opcional)
                  </label>
                  <input
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-slate-900 bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    placeholder="Ej: $ 1.500 o Consultar"
                    value={editingItem.precio || ""}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, precio: e.target.value })
                    }
                  />
                </div>
              </div>

              {/* SECCIÓN DE OFERTA / DESTACADO */}
              <div className="p-3.5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl space-y-2">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={Boolean(editingItem.esOferta)}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        esOferta: e.target.checked,
                        textoOferta: editingItem.textoOferta || "🔥 OFERTA"
                      })
                    }
                    className="w-4 h-4 text-amber-600 rounded border-slate-300 focus:ring-amber-500"
                  />
                  <span className="text-xs sm:text-sm font-bold text-amber-900 flex items-center gap-1.5">
                    <Flame className="w-4 h-4 text-red-600" />
                    Marcar como Producto en Oferta / Destacado
                  </span>
                </label>

                {editingItem.esOferta && (
                  <div className="pt-1.5 pl-6">
                    <label className="block text-[11px] font-semibold text-amber-900 mb-1">
                      Texto de la cinta o insignia de oferta:
                    </label>
                    <input
                      type="text"
                      className="w-full border border-amber-300 rounded-lg p-2 text-slate-900 bg-white text-xs font-bold focus:ring-2 focus:ring-amber-500 outline-none"
                      placeholder="Ej: 🔥 OFERTA, 20% OFF, PROMO, etc."
                      value={editingItem.textoOferta || "🔥 OFERTA"}
                      onChange={(e) =>
                        setEditingItem({ ...editingItem, textoOferta: e.target.value })
                      }
                    />
                    <p className="text-[11px] text-amber-700 mt-1">
                      Este texto aparecerá en una cinta flotante llamativa sobre la foto del producto.
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Foto del Producto (Ruta, URL o Archivo)
                </label>
                <div className="space-y-2">
                  <input
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-slate-900 bg-white text-xs font-mono"
                    placeholder="/assets/images/10236.jpeg"
                    value={editingItem.foto1 || ""}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, foto1: e.target.value })
                    }
                  />
                  <div className="flex items-center gap-2">
                    <label className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg cursor-pointer border border-slate-300 inline-flex items-center gap-1.5 transition">
                      <Upload className="w-3.5 h-3.5" /> Subir foto desde la PC
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (evt) => {
                              setEditingItem({
                                ...editingItem,
                                foto1: evt.target?.result as string
                              });
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                    {editingItem.foto1 && (
                      <button
                        type="button"
                        onClick={() => setEditingItem({ ...editingItem, foto1: "" })}
                        className="text-xs text-rose-600 hover:text-rose-800 font-semibold"
                      >
                        Quitar foto
                      </button>
                    )}
                  </div>
                </div>

                {editingItem.foto1 ? (
                  <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col items-center">
                    <span className="text-xs font-medium text-slate-500 mb-2">
                      Vista previa de la imagen:
                    </span>
                    <div className="relative max-h-40 flex items-center justify-center bg-white border border-slate-200 rounded-lg p-1 shadow-sm">
                      <img
                        src={editingItem.foto1}
                        alt="Vista previa"
                        className="max-h-36 max-w-full object-contain rounded"
                      />
                      {editingItem.esOferta && (
                        <div className="absolute top-2 left-2 bg-gradient-to-r from-red-600 to-amber-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded shadow">
                          {editingItem.textoOferta || "🔥 OFERTA"}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 p-3 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center text-xs text-slate-400">
                    Sin imagen seleccionada
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 text-sm font-semibold transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-semibold shadow-sm transition"
                >
                  Guardar Producto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
