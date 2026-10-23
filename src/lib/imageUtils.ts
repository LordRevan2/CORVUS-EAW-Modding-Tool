import TGA from 'tga-js';

/**
 * Converts an image file (including .tga, .png, .jpg, .webp, .bmp) to a data URL that can be displayed by <img> or SVG <image>.
 */
export async function fileToImageUrl(file: File): Promise<string> {
  const fileName = file.name.toLowerCase();
  
  if (fileName.endsWith('.tga')) {
    const buffer = await file.arrayBuffer();
    const tga = new TGA();
    tga.load(new Uint8Array(buffer));
    return tga.getDataURL('image/png');
  }

  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = (e) => reject(new Error('Failed to read image file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Searches a list of workspace files for potential Galaxy background texture / map files.
 */
export function findGalaxyBackgroundImage(files: File[]): File | undefined {
  const imageExtensions = ['.tga', '.png', '.jpg', '.jpeg', '.webp', '.bmp'];
  const candidateFiles = files.filter(f => {
    const lower = f.name.toLowerCase();
    return imageExtensions.some(ext => lower.endsWith(ext));
  });

  if (candidateFiles.length === 0) return undefined;

  // Priority order for galaxy background file names commonly used in Empire at War mods
  const patterns = [
    /galaxy[-_]?background/i,
    /w[-_]?galaxy[-_]?background/i,
    /galaxy[-_]?map/i,
    /galactic[-_]?map/i,
    /map[-_]?galaxy/i,
    /galaxy[-_]?core/i,
    /^galaxy\.(tga|png|jpg|jpeg|webp)$/i,
    /^galactic\.(tga|png|jpg|jpeg|webp)$/i,
    /background\.(tga|png|jpg|jpeg|webp)$/i,
  ];

  for (const pattern of patterns) {
    const match = candidateFiles.find(f => pattern.test(f.name));
    if (match) return match;
  }

  // Fallback: any image containing "galaxy" or "galactic"
  return candidateFiles.find(f => {
    const lower = f.name.toLowerCase();
    return lower.includes('galaxy') || lower.includes('galactic');
  });
}
