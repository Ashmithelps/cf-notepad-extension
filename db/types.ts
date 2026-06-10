import type { StoredCard } from "../srs/schedule";

export type Platform = "cf" | "atcoder" | "codechef" | "leetcode";

export interface ProblemKey {
  platform: Platform;
  contestId: string;
  index: string;
  key: string;
}

export type FsrsCardState = StoredCard;

export interface Note {
  key: string;
  platform: Platform;
  contestId: string;
  index: string;
  url: string;
  title?: string;
  rating?: number;
  officialTags?: string[];
  techniqueTags: string[];
  body: string;
  solved: boolean;
  difficultyFelt?: 1 | 2 | 3 | 4 | 5;
  createdAt: number;
  updatedAt: number;
  srs?: FsrsCardState;
}

export interface Settings {
  id: "singleton";
  theme: "auto" | "light" | "dark";
  bannerEnabled: boolean;
  reviewRemindersEnabled: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  id: "singleton",
  theme: "auto",
  bannerEnabled: true,
  reviewRemindersEnabled: true,
};
