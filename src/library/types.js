/**
 * @typedef {'unknown'|'checking'|'up_to_date'|'update_available'|'error'} UpdateStatus
 * @typedef {'idle'|'scanning'|'ready'|'error'} LibraryScanState
 * @typedef {'installed'|'not_installed'|'unknown'} InstallState
 *
 * @typedef {Object} Game
 * @property {string} id
 * @property {string} title
 * @property {string|null} [coverUrl]
 * @property {string|null} [installPath]
 * @property {string|null} [executable]
 * @property {string|null} [lastPlayedAt]
 * @property {number} [playtimeMinutes]
 * @property {UpdateStatus} updateStatus
 * @property {string|null} [updateMessage]
 * @property {InstallState} installState
 * @property {string|null} [epicAppName]
 * @property {string|null} [catalogNamespace]
 * @property {string|null} [catalogItemId]
 *
 * @typedef {Object} LibrarySnapshot
 * @property {LibraryScanState} scanState
 * @property {string|null} [scanMessage]
 * @property {Game[]} games
 * @property {string|null} [lastScannedAt]
 * @property {boolean} [epicDetected]
 */

module.exports = {};
