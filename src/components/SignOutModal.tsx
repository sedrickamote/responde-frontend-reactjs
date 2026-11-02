import { useEffect, useState } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { LogOut, X, Loader2 } from 'lucide-react';
import type { AuthUser } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';

interface SignOutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  isLoading?: boolean;
  user?: AuthUser | null;
}

// ── Motion tokens (Ambatubazz Apple Quadratic Deceleration) ──
const AMBATUBAZZ_EASE = [0.25, 0.46, 0.45, 0.94] as const;
const RAPID_EXIT_EASE = [0.4, 0, 1, 1] as const;

const backdropVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.26, ease: AMBATUBAZZ_EASE },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.16, ease: RAPID_EXIT_EASE },
  },
};

const modalVariants: Variants = {
  hidden: { opacity: 0, scale: 0.96, y: 14 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.32, ease: AMBATUBAZZ_EASE },
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    y: 8,
    transition: { duration: 0.16, ease: RAPID_EXIT_EASE },
  },
};

/**
 * UserRoleBadge: Clean, non-glaring slate pill badge with a 6px semantic status micro-dot
 * matching Section 3 of the Soft UI Minimalist Redesign Plan.
 */
function UserRoleBadge({ role }: { role?: string | null }) {
  const norm = (role || '').toLowerCase().trim();
  let dotColor = 'bg-emerald-500 ring-emerald-500/25';
  let label = 'Staff';

  if (norm === 'super_admin') {
    dotColor = 'bg-purple-500 ring-purple-500/25';
    label = 'Super Admin';
  } else if (norm === 'admin') {
    dotColor = 'bg-sky-500 ring-sky-500/25';
    label = 'Admin';
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-white/10 shadow-2xs whitespace-nowrap shrink-0">
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor} shrink-0 ring-2`} />
      <span>{label}</span>
    </span>
  );
}

export default function SignOutModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
  user: propUser,
}: SignOutModalProps) {
  const { user: authUser } = useAuth();
  const user = propUser !== undefined ? propUser : authUser;
  const [imgError, setImgError] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(
    user?.avatar_url || (user as { avatar?: string | null })?.avatar || (user as { picture?: string | null })?.picture || null
  );

  useEffect(() => {
    const direct = user?.avatar_url || (user as { avatar?: string | null })?.avatar || (user as { picture?: string | null })?.picture || null;
    if (direct) {
      setAvatarUrl(direct);
      return;
    }

    let isMounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) return;
      const meta = data.session?.user?.user_metadata;
      const metaAvatar = meta?.avatar_url || meta?.picture || meta?.avatar || null;
      if (metaAvatar) {
        setAvatarUrl(metaAvatar);
      }
    }).catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [user]);

  useEffect(() => {
    setImgError(false);
  }, [avatarUrl]);

  // Lock background scrolling while modal is open
  useEffect(() => {
    if (isOpen) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [isOpen]);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isLoading) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  const displayName = user?.full_name || user?.username || 'User';
  const initial = (displayName.charAt(0) || 'U').toUpperCase();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="signout-modal-backdrop"
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6 bg-slate-950/45 dark:bg-black/75 backdrop-blur-md"
          onClick={() => {
            if (!isLoading) onClose();
          }}
          aria-hidden={!isOpen}
        >
          <motion.div
            key="signout-modal-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="signout-modal-title"
            aria-describedby="signout-modal-desc"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white dark:bg-[#111827] backdrop-blur-2xl rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-white/10 shadow-[0_24px_60px_-15px_rgba(0,0,0,0.18),0_1px_3px_rgba(15,23,42,0.05),inset_0_1px_1px_rgba(255,255,255,0.9)] dark:shadow-[0_28px_70px_-15px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.08)] p-6 sm:p-7 relative overflow-hidden transform-gpu will-change-transform"
          >
            {/* Ambient top-right rose accent glow */}
            <div className="absolute -top-16 -right-16 w-36 h-36 bg-rose-500/10 dark:bg-rose-500/15 rounded-full blur-3xl pointer-events-none" />

            {/* Top Close Button */}
            <button
              id="close-signout-modal-btn"
              type="button"
              onClick={onClose}
              disabled={isLoading}
              aria-label="Close dialog"
              className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-40 cursor-pointer active:scale-90"
            >
              <X className="w-4 h-4" strokeWidth={2} />
            </button>

            {/* Content */}
            <div className="flex flex-col items-center text-center">
              {/* Soft UI Evolution squircle tile with LogOut icon */}
              <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-b from-rose-50 to-rose-100/70 dark:from-rose-950/40 dark:to-rose-900/20 text-rose-600 dark:text-rose-400 border border-rose-200/80 dark:border-rose-500/20 flex items-center justify-center mb-4 shadow-[inset_0_1px_1px_rgba(255,255,255,0.8),0_4px_16px_rgba(244,63,94,0.12)] shrink-0">
                <LogOut className="w-6 h-6 sm:w-6.5 sm:h-6.5 translate-x-0.5" strokeWidth={2} />
              </div>

              {/* Title & Description */}
              <h3
                id="signout-modal-title"
                className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight"
              >
                Do you want to sign out?
              </h3>
              <p
                id="signout-modal-desc"
                className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed max-w-xs"
              >
                You will be signed out of your session and redirected to the login screen.
              </p>

              {/* Current user card summary (Soft UI Recessed Well) */}
              {user && (
                <div className="w-full mt-5 p-3 sm:p-3.5 rounded-2xl bg-slate-50/90 dark:bg-slate-800/50 border border-slate-200/80 dark:border-white/10 shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)] flex items-center gap-3 text-left">
                  {avatarUrl && !imgError ? (
                    <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 ring-2 ring-white dark:ring-slate-700 shadow-xs">
                      <img
                        src={avatarUrl}
                        alt={displayName}
                        onError={() => setImgError(true)}
                        className="w-full h-full object-cover rounded-full"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-600 via-teal-600 to-sky-500 text-white font-bold text-xs flex items-center justify-center shadow-xs shrink-0 ring-2 ring-white dark:ring-slate-700">
                      {initial}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                      {displayName}
                    </p>
                    {user.email && (
                      <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-mono truncate mt-0.5">
                        {user.email}
                      </p>
                    )}
                  </div>
                  <UserRoleBadge role={user.role} />
                </div>
              )}

              {/* Action Buttons */}
              <div className="w-full mt-6 grid grid-cols-2 gap-3">
                <button
                  id="cancel-signout-btn"
                  type="button"
                  onClick={onClose}
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 min-h-[44px] rounded-xl text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 bg-slate-100/90 hover:bg-slate-200/80 dark:bg-slate-800/90 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-white/10 shadow-2xs transition-all active:scale-[0.97] disabled:opacity-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="confirm-signout-btn"
                  type="button"
                  onClick={onConfirm}
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 min-h-[44px] rounded-xl text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-red-600 via-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 border border-red-500/40 shadow-[0_4px_14px_rgba(225,29,72,0.32),inset_0_1px_1px_rgba(255,255,255,0.25)] hover:shadow-[0_6px_20px_rgba(225,29,72,0.42)] transition-all active:scale-[0.97] flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Signing out...</span>
                    </>
                  ) : (
                    <>
                      <LogOut className="w-4 h-4" strokeWidth={2} />
                      <span>Sign Out</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
