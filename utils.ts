import { PermissionLevel } from "./types";

// Replicating validators from the PDF
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
    // Simplified complexity check for demo
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
    const upperClause = clause.toUpperCase();
    
    // Check for comments
    for (const pattern of SQL_COMMENT_PATTERNS) {
        if (clause.includes(pattern)) {
            return { isValid: false, error: `SQL Injection attempt detected: comment pattern '${pattern}'` };
        }
    }

    // Check for forbidden keywords (simplified word boundary check)
    for (const keyword of FORBIDDEN_SQL_KEYWORDS) {
        const regex = new RegExp(`\\b${keyword}\\b`, 'i');
        if (regex.test(clause)) {
            return { isValid: false, error: "Forbidden SQL keyword detected." };
        }
    }

    return { isValid: true };
};

export const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('cs-CZ'); // Using Czech locale as per PDF context
};