import { motion, useReducedMotion } from "framer-motion";

/**
 * AmbientBackground
 * Implementation CHUẨN DUY NHẤT của công thức "Blob nền chuyển động"
 * (xem SOURCE_OF_TRUTH.md — Phần 3.1).
 *
 * KHÔNG tự viết lại blob bằng div/motion.div ở nơi khác trong app.
 * Mọi trang cần hiệu ứng nền này PHẢI import component này.
 *
 * Ánh xạ intensity theo Nhóm trang (SOURCE_OF_TRUTH Phần 4):
 *   - "full"    → Nhóm B (Marketing/Landing)
 *   - "subtle"  → Nhóm C (Workspace), dùng cho khối AI streaming chính
 *   - Nhóm A/D  → KHÔNG import component này
 */

type AmbientBackgroundProps = {
    intensity?: "full" | "subtle";
    /** Màu blob theo family token đã định nghĩa, không tự thêm hex mới */
    variant?: "primary" | "accent" | "neutral";
};

const INTENSITY_CONFIG = {
    full: {
        opacityRange: [0.2, 0.4, 0.2],
        blobCount: 3,
        durations: [8, 10, 15],
    },
    subtle: {
        opacityRange: [0.05, 0.1, 0.05],
        blobCount: 1,
        durations: [10],
    },
} as const;

const VARIANT_GRADIENT: Record<NonNullable<AmbientBackgroundProps["variant"]>, string> = {
    primary: "from-[hsl(var(--primary))]/20 to-[hsl(var(--primary))]/10",
    accent: "from-[hsl(var(--accent))]/15 to-[hsl(var(--accent))]/10",
    neutral: "from-slate-300/10 to-gray-300/10",
};

export function AmbientBackground({
    intensity = "full",
    variant = "primary",
}: AmbientBackgroundProps) {
    const prefersReducedMotion = useReducedMotion();
    const config = INTENSITY_CONFIG[intensity];

    // Vị trí lệch góc cố định — không đối xứng, đúng công thức 3.1
    const positions = [
        "top-1/4 left-1/4 w-[500px] h-[500px]",
        "bottom-1/4 right-1/4 w-[600px] h-[600px]",
        "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px]",
    ];

    const gradientClass = VARIANT_GRADIENT[variant];

    return (
        <div className="absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
            {Array.from({ length: config.blobCount }).map((_, i) => (
                <motion.div
                    key={i}
                    className={`absolute ${positions[i]} bg-gradient-to-br ${gradientClass} rounded-full blur-3xl`}
                    animate={
                        prefersReducedMotion
                            ? undefined
                            : {
                                scale: i % 2 === 0 ? [1, 1.2, 1] : [1.2, 1, 1.2],
                                opacity: config.opacityRange as unknown as number[],
                            }
                    }
                    transition={{
                        duration: config.durations[i] ?? 10,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: i * 1,
                    }}
                    style={
                        prefersReducedMotion ? { opacity: config.opacityRange[0] } : undefined
                    }
                />
            ))}
            {/* Lớp hoà tan blob vào nền — bắt buộc theo công thức 3.1, tránh viền cứng */}
            <div className="absolute inset-0 bg-gradient-to-b from-background/0 via-background/50 to-background" />
        </div>
    );
}