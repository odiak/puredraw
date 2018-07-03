import { Readable } from 'stream'
import { PNG } from 'pngjs'

interface Bitmap {
  width: number
  height: number
  data: Uint8Array | Uint8ClampedArray
}

interface Point {
  x: number
  y: number
}

type Color = [number, number, number, number]

const { abs, round } = Math

export const TRANSPARENT = Object.freeze([0, 0, 0, 0]) as Color

export function createBitmap(width: number, height: number): Bitmap {
  return {
    width,
    height,
    data: new Uint8ClampedArray(width * height * 4)
  }
}

export function rgb(r: number, g: number, b: number): Color {
  return [r, g, b, 255]
}

export function rgba(r: number, g: number, b: number, a: number): Color {
  return [r, g, b, a]
}

export function exportAsPNG({ width, height, data }: Bitmap): Readable {
  const png = new PNG({ width, height })
  png.data.set(data)
  return png.pack()
}

export function putPixel({ width, height, data }: Bitmap, { x, y }: Point, [r, g, b, a]: Color) {
  if (x < 0 || y < 0 || x >= width || y >= height) return

  const i = (x + y * width) * 4
  data[i + 0] = r
  data[i + 1] = g
  data[i + 2] = b
  data[i + 3] = a
}

export function getPixel({ width, height, data }: Bitmap, { x, y }: Point): Color {
  if (x < 0 || y < 0 || x >= width || y >= height) {
    throw new Error('out of bounds')
  }

  const i = (x + y * width) * 4
  return [data[i], data[i + 1], data[i + 2], data[i + 3]]
}

function composite1(n1: number, n2: number, a1: number, a2: number): number {
  return round((n1 * a1 + n2 * a2 * (1 - a1)) / (a1 + a2 * (1 - a1)))
}

export function compositeColor(newColor: Color, oldColor: Color): Color {
  return newColor.map((_, i) =>
    composite1(newColor[i], oldColor[i], newColor[3] / 255, oldColor[3] / 255)
  ) as Color
}

export function putPixelWithComposition(image: Bitmap, point: Point, color: Color) {
  putPixel(image, point, compositeColor(color, getPixel(image, point)))
}

export function clearRect(
  image: Bitmap,
  { x: x1, y: y1 }: Point = { x: 0, y: 0 },
  { x: x2, y: y2 }: Point = { x: image.width, y: image.height }
) {
  for (let x = x1; x <= x2; x++) {
    for (let y = y1; y <= y2; y++) {
      putPixel(image, { x, y }, TRANSPARENT)
    }
  }
}

export function drawLine(
  image: Bitmap,
  p1: Point,
  p2: Point,
  color: Color,
  width: number = 1,
  antiAliasing = true
) {
  if (antiAliasing) {
    drawLineAA(image, p1, p2, color, width)
  } else {
    drawLineNoAA(image, p1, p2, color, width)
  }
}

function drawLineAA(
  image: Bitmap,
  { x: x1, y: y1 }: Point,
  { x: x2, y: y2 }: Point,
  color: Color,
  width: number
) {}

function drawLineNoAA(
  image: Bitmap,
  { x: x1, y: y1 }: Point,
  { x: x2, y: y2 }: Point,
  color: Color,
  width: number
) {
  const dx = abs(x1 - x2)
  const dy = abs(y1 - y2)
  if (dx > dy) {
    if (x1 > x2) {
      ;[x1, x2] = [x2, x1]
      ;[y1, y2] = [y2, y1]
    }
    const sy = y2 > y1 ? 1 : -1
    let error = 0
    for (let x = x1, y = y1; x <= x2; x++) {
      putPixel(image, { x, y }, color)
      error += 2 * dy
      if (error > dx) {
        error -= 2 * dx
        y += sy
      }
    }
  } else {
    if (y1 > y2) {
      ;[x1, x2] = [x2, x1]
      ;[y1, y2] = [y2, y1]
    }
    const sx = x2 > x1 ? 1 : -1
    let error = 0
    for (let x = x1, y = y1; y <= y2; y++) {
      putPixel(image, { x, y }, color)
      error += 2 * dx
      if (error > dy) {
        error -= 2 * dy
        x += sx
      }
    }
  }
}
