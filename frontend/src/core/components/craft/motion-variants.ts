/**
 * motion-variants.ts
 * Implementation CHUẨN DUY NHẤT của công thức "Motion rhythm cho nội dung xuất
 * hiện" (xem SOURCE_OF_TRUTH.md — Phần 3.3).
 *
 * Mọi trang cần stagger animation khi load PHẢI import từ file này, KHÔNG tự
 * viết lại giá trị duration/easing/stagger ở nơi khác — tránh mỗi trang có một
 * "nhịp" chuyển động khác nhau.
 *
 * Có 2 bộ:
 *  - fullMotion   → Nhóm B (Marketing), stagger đầy đủ + micro-motion lặp vô hạn
 *  - minimalMotion → Nhóm A/C, chỉ fade+slide nhẹ 1 lần khi load, KHÔNG lặp
 */

import type { Variants } from "framer-motion";

const EASE_OUT_STRONG = [0.22, 1, 0.36, 1] as const;

// ---- Bộ đầy đủ (Nhóm B) ----

export const fullContainerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.2,
        },
    },
};

export const fullItemVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.6, ease: EASE_OUT_STRONG },
    },
};

/** Micro-motion lặp vô hạn cho icon mũi tên trong CTA — chỉ dùng ở Nhóm B */
export const ctaArrowMotion = {
    animate: { x: [0, 4, 0] },
    transition: { duration: 1.5, repeat: Infinity },
};

// ---- Bộ tối giản (Nhóm A / Nhóm C) ----
// Chỉ 1 lần fade+slide nhẹ khi trang load, KHÔNG lặp vô hạn, KHÔNG stagger nặng.

export const minimalContainerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.05, delayChildren: 0.1 },
    },
};

export const minimalItemVariants: Variants = {
    hidden: { opacity: 0, y: 12 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.35, ease: EASE_OUT_STRONG },
    },
};

/**
 * Micro-motion 1 lần cho nút CTA ở Nhóm A (Login/Register) — KHÔNG lặp vô hạn,
 * chỉ phản hồi khi hover/tap.
 */
export const ctaButtonMinimalMotion = {
    whileHover: { scale: 1.02 },
    whileTap: { scale: 0.98 },
};