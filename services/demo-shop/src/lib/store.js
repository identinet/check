/**
 * @typedef {Object} SSENonce
 * @property {String} nonce Nonce.
 * @property {Boolean} closed Indicates that the stream has been closed.
 */

/**
 * @typedef {Object.<String,SSENonce>} Store
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
