// Role w zespole – ikony i etykiety
export const ROLES = {
  dev: { label: 'dev', icon: '💻' },
  front: { label: 'front', icon: '🎨' },
  qa: { label: 'qa', icon: '🔍' },
  pm: { label: 'pm', icon: '📋' },
};

export const ROLE_KEYS = Object.keys(ROLES);

export function roleIcon(role) {
  return ROLES[role]?.icon ?? '💻';
}
