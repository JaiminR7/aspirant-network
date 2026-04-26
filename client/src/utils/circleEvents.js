/**
 * Lightweight pub/sub for circle membership changes.
 * Lets CircleDetail, Circles list, and AppLayout sidebar stay in sync
 * without requiring a shared context or prop drilling.
 *
 * Usage:
 *   emit: emitCircleMembershipChanged({ circleId, isMember, membersCount })
 *   subscribe: const off = onCircleMembershipChanged(({ circleId, isMember, membersCount }) => { ... })
 *              Call off() to unsubscribe (use in useEffect cleanup).
 */

const EVENT_NAME = 'circle:membership-changed';

/**
 * @param {{ circleId: string, isMember: boolean, membersCount: number }} detail
 */
export function emitCircleMembershipChanged(detail) {
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail }));
}

/**
 * @param {(detail: { circleId: string, isMember: boolean, membersCount: number }) => void} handler
 * @returns {() => void} unsubscribe function
 */
export function onCircleMembershipChanged(handler) {
  const listener = (e) => handler(e.detail);
  window.addEventListener(EVENT_NAME, listener);
  return () => window.removeEventListener(EVENT_NAME, listener);
}
