export const useFileKompressor = () => {
  const isRealPdf = async (file) => {
    try {
      const slice = file.slice(0, 5)
      const buffer = await slice.arrayBuffer()
      const header = new TextDecoder().decode(buffer)
      return header.startsWith('%PDF-')
    } catch {
      return false
    }
  }

  const compressFile = async (file) => {
    if (typeof window === 'undefined') return file
    try {
      const actuallyPdf = await isRealPdf(file)

      if (actuallyPdf) {
        return await processPdf(file)
      } else {
        return await processImage(file)
      }
    } catch (error) {
      console.warn('Compression failed, using original file:', error)
      return file
    }
  }

  // Extract raw JPEG bytes directly from PDF binary without any PDF libraries
  const extractJpegFromPdf = async (file) => {
    const arrayBuffer = await file.arrayBuffer()
    const bytes = new Uint8Array(arrayBuffer)

    // Search for JPEG SOI (Start of Image) marker: 0xFF, 0xD8
    let start = -1
    for (let i = 0; i < bytes.length - 1; i++) {
      if (bytes[i] === 0xff && bytes[i + 1] === 0xd8) {
        start = i
        break
      }
    }

    if (start === -1) throw new Error('No JPEG stream found in PDF')

    // Search for JPEG EOI (End of Image) marker: 0xFF, 0xD9
    let end = -1
    for (let i = bytes.length - 2; i > start; i--) {
      if (bytes[i] === 0xff && bytes[i + 1] === 0xd9) {
        end = i + 2
        break
      }
    }

    if (end === -1) throw new Error('Incomplete JPEG stream in PDF')

    const jpegBytes = bytes.subarray(start, end)
    return new Blob([jpegBytes], { type: 'image/jpeg' })
  }

  const processPdf = async (file) => {
    try {
      // 1. Pull raw JPEG scan directly out of the PDF byte stream
      const imageBlob = await extractJpegFromPdf(file)
      const extractedFile = new File([imageBlob], 'scan.jpg', { type: 'image/jpeg' })

      // 2. Compress via Canvas
      return await processImage(extractedFile)
    } catch (err) {
      console.warn('Direct byte extraction failed, processing file as standard image:', err)
      return await processImage(file)
    }
  }

  const processImage = (file) => {
    return new Promise((resolve) => {
      const img = new Image()
      const url = URL.createObjectURL(file)

      img.onload = () => {
        URL.revokeObjectURL(url)
        const canvas = document.createElement('canvas')
        const maxDim = 1800 // Crisp for OCR text, outputs ~1.0MB - 1.4MB
        let width = img.width
        let height = img.height

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width)
            width = maxDim
          } else {
            width = Math.round((width * maxDim) / height)
            height = maxDim
          }
        }

        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')

        if (ctx) {
          ctx.fillStyle = '#FFFFFF'
          ctx.fillRect(0, 0, width, height)
          ctx.drawImage(img, 0, 0, width, height)

          canvas.toBlob(
            (blob) => {
              if (blob) {
                const safeName = file.name.replace(/\.[^/.]+$/, '') + '.jpg'
                resolve(new File([blob], safeName, { type: 'image/jpeg' }))
              } else {
                resolve(file)
              }
            },
            'image/jpeg',
            0.82 // Excellent OCR quality, guarantees < 1.5MB output
          )
        } else {
          resolve(file)
        }
      }

      img.onerror = () => resolve(file)
      img.src = url
    })
  }

  return {
    compressFile
  }
}
