const FONT_FAMILY = 'Pixel Arial 11';

const REGULAR_PARTS = [
  new URL(
    '../assets/fonts/pixel-arial-regular-1.b64',
    import.meta.url,
  ),
  new URL(
    '../assets/fonts/pixel-arial-regular-2.b64',
    import.meta.url,
  ),
  new URL(
    '../assets/fonts/pixel-arial-regular-3.b64',
    import.meta.url,
  ),
];

const BOLD_PARTS = [
  new URL(
    '../assets/fonts/pixel-arial-bold-1.b64',
    import.meta.url,
  ),
  new URL(
    '../assets/fonts/pixel-arial-bold-2.b64',
    import.meta.url,
  ),
  new URL(
    '../assets/fonts/pixel-arial-bold-3.b64',
    import.meta.url,
  ),
];

const blobUrls = [];
let loadPromise = null;

async function readBase64(parts) {
  const chunks =
    await Promise.all(
      parts.map(
        async url => {
          const response =
            await fetch(url);

          if (!response.ok) {
            throw new Error(
              `font chunk failed: ${url.pathname}`,
            );
          }

          return (
            await response.text()
          ).trim();
        },
      ),
    );

  return chunks.join('');
}

function decodeBase64(base64) {
  const binary = atob(base64);
  const bytes =
    new Uint8Array(
      binary.length,
    );

  for (
    let i = 0;
    i < binary.length;
    i++
  ) {
    bytes[i] =
      binary.charCodeAt(i);
  }

  return bytes;
}

async function loadFace(
  parts,
  weight,
) {
  const base64 =
    await readBase64(parts);

  const bytes =
    decodeBase64(base64);

  const blob =
    new Blob(
      [bytes],
      {
        type: 'font/woff2',
      },
    );

  const url =
    URL.createObjectURL(blob);

  blobUrls.push(url);

  const face =
    new FontFace(
      FONT_FAMILY,
      `url("${url}") format("woff2")`,
      {
        style: 'normal',
        weight: String(weight),
      },
    );

  const loaded =
    await face.load();

  document.fonts.add(loaded);

  return loaded;
}

export function loadPixelArial() {
  if (!loadPromise) {
    loadPromise =
      Promise.all([
        loadFace(
          REGULAR_PARTS,
          400,
        ),
        loadFace(
          BOLD_PARTS,
          700,
        ),
      ])
        .then(() => true)
        .catch(error => {
          console.warn(
            'Pixel Arial 11 failed to load; using fallback font.',
            error,
          );

          return false;
        });
  }

  return loadPromise;
}

export const PIXEL_FONT_FAMILY =
  FONT_FAMILY;
