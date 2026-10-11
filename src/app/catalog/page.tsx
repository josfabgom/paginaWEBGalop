"use client";
import { useState, useEffect } from "react";
import { Save, Upload, Edit, Trash2, Plus, X } from "lucide-react";

export default function CatalogAdminPage() {
  const [settings, setSettings] = useState({
    vendedorNombre: "", vendedorRol: "", vendedorPhone: "", categoriaInicial: ""
  });
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [isModalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  const fetchAll = () => {
    fetch("/api/catalog").then(r => r.json()).then(d => {
        if (d.settings) setSettings(d.settings);
        if (d.items) setItems(d.items);
        setLoading(false);
    });
  };

  useEffect(() => { fetchAll(); }, []);

  const saveSettings = async () => {
    await fetch("/api/catalog/settings", { method: "POST", body: JSON.stringify(settings) });
    alert("Configuración guardada");
  };

  const deleteItem = async (id: string) => {
      if(!confirm("¿Seguro que deseas eliminar este producto?")) return;
      await fetch("/api/catalog/item?id=" + id, { method: "DELETE" });
      fetchAll();
  };

  const saveItem = async (e: any) => {
      e.preventDefault();
      const res = await fetch("/api/catalog/item", {
          method: "POST",
          body: JSON.stringify(editingItem)
      });
      const data = await res.json();
      if(data.success) {
          setModalOpen(false);
          fetchAll();
      } else {
          alert("Error: " + data.error);
      }
  };

  // Carga masiva (JSON)
  const handleFileUpload = (e: any) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const text = evt.target?.result as string;
        const arr = JSON.parse(text);
        const res = await fetch("/api/catalog/sync", { method: "POST", body: JSON.stringify({ items: arr }) });
        const data = await res.json();
        if(data.success) { alert("Catálogo actualizado."); fetchAll(); }
      } catch (err) { alert("Error leyendo el archivo."); }
    };
    reader.readAsText(file);
  };

  const openModal = (item: any = null) => {
      setEditingItem(item || { codigo: "", descripcion: "", categoria: "LIBRERÍA", precio: "Consultar", foto1: "" });
      setModalOpen(true);
  };

  if (loading) return <div className="p-8">Cargando...</div>;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Autogestión de Catálogo</h1>
        <a href="/" className="bg-slate-200 text-slate-800 px-4 py-2 rounded-md hover:bg-slate-300 font-medium text-sm flex items-center gap-2">
            ⬅ Volver a la página principal
        </a>
      </div>

      <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
        <h2 className="text-lg font-semibold mb-4 text-gray-900">Información de Contacto</h2>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm text-gray-700">Vendedor</label><input type="text" className="w-full border border-gray-300 rounded p-2 text-gray-900 bg-white" value={settings.vendedorNombre} onChange={e => setSettings({...settings, vendedorNombre: e.target.value})} /></div>
          <div><label className="block text-sm text-gray-700">WhatsApp</label><input type="text" className="w-full border border-gray-300 rounded p-2 text-gray-900 bg-white" value={settings.vendedorPhone} onChange={e => setSettings({...settings, vendedorPhone: e.target.value})} /></div>
        </div>
        <button onClick={saveSettings} className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-medium">Guardar Contacto</button>
      </div>

      <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Productos ({items.length})</h2>
            <div className="flex gap-2">
                <button onClick={() => openModal()} className="bg-green-600 text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-green-700 font-medium">
                    <Plus className="w-4 h-4"/> Nuevo Producto
                </button>
                <label className="bg-slate-700 text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-slate-800 cursor-pointer font-medium">
                    <Upload className="w-4 h-4" /> Subir JSON
                    <input type="file" accept=".json" className="hidden" onChange={handleFileUpload} />
                </label>
            </div>
        </div>

        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-slate-100 border-b border-gray-200">
                        <th className="p-2 w-16">Foto</th>
                        <th className="p-2 text-gray-700 font-semibold">Cód.</th>
                        <th className="p-2 text-gray-700 font-semibold">Descripción</th>
                        <th className="p-2 text-gray-700 font-semibold">Categoría</th>
                        <th className="p-2 text-gray-700 font-semibold">Precio</th>
                        <th className="p-2 w-20 text-gray-700 font-semibold">Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {items.slice(0, 50).map(item => (
                        <tr key={item.id} className="border-b border-gray-100 hover:bg-slate-50">
                            <td className="p-2">
                                {item.foto1 ? <img src={item.foto1} className="w-10 h-10 object-cover rounded" /> : <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500">N/A</div>}
                            </td>
                            <td className="p-2 text-gray-900">{item.codigo}</td>
                            <td className="p-2 truncate max-w-xs text-gray-900">{item.descripcion}</td>
                            <td className="p-2 text-gray-900">{item.categoria}</td>
                            <td className="p-2 text-gray-900">{item.precio}</td>
                            <td className="p-2 flex gap-2">
                                <button onClick={() => openModal(item)} className="text-blue-600 hover:text-blue-800"><Edit className="w-4 h-4"/></button>
                                <button onClick={() => deleteItem(item.id)} className="text-red-600 hover:text-red-800"><Trash2 className="w-4 h-4"/></button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {items.length > 50 && <div className="text-sm text-slate-500 mt-2">Mostrando los primeros 50 productos.</div>}
        </div>
      </div>

      {isModalOpen && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
              <div className="bg-white p-6 rounded-xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-between items-center mb-4 border-b pb-2">
                      <h3 className="text-lg font-bold text-gray-900">{editingItem.id ? 'Editar Producto' : 'Nuevo Producto'}</h3>
                      <button onClick={() => setModalOpen(false)}><X className="w-5 h-5 text-gray-500 hover:text-gray-800"/></button>
                  </div>
                  <form onSubmit={saveItem} className="space-y-4">
                      <div><label className="block text-sm text-gray-700 font-medium mb-1">Código</label><input required className="w-full border border-gray-300 rounded p-2 text-gray-900 bg-white" value={editingItem.codigo} onChange={e => setEditingItem({...editingItem, codigo: e.target.value})} /></div>
                      <div><label className="block text-sm text-gray-700 font-medium mb-1">Descripción</label><input required className="w-full border border-gray-300 rounded p-2 text-gray-900 bg-white" value={editingItem.descripcion} onChange={e => setEditingItem({...editingItem, descripcion: e.target.value})} /></div>
                      <div><label className="block text-sm text-gray-700 font-medium mb-1">Categoría</label><input required className="w-full border border-gray-300 rounded p-2 text-gray-900 bg-white" value={editingItem.categoria} onChange={e => setEditingItem({...editingItem, categoria: e.target.value})} /></div>
                      <div><label className="block text-sm text-gray-700 font-medium mb-1">Precio</label><input className="w-full border border-gray-300 rounded p-2 text-gray-900 bg-white" value={editingItem.precio} onChange={e => setEditingItem({...editingItem, precio: e.target.value})} /></div>
                      
                      <div>
                          <label className="block text-sm text-gray-700 font-medium mb-1">Foto del Producto</label>
                          <div className="space-y-2">
                              <input 
                                  className="w-full border border-gray-300 rounded p-2 text-gray-900 bg-white text-sm" 
                                  placeholder="/assets/images/10011.jpeg" 
                                  value={editingItem.foto1 || ''} 
                                  onChange={e => setEditingItem({...editingItem, foto1: e.target.value})} 
                              />
                              <div className="flex items-center gap-2">
                                  <label className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded cursor-pointer border border-slate-300 inline-flex items-center gap-1.5">
                                      <Upload className="w-3.5 h-3.5" /> Subir desde PC
                                      <input 
                                          type="file" 
                                          accept="image/*" 
                                          className="hidden" 
                                          onChange={(e) => {
                                              const file = e.target.files?.[0];
                                              if (file) {
                                                  const reader = new FileReader();
                                                  reader.onload = (evt) => {
                                                      setEditingItem({...editingItem, foto1: evt.target?.result as string});
                                                  };
                                                  reader.readAsDataURL(file);
                                              }
                                          }} 
                                      />
                                  </label>
                                  {editingItem.foto1 && (
                                      <button 
                                          type="button" 
                                          onClick={() => setEditingItem({...editingItem, foto1: ''})}
                                          className="text-xs text-red-600 hover:text-red-800"
                                      >
                                          Quitar foto
                                      </button>
                                  )}
                              </div>
                          </div>

                          {/* Vista previa en la edición */}
                          {editingItem.foto1 ? (
                              <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-lg flex flex-col items-center">
                                  <span className="text-xs font-medium text-slate-500 mb-2">Vista previa:</span>
                                  <div className="relative max-h-48 flex items-center justify-center bg-white border border-gray-200 rounded p-1 shadow-sm">
                                      <img 
                                          src={editingItem.foto1} 
                                          alt="Vista previa del producto" 
                                          className="max-h-44 max-w-full object-contain rounded"
                                      />
                                  </div>
                              </div>
                          ) : (
                              <div className="mt-3 p-3 bg-slate-50 border border-dashed border-slate-200 rounded-lg text-center text-xs text-slate-400">
                                  Sin imagen seleccionada
                              </div>
                          )}
                      </div>

                      <button type="submit" className="w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 font-semibold text-lg mt-2">Guardar</button>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
}
