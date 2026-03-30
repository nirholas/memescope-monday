/**
 * Resize an image file client-side using canvas.
 * Returns a new File that fits within the given max dimensions,
 * preserving aspect ratio and outputting as WebP for smaller sizes.
 */
export async function resizeImageFile(
  file: File,
  maxWidth: number,
  maxHeight: number,
): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new window.Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)

      let { width, height } = img

      // Only resize if the image exceeds the max dimensions
      if (width <= maxWidth && height <= maxHeight) {
        resolve(file)
        return
      }

      const ratio = Math.min(maxWidth / width, maxHeight / height)
      width = Math.round(width * ratio)
      height = Math.round(height * ratio)

      const canvas = document.createElement("canvas")
      canvas.width = width
      canvas.height = height

      const ctx = canvas.getContext("2d")
      if (!ctx) {
        resolve(file)
        return
      }

      ctx.drawImage(img, 0, 0, width, height)

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file)
            return
          }
          const resized = new File([blob], file.name.replace(/\.\w+$/, ".webp"), {
            type: "image/webp",
          })
          resolve(resized)
        },
        "image/webp",
        0.85,
      )
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error("Failed to load image for resizing"))
    }

    img.src = url
  })
}
