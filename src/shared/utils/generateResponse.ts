export const generateResponse = (data: unknown, correlationId: string) => {
  return {
    data,
    correlationId,
  };
};
