export const features = {
  whatsappApi: false,
  pointsRedemption: false,
  dailyReminders: false,
} as const;

export type FeatureFlag = keyof typeof features;
