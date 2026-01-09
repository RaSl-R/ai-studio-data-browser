"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatDate = exports.validateWhereClause = exports.getPasswordStrength = exports.validatePassword = exports.validateEmail = void 0;
var EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
var FORBIDDEN_SQL_KEYWORDS = [
    "DELETE", "UPDATE", "INSERT", "DROP",
    "ALTER", "EXEC", "EXECUTE", "CREATE", "TRUNCATE"
];
var SQL_COMMENT_PATTERNS = [";", "--", "/*"];
var validateEmail = function (email) {
    if (!email)
        return { isValid: false, error: "Email cannot be empty." };
    if (!EMAIL_REGEX.test(email))
        return { isValid: false, error: "Invalid email format." };
    return { isValid: true };
};
exports.validateEmail = validateEmail;
var validatePassword = function (password) {
    if (!password)
        return { isValid: false, error: "Password cannot be empty." };
    if (password.length < 8)
        return { isValid: false, error: "Password must be at least 8 characters." };
    return { isValid: true };
};
exports.validatePassword = validatePassword;
var getPasswordStrength = function (password) {
    if (!password)
        return { score: 0, label: "Weak", color: "bg-gray-200" };
    var score = 0;
    if (password.length >= 8)
        score++;
    if (/[A-Z]/.test(password))
        score++;
    if (/[0-9]/.test(password))
        score++;
    if (/[^A-Za-z0-9]/.test(password))
        score++;
    if (score < 2)
        return { score: score, label: "Weak", color: "bg-red-500" };
    if (score < 4)
        return { score: score, label: "Medium", color: "bg-yellow-500" };
    return { score: score, label: "Strong", color: "bg-green-500" };
};
exports.getPasswordStrength = getPasswordStrength;
var validateWhereClause = function (clause) {
    if (!clause)
        return { isValid: true };
    // Check for comments
    for (var _i = 0, SQL_COMMENT_PATTERNS_1 = SQL_COMMENT_PATTERNS; _i < SQL_COMMENT_PATTERNS_1.length; _i++) {
        var pattern = SQL_COMMENT_PATTERNS_1[_i];
        if (clause.includes(pattern)) {
            return {
                isValid: false,
                error: "SQL Injection attempt detected: comment pattern '".concat(pattern, "'")
            };
        }
    }
    // Check for forbidden keywords
    for (var _a = 0, FORBIDDEN_SQL_KEYWORDS_1 = FORBIDDEN_SQL_KEYWORDS; _a < FORBIDDEN_SQL_KEYWORDS_1.length; _a++) {
        var keyword = FORBIDDEN_SQL_KEYWORDS_1[_a];
        var regex = new RegExp("\\b".concat(keyword, "\\b"), 'i');
        if (regex.test(clause)) {
            return { isValid: false, error: "Forbidden SQL keyword detected." };
        }
    }
    return { isValid: true };
};
exports.validateWhereClause = validateWhereClause;
var formatDate = function (dateString) {
    return new Date(dateString).toLocaleString('cs-CZ');
};
exports.formatDate = formatDate;
