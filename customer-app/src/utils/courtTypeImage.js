import { serverOrigin } from '../services/api';

const FALLBACK_IMAGES = {
  badminton: require('../image/badminton.jpg'),
  tennis: require('../image/tennis.jpg'),
  football: require('../image/football.jpg'),
  table_tennis: require('../image/table_tennis.jpg'),
};

export const COURT_TYPE_LABELS = {
  badminton: 'Cầu lông',
  tennis: 'Tennis',
  football: 'Bóng đá',
  table_tennis: 'Bóng bàn',
};

export function getCourtTypeLabel(name) {
  return COURT_TYPE_LABELS[name] || name || '—';
}

function resolveImageUrl(image) {
  if (!image) return null;
  if (/^https?:\/\//i.test(image)) return image;
  if (image.startsWith('/')) return `${serverOrigin}${image}`;
  return `${serverOrigin}/${image}`;
}

export function getCourtTypeImageSource(courtType) {
  const remoteUrl = resolveImageUrl(courtType?.image);
  if (remoteUrl) {
    return { uri: remoteUrl };
  }
  return FALLBACK_IMAGES[courtType?.name] || FALLBACK_IMAGES.badminton;
}
