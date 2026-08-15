import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Extraemos limpiando espacios en blanco accidentales al inicio o final
    const email = body.email?.trim();
    const password = body.password?.trim();

    // ESTO SE IMPRIMIRÁ EN TU TERMINAL (Para que veas qué está llegando)
    console.log(`Intento de login - Correo: "${email}", Password: "${password}"`);

    // Los únicos accesos permitidos
    const usuariosPermitidos = [
      { email: 'revisor_meta@upway.business', password: 'MetaReview2026' },
      { email: 'rich@upway.com', password: 'AdminUpway123*' } // El tuyo para pruebas
    ];

    const usuarioValido = usuariosPermitidos.find(
      (u) => u.email === email && u.password === password
    );

    if (usuarioValido) {
      console.log('¡Login Exitoso!');
      return NextResponse.json({ 
        success: true, 
        message: 'Acceso autorizado',
        user: { email: usuarioValido.email }
      }, { status: 200 });
    } else {
      console.log('Login Fallido: Credenciales no coinciden.');
      return NextResponse.json({ 
        success: false, 
        message: 'Credenciales incorrectas. Verifica tu correo y contraseña.' 
      }, { status: 401 });
    }

  } catch (error) {
    console.error('Error en el servidor:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Error interno del servidor.' 
    }, { status: 500 });
  }
}