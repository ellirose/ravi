import { Gem, Globe, Layers, LayoutGrid, Megaphone, Shirt, Smartphone, Sparkles, Type, type LucideIcon } from "lucide-react";
import type { WorkCategory } from "@/data/works";

export const categoryIcon: Record<WorkCategory | "all", LucideIcon> = {
  all: LayoutGrid,
  web: Globe,
  mobile: Smartphone,
  concept: Sparkles,
  logo: Gem,
  type: Type,
  branding: Layers,
  marketing: Megaphone,
  apparel: Shirt,
};
