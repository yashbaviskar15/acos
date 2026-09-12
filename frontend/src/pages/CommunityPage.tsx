import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Heart,
  MessageCircle,
  Eye,
  Search,
  Plus,
  Pencil,
  Trash2,
  Pin,
  Send,
  ChevronLeft,
  ChevronRight,
  X,
  CheckCircle2,
  AlertCircle,
  Users,
  MessageSquare,
  ThumbsUp,
  MessageCircleQuestion,
  Clock,
  Filter,
  SortAsc,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  Rocket,
  Megaphone,
  Wrench,
  Cpu,
  CornerUpRight,
  BookOpen
} from 'lucide-react';
import { apiFetch } from '../config/api';
import { Button } from '../components/ui/Button';
import { Breadcrumbs } from '../components/ui/Breadcrumbs';
import { Navbar, LandingView } from '../components/ui/Navbar';
import { Footer } from '../components/ui/Footer';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalBody,
  ModalFooter,
  ModalClose,
} from '../components/ui/Modal';

function adaptPostFromApi(raw: any, currentUserId?: string): CommunityPost {
  if (!raw) return raw;
  const author = raw.author ? raw.author : {
    id: raw.user_id,
    name: raw.author_name || 'Engineer',
    email: raw.author_email || '',
    role: raw.author_role || 'Developer',
    avatar: raw.author_avatar,
  };
  const isOwner = Boolean(raw.is_owner || (currentUserId && (raw.user_id === currentUserId || author.id === currentUserId)));
  return {
    ...raw,
    author,
    tags: Array.isArray(raw.tags) ? raw.tags : [],
    like_count: typeof raw.likes_count === 'number' ? raw.likes_count : (raw.like_count ?? 0),
    comment_count: typeof raw.comments_count === 'number' ? raw.comments_count : (raw.comment_count ?? 0),
    view_count: typeof raw.views_count === 'number' ? raw.views_count : (raw.view_count ?? 0),
    has_liked: Boolean(raw.has_liked),
    is_owner: isOwner,
    is_pinned: Boolean(raw.is_pinned),
  };
}

function adaptCommentFromApi(raw: any, currentUserId?: string): CommunityComment {
  if (!raw) return raw;
  const author = raw.author ? raw.author : {
    id: raw.user_id,
    name: raw.author_name || 'Engineer',
    email: raw.author_email || '',
    role: raw.author_role || 'Developer',
    avatar: raw.author_avatar,
  };
  const isOwner = Boolean(raw.is_owner || (currentUserId && (raw.user_id === currentUserId || author.id === currentUserId)));
  return {
    ...raw,
    author,
    is_owner: isOwner,
    replies: Array.isArray(raw.replies) ? raw.replies.map((r: any) => adaptCommentFromApi(r, currentUserId)) : [],
  };
}

export type Category = 'all' | 'general' | 'announcements' | 'architecture' | 'troubleshooting' | 'showcase';
export type SortKey = 'latest' | 'popular' | 'most_commented' | 'most_viewed';

export interface CommunityPost {
  id: string;
  user_id?: string;
  title: string;
  content: string;
  category: Category;
  tags: string[];
  author: {
    id?: string;
    name: string;
    role?: string;
    email?: string;
    avatar?: string;
  };
  like_count: number;
  comment_count: number;
  view_count: number;
  is_pinned?: boolean;
  has_liked?: boolean;
  is_owner?: boolean;
  created_at: string;
  updated_at?: string;
}

export interface CommunityComment {
  id: string;
  post_id: string;
  parent_id?: string | null;
  content: string;
  author: {
    id?: string;
    name: string;
    role?: string;
    email?: string;
    avatar?: string;
  };
  is_owner?: boolean;
  created_at: string;
  updated_at?: string;
  replies?: CommunityComment[];
}

export interface CommunityStats {
  total_discussions: number;
  total_comments: number;
  total_likes: number;
  contributors_count?: number | string;
  engineers_count?: number | string;
  categories?: { id: string; label: string; count: number }[];
}

interface Toast {
  id: string;
  variant: 'success' | 'error' | 'warning' | 'info';
  title: string;
  description?: string;
}

const PAGE_SIZE = 9;

const CATEGORY_ICONS: Record<Exclude<Category, 'all'>, { label: string; Icon: React.FC<any>; bg: string; fg: string }> = {
  general: { label: 'General', Icon: MessageCircleQuestion, bg: 'bg-slate-100 dark:bg-slate-800', fg: 'text-slate-600 dark:text-slate-300' },
  announcements: { label: 'Announcements', Icon: Megaphone, bg: 'bg-amber-500/10', fg: 'text-amber-600 dark:text-amber-400' },
  architecture: { label: 'Architecture', Icon: Rocket, bg: 'bg-purple-500/10', fg: 'text-purple-600 dark:text-purple-400' },
  troubleshooting: { label: 'Troubleshooting', Icon: Wrench, bg: 'bg-rose-500/10', fg: 'text-rose-600 dark:text-rose-400' },
  showcase: { label: 'Showcase', Icon: Sparkles, bg: 'bg-emerald-500/10', fg: 'text-emerald-600 dark:text-emerald-400' },
};

