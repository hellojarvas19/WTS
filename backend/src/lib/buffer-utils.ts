export class BufferUtils {
  static readBytes(buf: Buffer, offset: number, length: number): Buffer | undefined {
    if (offset < 0 || length < 0) {
      console.log('invalid offset or length: negative values not allowed')
      return
    }
    const end = offset + length
    if (buf.byteLength < end) {
      console.log('range out of bounds')
      return
    }
    return buf.subarray(offset, end)
  }

  static readBigUintLE(buf: Buffer, offset: number, length: number): bigint {
    // Bounds check before reading
    if (offset < 0 || length < 0 || offset + length > buf.byteLength) {
      console.log(`buffer bounds check failed: offset=${offset}, length=${length}, bufferLength=${buf.byteLength}`)
      return BigInt(0)
    }
    
    switch (length) {
      case 1:
        return BigInt(buf.readUint8(offset))
      case 2:
        return BigInt(buf.readUint16LE(offset))
      case 4:
        return BigInt(buf.readUint32LE(offset))
      case 8:
        return buf.readBigUint64LE(offset)
    }
    console.log(`unsupported data size (${length} bytes)`)
    return BigInt(0)
  }

  static readBoolean(buf: Buffer, offset: number, length: number): boolean {
    const data = this.readBytes(buf, offset, length)
    if (!data) return false

    for (const b of data) {
      if (b) return true
    }

    return false
  }
}
