"use client";

import React, { useState } from 'react';
import { Database, UploadCloud, Search, Plus, Trash2, Box, ArrowRight, FileText } from 'lucide-react';

// Estructura de prueba vacía (borramos los productos viejos)
type Producto = { id: string; nombre: string; categoria: string; precio: number };

export default function InventarioPage() {
  const [metodoCarga, setMetodoCarga] = useState<'manual' | 'csv'>('manual');
  // Iniciamos la base de datos vacía para que se vea limpio
  const [productos, setProductos] = useState<Producto[]>([]); 
  
  // Estados del formulario manual
  const [nombre, setNombre] = useState('');
  const [precio, setPrecio] = useState('');
  const [categoria, setCategoria] = useState('');

  const handleAgregarManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre || !precio) return;
    
    const nuevo: Producto = {
      id: Math.random().toString(36).substring(7),
      nombre,
      categoria: categoria || 'General',
      precio: parseFloat(precio)
    };
    
    setProductos([nuevo, ...productos]);
    setNombre('');
    setPrecio('');
    setCategoria('');
  };

  const eliminarProducto = (id: string) => {
    setProductos(productos.filter(p => p.id !== id));
  };

  const fmt = (n: number) => `$${n.toLocaleString("es-CO")}`;

  return (
    <div className="min-h-screen bg-[#07090C] text-[#F5F7FA] font-sans pb-20 selection:bg-[#9B5CFF] selection:text-[#07090C]">
      
      <div className="max-w-6xl mx-auto px-6 pt-12 md:pt-16">
        
        {/* Header Premium */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10 pb-6 border-b border-[#1E293B]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-md border border-[#9B5CFF]/30 bg-[#9B5CFF]/10 px-2 py-1 text-[10px] font-mono tracking-widest text-[#9B5CFF] mb-4">
              <Database className="h-3 w-3" /> BASE DE CONOCIMIENTO
            </div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-[#F5F7FA]">
              Memoria Vectorial (RAG)
            </h1>
            <p className="text-[#8994A6] text-sm mt-2 max-w-2xl">
              Alimenta a tu empleado digital con tu inventario. La IA consultará estos datos en tiempo real para generar respuestas precisas.
            </p>
          </div>
          
          <button className="inline-flex items-center gap-2 rounded-xl bg-[#F5F7FA] text-[#07090C] px-5 py-2.5 text-sm font-bold hover:bg-[#E2E8F0] transition-all shadow-[0_0_20px_rgba(245,247,250,0.1)]">
            <Database className="h-4 w-4" /> Forzar Indexación
          </button>
        </div>

        <div className="grid lg:grid-cols-[1fr_1.5fr] gap-8">
          
          {/* COLUMNA IZQUIERDA: Ingesta de Datos */}
          <div className="space-y-6">
            <div className="rounded-2xl border border-[#1E293B] bg-[#0D1117] p-8 shadow-xl">
              <h2 className="text-lg font-bold text-[#F5F7FA] mb-6 flex items-center gap-2">
                <UploadCloud className="h-5 w-5 text-[#9B5CFF]" /> Ingesta de Datos
              </h2>
              
              {/* Selector de Método */}
              <div className="flex p-1 bg-[#07090C] border border-[#1E293B] rounded-xl mb-8">
                <button 
                  onClick={() => setMetodoCarga('manual')}
                  className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${
                    metodoCarga === 'manual' ? 'bg-[#1E293B] text-[#F5F7FA]' : 'text-[#8994A6] hover:text-[#F5F7FA]'
                  }`}
                >
                  Registro Manual
                </button>
                <button 
                  onClick={() => setMetodoCarga('csv')}
                  className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${
                    metodoCarga === 'csv' ? 'bg-[#1E293B] text-[#F5F7FA]' : 'text-[#8994A6] hover:text-[#F5F7FA]'
                  }`}
                >
                  Carga Masiva (CSV)
                </button>
              </div>

              {metodoCarga === 'manual' ? (
                <form onSubmit={handleAgregarManual} className="space-y-5">
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[#8994A6]">Nombre del Producto / Servicio</label>
                    <input 
                      type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} required
                      placeholder="Ej. Taladro Percutor 12V" 
                      className="w-full rounded-xl border border-[#1E293B] bg-[#07090C] px-4 py-3 text-sm text-[#F5F7FA] outline-none transition focus:border-[#9B5CFF] focus:ring-1 focus:ring-[#9B5CFF]" 
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[#8994A6]">Precio</label>
                      <input 
                        type="number" value={precio} onChange={(e) => setPrecio(e.target.value)} required
                        placeholder="Ej. 150000" 
                        className="w-full rounded-xl border border-[#1E293B] bg-[#07090C] px-4 py-3 text-sm text-[#F5F7FA] outline-none transition focus:border-[#9B5CFF]" 
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[#8994A6]">Categoría</label>
                      <input 
                        type="text" value={categoria} onChange={(e) => setCategoria(e.target.value)}
                        placeholder="Ej. Herramientas" 
                        className="w-full rounded-xl border border-[#1E293B] bg-[#07090C] px-4 py-3 text-sm text-[#F5F7FA] outline-none transition focus:border-[#9B5CFF]" 
                      />
                    </div>
                  </div>
                  <button type="submit" className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#9B5CFF] px-6 py-3.5 font-bold text-white transition-all hover:bg-[#8B4CFF] mt-2">
                    <Plus className="h-4 w-4" /> Agregar al Vector
                  </button>
                </form>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 border-2 border-dashed border-[#1E293B] rounded-xl bg-[#07090C] transition-all hover:border-[#9B5CFF]/50 cursor-pointer">
                  <FileText className="h-10 w-10 text-[#8994A6] mb-4" />
                  <p className="text-sm text-[#F5F7FA] font-medium mb-1">Arrastra tu archivo CSV aquí</p>
                  <p className="text-xs text-[#8994A6]">Máximo 5MB (Solo texto estructurado)</p>
                  <button className="mt-6 text-xs font-bold bg-[#1E293B] text-[#F5F7FA] px-4 py-2 rounded-lg hover:bg-[#2A3B4C] transition-colors">
                    Explorar archivos
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* COLUMNA DERECHA: Tabla de Vectores */}
          <div className="rounded-2xl border border-[#1E293B] bg-[#0D1117] p-8 shadow-xl flex flex-col h-full min-h-[500px]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-[#1E293B]">
              <div>
                <h2 className="text-lg font-bold text-[#F5F7FA] flex items-center gap-2">
                  <Box className="h-5 w-5 text-[#9B5CFF]" /> Base de Datos Activa
                </h2>
                <p className="text-xs text-[#8994A6] mt-1">{productos.length} registros vectorizados</p>
              </div>
              
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8994A6]" />
                <input 
                  type="text" 
                  placeholder="Buscar registro..." 
                  className="w-full sm:w-64 rounded-xl border border-[#1E293B] bg-[#07090C] pl-9 pr-4 py-2 text-sm text-[#F5F7FA] outline-none transition focus:border-[#9B5CFF]" 
                />
              </div>
            </div>

            <div className="flex-1 overflow-auto">
              {productos.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-50 py-12">
                  <Database className="h-12 w-12 text-[#8994A6] mb-4" />
                  <p className="text-sm font-semibold text-[#F5F7FA]">Sin registros vectorizados</p>
                  <p className="text-xs text-[#8994A6] max-w-xs mt-2">Agrega productos manualmente o sube un CSV para entrenar a la IA.</p>
                </div>
              ) : (
                <div className="w-full">
                  <div className="grid grid-cols-12 gap-4 text-xs font-bold uppercase tracking-widest text-[#8994A6] mb-4 px-4">
                    <div className="col-span-5">Registro</div>
                    <div className="col-span-3">Categoría</div>
                    <div className="col-span-3">Valor Ref.</div>
                    <div className="col-span-1 text-right">Acción</div>
                  </div>
                  
                  <div className="space-y-2">
                    {productos.map((p) => (
                      <div key={p.id} className="grid grid-cols-12 gap-4 items-center bg-[#07090C] border border-[#1E293B] rounded-xl px-4 py-3 transition-colors hover:border-[#8994A6]/50">
                        <div className="col-span-5 font-medium text-[#F5F7FA] text-sm truncate">{p.nombre}</div>
                        <div className="col-span-3 text-xs text-[#8994A6] truncate">{p.categoria}</div>
                        <div className="col-span-3 font-mono text-sm text-[#10B981]">{fmt(p.precio)}</div>
                        <div className="col-span-1 flex justify-end">
                          <button onClick={() => eliminarProducto(p.id)} className="text-[#8994A6] hover:text-red-400 transition-colors">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
          </div>

        </div>
      </div>
    </div>
  );
}