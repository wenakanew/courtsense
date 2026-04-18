class PCMProcessor extends AudioWorkletProcessor {
    process(inputs, outputs, parameters) {
        const input = inputs[0];
        if (input && input.length > 0) {
            const channelData = input[0];
            if (channelData) {
                // Send raw Float32Array to main thread
                this.port.postMessage(channelData);
            }
        }
        return true; // Keep alive
    }
}

registerProcessor('pcm-processor', PCMProcessor);
