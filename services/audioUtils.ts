export const decodeAudioData = async (
  base64String: string,
  audioContext: AudioContext
): Promise<AudioBuffer> => {
  const binaryString = atob(base64String);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  // Determine if it's raw PCM or a container format based on header (simplified)
  // The Gemini API currently returns raw PCM in most configurations or encapsulated in the response.
  // We will assume the API returns a format decodeAudioData can handle (MP3/WAV) or we configure it as such.
  // However, for `gemini-2.5-flash-preview-tts`, it often sends raw PCM. 
  // We'll try native decode first.
  
  try {
    // If the API returns a WAV container (which it often does for standard tts endpoints), this works.
    return await audioContext.decodeAudioData(bytes.buffer.slice(0));
  } catch (e) {
    // Fallback for raw PCM if necessary (assuming 24kHz mono based on docs)
    // Creating a buffer manually if decodeAudioData fails (implies raw data without header)
    const pcmData = new Int16Array(bytes.buffer);
    const channels = 1;
    const sampleRate = 24000;
    const buffer = audioContext.createBuffer(channels, pcmData.length, sampleRate);
    const channelData = buffer.getChannelData(0);
    for (let i = 0; i < pcmData.length; i++) {
      // Convert Int16 to Float32 [-1.0, 1.0]
      channelData[i] = pcmData[i] / 32768.0;
    }
    return buffer;
  }
};
