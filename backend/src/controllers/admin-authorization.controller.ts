import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

const getTargetUserId = (req: Request): number | null => {
  const id = Number(req.params.id);
  return Number.isInteger(id) && id > 0 ? id : null;
};

export const listAuthorizationMasters = async (_req: Request, res: Response): Promise<void> => {
  const [roles, divisions] = await Promise.all([
    prisma.role.findMany({ orderBy: { code: 'asc' } }),
    prisma.division.findMany({ orderBy: { code: 'asc' } }),
  ]);
  res.json({ roles, divisions });
};

export const assignRoles = async (req: Request, res: Response): Promise<void> => {
  const userId = getTargetUserId(req);
  const actorId = req.user?.id;
  const roleCodes: unknown = req.body.role_codes;
  if (!userId || !actorId || !Array.isArray(roleCodes) || !roleCodes.every((v) => typeof v === 'string')) {
    res.status(400).json({ message: 'Valid user ID and role_codes string array are required' });
    return;
  }

  const roles = await prisma.role.findMany({ where: { code: { in: roleCodes as string[] } } });
  if (roles.length !== roleCodes.length) {
    res.status(400).json({ message: 'One or more role codes are invalid' });
    return;
  }

  const result = await prisma.$transaction(async (tx) => {
    await tx.userRole.deleteMany({ where: { user_id: userId } });
    if (roles.length) {
      await tx.userRole.createMany({ data: roles.map((role) => ({ user_id: userId, role_id: role.id, assigned_by: actorId })) });
    }
    await tx.roleAuditLog.create({
      data: {
        actor_id: actorId,
        target_user_id: userId,
        action: 'ROLE_ASSIGN',
        detail: `Assigned roles: ${roleCodes.join(', ')}`,
      },
    });
    return tx.user.update({ where: { id: userId }, data: { token_version: { increment: 1 } }, select: { id: true, token_version: true } });
  });
  res.json({ message: 'Roles assigned successfully', user: result, role_codes: roleCodes });
};

export const assignDivisions = async (req: Request, res: Response): Promise<void> => {
  const userId = getTargetUserId(req);
  const actorId = req.user?.id;
  const divisionCodes: unknown = req.body.division_codes;
  if (!userId || !actorId || !Array.isArray(divisionCodes) || !divisionCodes.every((v) => typeof v === 'string')) {
    res.status(400).json({ message: 'Valid user ID and division_codes string array are required' });
    return;
  }

  const divisions = await prisma.division.findMany({ where: { code: { in: divisionCodes as string[] } } });
  if (divisions.length !== divisionCodes.length) {
    res.status(400).json({ message: 'One or more division codes are invalid' });
    return;
  }

  const result = await prisma.$transaction(async (tx) => {
    await tx.userDivision.deleteMany({ where: { user_id: userId } });
    if (divisions.length) {
      await tx.userDivision.createMany({ data: divisions.map((division) => ({ user_id: userId, division_id: division.id, assigned_by: actorId })) });
    }
    await tx.roleAuditLog.create({
      data: {
        actor_id: actorId,
        target_user_id: userId,
        action: 'DIVISION_ASSIGN',
        detail: `Assigned divisions: ${divisionCodes.join(', ')}`,
      },
    });
    return tx.user.update({ where: { id: userId }, data: { token_version: { increment: 1 } }, select: { id: true, token_version: true } });
  });
  res.json({ message: 'Divisions assigned successfully', user: result, division_codes: divisionCodes });
};
