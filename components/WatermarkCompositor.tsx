// We don't need a React component for this logic, but we'll export a function
// that uses HTML5 Canvas to merge the images.

export const compositeWatermark = (
  baseImageSrc: string,
  logoSrc: string
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      reject("No canvas context");
      return;
    }

    const baseImg = new Image();
    const logoImg = new Image();

    baseImg.onload = () => {
      canvas.width = baseImg.width;
      canvas.height = baseImg.height;

      // Draw base AI image
      ctx.drawImage(baseImg, 0, 0);

      logoImg.onload = () => {
        // Calculate logo size (e.g., 15% of the shortest edge of the base image)
        const scaleFactor = 0.15;
        const baseMinDim = Math.min(baseImg.width, baseImg.height);
        
        let logoWidth = logoImg.width;
        let logoHeight = logoImg.height;
        const aspectRatio = logoWidth / logoHeight;

        // Resize logo
        if (logoWidth > logoHeight) {
            logoWidth = baseMinDim * scaleFactor;
            logoHeight = logoWidth / aspectRatio;
        } else {
            logoHeight = baseMinDim * scaleFactor;
            logoWidth = logoHeight * aspectRatio;
        }

        // Position: Bottom Right with padding
        const padding = baseMinDim * 0.05;
        const x = canvas.width - logoWidth - padding;
        const y = canvas.height - logoHeight - padding;

        // Set global alpha for a slight transparency if desired, or keep solid
        ctx.globalAlpha = 0.9; 
        ctx.drawImage(logoImg, x, y, logoWidth, logoHeight);
        ctx.globalAlpha = 1.0;

        resolve(canvas.toDataURL('image/png'));
      };

      logoImg.onerror = (err) => reject(err);
      logoImg.src = logoSrc;
    };

    baseImg.onerror = (err) => reject(err);
    baseImg.src = baseImageSrc;
  });
};
