export function createPublicLog(message) {
  return {
    scope: 'public',
    message,
    createdAt: new Date().toISOString()
  };
}
