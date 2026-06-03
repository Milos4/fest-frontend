export const getInstagramDisplayName = (url: string) => {
  try {
    const normalizedUrl = url.endsWith("/") ? url.slice(0, -1) : url;
    return normalizedUrl.substring(normalizedUrl.lastIndexOf("/") + 1);
  } catch {
    return url;
  }
};
