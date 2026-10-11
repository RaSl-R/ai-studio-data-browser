const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const FORBIDDEN_SQL_KEYWORDS = [
  "DELETE", "UPDATE", "INSERT", "DROP",
  "ALTER", "EXEC", "EXECUTE", "CREATE", "TRUNCATE"
];

const SQL_COMMENT_PATTERNS = [";", "--", "/*"];

export const validateEmail = (email: string): { isValid: boolean; error?: string } => {
  if (!email) return { isValid: false, error: "Email cannot be empty." };
  if (!EMAIL_REGEX.test(email)) return { isValid: false, error: "Invalid email format." };
  return { isValid: true };
};

export const validatePassword = (password: string): { isValid: boolean; error?: string } => {
  if (!password) return { isValid: false, error: "Password cannot be empty." };
  if (password.length < 8) return { isValid: false, error: "Password must be at least 8 characters." };
  return { isValid: true };
};

export const getPasswordStrength = (password: string): { score: number; label: string; color: string } => {
  if (!password) return { score: 0, label: "Weak", color: "bg-gray-200" };
  
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  
  if (score < 2) return { score, label: "Weak", color: "bg-red-500" };
  if (score < 4) return { score, label: "Medium", color: "bg-yellow-500" };
  return { score, label: "Strong", color: "bg-green-500" };
};

export const validateWhereClause = (clause: string): { isValid: boolean; error?: string } => {
  if (!clause) return { isValid: true };
  
  for (const pattern of SQL_COMMENT_PATTERNS) {
    if (clause.includes(pattern)) {
      return { 
        isValid: false, 
        error: `SQL Injection attempt detected: comment pattern '${pattern}'` 
      };
    }
  }
  
  for (const keyword of FORBIDDEN_SQL_KEYWORDS) {
    const regex = new RegExp(`\\b${keyword}\\b`, 'i');
    if (regex.test(clause)) {
      return { isValid: false, error: "Forbidden SQL keyword detected." };
    }
  }
  
  return { isValid: true };
};

export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleString('cs-CZ');
};

export function isValidIdentifier(name: string): boolean {
  return /^[a-zA-Z0-9_]+$/.test(name);
}

export function escapeIdentifier(name: string): string {
  if (!isValidIdentifier(name)) {
    throw new Error(`Invalid SQL identifier: ${name}`);
  }
  return `"${name}"`;
}

// =====================================================
// JWT UTILITIES (Web Crypto API)
// =====================================================

async function getCryptoKey(secret: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  return crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

function base64UrlEncode(arr: Uint8Array): string {
  let str = '';
  for (let i = 0; i < arr.length; i++) {
    str += String.fromCharCode(arr[i]);
  }
  return btoa(str)
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64UrlDecode(str: string): string {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) {
    str += '=';
  }
  return atob(str);
}

export async function signJWT(payload: Record<string, any>, secret: string, expiresInSec = 86400): Promise<string> {
  const header = { alg: 'HS256', typ: 'JWT' };
  const exp = Math.floor(Date.now() / 1000) + expiresInSec;
  const fullPayload = { ...payload, exp };

  const encHeader = base64UrlEncode(new TextEncoder().encode(JSON.stringify(header)));
  const encPayload = base64UrlEncode(new TextEncoder().encode(JSON.stringify(fullPayload)));

  const dataToSign = new TextEncoder().encode(`${encHeader}.${encPayload}`);
  const key = await getCryptoKey(secret);
  const sig = await crypto.subtle.sign('HMAC', key, dataToSign);
  const encSig = base64UrlEncode(new Uint8Array(sig));

  return `${encHeader}.${encPayload}.${encSig}`;
}

export async function verifyJWT(token: string, secret: string): Promise<Record<string, any> | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [encHeader, encPayload, encSig] = parts;
    const dataToVerify = new TextEncoder().encode(`${encHeader}.${encPayload}`);
    const key = await getCryptoKey(secret);

    const sigStr = base64UrlDecode(encSig);
    const sigArr = new Uint8Array(sigStr.length);
    for (let i = 0; i < sigStr.length; i++) {
      sigArr[i] = sigStr.charCodeAt(i);
    }

    const isValid = await crypto.subtle.verify('HMAC', key, sigArr, dataToVerify);
    if (!isValid) return null;

    const payload = JSON.parse(base64UrlDecode(encPayload));
    if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}