const initialsFromName = (name: string): string => {
  if (!name) return '?';
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const formatRelativeTime = (iso: string, t: (k: string) => string): string => {
  if (!iso) return '';
  const d = new Date(iso);
  const now = Date.now();
  const diffMs = now - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffWk = Math.floor(diffDay / 7);
  const diffMo = Math.floor(diffDay / 30);
  const diffYr = Math.floor(diffDay / 365);
  if (diffSec < 60) return t('community.time_just_now') || 'just now';
  if (diffMin < 60) return `${diffMin}${t('community.time_minutes') || 'm ago'}`;
  if (diffHour < 24) return `${diffHour}${t('community.time_hours') || 'h ago'}`;
  if (diffDay < 7) return `${diffDay}${t('community.time_days') || 'd ago'}`;
  if (diffWk < 5) return `${diffWk}${t('community.time_weeks') || 'w ago'}`;
  if (diffMo < 12) return `${diffMo}${t('community.time_months') || 'mo ago'}`;
  return `${diffYr}${t('community.time_years') || 'y ago'}`;
};

const AuthorAvatar: React.FC<{ name: string; size?: 'sm' | 'md' | 'lg'; className?: string }> = ({ name, size = 'md', className = '' }) => {
  const sizeCls = size === 'sm' ? 'w-8 h-8 text-[10px]' : size === 'lg' ? 'w-12 h-12 text-sm' : 'w-10 h-10 text-xs';
  const colors = [
    'bg-brandGold-500/80 text-brandObsidian-950',
    'bg-sky-500/80 text-white',
    'bg-violet-500/80 text-white',
    'bg-emerald-500/80 text-white',
    'bg-rose-500/80 text-white',
    'bg-amber-500/80 text-white',
  ];
  const colorIdx = Math.abs(
    (name || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0) % colors.length
  );
  return (
    <div
      className={`${sizeCls} ${colors[colorIdx]} ${className} rounded-full flex items-center justify-center font-bold shadow-sm shrink-0 ring-2 ring-white dark:ring-slate-800`}
    >
      {initialsFromName(name)}
    </div>
  );
};

const InlineToaster: React.FC<{ toasts: Toast[]; onRemove: (id: string) => void }> = ({ toasts, onRemove }) => {
  const variantStyles: Record<Toast['variant'], { icon: React.FC<any>; iconCls: string; borderCls: string; bgCls: string }> = {
    success: { icon: CheckCircle2, iconCls: 'text-emerald-500', borderCls: 'border-l-4 border-l-emerald-500', bgCls: 'bg-emerald-500/5' },
    error: { icon: AlertCircle, iconCls: 'text-rose-500', borderCls: 'border-l-4 border-l-rose-500', bgCls: 'bg-rose-500/5' },
    warning: { icon: AlertTriangle, iconCls: 'text-amber-500', borderCls: 'border-l-4 border-l-amber-500', bgCls: 'bg-amber-500/5' },
    info: { icon: BookOpen, iconCls: 'text-brandGold-600 dark:text-brandGold-400', borderCls: 'border-l-4 border-l-brandGold-500', bgCls: 'bg-brandGold-500/5' },
  };
  return (
    <div className="fixed top-20 right-4 sm:right-6 z-[10001] space-y-3 w-[calc(100%-2rem)] sm:w-96 pointer-events-none">
      <AnimatePresence initial={false}>
        {toasts.map((t) => {
          const cfg = variantStyles[t.variant];
          const Icon = cfg.icon;
          return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 16 }}
              transition={{ duration: 0.2 }}
              className={`${cfg.bgCls} ${cfg.borderCls} pointer-events-auto border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-3.5 bg-white dark:bg-[#0F2038] backdrop-blur`}
            >
              <div className="flex items-start gap-3">
                <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${cfg.iconCls}`} />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold text-slate-900 dark:text-white">{t.title}</div>
                  {t.description && (
                    <div className="text-xs mt-0.5 text-slate-600 dark:text-slate-300">{t.description}</div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => onRemove(t.id)}
                  className="shrink-0 p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

const StatCard: React.FC<{
  Icon: React.FC<any>;
  label: string;
  value: number | string | undefined;
  subtitle: string;
  iconCls: string;
  bgCls: string;
}> = ({ Icon, label, value, subtitle, iconCls, bgCls }) => (
  <div className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm hover:border-brandGold-500/50 transition-all flex flex-col justify-between group">
    <div className="flex items-center justify-between text-slate-500">
      <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
      <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl ${bgCls} ${iconCls} flex items-center justify-center shrink-0`}>
        <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
      </div>
    </div>
    <div className="mt-2.5">
      <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
        {typeof value === 'number' ? value.toLocaleString() : (value ?? '0')}
      </p>
      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium truncate">{subtitle}</p>
    </div>
  </div>
);

export interface CommunityPageProps {
  onNavigate?: (view: any) => void;
  onGoToLogin?: () => void;
  onGoToRegister?: () => void;
  onOpenCommandPalette?: () => void;
  currentView?: LandingView;
}

const emptyStats: CommunityStats = {
  total_discussions: 0,
  total_comments: 0,
  total_likes: 0,
  contributors_count: '0',
  engineers_count: '0',
};

export const CommunityPage: React.FC<CommunityPageProps> = ({
  onNavigate,
  onGoToLogin,
  onGoToRegister,
  onOpenCommandPalette,
  currentView = 'community',
}) => {
  const { t } = useTranslation();
  const isPublicLanding = Boolean(onGoToLogin || onGoToRegister);

  const [toasts, setToasts] = useState<Toast[]>([]);
  const addToast = useCallback((nt: Omit<Toast, 'id'>) => {
    const id = `t-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setToasts(prev => [...prev, { ...nt, id }]);
    setTimeout(() => setToasts(prev => prev.filter(x => x.id !== id)), 4000);
    return id;
  }, []);
  const removeToast = useCallback((id: string) => setToasts(prev => prev.filter(x => x.id !== id)), []);

  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<CommunityStats>(emptyStats);
  const [statsLoading, setStatsLoading] = useState(true);

  const [category, setCategory] = useState<Category>('all');
  const [sort, setSort] = useState<SortKey>('latest');
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const searchDebounceRef = useRef<number | null>(null);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [createOpen, setCreateOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<CommunityPost | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailPost, setDetailPost] = useState<CommunityPost | null>(null);
  const [detailComments, setDetailComments] = useState<CommunityComment[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ kind: 'post' | 'comment'; id: string; postId?: string } | null>(null);

  const currentUser = useMemo<{ id?: string; name?: string } | null>(() => {
    try {
      const raw = localStorage.getItem('aravanta_user');
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return { id: parsed?.id || parsed?.user_id || parsed?.sub, name: parsed?.name || parsed?.email };
    } catch { return null; }
  }, []);

  const isAuthenticated = Boolean(localStorage.getItem('aravanta_token'));

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await apiFetch<CommunityStats>('/community/stats', { method: 'GET' });
      if (res) setStats(res);
    } catch {
      /* Keep existing state */
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const loadPosts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', String(PAGE_SIZE));
      params.set('sort', sort);
      if (category !== 'all') params.set('category', category);
      if (searchTerm.trim()) params.set('search', searchTerm.trim());

      const res = await apiFetch<{ posts: CommunityPost[]; total?: number; total_pages?: number; page?: number }>(
        `/community/posts?${params.toString()}`,
        { method: 'GET' }
      );
      const list = Array.isArray(res) ? res : (res?.posts || []);
      const currentUserId = currentUser?.id;
      setPosts(list.map(p => adaptPostFromApi(p, currentUserId)));
      setTotalCount(res?.total ?? list.length);
      setTotalPages(res?.total_pages ?? (list.length < PAGE_SIZE ? Math.max(1, page) : page + 1));
    } catch (e: any) {
      const msg = e?.message || t('community.error_load_posts') || 'Failed to load discussions';
      setError(msg);
      setPosts([]);
      setTotalCount(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [category, sort, searchTerm, page, t, currentUser?.id]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  useEffect(() => {
    if (searchDebounceRef.current) window.clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = window.setTimeout(() => {
      setSearchTerm(searchInput);
      setPage(1);
    }, 300);
    return () => { if (searchDebounceRef.current) window.clearTimeout(searchDebounceRef.current); };
  }, [searchInput]);

  const optimisticUpdatePost = (postId: string, patch: Partial<CommunityPost>) => {
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, ...patch } : p));
    if (detailPost?.id === postId) setDetailPost({ ...detailPost, ...patch });
  };

  const handleToggleLike = async (post: CommunityPost) => {
    const prevLiked = post.has_liked;
    const prevCount = post.like_count;
    optimisticUpdatePost(post.id, { has_liked: !prevLiked, like_count: Math.max(0, prevCount + (prevLiked ? -1 : 1)) });
    try {
      const res = await apiFetch<{ liked: boolean; likes_count: number }>(`/community/posts/${post.id}/like`, { method: 'POST' });
      optimisticUpdatePost(post.id, {
        has_liked: Boolean(res?.liked),
        like_count: typeof res?.likes_count === 'number' ? res.likes_count : (post.like_count as number)
      });
    } catch (e: any) {
      optimisticUpdatePost(post.id, { has_liked: prevLiked, like_count: prevCount });
      addToast({ variant: 'error', title: t('community.error_like') || 'Error updating like', description: e?.message });
    }
  };

  const openPostDetail = async (post: CommunityPost) => {
    setDetailOpen(true);
    setDetailPost(post);
    setDetailLoading(true);
    setDetailComments([]);
    try {
      const [detailRes, commentsRes] = await Promise.all([
        apiFetch<CommunityPost>(`/community/posts/${post.id}`, { method: 'GET' }),
        apiFetch<CommunityComment[]>(`/community/posts/${post.id}/comments`, { method: 'GET' }),
      ]);
      const currentUserId = currentUser?.id;
      if (detailRes) setDetailPost(adaptPostFromApi(detailRes, currentUserId));
      const rawComments = Array.isArray(commentsRes) ? commentsRes : (commentsRes as any)?.comments || [];
      setDetailComments(rawComments.map((c: any) => adaptCommentFromApi(c, currentUserId)));
    } catch (e: any) {
      addToast({ variant: 'error', title: t('community.error_load_post') || 'Could not load comments', description: e?.message });
    } finally {
      setDetailLoading(false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    try {
      await apiFetch(`/community/posts/${postId}`, { method: 'DELETE' });
      setPosts(prev => prev.filter(p => p.id !== postId));
      setDetailOpen(false);
      setDetailPost(null);
      setDeleteConfirm(null);
      addToast({ variant: 'success', title: t('community.post_deleted') || 'Discussion deleted' });
      loadStats();
    } catch (e: any) {
      addToast({ variant: 'error', title: t('community.error_delete_post') || 'Failed to delete discussion', description: e?.message });
      setDeleteConfirm(null);
    }
  };

  async function handleDeleteComment(postId: string, commentId: string) {
    try {
      await apiFetch(`/community/comments/${commentId}`, { method: 'DELETE' });
      setDetailComments(prev => prev.filter(c => c.id !== commentId && c.parent_id !== commentId));
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, comment_count: Math.max(0, (p.comment_count || 1) - 1) } : p));
      if (detailPost) {
        setDetailPost({ ...detailPost, comment_count: Math.max(0, (detailPost.comment_count || 1) - 1) });
      }
      setDeleteConfirm(null);
      addToast({ variant: 'success', title: t('community.comment_deleted') || 'Comment deleted' });
      loadStats();
    } catch (e: any) {
      addToast({ variant: 'error', title: t('community.error_delete_comment') || 'Failed to delete comment', description: e?.message });
      setDeleteConfirm(null);
    }
  }

  // Common UI blocks
  const headerBlock = (
    <div className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-brandGold-500/15 text-brandGold-500 flex items-center justify-center font-bold shrink-0">
          <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-sm sm:text-base font-black text-slate-900 dark:text-white uppercase tracking-tight">
              Community Engineering Hub
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30">
              PROD-ACTIVE
            </span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-0.5">
            Architecture patterns, incident write-ups & production runbooks • Real-Time Discussions
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
        <button
          onClick={() => { loadStats(); loadPosts(); }}
          disabled={loading || statsLoading}
          className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-800 transition-colors cursor-pointer"
          title="Refresh discussions"
        >
          <RefreshCw className={`w-4 h-4 ${loading || statsLoading ? 'animate-spin' : ''}`} />
        </button>
        <Button
          variant="primary"
          size="md"
          onClick={() => {
            if (!isAuthenticated) {
              if (onGoToLogin) onGoToLogin();
              else addToast({ variant: 'info', title: 'Sign in required', description: 'You must be signed in to create a post.' });
              return;
            }
            setEditingPost(null);
            setCreateOpen(true);
          }}
          leftIcon={<Plus className="w-4 h-4" />}
          className="bg-brandGold-500 hover:bg-brandGold-600 text-brandObsidian-950 font-black shadow-md shadow-brandGold-500/20 px-4 py-2 text-xs sm:text-sm rounded-xl cursor-pointer shrink-0"
        >
          {t('community.create_post') || 'Create Post'}
        </Button>
      </div>
    </div>
  );

  const statsBlock = (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
      <StatCard
        Icon={MessageSquare}
        label="Discussions"
        value={stats.total_discussions}
        subtitle="Platform Topics"
        iconCls="text-brandGold-500"
        bgCls="bg-brandGold-500/10"
      />
      <StatCard
        Icon={MessageCircle}
        label="Comments"
        value={stats.total_comments}
        subtitle="Peer Replies"
        iconCls="text-sky-500"
        bgCls="bg-sky-500/10"
      />
      <StatCard
        Icon={ThumbsUp}
        label="Likes & Upvotes"
        value={stats.total_likes}
        subtitle="Total Upvotes"
        iconCls="text-rose-500"
        bgCls="bg-rose-500/10"
      />
      <StatCard
        Icon={Users}
        label="Contributors"
        value={stats.contributors_count ?? stats.engineers_count}
        subtitle="Core Authors"
        iconCls="text-emerald-500"
        bgCls="bg-emerald-500/10"
      />
      <div className="col-span-2 sm:col-span-1">
        <StatCard
          Icon={Cpu}
          label="Engineers"
          value={stats.engineers_count ?? stats.contributors_count}
          subtitle="Global SRE Fleet"
          iconCls="text-purple-500"
          bgCls="bg-purple-500/10"
        />
      </div>
    </div>
  );

  const filterBlock = (
    <div className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 sm:p-4 shadow-sm space-y-3">
      {/* Category Pills */}
      <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 scrollbar-none">
        {(['all', 'general', 'announcements', 'architecture', 'troubleshooting', 'showcase'] as Category[]).map((c) => {
          const active = category === c;
          const meta = c === 'all' ? null : CATEGORY_ICONS[c];
          const CI = c === 'all' ? Filter : (meta ? meta.Icon : Filter);
          return (
            <button
              key={c}
              onClick={() => { setCategory(c); setPage(1); }}
              className={`inline-flex items-center gap-1.5 h-8 sm:h-9 px-3 sm:px-3.5 rounded-xl font-bold text-xs transition-all shrink-0 cursor-pointer ${
                active
                  ? 'bg-brandGold-500 text-brandObsidian-950 shadow-sm shadow-brandGold-500/30 ring-1 ring-brandGold-400'
                  : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <CI className="w-3.5 h-3.5 shrink-0" />
              <span>{c === 'all' ? t('community.category_all') || 'All Discussions' : t(`community.category_${c}`) || c}</span>
            </button>
          );
        })}
      </div>

      {/* Search Bar + Sort Dropdown */}
      <div className="flex flex-col sm:flex-row gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={t('community.search_placeholder') || 'Search discussions, architectures, authors, tags...'}
            className="w-full pl-9 pr-8 py-2 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200/60 dark:hover:bg-slate-800/80 focus:bg-white dark:focus:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-brandGold-500/50 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-brandGold-500/30 transition-all font-sans"
          />
          {searchInput && (
            <button
              onClick={() => { setSearchInput(''); setSearchTerm(''); setPage(1); }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="relative">
            <select
              value={sort}
              onChange={(e) => { setSort(e.target.value as SortKey); setPage(1); }}
              className="appearance-none h-9 pl-8 pr-8 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700 focus:outline-none focus:ring-1 focus:ring-brandGold-500/30 cursor-pointer"
            >
              <option value="latest">{t('community.sort_latest') || 'Latest Discussions'}</option>
              <option value="popular">{t('community.sort_popular') || 'Most Appreciated'}</option>
              <option value="most_commented">{t('community.sort_most_commented') || 'Most Commented'}</option>
              <option value="most_viewed">{t('community.sort_most_viewed') || 'Most Viewed'}</option>
            </select>
            <SortAsc className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>
    </div>
  );

  const contentBlock = (
    <>
      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />
            <div>
              <p className="text-sm font-bold text-rose-700 dark:text-rose-400">{t('community.error_title') || "Couldn't load discussions"}</p>
              <p className="text-xs text-rose-600/80 dark:text-rose-400/80 mt-0.5">{error}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={loadPosts} leftIcon={<RefreshCw className="w-3.5 h-3.5" />}>
            {t('common.retry') || 'Retry'}
          </Button>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={`sk-${i}`} className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-3 w-24 bg-slate-200 dark:bg-slate-800 rounded" />
                  <div className="h-2.5 w-16 bg-slate-200 dark:bg-slate-800 rounded" />
                </div>
              </div>
              <div className="h-4 w-3/4 bg-slate-200 dark:bg-slate-800 rounded" />
              <div className="space-y-2">
                <div className="h-3 w-full bg-slate-200 dark:bg-slate-800 rounded" />
                <div className="h-3 w-5/6 bg-slate-200 dark:bg-slate-800 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 rounded-2xl p-8 sm:p-12 shadow-sm text-center">
          <div className="w-12 h-12 rounded-2xl bg-brandGold-500/15 text-brandGold-500 flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="w-6 h-6" />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
            {searchTerm || category !== 'all' ? t('community.no_results') || 'No discussions match your filter' : t('community.no_posts') || 'No discussions published yet'}
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
            {searchTerm || category !== 'all' ? t('community.no_results_desc') || 'Try clearing your search query or selecting another category.' : t('community.no_posts_desc') || 'Be the first to share an architecture runbook or ask an engineering question.'}
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            {(searchTerm || category !== 'all') && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setSearchInput(''); setSearchTerm(''); setCategory('all'); setPage(1); }}
              >
                {t('community.clear_filters') || 'Clear Filters'}
              </Button>
            )}
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                if (!isAuthenticated) {
                  if (onGoToLogin) onGoToLogin();
                  else addToast({ variant: 'info', title: 'Sign in required', description: 'You must be signed in to create a post.' });
                  return;
                }
                setEditingPost(null);
                setCreateOpen(true);
              }}
              leftIcon={<Plus className="w-4 h-4" />}
              className="bg-brandGold-500 hover:bg-brandGold-600 text-brandObsidian-950 font-bold"
            >
              {t('community.create_first_post') || 'Start First Discussion'}
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {posts.map((post) => (
            <div
              key={post.id}
              className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 hover:border-brandGold-500/50 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div>
                {/* Author and Badges */}
                <div className="flex items-start justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => openPostDetail(post)}
                    className="flex items-center gap-2.5 min-w-0 flex-1 text-left cursor-pointer"
                  >
                    <AuthorAvatar name={post.author?.name || '?'} size="md" />
                    <div className="min-w-0">
                      <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                        {post.author?.name || t('community.anonymous') || 'Engineer'}
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                        <Clock className="w-3 h-3 shrink-0" />
                        <span>{formatRelativeTime(post.created_at, t)}</span>
                      </div>
                    </div>
                  </button>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {post.is_pinned && (
                      <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-md bg-brandGold-500/15 text-brandGold-600 dark:text-brandGold-400 border border-brandGold-500/30 flex items-center gap-1">
                        <Pin className="w-2.5 h-2.5" /> Pinned
                      </span>
                    )}
                    {post.category && (
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${
                        post.category === 'announcements' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20' :
                        post.category === 'architecture' ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20' :
                        post.category === 'troubleshooting' ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20' :
                        post.category === 'showcase' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' :
                        'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                      }`}>
                        {t(`community.category_${post.category}`) || post.category}
                      </span>
                    )}

                    {post.is_owner && (
                      <div className="flex items-center gap-0.5">
                        <button
                          onClick={(e) => { e.stopPropagation(); setEditingPost(post); setCreateOpen(true); }}
                          className="p-1.5 text-slate-400 hover:text-brandGold-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                          title={t('common.edit') || 'Edit'}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setDeleteConfirm({ kind: 'post', id: post.id }); }}
                          className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                          title={t('common.delete') || 'Delete'}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Title & Preview */}
                <h3
                  onClick={() => openPostDetail(post)}
                  className="text-sm sm:text-base font-bold text-slate-900 dark:text-white group-hover:text-brandGold-600 dark:group-hover:text-brandGold-400 transition-colors line-clamp-2 mt-3 cursor-pointer"
                >
                  {post.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed mt-2 whitespace-pre-wrap">
                  {post.content}
                </p>

                {/* Tags */}
                {Array.isArray(post.tags) && post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {post.tags.slice(0, 4).map((tg, i) => (
                      <span
                        key={`${tg}-${i}`}
                        className="px-2 py-0.5 text-[10px] font-mono font-medium rounded-md bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800"
                      >
                        #{tg}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Bottom Actions */}
              <div className="flex items-center justify-between pt-3 mt-4 border-t border-slate-100 dark:border-slate-800/80">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggleLike(post)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      post.has_liked
                        ? 'bg-rose-50 dark:bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30'
                        : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Heart className={`w-3.5 h-3.5 ${post.has_liked ? 'fill-current' : ''}`} />
                    <span>{post.like_count || 0}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => openPostDetail(post)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>{post.comment_count || 0}</span>
                  </button>

                  <div className="inline-flex items-center gap-1 text-[11px] text-slate-400 font-mono ml-1">
                    <Eye className="w-3 h-3" />
                    <span>{post.view_count || 0}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => openPostDetail(post)}
                  className="text-xs font-bold text-brandGold-600 dark:text-brandGold-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  View <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage(p => Math.max(1, p - 1))}
            leftIcon={<ChevronLeft className="w-3.5 h-3.5" />}
          >
            {t('common.previous') || 'Previous'}
          </Button>
          <span className="text-xs font-mono font-medium text-slate-500">
            Page {page} of {totalPages} {totalCount > 0 ? `(${totalCount} total)` : ''}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
          >
            {t('common.next') || 'Next'}
          </Button>
        </div>
      )}
    </>
  );

  const mainView = (
    <div className="space-y-4 sm:space-y-6">
      <InlineToaster toasts={toasts} onRemove={removeToast} />

      {/* Breadcrumb Home */}
      <Breadcrumbs
        showHome={true}
        onHomeClick={() => {
          if (isPublicLanding) {
            onNavigate?.('home');
          } else {
            onNavigate?.('dashboard');
          }
        }}
        items={[
          { label: t('community.breadcrumb') || 'Community', onClick: () => window.scrollTo({ top: 0, behavior: 'smooth' }) }
        ]}
      />

      {headerBlock}
      {statsBlock}
      {filterBlock}
      {contentBlock}

      {/* Create / Edit Post Modal */}
      <CreateEditPostModal
        open={createOpen}
        post={editingPost}
        onClose={() => { setCreateOpen(false); setEditingPost(null); }}
        onCreated={() => {
          setCreateOpen(false);
          setEditingPost(null);
          loadPosts();
          loadStats();
          addToast({ variant: 'success', title: editingPost ? 'Discussion updated' : 'Discussion published' });
        }}
        onError={(title, desc) => addToast({ variant: 'error', title, description: desc })}
      />

      {/* Detailed Post Modal */}
      <PostDetailModal
        open={detailOpen}
        post={detailPost}
        comments={detailComments}
        loading={detailLoading}
        onClose={() => { setDetailOpen(false); setDetailPost(null); }}
        onToggleLike={() => { if (detailPost) handleToggleLike(detailPost); }}
        onCommentAdded={async () => {
          if (!detailPost) return;
          try {
            const res = await apiFetch<CommunityComment[]>(`/community/posts/${detailPost.id}/comments`, { method: 'GET' });
            const raw = Array.isArray(res) ? res : (res as any)?.comments || [];
            const currentUserId = currentUser?.id;
            setDetailComments(raw.map((c: any) => adaptCommentFromApi(c, currentUserId)));
            loadStats();
          } catch { /* ignore */ }
        }}
        onUpdateCommentCount={(delta) => {
          if (!detailPost) return;
          const nc = Math.max(0, (detailPost.comment_count || 0) + delta);
          setDetailPost({ ...detailPost, comment_count: nc });
          setPosts(prev => prev.map(p => p.id === detailPost.id ? { ...p, comment_count: nc } : p));
        }}
        onRequestDeleteComment={(c) => setDeleteConfirm({ kind: 'comment', id: c.id, postId: detailPost?.id })}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        open={Boolean(deleteConfirm)}
        kind={deleteConfirm?.kind ?? 'post'}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => {
          if (!deleteConfirm) return;
          if (deleteConfirm.kind === 'post') {
            handleDeletePost(deleteConfirm.id);
          } else if (deleteConfirm.postId) {
            handleDeleteComment(deleteConfirm.postId, deleteConfirm.id);
          }
        }}
      />
    </div>
  );

  if (isPublicLanding) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-brandObsidian-950 font-sans antialiased text-slate-900 dark:text-slate-100 flex flex-col justify-between">
        <Navbar
          onGoToLogin={onGoToLogin || (() => {})}
          onGoToRegister={onGoToRegister || (() => {})}
          onOpenCommandPalette={onOpenCommandPalette}
          onNavigate={onNavigate}
          currentView={currentView}
        />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex-1 w-full">
          {mainView}
        </main>
        <Footer onNavigate={onNavigate} />
      </div>
    );
  }

  // Inside authenticated console tab
  return mainView;
};

// -------------------------------------------------------------
// Subcomponents (CreateEditPostModal, PostDetailModal, DeleteConfirmModal)
// -------------------------------------------------------------

interface CreateEditPostModalProps {
  open: boolean;
  post: CommunityPost | null;
  onClose: () => void;
  onCreated: (p: CommunityPost) => void;
  onError: (title: string, desc?: string) => void;
}

const CreateEditPostModal: React.FC<CreateEditPostModalProps> = ({ open, post, onClose, onCreated, onError }) => {
  const { t } = useTranslation();
  const isEdit = Boolean(post);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<string>('general');
  const [tagsInput, setTagsInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [titleErr, setTitleErr] = useState<string | null>(null);
  const [contentErr, setContentErr] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setTitle(post?.title || '');
      setContent(post?.content || '');
      setCategory(post?.category || 'general');
      setTagsInput(Array.isArray(post?.tags) ? post.tags.join(', ') : '');
      setTitleErr(null);
      setContentErr(null);
      setSubmitting(false);
    }
  }, [open, post]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTitle = title.trim();
    const trimmedContent = content.trim();
    let ok = true;
    if (trimmedTitle.length < 3) { setTitleErr('Title must be at least 3 characters'); ok = false; }
    else if (trimmedTitle.length > 255) { setTitleErr('Title must be under 255 characters'); ok = false; }
    else setTitleErr(null);

    if (trimmedContent.length < 5) { setContentErr('Content must be at least 5 characters'); ok = false; }
    else if (trimmedContent.length > 30000) { setContentErr('Content is too long'); ok = false; }
    else setContentErr(null);

    if (!ok) return;

    setSubmitting(true);
    const tagsArr = tagsInput
      .split(/[,，\s]+/)
      .map(x => x.trim().replace(/^#/, ''))
      .filter(Boolean)
      .slice(0, 8);

    const payload: any = { title: trimmedTitle, content: trimmedContent, category, tags: tagsArr };
    try {
      let result: CommunityPost;
      if (isEdit) {
        result = await apiFetch<CommunityPost>(`/community/posts/${post!.id}`, { method: 'PUT', body: JSON.stringify(payload) });
      } else {
        result = await apiFetch<CommunityPost>('/community/posts', { method: 'POST', body: JSON.stringify(payload) });
      }
      onCreated(adaptPostFromApi(result));
    } catch (e: any) {
      onError(isEdit ? 'Error updating post' : 'Error creating post', e?.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onOpenChange={(next) => { if (!next) onClose(); }}>
      <ModalContent onClose={onClose} className="max-w-2xl bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6">
        <form onSubmit={handleSubmit}>
          <ModalHeader>
            <div className="flex items-center justify-between">
              <div>
                <ModalTitle className="text-lg font-black text-slate-900 dark:text-white">
                  {isEdit ? t('community.edit_discussion') || 'Edit Discussion' : t('community.start_discussion') || 'Start a Discussion'}
                </ModalTitle>
                <ModalDescription className="text-xs text-slate-500 mt-0.5">
                  Share architecture design, incident post-mortems, or ask technical questions.
                </ModalDescription>
              </div>
              <ModalClose />
            </div>
          </ModalHeader>

          <ModalBody className="space-y-4 py-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Category
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {(['general', 'announcements', 'architecture', 'troubleshooting', 'showcase'] as const).map((c) => {
                  const meta = CATEGORY_ICONS[c];
                  const Icon = meta.Icon;
                  const active = category === c;
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCategory(c)}
                      className={`p-2 rounded-xl text-xs font-bold flex flex-col items-center gap-1.5 border transition-all cursor-pointer ${
                        active
                          ? 'bg-brandGold-500/10 border-brandGold-500 text-brandGold-700 dark:text-brandGold-400 ring-1 ring-brandGold-500'
                          : 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="truncate">{meta.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Automating cross-cloud PostgreSQL failover with Patroni"
                maxLength={255}
                className={`w-full px-3.5 py-2.5 bg-slate-100 dark:bg-slate-900 border ${
                  titleErr ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'
                } rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-brandGold-500/40`}
              />
              {titleErr && <p className="text-[11px] text-rose-500 mt-1">{titleErr}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Content
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={7}
                placeholder="Provide architecture context, metrics thresholds, or reproduction steps..."
                maxLength={30000}
                className={`w-full px-3.5 py-2.5 bg-slate-100 dark:bg-slate-900 border ${
                  contentErr ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'
                } rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-brandGold-500/40 font-mono`}
              />
              {contentErr && <p className="text-[11px] text-rose-500 mt-1">{contentErr}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Tags (comma separated)
              </label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="kubernetes, postgres, ebpf, patroni"
                className="w-full px-3.5 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-brandGold-500/40"
              />
            </div>
          </ModalBody>

          <ModalFooter className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button variant="ghost" size="sm" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              disabled={submitting}
              className="bg-brandGold-500 hover:bg-brandGold-600 text-brandObsidian-950 font-black shadow-md shadow-brandGold-500/20"
            >
              {submitting ? 'Publishing...' : isEdit ? 'Save Changes' : 'Publish Discussion'}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
};

interface PostDetailModalProps {
  open: boolean;
  post: CommunityPost | null;
  comments: CommunityComment[];
  loading: boolean;
  onClose: () => void;
  onToggleLike: () => void;
  onCommentAdded: () => void;
  onUpdateCommentCount: (delta: number) => void;
  onRequestDeleteComment: (c: CommunityComment) => void;
}

const PostDetailModal: React.FC<PostDetailModalProps> = ({
  open,
  post,
  comments,
  loading,
  onClose,
  onToggleLike,
  onCommentAdded,
  onUpdateCommentCount,
  onRequestDeleteComment,
}) => {
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  const isAuthenticated = Boolean(localStorage.getItem('aravanta_token'));

  const handleAddComment = async (parentId: string | null = null) => {
    const text = parentId ? replyText.trim() : commentText.trim();
    if (!text || !post) return;
    setSubmitting(true);
    try {
      await apiFetch(`/community/posts/${post.id}/comments`, {
        method: 'POST',
        body: JSON.stringify({ content: text, parent_id: parentId }),
      });
      if (parentId) {
        setReplyText('');
        setReplyingTo(null);
      } else {
        setCommentText('');
      }
      onUpdateCommentCount(1);
      onCommentAdded();
    } catch {
      /* ignore */
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateComment = async (commentId: string) => {
    const trimmed = editText.trim();
    if (!trimmed) return;
    try {
      await apiFetch(`/community/comments/${commentId}`, {
        method: 'PUT',
        body: JSON.stringify({ content: trimmed }),
      });
      setEditingCommentId(null);
      setEditText('');
      onCommentAdded();
    } catch {
      /* ignore */
    }
  };

  if (!post) return null;

  return (
    <Modal open={open} onOpenChange={(next) => { if (!next) onClose(); }}>
      <ModalContent onClose={onClose} className="max-w-3xl bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 max-h-[90vh] flex flex-col">
        <ModalHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <AuthorAvatar name={post.author?.name || '?'} size="md" />
              <div>
                <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>{post.author?.name}</span>
                  <span className="text-[10px] px-1.5 py-0.5 font-bold rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                    {post.author?.role || 'Engineer'}
                  </span>
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  {new Date(post.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
            <ModalClose />
          </div>
        </ModalHeader>

        <ModalBody className="overflow-y-auto flex-1 py-4 space-y-6">
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">{post.title}</h2>
            <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 mt-3 whitespace-pre-wrap leading-relaxed font-sans">
              {post.content}
            </div>
            {Array.isArray(post.tags) && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-4">
                {post.tags.map((tg, i) => (
                  <span
                    key={`${tg}-${i}`}
                    className="px-2 py-0.5 text-xs font-mono font-medium rounded-md bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800"
                  >
                    #{tg}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 py-3 border-y border-slate-100 dark:border-slate-800">
            <button
              onClick={onToggleLike}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                post.has_liked
                  ? 'bg-rose-50 dark:bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
              }`}
            >
              <Heart className={`w-4 h-4 ${post.has_liked ? 'fill-current' : ''}`} />
              <span>{post.like_count || 0} Upvotes</span>
            </button>
            <div className="text-xs text-slate-400 flex items-center gap-1">
              <MessageCircle className="w-3.5 h-3.5" />
              <span>{post.comment_count || 0} Comments</span>
            </div>
          </div>

          {/* New Comment Input */}
          {isAuthenticated ? (
            <div className="space-y-2">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                rows={3}
                placeholder="Share your technical perspective, query, or runbook manifest..."
                className="w-full px-3.5 py-2.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-brandGold-500/40"
              />
              <div className="flex justify-end">
                <Button
                  variant="primary"
                  size="sm"
                  disabled={submitting || !commentText.trim()}
                  onClick={() => handleAddComment(null)}
                  leftIcon={<Send className="w-3.5 h-3.5" />}
                  className="bg-brandGold-500 hover:bg-brandGold-600 text-brandObsidian-950 font-bold text-xs"
                >
                  Comment
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-slate-100 dark:bg-slate-900 rounded-xl text-xs text-slate-500 text-center">
              Please sign in to participate in the discussion thread.
            </div>
          )}

          {/* Comment Thread */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Discussion Thread ({comments.length})
            </h4>

            {loading ? (
              <div className="text-xs text-slate-400 text-center py-4">Loading comments...</div>
            ) : comments.length === 0 ? (
              <div className="text-xs text-slate-400 text-center py-4">No comments yet. Start the conversation!</div>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 rounded-xl p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AuthorAvatar name={comment.author?.name || '?'} size="sm" />
                      <span className="text-xs font-bold text-slate-900 dark:text-white">{comment.author?.name}</span>
                      <span className="text-[10px] text-slate-400">• {new Date(comment.created_at).toLocaleDateString()}</span>
                    </div>
                    {comment.is_owner && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => { setEditingCommentId(comment.id); setEditText(comment.content); }}
                          className="p-1 text-slate-400 hover:text-brandGold-500 cursor-pointer"
                          title="Edit"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => onRequestDeleteComment(comment)}
                          className="p-1 text-slate-400 hover:text-rose-500 cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>

                  {editingCommentId === comment.id ? (
                    <div className="space-y-2 pt-1">
                      <textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        rows={2}
                        className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                      />
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setEditingCommentId(null)}>Cancel</Button>
                        <Button variant="primary" size="sm" onClick={() => handleUpdateComment(comment.id)}>Save</Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                      {comment.content}
                    </p>
                  )}

                  {isAuthenticated && (
                    <div className="pt-1 flex items-center gap-2">
                      <button
                        onClick={() => {
                          setReplyingTo(replyingTo === comment.id ? null : comment.id);
                          setReplyText('');
                        }}
                        className="text-[11px] font-bold text-slate-500 hover:text-brandGold-500 flex items-center gap-1 cursor-pointer"
                      >
                        <CornerUpRight className="w-3 h-3" /> Reply
                      </button>
                    </div>
                  )}

                  {/* Inline Reply Input */}
                  {replyingTo === comment.id && (
                    <div className="pt-2 pl-4 border-l-2 border-slate-200 dark:border-slate-800 space-y-2">
                      <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        rows={2}
                        placeholder="Write a reply..."
                        className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs"
                      />
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setReplyingTo(null)}>Cancel</Button>
                        <Button
                          variant="primary"
                          size="sm"
                          disabled={submitting || !replyText.trim()}
                          onClick={() => handleAddComment(comment.id)}
                          className="bg-brandGold-500 hover:bg-brandGold-600 text-brandObsidian-950 font-bold text-xs"
                        >
                          Reply
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Nested Replies */}
                  {comment.replies && comment.replies.length > 0 && (
                    <div className="pl-4 border-l-2 border-slate-200 dark:border-slate-800 space-y-2 pt-2">
                      {comment.replies.map((reply) => (
                        <div key={reply.id} className="bg-white dark:bg-slate-900/40 rounded-lg p-2.5 space-y-1">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <AuthorAvatar name={reply.author?.name || '?'} size="sm" />
                              <span className="text-xs font-bold text-slate-900 dark:text-white">{reply.author?.name}</span>
                              <span className="text-[10px] text-slate-400">• {new Date(reply.created_at).toLocaleDateString()}</span>
                            </div>
                            {reply.is_owner && (
                              <button
                                onClick={() => onRequestDeleteComment(reply)}
                                className="p-1 text-slate-400 hover:text-rose-500 cursor-pointer"
                                title="Delete"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-wrap pl-6">
                            {reply.content}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

interface DeleteConfirmModalProps {
  open: boolean;
  kind: 'post' | 'comment';
  onClose: () => void;
  onConfirm: () => void;
}

const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({ open, kind, onClose, onConfirm }) => (
  <Modal open={open} onOpenChange={(next) => { if (!next) onClose(); }}>
    <ModalContent onClose={onClose} className="max-w-md bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl">
      <ModalHeader>
        <ModalTitle className="text-base font-bold text-slate-900 dark:text-white">
          Delete {kind === 'post' ? 'Discussion' : 'Comment'}?
        </ModalTitle>
        <ModalDescription className="text-xs text-slate-500 mt-1">
          Are you sure you want to delete this {kind}? This action cannot be undone.
        </ModalDescription>
      </ModalHeader>
      <ModalFooter className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800 mt-4">
        <Button variant="ghost" size="sm" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={onConfirm}
          className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
        >
          Confirm Delete
        </Button>
      </ModalFooter>
    </ModalContent>
  </Modal>
);
