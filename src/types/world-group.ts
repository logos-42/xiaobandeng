
export interface WorldGroup {
  id: string;
  name: string;
  theme: string;
  description: string | null;
  created_at: string;
}

export type Theme = "玄幻" | "科幻" | "言情" | "武侠" | "都市";
