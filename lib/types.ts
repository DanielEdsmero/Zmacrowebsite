export type Macro = {
  id: string;
  slug: string;
  name: string;
  short_description: string;
  long_description: string | null;
  version: string;
  price_usd: number;
  cover_url: string | null;
  file_path: string;
  screenshots: string[];
  published: boolean;
  download_count: number;
  github_url: string | null;
  created_at: string;
  updated_at: string;
};

export type DownloadLog = {
  id: string;
  macro_id: string;
  ip: string | null;
  user_agent: string | null;
  downloaded_at: string;
};

export type Review = {
  id: string;
  macro_id: string;
  author_name: string;
  rating: number;
  body: string | null;
  safety_vote: "safe" | "virus" | "unsure" | null;
  ip: string | null;
  created_at: string;
};

export type ReviewWithMacro = Review & {
  macros: { name: string; slug: string } | null;
};
