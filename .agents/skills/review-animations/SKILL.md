---
name: review-animations
description: Reviews animation and motion code against a high craft bar derived from Emil Kowalski's design engineering philosophy. Default to flagging; approval is earned.
---

# Reviewing Animations

A specialized review skill to audit animation and motion code against Emil Kowalski's high craft bar.

## The Ten Non-Negotiable Standards

1. **Justified motion.** Every animation must answer "why does this animate?" — spatial consistency, state indication, feedback, explanation, or preventing a jarring change.
2. **Frequency-appropriate.** Match motion to how often it's seen. Keyboard-initiated and 100+/day actions get **no** animation.
3. **Responsive easing.** Entering/exiting elements use `ease-out` (`cubic-bezier(0.23, 1, 0.32, 1)`) or custom curves. Never use `ease-in` on UI elements.
4. **Sub-300ms UI.** UI animations stay under 300ms (100–250ms ideal for buttons, popovers, dropdowns).
5. **Origin & physical correctness.** Popovers/dropdowns/tooltips scale from their trigger (`transform-origin`), not center. Never animate from `scale(0)` — start from `scale(0.95)` + opacity.
6. **Interruptibility.** Gesture-driven motion or rapid toggles must be interruptible (springs or smooth CSS transitions).
7. **GPU-only properties.** Animate `transform` and `opacity` only. Avoid animating layout properties like `width`, `height`, `margin`, `padding`, `top`, `left`.
8. **Accessibility.** Honor `prefers-reduced-motion` and gate hover animations behind `@media (hover: hover)`.
9. **Asymmetric enter/exit.** Deliberate actions (a press, a hold) animate slower; system responses snap fast.
10. **Cohesion.** Motion matches the component's personality and product feel.
