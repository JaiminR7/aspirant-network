export const getTypeStyle = (type) => {
  const normalizedType = String(type || '').trim().toLowerCase();

  const styleMap = {
    question: 'bg-blue-100 text-blue-600',
    resource: 'bg-green-100 text-green-600',
    story: 'bg-purple-100 text-purple-600'
  };

  return styleMap[normalizedType] || 'bg-slate-100 text-slate-600';
};

export const normalizePostType = (type) => {
  const normalizedType = String(type || '').trim().toLowerCase();
  if (normalizedType === 'question' || normalizedType === 'resource' || normalizedType === 'story') {
    return normalizedType;
  }
  return 'question';
};

export const getPostTypeLabel = (type) => {
  const normalized = normalizePostType(type);
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
};
