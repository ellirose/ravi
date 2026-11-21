import { Clapperboard, Droplets, Dumbbell, Gem, Shirt, ShoppingBasket, Sunset, UserRound, type LucideIcon } from "lucide-react";
import type { ReelCategory } from "@/data/reels";

/** Icon + colour per industry: chip tones, the timeline clip colour, and a kanji tag. */
export const reelStyle: Record<ReelCategory | "all", { Icon: LucideIcon; chip: string; clip: string; kanji: string }> = {
  all: { Icon: Clapperboard, chip: "bg-sumi text-paper", clip: "#262b3d", kanji: "全" },
  fashion: { Icon: Shirt, chip: "bg-ai-soft text-ai", clip: "#34508f", kanji: "服" },
  characters: { Icon: UserRound, chip: "bg-sakura-soft text-[#c2566e]", clip: "#d9738a", kanji: "人" },
  food: { Icon: ShoppingBasket, chip: "bg-kin-soft text-[#9a7633]", clip: "#c19a4e", kanji: "食" },
  beauty: { Icon: Droplets, chip: "bg-shu-soft text-shu", clip: "#e04a3c", kanji: "美" },
  jewelry: { Icon: Gem, chip: "bg-asagi text-[#2f6f86]", clip: "#4b93ad", kanji: "宝" },
  lifestyle: { Icon: Sunset, chip: "bg-[#fdebd9] text-[#c0662a]", clip: "#e0823d", kanji: "暮" },
  sports: { Icon: Dumbbell, chip: "bg-matcha-soft text-[#5d7a3d]", clip: "#7f9f5a", kanji: "動" },
};
