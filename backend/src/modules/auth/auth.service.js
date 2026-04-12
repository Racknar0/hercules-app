import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createHash, randomUUID } from 'crypto';
import { prisma } from '../../database/prismaClient.js';
import { env } from '../../config/env.js';

function hashToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

function getPrimaryMembership(user) {
  if (!Array.isArray(user.memberships) || user.memberships.length === 0) {
    return null;
  }

  return user.memberships[0];
}

function toSafeUser(user) {
  const membership = getPrimaryMembership(user);

  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    organization: membership
      ? {
          id: membership.organization.id,
          name: membership.organization.name,
          membershipRole: membership.role,
        }
      : null,
  };
}

function getUserInclude() {
  return {
    memberships: {
      where: { status: 'ACTIVE' },
      orderBy: { createdAt: 'asc' },
      take: 1,
      include: {
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    },
  };
}

export function extractBearerToken(authorizationHeader = '') {
  if (!authorizationHeader || typeof authorizationHeader !== 'string') {
    return null;
  }

  const [scheme, token] = authorizationHeader.split(' ');
  if (scheme?.toLowerCase() !== 'bearer' || !token) {
    return null;
  }

  return token.trim();
}

export async function loginWithPassword({ email, password, ipAddress, userAgent }) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  if (!normalizedEmail || !password) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    include: getUserInclude(),
  });

  if (!user || user.status !== 'ACTIVE') {
    return null;
  }

  const isValidPassword = await bcrypt.compare(password, user.passwordHash);
  if (!isValidPassword) {
    return null;
  }

  const membership = getPrimaryMembership(user);

  const token = jwt.sign(
    {
      sub: user.id,
      role: user.role,
      orgId: membership?.organizationId || null,
    },
    env.jwtSecret,
    {
      expiresIn: env.jwtExpiresIn,
      jwtid: randomUUID(),
    },
  );

  const decodedToken = jwt.decode(token);
  const expiresAt = decodedToken?.exp
    ? new Date(decodedToken.exp * 1000)
    : new Date(Date.now() + 12 * 60 * 60 * 1000);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    }),
    prisma.session.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(token),
        ipAddress: ipAddress ? String(ipAddress).slice(0, 45) : null,
        userAgent: userAgent ? String(userAgent).slice(0, 255) : null,
        status: 'ACTIVE',
        expiresAt,
      },
    }),
  ]);

  return {
    token,
    expiresAt,
    user: toSafeUser(user),
  };
}

export async function getAuthenticatedUserByToken(token) {
  if (!token) {
    return null;
  }

  let payload;
  try {
    payload = jwt.verify(token, env.jwtSecret);
  } catch {
    return null;
  }

  if (!payload || typeof payload !== 'object' || !payload.sub) {
    return null;
  }

  const activeSession = await prisma.session.findFirst({
    where: {
      tokenHash: hashToken(token),
      status: 'ACTIVE',
      expiresAt: {
        gt: new Date(),
      },
    },
    select: {
      id: true,
      userId: true,
    },
  });

  if (!activeSession || activeSession.userId !== payload.sub) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    include: getUserInclude(),
  });

  if (!user || user.status !== 'ACTIVE') {
    return null;
  }

  return {
    payload,
    user: toSafeUser(user),
  };
}

export async function logoutByToken(token) {
  if (!token) {
    return 0;
  }

  const result = await prisma.session.updateMany({
    where: {
      tokenHash: hashToken(token),
      status: 'ACTIVE',
    },
    data: {
      status: 'REVOKED',
      revokedAt: new Date(),
    },
  });

  return result.count;
}
