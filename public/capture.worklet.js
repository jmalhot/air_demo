/**
 * Audio capture worklet processor.
 * Runs on the dedicated audio rendering thread, isolated from the main UI thread.
 * Accumulates Float32 samples, converts to Int16 PCM, and posts to the main thread.
 */
const BUFFER_SIZE = 640; // 40ms at 16kHz — Google's recommended 20-40ms upper bound

class CaptureProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this._buffer = new Int16Array(BUFFER_SIZE);
    this._offset = 0;
  }

  process(inputs) {
    const input = inputs[0];
    if (!input || !input[0]) return true;

    const samples = input[0]; // Float32Array, 128 samples per render quantum
    for (let i = 0; i < samples.length; i++) {
      // Convert Float32 [-1.0, 1.0] → Int16 [-32768, 32767] with clamping
      this._buffer[this._offset++] = Math.max(-32768, Math.min(32767, samples[i] * 32768));

      if (this._offset >= BUFFER_SIZE) {
        // Transfer buffer ownership to main thread (zero-copy)
        const transfer = this._buffer.buffer;
        this.port.postMessage(transfer, [transfer]);
        this._buffer = new Int16Array(BUFFER_SIZE);
        this._offset = 0;
      }
    }
    return true; // keep processor alive
  }
}

registerProcessor('capture-processor', CaptureProcessor);
