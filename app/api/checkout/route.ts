import { NextRequest, NextResponse } from 'next/server';

// 💰 Precios oficiales definidos en el SERVIDOR (nunca confiar en el precio del cliente)
const PLANES: Record<string, { precio: number; descripcion: string }> = {
  emprendedor: { precio: 149900, descripcion: 'Plan Emprendedor Upway - Bot de WhatsApp (texto y catálogo básico)' },
  negocio:     { precio: 299900, descripcion: 'Plan Negocio Upway - IA multimodal, notas de voz, imágenes y RAG de inventario' },
  pro:         { precio: 499900, descripcion: 'Plan PRO Upway - Alto volumen y reportes avanzados' },
};

export async function POST(req: NextRequest) {
  try {
    const { plan } = await req.json();

    const planInfo = PLANES[String(plan || '').toLowerCase()];
    if (!planInfo) {
      return NextResponse.json({ error: 'Plan no válido.' }, { status: 400 });
    }

    const apiKey = process.env.BOLD_API_KEY;

    if (!apiKey) throw new Error("Falta la llave de Bold en el entorno.");

    const payload = {
      amount_type: "CLOSE",
      amount: {
        currency: "COP",
        total_amount: planInfo.precio
      },
      description: planInfo.descripcion,
    };

    const response = await fetch('https://integrations.api.bold.co/online/link/v1', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `x-api-key ${apiKey}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Error de Bold:", errorData);
      throw new Error("Fallo al crear el link de pago con Bold");
    }

    const data = await response.json();
    return NextResponse.json({ payment_url: data.payload.url });

  } catch (error: unknown) {
    console.error("Error en el endpoint /api/checkout:", error);
    return NextResponse.json({ error: "Sistemas de pago temporalmente no disponibles." }, { status: 500 });
  }
}