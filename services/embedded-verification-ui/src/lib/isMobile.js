/**
 * Determines if the page is viewed on a mobile device.
 * Warning: It does not determine whether the screen is small or large!
 *
 * @type {() => boolean}
 */
export default function isMobile() {
  // always use mobile version of EVI
  return true;
  // return /Mobi|Android|iPhone|iPad|iPod|Windows Phone/i.test(
  //   navigator.userAgent,
  // );
}
