import * as fs from 'fs'
import * as pd from '../src'

const im = pd.createBitmap(100, 100)
im.data.fill(100)
for (let i = 0; i < 5; i++) {
  pd.drawLine(im, { x: 10, y: 30 }, { x: 90, y: 10 + i * 10 }, pd.rgb(100 + i * 20, 0, 0), 1, false)
}
for (let i = 0; i < 5; i++) {
  pd.drawLine(im, { x: 30, y: 10 }, { x: 10 + i * 10, y: 90 }, pd.rgb(0, 0, 100 + i * 20), 1, false)
}

pd.exportAsPNG(im).pipe(fs.createWriteStream('demo/out.png'))
