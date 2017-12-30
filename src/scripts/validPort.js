/**
 * @param {number} port
 * @returns {boolean}
 */
export default function(port) {
	return typeof port === 'number' && port > 0;
}
