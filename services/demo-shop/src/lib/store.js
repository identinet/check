/**
 * @typedef {Object} SSESession
 * @property {String} nonce Nonce.
 * @property {Boolean} closed Indicates that the stream has been closed.
 * @property {Boolean} mobile Indicates whether the session was started on a mobile device.
 * @property {Array} credentials Verifiable Credentials submitted by the user.
 */

/**
 * @typedef {Object.<String,SSESession>} Store
 */

/**
 * @type {Store} Can be replace with ./store_redis.js if the API is scaled horizontally.
 */
export const store = {};

/**
 * @typedef {Object.<String,Object>} ConnectionStore
 * @type {ConnectionStore}
 */
export const connections = {};
