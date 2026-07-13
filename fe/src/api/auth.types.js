/**
 * @typedef {Object} AuthUserDto
 * @property {string} id
 * @property {string} username
 * @property {string} email
 * @property {string} displayName
 * @property {string} role
 * @property {boolean} isPremium
 * @property {string|null} [avatarUrl]
 * @property {boolean} [emailConfirmed]
 * @property {boolean} [isProfileComplete]
 * @property {number} points
 * @property {string|null} [levelName]
 */

/**
 * @typedef {Object} LoginResponse
 * @property {string} accessToken
 * @property {number} expiresIn
 * @property {string} refreshToken
 * @property {number} refreshExpiresIn
 * @property {AuthUserDto} user
 */

/**
 * @typedef {Object} MeResponse
 * @property {string} id
 * @property {string} username
 * @property {string} email
 * @property {string} displayName
 * @property {string} role
 * @property {boolean} isPremium
 * @property {string|null} [avatarUrl]
 * @property {number} points
 * @property {string|null} [levelName]
 * @property {boolean} [emailConfirmed]
 * @property {boolean} [isProfileComplete]
 */

/**
 * @typedef {Object} ApiErrorItem
 * @property {string} field
 * @property {string} message
 */

/**
 * @typedef {Object} ApiEnvelope
 * @property {boolean} success
 * @property {unknown} [data]
 * @property {string|null} [message]
 * @property {ApiErrorItem[]} [errors]
 */

export {};
