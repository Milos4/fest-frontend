export const DEFAULT_PROFILE_PICTURE_URL = "/default-profile.svg";

// Vraca korisnikovu sliku ili neutralni avatar ako je jos nije postavio.
export const profilePictureOrDefault = (url?: string | null): string =>
  url?.trim() || DEFAULT_PROFILE_PICTURE_URL;
