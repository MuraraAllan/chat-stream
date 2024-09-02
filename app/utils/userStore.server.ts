const userStore = new Map<string, string>();

export function getUserId(request: Request): string {
  const cookie = request.headers.get("Cookie");
  const userId = cookie?.match(/userId=([^;]+)/)?.[1];

  if (userId && userStore.has(userId)) {
    return userId;
  }

  const newUserId = "user-" + Math.random().toString(36).substr(2, 9);
  userStore.set(newUserId, new Date().toISOString());
  return newUserId;
}

export function getUserIdCookie(userId: string): string {
  return `userId=${userId}; Path=/; HttpOnly; SameSite=Strict`;
}
