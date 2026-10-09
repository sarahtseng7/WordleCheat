// imageCrop.js
//
// Loads an image and crops it to a centered slice - widthFraction of its
// natural width, heightFraction of its natural height - the same centered-
// crop math as WordGuessGame.java's loadMiddleSlice()/getSubimage(). Unlike
// a CSS clip-path, this produces an image whose actual pixel dimensions
// equal the cropped region, so a button/title sized to it has no leftover
// blank space.
//
// Resolves with a data URL on success, or null if the image is missing or
// fails to load (the caller is expected to fall back to plain text, exactly
// like the Java version's icon.getIconWidth() > 0 check).

function cropImage(src, widthFraction = 1, heightFraction = 1, maxWidth = null) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            const nw = img.naturalWidth;
            const nh = img.naturalHeight;

            const sw = Math.max(1, Math.round(nw * widthFraction));
            const sh = Math.max(1, Math.round(nh * heightFraction));
            const sx = Math.round((nw - sw) / 2);
            const sy = Math.round((nh - sh) / 2);

            let outW = sw;
            let outH = sh;
            if (maxWidth && outW > maxWidth) {
                const scale = maxWidth / outW;
                outW = maxWidth;
                outH = Math.max(1, Math.round(sh * scale));
            }

            const canvas = document.createElement('canvas');
            canvas.width = outW;
            canvas.height = outH;
            const ctx = canvas.getContext('2d');
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, sx, sy, sw, sh, 0, 0, outW, outH);

            resolve(canvas.toDataURL());
        };
        img.onerror = () => resolve(null);
        img.src = src;
    });
}
