import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/session';

export async function GET(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser(req);
    if (!sessionUser) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // 🛡️ Limitar visibilidad de usuarios al alcance de su propia organización
    const organizations = await prisma.organization.findMany({
      where: {
        OR: [
          { ownerId: sessionUser.id },
          { members: { some: { userId: sessionUser.id } } },
        ],
      },
      select: { id: true },
    });

    const orgIds = organizations.map((o) => o.id);

    const users = await prisma.user.findMany({
      where: {
        OR: [
          { id: sessionUser.id },
          { organizationMemberships: { some: { organizationId: { in: orgIds } } } },
          { ownedOrganizations: { some: { id: { in: orgIds } } } },
        ],
      },
      orderBy: { email: 'asc' },
      select: {
        id: true,
        name: true,
        email: true,
      },
      take: 50,
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'No se pudieron cargar los usuarios' }, { status: 500 });
  }
}
