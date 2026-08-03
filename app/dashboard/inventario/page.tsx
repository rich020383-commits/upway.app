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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.15),_transparent_55%)] bg-slate-950 px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        
        {/* Cabecera Premium Oscura */}
        <div className="mb-8 overflow-hidden rounded-[32px] border border-white/10 bg-white/5 p-8 shadow-2xl shadow-blue-900/20 backdrop-blur-xl">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-sm font-semibold text-blue-400">
                <Package className="h-4 w-4" />
                Inventario inteligente
              </div>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">Administra tu stock con una experiencia premium</h1>
              <p className="mt-3 max-w-2xl text-sm text-slate-300 sm:text-base">Carga productos manualmente o en lote, edita stock y mantén un control claro del negocio desde un solo panel.</p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg">
              <Sparkles className="h-4 w-4" />
              Listo para WhatsApp
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          
          {/* COLUMNA IZQUIERDA: FORMULARIOS */}
          <div className="space-y-6">
            <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur-md">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-500/20 text-blue-400">
                  <Search className="h-5 w-5" />
                </div>
                <h2 className="text-xl font-semibold text-white">Carga de productos</h2>
              </div>
              
              {/* Selector de modo oscuro */}
              <div className="mb-6 flex rounded-2xl border border-white/5 bg-black/20 p-1">
                <button onClick={() => setModoCarga('manual')} className={`flex-1 rounded-xl px-3 py-2 text-sm font-medium transition ${modoCarga === 'manual' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-300'}`}>Manual</button>
                <button onClick={() => setModoCarga('csv')} className={`flex-1 rounded-xl px-3 py-2 text-sm font-medium transition ${modoCarga === 'csv' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-300'}`}>CSV</button>
              </div>

              {modoCarga === 'manual' ? (
                <form onSubmit={agregarProducto} className="space-y-5">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-300">Nombre</label>
                    <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} className="w-full rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition focus:border-blue-500" placeholder="Ej. Leche Entera" />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-300">Precio</label>
                    <input type="number" value={precio} onChange={(e) => setPrecio(e.target.value)} className="w-full rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition focus:border-blue-500" placeholder="Ej. 4500" />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-300">Categoría</label>
                    <input type="text" value={categoria} onChange={(e) => setCategoria(e.target.value)} className="w-full rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition focus:border-blue-500" placeholder="Opcional" />
                  </div>
                  <button type="submit" disabled={guardando} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3.5 font-semibold text-white transition hover:bg-blue-500 disabled:opacity-70">
                    <PlusCircle className="h-4 w-4" />
                    {guardando ? 'Guardando...' : 'Agregar producto'}
                  </button>
                </form>
              ) : (
                <form onSubmit={subirArchivoCSV} className="space-y-4 text-center">
                  <div className="cursor-pointer rounded-[24px] border border-dashed border-white/20 bg-white/5 p-8 transition hover:border-blue-500 hover:bg-blue-500/10">
                    <Upload className="mx-auto mb-3 h-8 w-8 text-blue-400" />
                    <p className="text-sm font-medium text-slate-300">Selecciona un archivo CSV</p>
                    <input type="file" accept=".csv" onChange={(e) => setArchivoCSV(e.target.files?.[0] || null)} className="absolute inset-0 h-full w-full opacity-0" />
                  </div>
                  {archivoCSV ? <p className="rounded-xl bg-emerald-500/20 px-3 py-2 text-sm text-emerald-400">{archivoCSV.name}</p> : null}
                  <button type="submit" disabled={guardando || !archivoCSV} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3.5 font-semibold text-white transition hover:bg-blue-500 disabled:opacity-70">
                    {guardando ? 'Procesando...' : 'Subir inventario masivo'}
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* COLUMNA DERECHA: TABLA */}
          <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur-md">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white">Productos activos</h2>
                <p className="text-sm text-slate-400">{productos.length} elementos disponibles</p>
              </div>
              <div className="rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-sm font-semibold text-blue-400">Sincronizado</div>
            </div>

            {cargando ? (
              <div className="rounded-[24px] border border-white/10 bg-white/5 p-10 text-center text-sm text-slate-400">Cargando inventario...</div>
            ) : (
              <div className="overflow-hidden rounded-[24px] border border-white/10">
                <table className="min-w-full text-left text-sm text-slate-300">
                  <thead className="border-b border-white/10 bg-black/20 text-xs uppercase tracking-[0.2em] text-slate-400">
                    <tr>
                      <th className="px-4 py-4 font-semibold">Producto</th>
                      <th className="px-4 py-4 font-semibold">Categoría</th>
                      <th className="px-4 py-4 text-right font-semibold">Precio</th>
                      <th className="px-4 py-4 text-center font-semibold">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productos.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-12 text-center">
                          <Package className="mx-auto mb-3 h-8 w-8 text-slate-500 opacity-50" />
                          <p className="text-slate-400">No hay productos registrados en tu base de datos.</p>
                          <p className="text-sm text-slate-500">Agrega uno manualmente o sube un CSV para comenzar.</p>
                        </td>
                      </tr>
                    ) : (
                      productos.map((producto, idx) => (
                        <tr key={idx} className="border-b border-white/5 bg-transparent transition-colors hover:bg-white/[0.02] last:border-0">
                          {editandoId === producto.id ? (
                            <>
                              <td className="px-4 py-3"><input type="text" value={editNombre} onChange={(e) => setEditNombre(e.target.value)} className="w-full rounded-xl border border-white/20 bg-slate-900 px-3 py-2 text-sm text-white outline-none" /></td>
                              <td className="px-4 py-3"><input type="text" value={editCategoria} onChange={(e) => setEditCategoria(e.target.value)} className="w-full rounded-xl border border-white/20 bg-slate-900 px-3 py-2 text-sm text-white outline-none" /></td>
                              <td className="px-4 py-3"><input type="number" value={editPrecio} onChange={(e) => setEditPrecio(e.target.value)} className="w-full rounded-xl border border-white/20 bg-slate-900 px-3 py-2 text-right text-sm text-white outline-none" /></td>
                              <td className="px-4 py-3 text-center">
                                <button onClick={() => guardarEdicion(producto.id)} className="mr-3 font-medium text-emerald-400 transition hover:text-emerald-300">Guardar</button>
                                <button onClick={() => setEditandoId(null)} className="font-medium text-slate-400 transition hover:text-slate-300">Cancelar</button>
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="px-4 py-4 font-medium text-white">{producto.nombre}</td>
                              <td className="px-4 py-4 text-slate-400">{producto.categoria}</td>
                              <td className="px-4 py-4 text-right font-medium text-white">${producto.precio?.toLocaleString('es-CO')}</td>
                              <td className="px-4 py-4 text-center">
                                <button onClick={() => iniciarEdicion(producto)} className="mr-4 text-blue-400 transition hover:text-blue-300"><Pencil className="h-4 w-4" /></button>
                                <button onClick={() => eliminarProducto(producto.id)} className="text-rose-400 transition hover:text-rose-300"><Trash2 className="h-4 w-4" /></button>
                              </td>
                            </>
                          )}
                        </tr>
                      ))
                    )}
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