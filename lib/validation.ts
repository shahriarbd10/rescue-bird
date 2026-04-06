export function isValidLatitude(value: number) {
  return Number.isFinite(value) && value >= -90 && value <= 90;
}

export function isValidLongitude(value: number) {
  return Number.isFinite(value) && value >= -180 && value <= 180;
}

export function isValidLatLng(lat: number, lng: number) {
  return isValidLatitude(lat) && isValidLongitude(lng);
}
