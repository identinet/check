/**
 * Determines if the page is viewed on a mobile device.
 * Warning: It does not determine whether the screen is small or large!
 *
 * @type {() => boolean}
 */
export default function isMobile() {
  return /Mobi|Android|iPhone|iPad|iPod|Windows Phone/i.test(
    navigator.userAgent,
  );
}
