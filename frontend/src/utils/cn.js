// src/utils/cn.js
/**
 * Simple className merge utility.
 * Similar to `classnames` package.
 * Example:
 * cn("bg-blue-500", condition && "text-white")
 */
export function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}
