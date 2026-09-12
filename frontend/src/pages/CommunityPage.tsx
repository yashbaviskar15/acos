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
  SendHorizontal,
  CornerUpRight,
  Sparkles,
  BookOpen,
  Rocket,
  Megaphone,
  Wrench,
} from 'lucide-react';
import { apiFetch } from '../config/api';
import { Card, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { Badge } from '../components/ui/Badge';
import { Skeleton, SkeletonText } from '../components/ui/Skeleton';
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

function adaptPostFromApi(raw: any): any {
  if (!raw) return raw;
  return {
    ...raw,
    author: raw.author ? raw.author : {
      id: raw.user_id,
      name: raw.author_name,
      email: raw.author_email,
      role: raw.author_role,
      avatar: raw.author_avatar,
    },
    like_count: typeof raw.like_count === 'number' ? raw.like_count : (typeof raw.likes_count === 'number' ? raw.likes_count : 0),
    view_count: typeof raw.view_count === 'number' ? raw.view_count : (typeof raw.views_count === 'number' ? raw.views_count : 0),
    comment_count: typeof raw.comment_count === 'number' ? raw.comment_count : (typeof raw.comments_count === 'number' ? raw.comments_count : 0),
    has_liked: typeof raw.has_liked === 'boolean' ? raw.has_liked : false,
    is_owner: typeof raw.is_owner === 'boolean' ? raw.is_owner : false,
  };
}

function adaptCommentFromApi(raw: any): any {
  if (!raw) return raw;
  return {
    ...raw,
    author: raw.author ? raw.author : {
      id: raw.user_id,
      name: raw.author_name,
      email: raw.author_email,
      role: raw.author_role,
      avatar: raw.author_avatar,
    },
    is_owner: typeof raw.is_owner === 'boolean' ? raw.is_owner : false,
  };
}

export interface CommunityAuthor {
  id?: string;
  user_id?: string;
  name: string;
  email?: string;
  avatar_url?: string | null;
  role?: string;
}

export interface CommunityPost {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  author: CommunityAuthor;
  like_count: number;
  comment_count: number;
  view_count: number;
  is_pinned: boolean;
  has_liked: boolean;
  is_owner: boolean;
  created_at: string;
  updated_at: string;
}

export interface CommunityComment {
  id: string;
  post_id: string;
  parent_id: string | null;
  content: string;
  author: CommunityAuthor;
  is_owner: boolean;
  created_at: string;
  updated_at: string;
  replies?: CommunityComment[];
}

export interface CommunityStats {
  total_discussions?: number;
  total_comments?: number;
  total_likes?: number;
  contributors_count?: number;
  engineers_count?: number;
}

interface Toast {
  id: string;
  title: string;
  description?: string;
  variant: 'success' | 'error' | 'warning' | 'info';
}

type Category = 'all' | 'general' | 'announcements' | 'architecture' | 'troubleshooting' | 'showcase';
type SortKey = 'latest' | 'popular' | 'most_commented' | 'most_viewed';

const PAGE_SIZE = 6;

const CATEGORY_ICONS: Record<Exclude<Category, 'all'>, { label: string; Icon: React.FC<any>; bg: string; fg: string }> = {
  general: { label: 'General', Icon: MessageCircleQuestion, bg: 'bg-slate-100 dark:bg-brandObsidian-700', fg: 'text-slate-600 dark:text-slate-300' },
  announcements: { label: 'Announcements', Icon: Megaphone, bg: 'bg-brandGold-500/10', fg: 'text-brandGold-700 dark:text-brandGold-400' },
  architecture: { label: 'Architecture', Icon: Rocket, bg: 'bg-violet-500/10', fg: 'text-violet-700 dark:text-violet-400' },
  troubleshooting: { label: 'Troubleshooting', Icon: Wrench, bg: 'bg-amber-500/10', fg: 'text-amber-700 dark:text-amber-400' },
  showcase: { label: 'Showcase', Icon: Sparkles, bg: 'bg-emerald-500/10', fg: 'text-emerald-700 dark:text-emerald-400' },
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
  if (diffSec < 60) return t('community.time_just_now');
  if (diffMin < 60) return `${diffMin}${t('community.time_minutes')}`;
  if (diffHour < 24) return `${diffHour}${t('community.time_hours')}`;
  if (diffDay < 7) return `${diffDay}${t('community.time_days')}`;
  if (diffWk < 5) return `${diffWk}${t('community.time_weeks')}`;
  if (diffMo < 12) return `${diffMo}${t('community.time_months')}`;
  return `${diffYr}${t('community.time_years')}`;
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
      className={`${sizeCls} ${colors[colorIdx]} ${className} rounded-full flex items-center justify-center font-bold shadow-sm shrink-0 ring-2 ring-white dark:ring-brandObsidian-800`}
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
              className={`${cfg.bgCls} ${cfg.borderCls} pointer-events-auto border border-slate-200 dark:border-brandObsidian-700 rounded-xl shadow-xl p-3.5 bg-white dark:bg-brandObsidian-900 backdrop-blur`}
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
                  className="shrink-0 p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-brandObsidian-800"
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

const StatCard: React.FC<{ Icon: React.FC<any>; label: string; value: number | string | undefined; accent: string }> = ({ Icon, label, value, accent }) => (
  <Card className="flex-1 min-w-[130px] border border-slate-200/80 dark:border-brandObsidian-700/80 hover:border-brandGold-500/40 hover:shadow-md transition-all">
    <CardBody className="p-3.5 sm:p-5">
      <div className="flex items-center gap-3 sm:gap-4">
        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl ${accent} flex items-center justify-center shrink-0 shadow-sm`}>
          <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
        <div className="min-w-0">
          <div className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            {typeof value === 'number' ? value.toLocaleString() : (value ?? '0')}
          </div>
          <div className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium truncate">{label}</div>
        </div>
      </div>
    </CardBody>
  </Card>
);

const PostCardSkeleton: React.FC = () => (
  <Card>
    <CardBody className="p-5">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <Skeleton className="w-10 h-10 rounded-full" />
          <div className="min-w-0 flex-1">
            <Skeleton className="h-3.5 w-24 rounded-full mb-1.5" />
            <Skeleton className="h-3 w-16 rounded-full" />
          </div>
        </div>
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>
      <Skeleton className="h-5 w-11/12 rounded mb-2" />
      <Skeleton className="h-5 w-3/4 rounded mb-4" />
      <SkeletonText lines={3} lastLineWidth="70%" />
      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-16 rounded-full" />
          <Skeleton className="h-8 w-14 rounded-full" />
          <Skeleton className="h-8 w-14 rounded-full" />
        </div>
        <Skeleton className="h-4 w-20 rounded-full" />
      </div>
    </CardBody>
  </Card>
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
  contributors_count: 0,
  engineers_count: 0,
};

export const CommunityPage: React.FC<CommunityPageProps> = ({
  onNavigate,
  onGoToLogin,
  onGoToRegister,
  onOpenCommandPalette,
  currentView = 'community',
}) => {
  const { t } = useTranslation();
  const isPublicLanding = Boolean(onGoToLogin || onGoToRegister || !localStorage.getItem('aravanta_token'));

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

  const isAuthenticated = !!localStorage.getItem('aravanta_token');

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await apiFetch<CommunityStats>('/community/stats', { method: 'GET' });
      setStats(res || emptyStats);
    } catch { /* stats failure is non-fatal */ }
    finally { setStatsLoading(false); }
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
      setPosts(list.map(adaptPostFromApi));
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
  }, [category, sort, searchTerm, page, t]);

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
      optimisticUpdatePost(post.id, { has_liked: !!res?.liked, like_count: typeof res?.likes_count === 'number' ? res.likes_count : (post.like_count as number) });
    } catch (e: any) {
      optimisticUpdatePost(post.id, { has_liked: prevLiked, like_count: prevCount });
      addToast({ variant: 'error', title: t('community.error_like'), description: e?.message });
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
      if (detailRes) setDetailPost(adaptPostFromApi(detailRes));
      const rawComments = Array.isArray(commentsRes) ? commentsRes : (commentsRes as any)?.comments || [];
      setDetailComments(rawComments.map(adaptCommentFromApi));
    } catch (e: any) {
      addToast({ variant: 'error', title: t('community.error_load_post'), description: e?.message });
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
      addToast({ variant: 'success', title: t('community.post_deleted') });
    } catch (e: any) {
      addToast({ variant: 'error', title: t('community.error_delete_post'), description: e?.message });
      setDeleteConfirm(null);
    }
  };

  const sortLabel = (key: SortKey): string => ({
    latest: t('community.sort_latest'),
    popular: t('community.sort_popular'),
    most_commented: t('community.sort_most_commented'),
    most_viewed: t('community.sort_most_viewed'),
  }[key]);

  const pageContent = (
    <div className="relative overflow-hidden pt-6 sm:pt-10 pb-16">
      <div aria-hidden className="absolute inset-x-0 top-0 -z-10 h-[520px] bg-hero-radial opacity-80 pointer-events-none" />
      <InlineToaster toasts={toasts} onRemove={removeToast} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 sm:mb-8">
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
            className="mb-4 sm:mb-6"
          />

          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 pb-5 border-b border-slate-200/70 dark:border-brandObsidian-800">
            <div className="space-y-3">
              <Badge variant="gold" size="md" dot>
                <MessageSquare className="w-3.5 h-3.5" /> {t('community.breadcrumb') || 'Community Hub'}
              </Badge>
              <div>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.08]">
                  {t('community.title') || 'Community Hub'}
                </h1>
                <p className="mt-2 text-sm sm:text-base text-slate-600 dark:text-slate-300 font-medium max-w-2xl leading-relaxed">
                  {t('community.subtitle') || 'Connect with cloud engineers, SREs, and platform teams building on Aravanta Cloud OS. Ask questions, share architectures, and learn from production-grade write-ups.'}
                </p>
              </div>
            </div>
            <Button
              variant="primary"
              size="md"
              onClick={() => {
                if (!isAuthenticated) {
                  if (onGoToLogin) {
                    onGoToLogin();
                  } else {
                    addToast({ variant: 'info', title: t('community.login_required') || 'Sign in required', description: t('community.login_to_post') || 'You must be signed in to create a post.' });
                  }
                  return;
                }
                setEditingPost(null);
                setCreateOpen(true);
              }}
              leftIcon={<Plus className="w-4 h-4" />}
              className="bg-brandGold-500 hover:bg-brandGold-600 text-brandObsidian-950 font-bold shadow-md shadow-brandGold-500/20 w-full sm:w-auto min-h-[44px] px-5 shrink-0"
            >
              {t('community.create_post') || 'Create Post'}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mb-6 sm:mb-8">
          {statsLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Card key={`st-${i}`}><CardBody className="p-4 sm:p-5"><Skeleton className="h-14 rounded-xl" /></CardBody></Card>
            ))
          ) : (
            <>
              <StatCard Icon={MessageSquare} label={t('community.stat_discussions')} value={stats.total_discussions} accent="bg-brandGold-500/10 text-brandGold-700 dark:text-brandGold-400" />
              <StatCard Icon={MessageCircle} label={t('community.stat_comments')} value={stats.total_comments} accent="bg-sky-500/10 text-sky-700 dark:text-sky-400" />
              <StatCard Icon={ThumbsUp} label={t('community.stat_likes')} value={stats.total_likes} accent="bg-rose-500/10 text-rose-700 dark:text-rose-400" />
              <StatCard Icon={Users} label={t('community.stat_contributors')} value={stats.contributors_count ?? stats.engineers_count} accent="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" />
              <div className="hidden lg:block">
                <StatCard Icon={Users} label={t('community.stat_engineers')} value={stats.engineers_count ?? stats.contributors_count} accent="bg-violet-500/10 text-violet-700 dark:text-violet-400" />
              </div>
            </>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-5">
          {(['all', 'general', 'announcements', 'architecture', 'troubleshooting', 'showcase'] as Category[]).map((c) => {
            const active = category === c;
            const meta = c === 'all' ? null : CATEGORY_ICONS[c];
            const CI: React.FC<any> | null = c === 'all' ? Filter : (meta ? meta.Icon : null);
            return (
              <button
                key={c}
                onClick={() => { setCategory(c); setPage(1); }}
                className={[
                  'inline-flex items-center gap-1.5 h-9 px-3 sm:px-3.5 rounded-xl font-semibold text-xs sm:text-sm min-h-[40px] transition-all',
                  active
                    ? 'bg-brandGold-500 text-brandObsidian-950 shadow-md shadow-brandGold-500/20'
                    : 'bg-white dark:bg-brandObsidian-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-brandObsidian-700 hover:border-brandGold-500/50 hover:text-brandGold-700 dark:hover:text-brandGold-400',
                ].join(' ')}
              >
                {CI && <CI className="w-4 h-4 shrink-0" />}
                <span>{c === 'all' ? t('community.category_all') : t(`community.category_${c}`)}</span>
              </button>
            );
          })}
        </div>

        <Card className="mb-6 sm:mb-8">
          <CardBody className="p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 min-w-0">
                <Input
                  size="md"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder={t('community.search_placeholder')}
                  leftIcon={<Search className="w-4 h-4" />}
                  clearable
                  onClear={() => { setSearchInput(''); setSearchTerm(''); setPage(1); }}
                />
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <div className="relative">
                  <select
                    value={sort}
                    onChange={(e) => { setSort(e.target.value as SortKey); setPage(1); }}
                    className="h-11 min-h-[44px] pl-10 pr-9 rounded-xl border border-slate-200 dark:border-brandObsidian-700 bg-white dark:bg-brandObsidian-900 text-sm font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brandGold-500/30 focus:border-brandGold-500 appearance-none cursor-pointer w-full sm:w-auto"
                    aria-label={t('community.sort_label')}
                  >
                    <option value="latest">{sortLabel('latest')}</option>
                    <option value="popular">{sortLabel('popular')}</option>
                    <option value="most_commented">{sortLabel('most_commented')}</option>
                    <option value="most_viewed">{sortLabel('most_viewed')}</option>
                  </select>
                  <SortAsc className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>
          </CardBody>
        </Card>

        {error && (
          <Card className="mb-6 border-rose-200 dark:border-rose-500/30 bg-rose-500/5">
            <CardBody className="p-5">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-slate-900 dark:text-white">{t('community.error_title')}</div>
                  <div className="text-sm mt-0.5 text-slate-600 dark:text-slate-300 break-words">{error}</div>
                </div>
                <Button variant="outline" size="md" onClick={loadPosts} leftIcon={<RefreshCw className="w-4 h-4" />}>
                  {t('common.retry')}
                </Button>
              </div>
            </CardBody>
          </Card>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
            {Array.from({ length: Math.max(3, PAGE_SIZE) }).map((_, i) => <PostCardSkeleton key={`sk-${i}`} />)}
          </div>
        ) : posts.length === 0 ? (
          <Card>
            <CardBody className="py-16 sm:py-20">
              <div className="flex flex-col items-center text-center max-w-md mx-auto">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-brandGold-500/10 flex items-center justify-center mb-5">
                  <MessageCircleQuestion className="w-10 h-10 sm:w-12 sm:h-12 text-brandGold-600 dark:text-brandGold-400" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-2">
                  {searchTerm || category !== 'all' ? t('community.no_results') : t('community.no_posts')}
                </h3>
                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mb-6">
                  {searchTerm || category !== 'all' ? t('community.no_results_desc') : t('community.no_posts_desc')}
                </p>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  {(searchTerm || category !== 'all') && (
                    <Button
                      variant="outline"
                      size="md"
                      onClick={() => { setSearchInput(''); setSearchTerm(''); setCategory('all'); setPage(1); }}
                      className="w-full sm:w-auto"
                    >
                      {t('community.clear_filters')}
                    </Button>
                  )}
                  {isAuthenticated && (
                    <Button
                      variant="primary"
                      size="md"
                      onClick={() => { setEditingPost(null); setCreateOpen(true); }}
                      leftIcon={<Plus className="w-4 h-4" />}
                      className="bg-brandGold-500 hover:bg-brandGold-600 text-brandObsidian-950 font-bold w-full sm:w-auto"
                    >
                      {t('community.create_first_post')}
                    </Button>
                  )}
                </div>
              </div>
            </CardBody>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
              {posts.map((post) => (
                <motion.div
                  key={post.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  <Card hover className="h-full flex flex-col">
                    <CardBody className="p-5 flex flex-col flex-1 gap-4">
                      <div className="flex items-start justify-between gap-3">
                        <button
                          type="button"
                          onClick={() => openPostDetail(post)}
                          className="flex items-center gap-3 min-w-0 flex-1 text-left"
                        >
                          <AuthorAvatar name={post.author?.name || '?'} size="md" />
                          <div className="min-w-0">
                            <div className="text-sm font-bold text-slate-900 dark:text-white truncate">
                              {post.author?.name || t('community.anonymous')}
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                              <Clock className="w-3 h-3 shrink-0" />
                              <span className="truncate">{formatRelativeTime(post.created_at, t)}</span>
                              {post.updated_at && post.updated_at !== post.created_at && (
                                <span className="truncate opacity-70"> · {t('community.edited')}</span>
                              )}
                            </div>
                          </div>
                        </button>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {post.is_pinned && (
                            <Badge variant="gold" size="sm" dot>
                              <Pin className="w-3 h-3" />
                            </Badge>
                          )}
                          {post.category && post.category !== 'general' && (
                            <Badge
                              size="sm"
                              variant={post.category === 'announcements' ? 'gold' : post.category === 'troubleshooting' ? 'warning' : post.category === 'architecture' ? 'info' : post.category === 'showcase' ? 'success' : 'default'}
                            >
                              {t(`community.category_${post.category}`)}
                            </Badge>
                          )}

                          {post.is_owner && (
                            <div className="flex items-center gap-0.5 ml-1">
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setEditingPost(post); setCreateOpen(true); }}
                                className="p-2 rounded-lg text-slate-400 hover:text-brandGold-600 dark:hover:text-brandGold-400 hover:bg-brandGold-50 dark:hover:bg-brandObsidian-700 transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
                                title={t('common.edit')}
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setDeleteConfirm({ kind: 'post', id: post.id }); }}
                                className="p-2 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
                                title={t('common.delete')}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => openPostDetail(post)}
                        className="text-left"
                      >
                        <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-2 line-clamp-2 hover:text-brandGold-700 dark:hover:text-brandGold-400 transition-colors">
                          {post.title}
                        </h3>
                      </button>

                      <div className="flex-1 min-h-[4.5rem]">
                        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-4 whitespace-pre-wrap break-words">
                          {post.content}
                        </p>
                      </div>

                      {Array.isArray(post.tags) && post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {post.tags.slice(0, 4).map((tg, i) => (
                            <span
                              key={`${tg}-${i}`}
                              className="inline-flex items-center px-2 py-0.5 text-[11px] font-semibold rounded-md bg-slate-100 dark:bg-brandObsidian-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-brandObsidian-600"
                            >
                              #{tg}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-3 mt-auto border-t border-slate-100 dark:border-brandObsidian-700/60">
                        <div className="flex items-center gap-1.5 sm:gap-2">
                          <button
                            type="button"
                            onClick={() => handleToggleLike(post)}
                            className={[
                              'inline-flex items-center gap-1.5 h-8 px-2.5 sm:px-3 rounded-lg font-semibold text-xs sm:text-sm min-h-[36px] transition-all',
                              post.has_liked
                                ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-brandObsidian-700 hover:text-slate-700 dark:hover:text-slate-200 border border-transparent',
                            ].join(' ')}
                          >
                            <Heart className={`w-4 h-4 ${post.has_liked ? 'fill-current' : ''}`} />
                            <span>{post.like_count || 0}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => openPostDetail(post)}
                            className="inline-flex items-center gap-1.5 h-8 px-2.5 sm:px-3 rounded-lg font-semibold text-xs sm:text-sm min-h-[36px] text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-brandObsidian-700 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                          >
                            <MessageCircle className="w-4 h-4" />
                            <span>{post.comment_count || 0}</span>
                          </button>

                          <div className="inline-flex items-center gap-1.5 h-8 px-2.5 sm:px-3 rounded-lg font-semibold text-xs sm:text-sm min-h-[36px] text-slate-500 dark:text-slate-400">
                            <Eye className="w-4 h-4" />
                            <span>{post.view_count || 0}</span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => openPostDetail(post)}
                          className="text-xs sm:text-sm font-bold text-brandGold-700 dark:text-brandGold-400 hover:text-brandGold-600 dark:hover:text-brandGold-300 min-h-[36px] px-2 rounded-lg hover:bg-brandGold-50 dark:hover:bg-brandObsidian-700 transition-colors"
                        >
                          {t('community.read_more')} →
                        </button>
                      </div>
                    </CardBody>
                  </Card>
                </motion.div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-between gap-3 flex-wrap">
                <div className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  {t('community.page_info', { page, total: totalPages, count: totalCount })}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1 || loading}
                    leftIcon={<ChevronLeft className="w-4 h-4" />}
                  >
                    {t('community.prev_page')}
                  </Button>
                  <div className="text-sm font-bold px-3 text-slate-800 dark:text-white">
                    {page} / {totalPages}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages || loading}
                    rightIcon={<ChevronRight className="w-4 h-4" />}
                  >
                    {t('community.next_page')}
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <CreateEditPostModal
        open={createOpen}
        post={editingPost}
        onClose={() => { setCreateOpen(false); setEditingPost(null); }}
        onCreated={(newPost) => {
          if (editingPost) {
            setPosts(prev => prev.map(p => p.id === newPost.id ? newPost : p));
            if (detailPost?.id === newPost.id) setDetailPost(newPost);
            addToast({ variant: 'success', title: t('community.post_updated') });
          } else {
            setPosts(prev => [newPost, ...prev].slice(0, PAGE_SIZE));
            setPage(1);
            setStats(s => ({ ...s, total_discussions: (s.total_discussions ?? 0) + 1 }));
            addToast({ variant: 'success', title: t('community.post_created') });
          }
          setCreateOpen(false);
          setEditingPost(null);
        }}
        onError={(title, desc) => addToast({ variant: 'error', title, description: desc })}
      />

      <PostDetailModal
        open={detailOpen}
        post={detailPost}
        comments={detailComments}
        loading={detailLoading}
        currentUser={currentUser}
        isAuthenticated={isAuthenticated}
        onClose={() => { setDetailOpen(false); setDetailPost(null); setDetailComments([]); }}
        onToggleLike={() => detailPost && handleToggleLike(detailPost)}
        onEditPost={(p) => { setDetailOpen(false); setEditingPost(p); setCreateOpen(true); }}
        onRequestDeletePost={(p) => setDeleteConfirm({ kind: 'post', id: p.id })}
        onRefreshComments={async () => {
          if (!detailPost) return;
          try {
            const res = await apiFetch<CommunityComment[]>(`/community/posts/${detailPost.id}/comments`, { method: 'GET' });
            const rawComments = Array.isArray(res) ? res : (res as any)?.comments || [];
            setDetailComments(rawComments.map(adaptCommentFromApi));
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

      <DeleteConfirmModal
        open={!!deleteConfirm}
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
        <main className="flex-1">
          {pageContent}
        </main>
        <Footer onNavigate={onNavigate} />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-80px)] bg-slate-50 dark:bg-brandObsidian-950 font-sans antialiased text-slate-900 dark:text-slate-100">
      {pageContent}
    </div>
  );

  async function handleDeleteComment(postId: string, commentId: string) {
    try {
      await apiFetch(`/community/comments/${commentId}`, { method: 'DELETE' });
      setDetailComments(prev => prev.filter(c => c.id !== commentId && c.parent_id !== commentId));
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, comment_count: Math.max(0, (p.comment_count || 1) - 1) } : p));
      if (detailPost) {
        setDetailPost({ ...detailPost, comment_count: Math.max(0, (detailPost.comment_count || 1) - 1) });
      }
      setDeleteConfirm(null);
      addToast({ variant: 'success', title: t('community.comment_deleted') });
    } catch (e: any) {
      addToast({ variant: 'error', title: t('community.error_delete_comment'), description: e?.message });
      setDeleteConfirm(null);
    }
  }
};

interface CreateEditPostModalProps {
  open: boolean;
  post: CommunityPost | null;
  onClose: () => void;
  onCreated: (p: CommunityPost) => void;
  onError: (title: string, desc?: string) => void;
}

const CreateEditPostModal: React.FC<CreateEditPostModalProps> = ({ open, post, onClose, onCreated, onError }) => {
  const { t } = useTranslation();
  const isEdit = !!post;
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
    if (trimmedTitle.length < 3) { setTitleErr(t('community.err_title_short')); ok = false; }
    else if (trimmedTitle.length > 255) { setTitleErr(t('community.err_title_long')); ok = false; }
    else setTitleErr(null);
    if (trimmedContent.length < 5) { setContentErr(t('community.err_content_short')); ok = false; }
    else if (trimmedContent.length > 30000) { setContentErr(t('community.err_content_long')); ok = false; }
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
      onError(isEdit ? t('community.error_update_post') : t('community.error_create_post'), e?.message);
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onOpenChange={(o) => { if (!o && !submitting) onClose(); }}>
      <ModalContent size="lg" onClose={onClose}>
        <ModalHeader>
          <ModalTitle>{isEdit ? t('community.edit_post') : t('community.create_post')}</ModalTitle>
          <ModalDescription>
            {isEdit ? t('community.edit_post_desc') : t('community.create_post_desc')}
          </ModalDescription>
        </ModalHeader>
        <form onSubmit={handleSubmit} noValidate>
          <ModalBody className="space-y-4 max-h-[65vh] overflow-y-auto">
            <div>
              <label className="block text-sm font-bold text-slate-800 dark:text-white mb-1.5">
                {t('community.field_title')} <span className="text-rose-500">*</span>
              </label>
              <Input
                size="md"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t('community.placeholder_title')}
                maxLength={255}
                className={titleErr ? 'border-rose-500 focus:ring-rose-500/30' : ''}
              />
              <div className="flex items-center justify-between mt-1.5">
                {titleErr ? (
                  <span className="text-xs text-rose-500 font-medium">{titleErr}</span>
                ) : <span />}
                <span className="text-[11px] text-slate-400 font-medium ml-auto">{title.length}/255</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-800 dark:text-white mb-1.5">
                {t('community.field_category')}
              </label>
              <div className="relative">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full h-11 min-h-[44px] px-4 rounded-xl border border-slate-200 dark:border-brandObsidian-700 bg-white dark:bg-brandObsidian-900 text-sm font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brandGold-500/30 focus:border-brandGold-500 appearance-none cursor-pointer pr-10"
                >
                  {(['general', 'announcements', 'architecture', 'troubleshooting', 'showcase'] as const).map((c) => (
                    <option key={c} value={c}>{t(`community.category_${c}`)}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-800 dark:text-white mb-1.5">
                {t('community.field_content')} <span className="text-rose-500">*</span>
              </label>
              <Textarea
                rows={8}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={t('community.placeholder_content')}
                maxLength={30000}
              />
              <div className="flex items-center justify-between mt-1.5">
                {contentErr ? (
                  <span className="text-xs text-rose-500 font-medium">{contentErr}</span>
                ) : <span />}
                <span className="text-[11px] text-slate-400 font-medium ml-auto">{content.length}/30000</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-800 dark:text-white mb-1.5">
                {t('community.field_tags')}
              </label>
              <Input
                size="md"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder={t('community.placeholder_tags')}
              />
              <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                {t('community.tags_hint')}
              </p>
            </div>
          </ModalBody>

          <ModalFooter>
            <ModalClose>
              <Button variant="outline" size="md" disabled={submitting} type="button">
                {t('common.cancel')}
              </Button>
            </ModalClose>
            <Button
              variant="primary"
              size="md"
              type="submit"
              loading={submitting}
              leftIcon={isEdit ? <Pencil className="w-4 h-4" /> : <Send className="w-4 h-4" />}
              className="bg-brandGold-500 hover:bg-brandGold-600 text-brandObsidian-950 font-bold"
            >
              {isEdit ? t('common.save') : t('community.submit_post')}
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
  currentUser: { id?: string; name?: string } | null;
  isAuthenticated: boolean;
  onClose: () => void;
  onToggleLike: () => void;
  onEditPost: (p: CommunityPost) => void;
  onRequestDeletePost: (p: CommunityPost) => void;
  onRefreshComments: () => Promise<void>;
  onUpdateCommentCount: (delta: number) => void;
  onRequestDeleteComment: (c: CommunityComment) => void;
}

const PostDetailModal: React.FC<PostDetailModalProps> = ({
  open, post, comments, loading, currentUser, isAuthenticated,
  onClose, onToggleLike, onEditPost, onRequestDeletePost,
  onRefreshComments, onUpdateCommentCount, onRequestDeleteComment,
}) => {
  const { t } = useTranslation();
  const [commentText, setCommentText] = useState('');
  const [commentErr, setCommentErr] = useState<string | null>(null);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentText, setEditingCommentText] = useState('');
  const tree = useMemo(() => post ? buildCommentsTree(comments) : [], [comments, post]);

  useEffect(() => {
    if (!open) {
      setCommentText(''); setCommentErr(null); setSubmittingComment(false);
      setReplyToId(null); setReplyText('');
      setEditingCommentId(null); setEditingCommentText('');
    }
  }, [open]);

  const handleSubmitComment = async (e: React.FormEvent, parentId?: string) => {
    e.preventDefault();
    if (!post) return;
    const text = (parentId ? replyText : commentText).trim();
    setCommentErr(null);
    if (text.length < 2) { setCommentErr(t('community.err_comment_short')); return; }
    if (text.length > 5000) { setCommentErr(t('community.err_comment_long')); return; }
    if (!isAuthenticated) { setCommentErr(t('community.login_to_comment')); return; }
    setSubmittingComment(true);
    try {
      const newComment = await apiFetch<CommunityComment>(`/community/posts/${post.id}/comments`, {
        method: 'POST',
        body: JSON.stringify({ content: text, parent_id: parentId ?? null }),
      });
      const adaptedComment = adaptCommentFromApi(newComment);
      void adaptedComment;
      onUpdateCommentCount(1);
      if (parentId) { setReplyToId(null); setReplyText(''); }
      else setCommentText('');
      await onRefreshComments();
    } catch (e: any) {
      setCommentErr(e?.message || t('community.error_create_comment'));
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleEditComment = async (commentId: string) => {
    const txt = editingCommentText.trim();
    if (txt.length < 2 || txt.length > 5000) return;
    try {
      const updatedComment = await apiFetch<CommunityComment>(`/community/comments/${commentId}`, {
        method: 'PUT', body: JSON.stringify({ content: txt }),
      });
      const adaptedUpdated = adaptCommentFromApi(updatedComment);
      void adaptedUpdated;
      setEditingCommentId(null);
      setEditingCommentText('');
      await onRefreshComments();
    } catch (e: any) {
      setCommentErr(e?.message || t('community.error_update_comment'));
    }
  };

  if (!post) return null;

  return (
    <Modal open={open} onOpenChange={(o) => { if (!o && !submittingComment) onClose(); }}>
      <ModalContent size="xl" onClose={onClose}>
        <ModalHeader>
          <div className="flex items-start justify-between gap-4 pr-10">
            <div className="min-w-0">
              <ModalTitle className="!text-xl !leading-tight break-words pr-2">
                {post.title}
              </ModalTitle>
              <div className="mt-2 flex items-center gap-2 flex-wrap">
                <AuthorAvatar name={post.author?.name || '?'} size="sm" />
                <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                  <span className="font-bold text-slate-800 dark:text-white">{post.author?.name || t('community.anonymous')}</span>
                  <span className="mx-1 opacity-50">·</span>
                  <span>{formatRelativeTime(post.created_at, t)}</span>
                  {post.category && (
                    <>
                      <span className="mx-1 opacity-50">·</span>
                      <span className="font-semibold text-brandGold-700 dark:text-brandGold-400">{t(`community.category_${post.category}`)}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            {post.is_owner && (
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => onEditPost(post)}
                  className="p-2 rounded-lg text-slate-400 hover:text-brandGold-600 dark:hover:text-brandGold-400 hover:bg-brandGold-50 dark:hover:bg-brandObsidian-700 min-w-[38px] min-h-[38px] flex items-center justify-center"
                  title={t('common.edit')}
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onRequestDeletePost(post)}
                  className="p-2 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 min-w-[38px] min-h-[38px] flex items-center justify-center"
                  title={t('common.delete')}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </ModalHeader>
        <ModalBody className="max-h-[70vh] overflow-y-auto space-y-5">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onToggleLike}
                className={[
                  'inline-flex items-center gap-2 h-10 px-4 rounded-xl font-bold text-sm transition-all min-h-[40px]',
                  post.has_liked
                    ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                    : 'bg-slate-100 dark:bg-brandObsidian-700 text-slate-700 dark:text-slate-200 hover:border-brandGold-500/50 border border-slate-200 dark:border-brandObsidian-600',
                ].join(' ')}
              >
                <Heart className={`w-4 h-4 ${post.has_liked ? 'fill-current' : ''}`} />
                <span>{post.like_count || 0} {t('community.likes')}</span>
              </button>
              <div className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-slate-100 dark:bg-brandObsidian-700 text-slate-700 dark:text-slate-200 font-bold text-sm border border-slate-200 dark:border-brandObsidian-600">
                <MessageCircle className="w-4 h-4" />
                <span>{post.comment_count || 0} {t('community.comments')}</span>
              </div>
              <div className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-slate-100 dark:bg-brandObsidian-700 text-slate-700 dark:text-slate-200 font-bold text-sm border border-slate-200 dark:border-brandObsidian-600">
                <Eye className="w-4 h-4" />
                <span>{post.view_count || 0}</span>
              </div>
            </div>

            {Array.isArray(post.tags) && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {post.tags.map((tg, i) => (
                  <span
                    key={`${tg}-${i}`}
                    className="inline-flex items-center px-2.5 py-1 text-xs font-bold rounded-lg bg-slate-100 dark:bg-brandObsidian-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-brandObsidian-600"
                  >
                    #{tg}
                  </span>
                ))}
              </div>
            )}

            <div className="rounded-2xl border border-slate-200 dark:border-brandObsidian-700 bg-slate-50/50 dark:bg-brandObsidian-900/50 p-4 sm:p-5">
              <div className="text-sm sm:text-base text-slate-800 dark:text-slate-100 leading-relaxed whitespace-pre-wrap break-words">
                {post.content}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-brandObsidian-700">
            <h4 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-brandGold-600 dark:text-brandGold-400" />
              {t('community.comments')} ({comments.length})
            </h4>

            <form onSubmit={(e) => handleSubmitComment(e)} noValidate className="mb-5">
              <Textarea
                rows={3}
                value={commentText}
                onChange={(e) => { setCommentText(e.target.value); if (commentErr) setCommentErr(null); }}
                placeholder={isAuthenticated ? t('community.placeholder_comment') : t('community.login_to_comment')}
                disabled={!isAuthenticated || submittingComment}
                maxLength={5000}
              />
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {commentErr && <span className="text-xs text-rose-500 font-medium truncate">{commentErr}</span>}
                  {!commentErr && <span className="text-[11px] text-slate-400 font-medium">{commentText.length}/5000</span>}
                </div>
                <Button
                  variant="primary"
                  size="md"
                  type="submit"
                  loading={submittingComment}
                  leftIcon={<SendHorizontal className="w-4 h-4" />}
                  disabled={!isAuthenticated}
                  className="bg-brandGold-500 hover:bg-brandGold-600 text-brandObsidian-950 font-bold shrink-0 mt-2 sm:mt-0"
                >
                  {t('community.submit_comment')}
                </Button>
              </div>
            </form>

            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={`sc-${i}`} className="flex gap-3">
                    <Skeleton className="w-10 h-10 rounded-full shrink-0" />
                    <div className="flex-1 space-y-2"><Skeleton className="h-4 w-1/3 rounded mb-2" /><SkeletonText lines={2} /></div>
                  </div>
                ))}
              </div>
            ) : tree.length === 0 ? (
              <div className="py-10 text-center rounded-2xl border border-dashed border-slate-200 dark:border-brandObsidian-700 bg-slate-50 dark:bg-brandObsidian-900/50">
                <MessageCircle className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                <div className="text-sm font-bold text-slate-500 dark:text-slate-400">{t('community.no_comments')}</div>
                <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{t('community.no_comments_desc')}</div>
              </div>
            ) : (
              <div className="space-y-4">
                {tree.map((c) => (
                  <CommentItem
                    key={c.id}
                    comment={c}
                    depth={0}
                    currentUser={currentUser}
                    isAuthenticated={isAuthenticated}
                    replyToId={replyToId}
                    setReplyToId={setReplyToId}
                    replyText={replyText}
                    setReplyText={setReplyText}
                    onReplySubmit={(e) => handleSubmitComment(e, c.id)}
                    submittingComment={submittingComment}
                    editingId={editingCommentId}
                    setEditingId={setEditingCommentId}
                    editingText={editingCommentText}
                    setEditingText={setEditingCommentText}
                    onEditSubmit={handleEditComment}
                    onRequestDelete={onRequestDeleteComment}
                  />
                ))}
              </div>
            )}
          </div>
        </ModalBody>

        <ModalFooter>
          <ModalClose>
            <Button variant="outline" size="md" type="button" disabled={submittingComment}>
              {t('common.close')}
            </Button>
          </ModalClose>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

interface CommentItemProps {
  comment: CommunityComment;
  depth: number;
  currentUser: { id?: string; name?: string } | null;
  isAuthenticated: boolean;
  replyToId: string | null;
  setReplyToId: (id: string | null) => void;
  replyText: string;
  setReplyText: (s: string) => void;
  onReplySubmit: (e: React.FormEvent) => void;
  submittingComment: boolean;
  editingId: string | null;
  setEditingId: (id: string | null) => void;
  editingText: string;
  setEditingText: (s: string) => void;
  onEditSubmit: (id: string) => void;
  onRequestDelete: (c: CommunityComment) => void;
}

const CommentItem: React.FC<CommentItemProps> = (p) => {
  const { t } = useTranslation();
  const { comment, depth } = p;
  const isEditing = p.editingId === comment.id;
  const isReplying = p.replyToId === comment.id;
  return (
    <div className={['flex gap-3', depth > 0 ? 'ml-6 sm:ml-10 pl-3 sm:pl-4 border-l-2 border-slate-200 dark:border-brandObsidian-700' : ''].join(' ')}>
      <AuthorAvatar name={comment.author?.name || '?'} size="sm" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <div className="text-sm">
            <span className="font-bold text-slate-900 dark:text-white">{comment.author?.name || t('community.anonymous')}</span>
            <span className="mx-1.5 text-slate-400">·</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">{formatRelativeTime(comment.created_at, t)}</span>
            {comment.updated_at && comment.updated_at !== comment.created_at && (
              <span className="mx-1 text-xs opacity-70">· {t('community.edited')}</span>
            )}
          </div>
          {comment.is_owner && (
            <div className="flex items-center gap-0.5 shrink-0">
              {!isEditing ? (
                <button
                  type="button"
                  onClick={() => { p.setEditingId(comment.id); p.setEditingText(comment.content); }}
                  className="p-1.5 rounded-md text-slate-400 hover:text-brandGold-600 dark:hover:text-brandGold-400 hover:bg-brandGold-50 dark:hover:bg-brandObsidian-700 min-w-[32px] min-h-[32px] flex items-center justify-center"
                  title={t('common.edit')}
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => { p.setEditingId(null); p.setEditingText(''); }}
                  className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 min-w-[32px] min-h-[32px]"
                  title={t('common.cancel')}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={() => p.onRequestDelete(comment)}
                className="p-1.5 rounded-md text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 min-w-[32px] min-h-[32px] flex items-center justify-center"
                title={t('common.delete')}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {isEditing ? (
          <div className="space-y-2">
            <Textarea rows={2} value={p.editingText} onChange={(e) => p.setEditingText(e.target.value)} maxLength={5000} />
            <div className="flex items-center gap-2">
              <Button size="sm" variant="primary" onClick={() => p.onEditSubmit(comment.id)} leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}>
                {t('common.save')}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => { p.setEditingId(null); p.setEditingText(''); }}>
                {t('common.cancel')}
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap break-words leading-relaxed">
            {comment.content}
          </div>
        )}

        {!isEditing && p.isAuthenticated && depth < 1 && (
          <div className="mt-1.5">
            {!isReplying ? (
              <button
                type="button"
                onClick={() => { p.setReplyToId(comment.id); p.setReplyText(''); }}
                className="inline-flex items-center gap-1.5 h-7 px-2 rounded-md text-xs font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-brandObsidian-700 hover:text-slate-800 dark:hover:text-slate-100 transition-colors"
              >
                <CornerUpRight className="w-3.5 h-3.5" />
                {t('community.reply')}
              </button>
            ) : (
              <form onSubmit={p.onReplySubmit} noValidate className="mt-2">
                <Textarea rows={2} value={p.replyText} onChange={(e) => p.setReplyText(e.target.value)} placeholder={t('community.placeholder_reply')} maxLength={5000} />
                <div className="flex items-center gap-2 mt-2">
                  <Button size="sm" variant="primary" type="submit" loading={p.submittingComment} leftIcon={<SendHorizontal className="w-3.5 h-3.5" />}>
                    {t('community.submit_reply')}
                  </Button>
                  <Button size="sm" variant="ghost" type="button" onClick={() => { p.setReplyToId(null); p.setReplyText(''); }}>
                    {t('common.cancel')}
                  </Button>
                </div>
              </form>
            )}
          </div>
        )}

        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-4 space-y-4">
            {comment.replies.map((r) => (
              <CommentItem key={r.id} {...p} comment={r} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

interface DeleteConfirmModalProps {
  open: boolean;
  kind: 'post' | 'comment';
  onClose: () => void;
  onConfirm: () => void;
}

const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({ open, kind, onClose, onConfirm }) => {
  const { t } = useTranslation();
  return (
    <Modal open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <ModalContent size="sm" onClose={onClose}>
        <ModalHeader>
          <ModalTitle>{kind === 'post' ? t('community.confirm_delete_post') : t('community.confirm_delete_comment')}</ModalTitle>
          <ModalDescription>
            {kind === 'post' ? t('community.confirm_delete_post_desc') : t('community.confirm_delete_comment_desc')}
          </ModalDescription>
        </ModalHeader>
        <ModalFooter>
          <ModalClose>
            <Button variant="outline" size="md" type="button">{t('common.cancel')}</Button>
          </ModalClose>
          <Button variant="destructive" size="md" type="button" leftIcon={<Trash2 className="w-4 h-4" />} onClick={onConfirm}>
            {t('common.delete')}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

function buildCommentsTree(flat: CommunityComment[]): CommunityComment[] {
  const byId = new Map<string, CommunityComment>();
  flat.forEach(c => byId.set(c.id, { ...c, replies: [] }));
  const roots: CommunityComment[] = [];
  flat.forEach(c => {
    const node = byId.get(c.id)!;
    if (c.parent_id && byId.has(c.parent_id)) {
      byId.get(c.parent_id)!.replies!.push(node);
    } else {
      roots.push(node);
    }
  });
  return roots;
}
