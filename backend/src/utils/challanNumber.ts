// src/utils/challanNumber.ts
import { prisma } from '../config/database';

export const generateChallanNumber = async (): Promise<string> => {
  const now = new Date();
  const datePart = now.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD

  // Count challans created today to get sequence
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

  const todayCount = await prisma.challan.count({
    where: {
      createdAt: {
        gte: startOfDay,
        lt: endOfDay,
      },
    },
  });

  const sequence = String(todayCount + 1).padStart(4, '0');
  return `CHN-${datePart}-${sequence}`;
};
