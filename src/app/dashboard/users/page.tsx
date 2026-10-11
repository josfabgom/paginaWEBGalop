"use client";
import { useState, useEffect } from "react";
import { Trash2, Edit, Plus, X } from "lucide-react";

export default function UsersAdminPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<any>(null);
    const [errorMsg, setErrorMsg] = useState("");

    const fetchUsers = () => {
        fetch("/api/admin/users").then(r => r.json()).then(d => {
            if (d.success) setUsers(d.users);
            setLoading(false);
        });
    };

    useEffect(() => { fetchUsers(); }, []);

    const openModal = (user: any = null) => {
        setErrorMsg("");
        setEditingUser(user || { name: "", email: "", role: "CLIENT", password: "" });
        setModalOpen(true);
    };

    const deleteUser = async (id: string) => {
        if(!confirm("¿Seguro que deseas eliminar este usuario?")) return;
        const res = await fetch("/api/admin/users?id=" + id, { method: "DELETE" });
        const data = await res.json();
        if (data.success) fetchUsers();
        else alert(data.error);
    };

    const saveUser = async (e: any) => {
        e.preventDefault();
        setErrorMsg("");
        const res = await fetch("/api/admin/users", {
            method: "POST",
            body: JSON.stringify(editingUser)
        });
        const data = await res.json();
        if(data.success) {
            setModalOpen(false);
            fetchUsers();
        } else {
            setErrorMsg(data.error || "Error al guardar");
        }
    };

    if (loading) return <div>Cargando usuarios...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">Gestión de Usuarios</h1>
                <button onClick={() => openModal()} className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-blue-700">
                    <Plus className="w-4 h-4"/> Nuevo Usuario
                </button>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 border-b">
                            <th className="p-4 text-gray-700">Nombre</th>
                            <th className="p-4 text-gray-700">Email</th>
                            <th className="p-4 text-gray-700">Rol</th>
                            <th className="p-4 text-gray-700 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(u => (
                            <tr key={u.id} className="border-b hover:bg-slate-50">
                                <td className="p-4 text-gray-900">{u.name}</td>
                                <td className="p-4 text-gray-600">{u.email}</td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${u.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'}`}>
                                        {u.role === 'ADMIN' ? 'Admin / GestionQ' : 'Vendedor / Catálogo'}
                                    </span>
                                </td>
                                <td className="p-4 text-right flex gap-3 justify-end">
                                    <button onClick={() => openModal(u)} className="text-blue-600 hover:text-blue-800"><Edit className="w-4 h-4"/></button>
                                    <button onClick={() => deleteUser(u.id)} className="text-red-600 hover:text-red-800"><Trash2 className="w-4 h-4"/></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-xl w-full max-w-md shadow-2xl">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-gray-900">{editingUser.id ? 'Editar Usuario' : 'Nuevo Usuario'}</h3>
                            <button onClick={() => setModalOpen(false)}><X className="w-5 h-5 text-gray-500 hover:text-gray-800"/></button>
                        </div>
                        {errorMsg && <div className="mb-4 text-red-600 text-sm bg-red-50 p-2 rounded">{errorMsg}</div>}
                        <form onSubmit={saveUser} className="space-y-4">
                            <div><label className="block text-sm text-gray-700 mb-1">Nombre</label><input required className="w-full border p-2 rounded text-gray-900" value={editingUser.name} onChange={e => setEditingUser({...editingUser, name: e.target.value})} /></div>
                            <div><label className="block text-sm text-gray-700 mb-1">Correo (Login)</label><input required type="email" className="w-full border p-2 rounded text-gray-900" value={editingUser.email} onChange={e => setEditingUser({...editingUser, email: e.target.value})} /></div>
                            <div><label className="block text-sm text-gray-700 mb-1">Rol</label>
                                <select className="w-full border p-2 rounded text-gray-900" value={editingUser.role} onChange={e => setEditingUser({...editingUser, role: e.target.value})}>
                                    <option value="ADMIN">Administrador (Acceso a TODO GestionQ y Catálogo)</option>
                                    <option value="CLIENT">Vendedor (Acceso SOLO al Catálogo)</option>
                                </select>
                            </div>
                            <div><label className="block text-sm text-gray-700 mb-1">Contraseña {editingUser.id && '(Dejar en blanco para no cambiar)'}</label><input type="password" required={!editingUser.id} className="w-full border p-2 rounded text-gray-900" value={editingUser.password || ''} onChange={e => setEditingUser({...editingUser, password: e.target.value})} /></div>
                            <button type="submit" className="w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 font-semibold mt-4">Guardar Usuario</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
