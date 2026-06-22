import Constants from "expo-constants";
import axios from "axios";

/**
 * Серверийн суурь хаяг.
 * __DEV__ (Expo Go): Metro-ийн LAN host + :3000 — ижил Wi‑Fi дээр backend (npm run server).
 *   EXPO_PUBLIC_FORCE_REMOTE_API=true бол .env-ийн туннель URL ашиглана.
 * Production: EXPO_PUBLIC_API_URL эсвэл app.json → expo.extra.apiBaseUrl
 * Android emulator: 10.0.2.2:3000
 */
function stripTrailingSlash(url) {
  return String(url || "").replace(/\/+$/, "");
}

function devHostFromExpo() {
  const hostUri =
    Constants.expoConfig?.hostUri ||
    Constants.expoGoConfig?.debuggerHost ||
    Constants.manifest2?.extra?.expoClient?.hostUri ||
    Constants.manifest?.debuggerHost;

  if (!hostUri) return null;
  const host = String(hostUri).split(":")[0];
  return host || null;
}

function resolveApiBaseUrl() {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  const envUrl = fromEnv && String(fromEnv).trim() ? stripTrailingSlash(fromEnv) : null;
  const forceRemote =
    process.env.EXPO_PUBLIC_FORCE_REMOTE_API === "true" ||
    process.env.EXPO_PUBLIC_FORCE_REMOTE_API === "1";

  const fromExtra = Constants.expoConfig?.extra?.apiBaseUrl;
  const extraUrl =
    fromExtra && String(fromExtra).trim() ? stripTrailingSlash(fromExtra) : null;

  if (typeof __DEV__ !== "undefined" && __DEV__) {
    if (forceRemote && envUrl) {
      return envUrl;
    }
    const host = devHostFromExpo();
    if (host) {
      return `http://${host}:3000`;
    }
    if (envUrl) {
      return envUrl;
    }
    if (extraUrl) {
      return extraUrl;
    }
    return "http://10.0.2.2:3000";
  }

  if (envUrl) {
    return envUrl;
  }
  if (extraUrl) {
    return extraUrl;
  }

  return "http://localhost:3000";
}

export const API_BASE_URL = resolveApiBaseUrl();

/**
 * Axios алдааг хэрэглэгчид ойлгомжтой болгох (502 = прокси, backend унтарсан г.м.)
 */
export function formatApiHttpError(error) {
  if (!error) return "Тодорхойгүй алдаа";
  const status = error.response?.status;
  if (status === 502 || status === 504) {
    return `Шлюзийн алдаа (${status}): ихэвчлэн Express backend ажиллахгүй байна.\nТусдаа терминалд: npm run server (порт 3000)\nЭсвэл: npm run start:all\nХаяг: ${API_BASE_URL}\nNgrok ашиглавал туннель + local backend хоёулаа асаалттай эсэхийг шалгана уу.`;
  }
  if (status === 503) {
    const msg = error.response?.data?.message;
    if (msg) return String(msg);
    return "Сервер түр завсарлаж байна (өгөгдлийн сантай синк). Хэдэн секундын дараа дахин оролдоно уу.";
  }
  if (error.code === "ECONNABORTED") {
    return "Хүсэлт хэт удаан — сервер асаалттай эсэхийг шалгана уу.";
  }
  if (error.code === "ERR_NETWORK" || error.message === "Network Error") {
    return `Сүлжээний алдаа. Сервер: ${API_BASE_URL}\nBackend (порт 3000) асааж, Wi‑Fi / EXPO_PUBLIC_API_URL тохируулна уу.`;
  }
  const serverMsg = error.response?.data?.message;
  if (serverMsg) return String(serverMsg);
  if (error.message) return error.message;
  return "Хүсэлт амжилтгүй";
}

/** Ngrok-ийн үнэгүй домэйн HTML interstitial-ийг API дуудлагаас алгасна */
if (/ngrok-free\.app|ngrok\.io|ngrok\.app|serveousercontent\.com/i.test(API_BASE_URL)) {
  axios.defaults.headers.common["ngrok-skip-browser-warning"] = "69420";
}
