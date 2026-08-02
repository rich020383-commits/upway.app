import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { plan, precio, descripcion } = await req.json();

    // 🚀 Llave directa de producción (Asegúrate de que BOLD_API_KEY esté en Render)
    const apiKey = process.env.BOLD_API_KEY;
    
    if (!apiKey) throw new Error("Falta la llave de Bold en el entorno.");

    const payload = {
      amount: {
        currency: "COP",
        total_amount: precio
      },
      description: descripcion,
    };

    const response = await fetch('https://payments.api.bold.co/v2/payment-links', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `ApiKey ${apiKey}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Error de Bold:", errorData);
      throw new Error("Fallo al crear el link de pago con Bold");
    }

    const data = await response.json();
    return NextResponse.json({ payment_url: data.payment_url });

  } catch (error: any) {
    console.error("Error en el endpoint /api/checkout:", error);
    return NextResponse.json({ error: "Sistemas de pago temporalmente no disponibles." }, { status: 500 });
  }
}