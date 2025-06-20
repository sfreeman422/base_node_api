export const generateError = (error: unknown, correlationId: string) => {
  return {
    error,
    correlationId,
  };
};
