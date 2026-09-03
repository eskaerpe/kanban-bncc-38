import { prisma } from './prisma';

export const logCardActivity = async (
  cardId: number,
  userId: number,
  actionType: string,
  description: string
): Promise<void> => {
  try {
    await prisma.cardActivity.create({
      data: {
        card_id: cardId,
        user_id: userId,
        action_type: actionType,
        description,
      },
    });
  } catch (error) {
    console.error('Failed to log card activity:', error);
  }
};
