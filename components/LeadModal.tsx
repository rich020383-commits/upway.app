"use client";

import { useForm } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
import { X, Building2, User, Mail, Phone, ArrowRight, Loader2 } from "lucide-react";
import { useState } from "react";

export default function LeadModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      // 🔥 ACTUALIZADO: Apunta al nuevo dominio unificado
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://upway.business";
      const response = await fetch(`${baseUrl}/api/leads/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nombre_completo: data.nombre,
          empresa: data.empresa,
          email: data.email,
          telefono: data.telefono,
          tamano_empresa: data.tamano,
          mensaje: data.mensaje || "",
        }),
      });

      if (response.ok) {
        setIsSuccess(true);
        setTimeout(() => {
          setIsSuccess(false);
          reset();
          onClose();
        }, 3000);
      } else {
        alert("Hubo un error al enviar los datos. Inténtalo de nuevo.");
      }
    } catch (error) {
      console.error("Error conectando con el backend:", error);
      alert("No se pudo conectar con el servidor backend.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="bg-white rounded-3xl w-full max-w-lg p-8 shadow-2xl relative border border-slate-100 overflow-hidden z-10"
          >
            <button onClick={onClose} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 transition-colors">
              <X className="w-5 h-5" />
            </button>

            {!isSuccess ? (
              <>
                <div className="mb-6 space-y-2">
                  <h3 className="text-2xl font-bold text-slate-900 tracking-tight">Impulsa tu empresa con IA</h3>
                  <p className="text-slate-500 text-sm">Déjanos tus datos y un especialista diseñará una propuesta a la medida.</p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div className="relative">
                    <User className="absolute left-4 top-[14px] w-4 h-4 text-slate-400" />
                    <input
                      {...register("nombre", { required: true })}
                      placeholder="Nombre completo"
                      className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-xl pl-11 pr-4 py-3 text-sm text-slate-900 outline-none transition-all"
                    />
                    {errors.nombre && <span className="text-xs text-red-500 block mt-1">Este campo es requerido</span>}
                  </div>

                  <div className="relative">
                    <Building2 className="absolute left-4 top-[14px] w-4 h-4 text-slate-400" />
                    <input
                      {...register("empresa", { required: true })}
                      placeholder="Nombre de tu empresa"
                      className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-xl pl-11 pr-4 py-3 text-sm text-slate-900 outline-none transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="relative">
                      <Mail className="absolute left-4 top-[14px] w-4 h-4 text-slate-400" />
                      <input
                        {...register("email", { required: true, pattern: /^\S+@\S+$/i })}
                        type="email"
                        placeholder="Correo corporativo"
                        className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-xl pl-11 pr-4 py-3 text-sm text-slate-900 outline-none transition-all"
                      />
                    </div>
                    <div className="relative">
                      <Phone className="absolute left-4 top-[14px] w-4 h-4 text-slate-400" />
                      <input
                        {...register("telefono", { required: true })}
                        type="tel"
                        placeholder="Teléfono de contacto"
                        className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-xl pl-11 pr-4 py-3 text-sm text-slate-900 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <select
                      {...register("tamano", { required: true })}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-xl px-4 py-3 text-sm text-slate-500 outline-none transition-all appearance-none cursor-pointer"
                    >
                      <option value="">¿Cuántos empleados tienen?</option>
                      <option value="1-10">1 - 10 empleados</option>
                      <option value="11-50">11 - 50 empleados</option>
                      <option value="51-200">51 - 200 empleados</option>
                      <option value="201+">Más de 200 empleados</option>
                    </select>
                  </div>

                  <div>
                    <textarea
                      {...register("mensaje")}
                      placeholder="Cuéntanos brevemente qué proceso te gustaría automatizar..."
                      rows={3}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-xl px-4 py-3 text-sm text-slate-900 outline-none transition-all resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3.5 rounded-xl transition-all duration-300 shadow-md flex items-center justify-center space-x-2 group"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <span>Solicitar asesoría gratuita</span>
                        <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>
                </form>
              </>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12 space-y-4">
                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                  <span className="text-2xl font-bold">✓</span>
                </div>
                <h3 className="text-2xl font-bold text-slate-900 tracking-tight">¡Solicitud Recibida!</h3>
                <p className="text-slate-500 text-sm max-w-xs mx-auto">
                  Analizaremos tu empresa y un consultor senior te contactará en menos de 24 horas.
                </p>
              </motion.div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}