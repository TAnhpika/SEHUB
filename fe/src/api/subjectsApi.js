import { apiRequest } from "./httpClient";

export function listSubjects() {
  return apiRequest("/api/v1/subjects", { auth: false, cache: "no-store" });
}
