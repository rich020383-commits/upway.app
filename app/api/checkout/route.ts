import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { plan, precio, descripcion } = await req.json();

    // 🚀 Llave de identidad en Render
    const apiKey = process.env.BOLD_API_KEY;
    
    if (!apiKey) throw new Error("Falta la llave de Bold en el entorno.");

    // 🎯 Payload adaptado a la documentación oficial (amount_type CLOSE para montos fijos)
    const payload = {
      amount_type: "CLOSE",
      amount: {
        currency: "COP",
        total_amount: precio
      },
      description: descripcion,
    };

    // 🌐 URL Base y endpoint oficial de Bold
    const response = await fetch('https://integrations.api.bold.co/online/link/v1', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey // 🔑 Cabecera oficial requerida por Bold
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Error de Bold:", errorData);
      throw new Error("Fallo al crear el link de pago con Bold");
    }

    const data = await response.json();
    
    // 🔗 La URL de pago oficial viene dentro del objeto payload de Bold
    return NextResponse.json({ payment_url: data.payload.url });

  } catch (error: any) {
    console.error("Error en el endpoint /api/checkout:", error);
    return NextResponse.json({ error: "Sistemas de pago temporalmente no disponibles." }, { status: 500 });
  }
}