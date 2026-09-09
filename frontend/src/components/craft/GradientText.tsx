import { motion } from "framer-motion";
import { type ReactNode } from "react";

/**
 * GradientText
 * Implementation CHUẨN DUY NHẤT của công thức "Gradient Text cho từ khoá"
 * (xem SOURCE_OF_TRUTH.md — Phần 3.2).
 *
 * QUY TẮC BẮT BUỘC:
 * - Chỉ bọc 1 CỤM TỪ trong headline, KHÔNG bọc cả câu.
 * - Chỉ dùng ở Nhóm B (Marketing/Landing). Nhóm A/C/D KHÔNG import component này
 *   (Nhóm A headline giữ nguyên màu foreground, xem SOURCE_OF_TRUTH Phần 4).
 */

type GradientTextProps = {
    children: ReactNode;
    /** Có vẽ nét gạch chân SVG bên dưới cụm từ hay không */
    underline?: boolean;
};

export function GradientText({ children, underline = false }: GradientTextProps) {
    return (
        <span className="relative inline-block">
            <span className="bg-gradient-to-r from-[hsl(var(--primary))] via-[hsl(172_70%_40%)] to-[hsl(180_60%_45%)] bg-clip-text text-transparent">
                {children}
            </span>
            {underline && (
                <motion.svg
                    className="absolute -bottom-2 left-0 w-full"
                    viewBox="0 0 300 12"
                    fill="none"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 1, delay: 1 }}
                >
                    <motion.path
                        d="M2 8 Q 75 2, 150 8 Q 225 14, 298 8"
                        stroke="url(#gradientTextUnderline)"
                        strokeWidth="3"
                        strokeLinecap="round"
                        fill="none"
                    />
                    <defs>
                        <linearGradient id="gradientTextUnderline" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="hsl(var(--primary))" />
                            <stop offset="50%" stopColor="hsl(172 70% 40%)" />
                            <stop offset="100%" stopColor="hsl(180 60% 45%)" />
                        </linearGradient>
                    </defs>
                </motion.svg>
            )}
        </span>
    );
}