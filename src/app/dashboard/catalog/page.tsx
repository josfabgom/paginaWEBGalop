"use client";
import { useState, useEffect } from "react";
import { Save, Upload, RefreshCw } from "lucide-react";

export default function CatalogAdminPage() {
  const [settings, setSettings] = useState({
    vendedorNombre: "",
    vendedorRol: "",
    vendedorPhone: "",
    categoriaInicial: ""
  });
  const [stats, setStats] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/catalog")
      .then(r => r.json())
      .then(d => {
        if (d.settings) setSettings(d.settings);
        if (d.items) setStats(d.items.length);
        setLoading(false);
      });
  }, []);

  const saveSettings = async () => {
    await fetch("/api/catalog/settings", {
      method: "POST",
      body: JSON.stringify(settings)
    });
    alert("Configuración guardada");
  };

  const handleFileUpload = (e: any) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const text = evt.target?.result as string;
        const items = JSON.parse(text);
        if (!Array.isArray(items)) throw new Error("Debe ser un Array de JSON");
        
        const res = await fetch("/api/catalog/sync", {
          method: "POST",
          body: JSON.stringify({ items })
        });
        const data = await res.json();
        if(data.success) {
            setStats(data.count);
            alert("Catálogo actualizado con " + data.count + " productos.");
        } else {
            alert("Error: " + data.error);
        }
      } catch (err) {
        alert("Error leyendo el archivo JSON: " + err);
      }
    };
    reader.readAsText(file);
  };

  if (loading) return <div className="p-8">Cargando...</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Autogestión de Catálogo</h1>
        <p className="text-gray-500">Administra los datos públicos de tu catálogo en galopsrl.com.ar</p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
        <h2 className="text-lg font-semibold mb-4">Información de Contacto</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nombre del Vendedor</label>
            <input type="text" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border outline-none focus:ring-2 focus:ring-blue-500" 
              value={settings.vendedorNombre} onChange={e => setSettings({...settings, vendedorNombre: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Rol</label>
            <input type="text" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border outline-none focus:ring-2 focus:ring-blue-500" 
              value={settings.vendedorRol} onChange={e => setSettings({...settings, vendedorRol: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">WhatsApp (Código país + número)</label>
            <input type="text" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border outline-none focus:ring-2 focus:ring-blue-500" 
              value={settings.vendedorPhone} onChange={e => setSettings({...settings, vendedorPhone: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Categoría Inicial</label>
            <input type="text" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border outline-none focus:ring-2 focus:ring-blue-500" 
              value={settings.categoriaInicial} onChange={e => setSettings({...settings, categoriaInicial: e.target.value})} />
          </div>
        </div>
        <button onClick={saveSettings} className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-blue-700">
          <Save className="w-4 h-4" /> Guardar Configuración
        </button>
      </div>

      <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
        <h2 className="text-lg font-semibold mb-4">Productos ({stats} actuales)</h2>
        <p className="text-sm text-gray-600 mb-4">
          Sube un archivo JSON con el listado de productos. Esto reemplazará el catálogo actual.
        </p>
        <div className="flex items-center gap-4">
          <label className="bg-green-600 text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-green-700 cursor-pointer">
            <Upload className="w-4 h-4" /> Subir JSON de Productos
            <input type="file" accept=".json" className="hidden" onChange={handleFileUpload} />
          </label>
        </div>
      </div>
    </div>
  );
}
