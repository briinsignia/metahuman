import apiService from "../apiService";

export async function postTranscribeAudio(formData: any): Promise<any> {
  return apiService
    .post("/transcribe-audio", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    })
    .then((response) => response.data);
}

export async function getResponseAudio(text: string): Promise<any> {
  return apiService
    .post("/testing/query", { query: text })
    .then((res) => res.data);
}

export async function getResponseAudioText(text: string): Promise<any> {
  return apiService
    .post("/testing_v2/query", { query: text })
    .then((res) => res.data);
}

export async function getMiddlewareResponseAudioText(text: string): Promise<any> {
  return apiService
    .post("/metahuman/response_audio_v2", { query: text })
    .then((res) => res.data);
}

export async function silentAI() {
  // return apiService.get("/healthcheck");
  return apiService.get("/metahuman/healthcheck");
}
