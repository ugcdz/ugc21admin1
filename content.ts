import { z } from "zod";

export const PURPOSES: Record<string, string> = { apps: "تحميل تطبيقات", books: "كتب PDF", products: "منتوجات", music: "أغاني", images: "صور", videos: "فيديو", digital: "متجر كتب ودروس ومنتجات رقمية", manual: "موقع يدوي / محتوى متنوع" };
export const CONTENT_TYPES: Record<string, string> = { app: "تطبيق", book: "كتاب PDF", product: "منتوج", song: "أغنية", image: "صورة", video: "فيديو", lesson: "درس", digital: "منتج رقمي" };
export const defaultContentType = (purpose: string) => ({ apps: "app", books: "book", products: "product", music: "song", images: "image", videos: "video", digital: "book" })[purpose] ?? "product";
export const promoSchema = z.object({ code: z.string().trim().min(1).max(40).regex(/^[A-Za-z0-9_-]+$/).transform(v => v.toUpperCase()), discount_percent: z.number().positive().max(100), max_uses: z.number().int().positive() });
export const promoAvailable = (p: { active: boolean; used_count: number; max_uses: number }) => p.active && p.used_count < p.max_uses;