"use client";

import React, { useState, useEffect } from 'react';
import { Package, PlusCircle, Upload, Pencil, Trash2, Search, Sparkles } from 'lucide-react';

export default function InventarioPage() {
  const [modoCarga, setModoCarga] = useState<'manual' | 'csv'>('manual');
  const [guardando, setGuardando] = useState(false);
  const [productos, setProductos] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [nombre, setNombre] = useState('');
  const [precio, setPrecio] = useState('');
  const [categoria, setCategoria] = useState('');
  const [archivoCSV, setArchivoCSV] = useState<File | null>(null);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [editNombre, setEditNombre] = useState('');
  const [editPrecio, setEditPrecio] = useState('');
  const [editCategoria, setEditCategoria] = useState('');

  const TIENDA_ID = '1172769935927318';

  const cargarInventario = async () => {
    setCargando(true);
    try {
      const respuesta = await fetch(`/api/inventario/${TIENDA_ID}`);
      if (respuesta.ok) {
        const datos = await respuesta.json();
        setProductos(datos.inventario || []);
      }
    } catch (error) {
      console.error('Error', error);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarInventario();
  }, []);

  const agregarProducto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre || !precio) return alert('Nombre y precio son obligatorios.');
    setGuardando(true);

    try {
      const respuesta = await fetch('/api/inventario/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tienda_id: TIENDA_ID, nombre, precio: parseFloat(precio), categoria: categoria || 'General', disponible: true }),
      });
      if (respuesta.ok) {
        setNombre('');
        setPrecio('');
        setCategoria('');
        cargarInventario();
      }
    } catch (error) {
      alert('❌ Error conectando al servidor.');
    } finally {
      setGuardando(false);
    }
  };

  const subirArchivoCSV = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!archivoCSV) return alert('Selecciona un archivo CSV primero.');
    setGuardando(true);

    const formData = new FormData();
    formData.append('tienda_id', TIENDA_ID);
    formData.append('archivo', archivoCSV);

    try {
      const respuesta = await fetch('/api/inventario/cargar-csv/', {
        method: 'POST',
        body: formData,
      });
      if (respuesta.ok) {
        setArchivoCSV(null);
        cargarInventario();
      } else {
        alert('❌ Error al procesar el archivo.');
      }
    } catch (error) {
      alert('❌ Error de conexión.');
    } finally {
      setGuardando(false);
    }
  };

  const eliminarProducto = async (id: number) => {
    if (!confirm('¿Seguro que quieres borrar este producto?')) return;

    try {
      const respuesta = await fetch(`/api/inventario/${id}`, { method: 'DELETE' });
      if (respuesta.ok) {
        cargarInventario();
      }
    } catch (error) {
      alert('❌ Error eliminando producto.');
    }
  };

  const iniciarEdicion = (producto: any) => {
    setEditandoId(producto.id);
    setEditNombre(producto.nombre);
    setEditPrecio(producto.precio.toString());
    setEditCategoria(producto.categoria || '');
  };

  const guardarEdicion = async (id: number) => {
    try {
      const respuesta = await fetch(`/api/inventario/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: editNombre, precio: parseFloat(editPrecio), categoria: editCategoria }),
      });

      if (respuesta.ok) {
        setEditandoId(null);
        cargarInventario();
      }
    } catch (error) {
      alert('❌ Error al actualizar.');
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.12),_transparent_50%)] px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 overflow-hidden rounded-[32px] border border-slate-200/80 bg-white/80 p-8 shadow-premium backdrop-blur">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">
                <Package className="h-4 w-4" />
                Inventario inteligente
              </div>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">Administra tu stock con una experiencia premium</h1>
              <p className="mt-3 max-w-2xl text-sm text-slate-600 sm:text-base">Carga productos manualmente o en lote, edita stock y mantén un control claro del negocio desde un solo panel.</p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-950 px-4 py-2 text-sm font-semibold text-white">
              <Sparkles className="h-4 w-4" />
              Listo para WhatsApp
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="space-y-6">
            <div className="rounded-[28px] border border-slate-200/80 bg-white/90 p-6 shadow-premium">
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
                  <Search className="h-5 w-5" />
                </div>
                <h2 className="text-xl font-semibold text-slate-900">Carga de productos</h2>
              </div>
              <div className="mb-4 flex rounded-2xl bg-slate-100 p-1">
                <button onClick={() => setModoCarga('manual')} className={`flex-1 rounded-xl px-3 py-2 text-sm font-medium transition ${modoCarga === 'manual' ? 'bg-white text-blue-700 shadow' : 'text-slate-500'}`}>Manual</button>
                <button onClick={() => setModoCarga('csv')} className={`flex-1 rounded-xl px-3 py-2 text-sm font-medium transition ${modoCarga === 'csv' ? 'bg-white text-blue-700 shadow' : 'text-slate-500'}`}>CSV</button>
              </div>

              {modoCarga === 'manual' ? (
                <form onSubmit={agregarProducto} className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">Nombre</label>
                    <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500" placeholder="Ej. Leche Entera" />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">Precio</label>
                    <input type="number" value={precio} onChange={(e) => setPrecio(e.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500" placeholder="Ej. 4500" />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">Categoría</label>
                    <input type="text" value={categoria} onChange={(e) => setCategoria(e.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500" placeholder="Opcional" />
                  </div>
                  <button type="submit" disabled={guardando} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-500 disabled:opacity-70">
                    <PlusCircle className="h-4 w-4" />
                    {guardando ? 'Guardando...' : 'Agregar producto'}
                  </button>
                </form>
              ) : (
                <form onSubmit={subirArchivoCSV} className="space-y-4 text-center">
                  <div className="cursor-pointer rounded-[24px] border border-dashed border-slate-300 bg-slate-50 p-8 transition hover:border-blue-400 hover:bg-blue-50">
                    <Upload className="mx-auto mb-3 h-8 w-8 text-blue-600" />
                    <p className="text-sm font-medium text-slate-700">Selecciona un archivo CSV</p>
                    <input type="file" accept=".csv" onChange={(e) => setArchivoCSV(e.target.files?.[0] || null)} className="absolute inset-0 h-full w-full opacity-0" />
                  </div>
                  {archivoCSV ? <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{archivoCSV.name}</p> : null}
                  <button type="submit" disabled={guardando || !archivoCSV} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-500 disabled:opacity-70">
                    {guardando ? 'Procesando...' : 'Subir inventario masivo'}
                  </button>
                </form>
              )}
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-200/80 bg-white/90 p-6 shadow-premium">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Productos activos</h2>
                <p className="text-sm text-slate-500">{productos.length} elementos disponibles</p>
              </div>
              <div className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">Sincronizado</div>
            </div>

            {cargando ? (
              <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-10 text-center text-sm text-slate-500">Cargando inventario...</div>
            ) : (
              <div className="overflow-hidden rounded-[24px] border border-slate-200">
                <table className="min-w-full text-sm text-left text-slate-600">
                  <thead className="bg-slate-50 text-xs uppercase tracking-[0.2em] text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Producto</th>
                      <th className="px-4 py-3">Categoría</th>
                      <th className="px-4 py-3 text-right">Precio</th>
                      <th className="px-4 py-3 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productos.map((producto, idx) => (
                      <tr key={idx} className="border-t border-slate-200 bg-white/80">
                        {editandoId === producto.id ? (
                          <>
                            <td className="px-4 py-3"><input type="text" value={editNombre} onChange={(e) => setEditNombre(e.target.value)} className="w-full rounded-xl border border-slate-200 px-2 py-2 text-sm" /></td>
                            <td className="px-4 py-3"><input type="text" value={editCategoria} onChange={(e) => setEditCategoria(e.target.value)} className="w-full rounded-xl border border-slate-200 px-2 py-2 text-sm" /></td>
                            <td className="px-4 py-3"><input type="number" value={editPrecio} onChange={(e) => setEditPrecio(e.target.value)} className="w-full rounded-xl border border-slate-200 px-2 py-2 text-right text-sm" /></td>
                            <td className="px-4 py-3 text-center">
                              <button onClick={() => guardarEdicion(producto.id)} className="mr-2 text-emerald-600">Guardar</button>
                              <button onClick={() => setEditandoId(null)} className="text-slate-500">Cancelar</button>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="px-4 py-3 font-medium text-slate-900">{producto.nombre}</td>
                            <td className="px-4 py-3">{producto.categoria}</td>
                            <td className="px-4 py-3 text-right">${producto.precio?.toLocaleString('es-CO')}</td>
                            <td className="px-4 py-3 text-center">
                              <button onClick={() => iniciarEdicion(producto)} className="mr-3 text-blue-600"><Pencil className="h-4 w-4" /></button>
                              <button onClick={() => eliminarProducto(producto.id)} className="text-rose-600"><Trash2 className="h-4 w-4" /></button>
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}