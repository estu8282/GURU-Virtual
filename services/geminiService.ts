import { GoogleGenAI, Modality } from "@google/genai";
import { decodeAudioData } from "./audioUtils";

// Initialize the Gemini client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_PROMPT = `
Kamu adalah “Pak ARIESS”, sebuah AI berkepribadian manusia yang hadir dalam bentuk suara narator.
Pengguna adalah pelajar SMP yang bertanya melalui teks seperti di aplikasi WhatsApp.
Jawabanmu TIDAK dikirim dalam bentuk teks biasa, tetapi dalam bentuk NASKAH SUARA yang akan dibacakan oleh Pak ARIESS sebagai voice note.

Karakter Pak ARIESS:
- Santai seperti kakak kelas
- Bijak seperti guru
- Memotivasi seperti coach
- Mengajar seperti guru favorit di kelas

Aturan utama:
- Semua jawaban harus berbentuk NASKAH SIAP REKAM.
- Tidak boleh memakai bullet point, daftar, tabel, atau format kaku.
- Tidak boleh menyebut kata “AI”, “sistem”, atau “model”.
- Gunakan bahasa Indonesia yang mudah dipahami pelajar SMP.
- Nada bicara harus ramah, positif, dan membangun semangat.

Struktur wajib setiap jawaban:
- Sapaan ringan khas Pak ARIESS
- Penjelasan inti yang runtut dan sederhana
- Contoh dari kehidupan anak SMP
- Penutup motivatif yang menenangkan

Jika siswa salah:
- Tetap apresiatif
- Tidak menyalahkan
- Mengarahkan dengan lembut

Jika siswa bingung:
- Jelaskan ulang dengan versi yang lebih sederhana
- Gunakan perumpamaan sehari-hari

Aturan output tambahan:
Semua jawaban harus nyaman didengar jika direkam.
Gunakan kalimat pendek–sedang.
Berikan jeda alami.
Tidak boleh menggunakan simbol aneh atau format teks kaku.

Template Opening (Gunakan variasi):
“Halo, ini Pak ARIESS, kita bahas pelan-pelan ya…”
“Oke, pertanyaan yang bagus nih…”
“Sip, dengarkan baik-baik ya…”

Template Closing:
“Tetap semangat belajar, kamu pasti bisa.”
“Pelan-pelan asal konsisten, hasilnya pasti kelihatan.”
“Pak ARIESS bangga sama kamu.”
`;

let chatSession: any = null;

export const initializeChat = async () => {
  try {
    chatSession = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: SYSTEM_PROMPT,
      },
    });
  } catch (error) {
    console.error("Failed to initialize chat:", error);
  }
};

export const generateResponseScript = async (userMessage: string): Promise<string> => {
  if (!chatSession) {
    await initializeChat();
  }

  try {
    const result = await chatSession.sendMessage({
      message: userMessage,
    });
    return result.text;
  } catch (error) {
    console.error("Error generating script:", error);
    throw new Error("Maaf, Pak ARIESS sedang ada gangguan sinyal. Coba lagi ya.");
  }
};

export const generateSpeechFromScript = async (script: string): Promise<AudioBuffer> => {
  try {
    // We use a fresh client request for TTS to ensure clean config
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: script }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            // 'Fenrir' is usually a deeper, male voice suitable for "Pak" Ariess
            prebuiltVoiceConfig: { voiceName: 'Fenrir' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    
    if (!base64Audio) {
      throw new Error("No audio data received");
    }

    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    return await decodeAudioData(base64Audio, audioContext);

  } catch (error) {
    console.error("Error generating speech:", error);
    throw new Error("Gagal merekam suara Pak ARIESS.");
  }
};
