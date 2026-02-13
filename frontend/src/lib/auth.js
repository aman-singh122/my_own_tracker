"use client";

const COOKIE_NAME = "study_token";

export const setAuthToken = (token) => {
  const maxAge = 60 * 60 * 24 * 7;
  document.cookie = `${COOKIE_NAME}=${token}; path=/; max-age=${maxAge}; samesite=lax`;
};

export const getAuthToken = () => {
  if (typeof document === "undefined") return "";
  const cookies = document.cookie.split(";").map((part) => part.trim());
  const target = cookies.find((c) => c.startsWith(`${COOKIE_NAME}=`));
  return target ? decodeURIComponent(target.split("=")[1]) : "";
};

export const clearAuthToken = () => {
  document.cookie = `${COOKIE_NAME}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; samesite=lax`;
};
