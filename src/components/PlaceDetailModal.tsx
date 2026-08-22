import React, { useState, useEffect } from 'react';
import { Place, Review } from '../types';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { localizeContact, localizeHours } from '../utils/localization';
import {
  X,
  Star,
  Heart,
  Share2,
  MapPin,
  Clock,
  DollarSign,
  ExternalLink,
  Phone,
  Compass,
  Send,
  Check,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PlaceDetailModalProps {
  placeId: number | null;
  onClose: () => void;
}

export const PlaceDetailModal: React.FC<PlaceDetailModalProps> = ({ placeId, onClose }) => {
  const {
    getLocalized,
    lang,
    t,
    favorites,
    toggleFavorite,
    user,
    setIsAuthModalOpen,
    showToast
  } = useApp();

  const [place, setPlace] = useState<Place | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [ratingInput, setRatingInput] = useState(5);
  const [commentInput, setCommentInput] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!placeId) {
      setPlace(null);
      return;
    }

    setLoading(true);
    setActiveImageIndex(0);
    setCommentInput('');

    Promise.all([
      api.getPlace(placeId),
      api.getReviews({ placeId })
    ])
      .then(([placeData, reviewList]) => {
        setPlace(placeData);
        setReviews(reviewList);
      })
      .catch(err => {
        console.error('Error loading place detail:', err);
        showToast(t('place_detail.load_error'), 'error');
      })
      .finally(() => setLoading(false));
  }, [placeId, lang]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!placeId) return null;

  const isFav = place ? favorites.includes(place.id) : false;
  const dateLocale = lang === 'th' ? 'th-TH' : lang === 'zh' ? 'zh-CN' : 'en-US';

  const handleShare = () => {
    const url = `${window.location.origin}/?placeId=${placeId}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    showToast(t('place_detail.share_copied'), 'success');
    setTimeout(() => setCopied(false), 3000);
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!place || !commentInput.trim()) return;

    setSubmittingReview(true);
    try {
      const newReview = await api.createReview({
        placeId: place.id,
        rating: ratingInput,
        comment: commentInput.trim(),
        userName: user?.name || t('review.anonymous'),
        userId: user?.id || 'guest',
        userAvatar: user?.avatar,
        language: lang
      });

      setReviews(prev => [newReview, ...prev]);
      setCommentInput('');
      showToast(t('review.success'), 'success');

      const updatedPlace = await api.getPlace(place.id);
      setPlace(updatedPlace);
    } catch (err) {
      console.error('Failed to submit review', err);
      showToast(t('review.error'), 'error');
    } finally {
      setSubmittingReview(false);
    }
  };

  const localizedContact = localizeContact(
    place?.contact,
    lang,
    t('place_detail.tat_hotline')
  );

  return (
    <AnimatePresence>
      <div
        id="place-detail-modal"
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto bg-slate-900/40 backdrop-blur-xs"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden text-slate-900"
        >
          <div className="absolute top-4 right-4 z-30 flex items-center gap-2">
            <button
              onClick={handleShare}
              className="p-2.5 rounded-full bg-white/90 hover:bg-white text-slate-700 border border-slate-200 backdrop-blur-md transition-colors shadow-xs"
              title={t('place_detail.share')}
              aria-label={t('place_detail.share')}
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
            </button>
            <button
              onClick={() => place && toggleFavorite(place.id)}
              className={`p-2.5 rounded-full backdrop-blur-md transition-transform active:scale-95 shadow-xs ${
                isFav
                  ? 'bg-rose-500 text-white shadow-rose-500/30'
                  : 'bg-white/90 hover:bg-white text-slate-700 border border-slate-200'
              }`}
              title={isFav ? t('place_detail.favorited') : t('place_detail.add_favorite')}
              aria-label={isFav ? t('place_detail.favorited') : t('place_detail.add_favorite')}
            >
              <Heart className={`w-4 h-4 ${isFav ? 'fill-white stroke-white' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2.5 rounded-full bg-white/90 hover:bg-white text-slate-700 border border-slate-200 backdrop-blur-md transition-colors shadow-xs"
              title={t('place_detail.close')}
              aria-label={t('place_detail.close')}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {loading || !place ? (
            <div className="p-16 flex flex-col items-center justify-center space-y-4">
              <div className="w-10 h-10 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm text-slate-500">{t('place_detail.loading')}</p>
            </div>
          ) : (
            <div className="overflow-y-auto flex-1 custom-scrollbar">
              <div className="relative aspect-[16/9] sm:aspect-[21/9] w-full bg-slate-100 overflow-hidden">
                <img
                  src={place.images[activeImageIndex] || place.images[0] || 'https://images.unsplash.com/photo-1528181304800-259b08848526?auto=format&fit=crop&w=1200&q=80'}
                  alt={getLocalized(place.name)}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1528181304800-259b08848526?auto=format&fit=crop&w=1200&q=80';
                  }}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent" />

                {place.images.length > 1 && (
                  <div className="absolute inset-y-0 left-3 right-3 flex items-center justify-between pointer-events-none">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveImageIndex(prev => (prev === 0 ? place.images.length - 1 : prev - 1));
                      }}
                      className="pointer-events-auto p-2 rounded-full bg-white/80 hover:bg-white text-slate-800 backdrop-blur-md border border-slate-200 shadow-sm"
                      aria-label={t('place_detail.previous_image')}
                      title={t('place_detail.previous_image')}
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveImageIndex(prev => (prev === place.images.length - 1 ? 0 : prev + 1));
                      }}
                      className="pointer-events-auto p-2 rounded-full bg-white/80 hover:bg-white text-slate-800 backdrop-blur-md border border-slate-200 shadow-sm"
                      aria-label={t('place_detail.next_image')}
                      title={t('place_detail.next_image')}
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                )}

                <div className="absolute bottom-4 left-6 flex items-center gap-2">
                  {place.images.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImageIndex(idx)}
                      className={`h-2 rounded-full transition-all ${
                        activeImageIndex === idx ? 'w-7 bg-emerald-400' : 'w-2 bg-white/60'
                      }`}
                      aria-label={`${t('place_detail.image')} ${idx + 1}`}
                    />
                  ))}
                </div>

                <div className="absolute top-4 left-4 flex items-center gap-2">
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-600 text-white shadow-sm">
                    {getLocalized(place.category)}
                  </span>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white/90 text-slate-800 border border-slate-200 backdrop-blur-md shadow-xs">
                    {getLocalized(place.region)}
                  </span>
                </div>
              </div>

              <div className="p-6 sm:p-8 space-y-8">
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-sm text-emerald-700 font-semibold">
                      <MapPin className="w-4 h-4" />
                      <span>{getLocalized(place.province)}, {t('place_detail.country')}</span>
                    </div>

                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm font-bold shadow-xs">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                      <span>{place.rating.toFixed(1)} / 5.0</span>
                      <span className="text-xs text-slate-500 font-normal">({place.reviewCount} {t('place_detail.reviews_count_short')})</span>
                    </div>
                  </div>

                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2 leading-tight">
                    {getLocalized(place.name)}
                  </h1>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                    <div className="flex items-center gap-2 text-xs text-emerald-700 font-semibold">
                      <Clock className="w-4 h-4" />
                      <span>{t('place_detail.opening_hours')}</span>
                    </div>
                    <p className="text-sm font-bold text-slate-800">{localizeHours(place.hours, lang)}</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                    <div className="flex items-center gap-2 text-xs text-teal-700 font-semibold">
                      <DollarSign className="w-4 h-4" />
                      <span>{t('place_detail.entrance_fee')}</span>
                    </div>
                    <p className="text-sm font-bold text-slate-800">{getLocalized(place.price)}</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                    <div className="flex items-center gap-2 text-xs text-cyan-700 font-semibold">
                      <Compass className="w-4 h-4" />
                      <span>{t('place_detail.gps')}</span>
                    </div>
                    <p className="text-xs font-mono text-slate-700 truncate">
                      {place.lat.toFixed(4)}, {place.lng.toFixed(4)}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                    <div className="flex items-center gap-2 text-xs text-rose-700 font-semibold">
                      <Phone className="w-4 h-4" />
                      <span>{t('place_detail.contact')}</span>
                    </div>
                    <p className="text-xs font-medium text-slate-700 truncate">{localizedContact}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center border-b border-slate-200 pb-2">
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <Info className="w-4 h-4 text-emerald-700" />
                      <span>{t('place_detail.about')}</span>
                    </h3>
                  </div>

                  <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
                    {getLocalized(place.description)}
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 shadow-xs">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{t('place_detail.location_map')}</h4>
                      <p className="text-xs text-slate-500">
                        {getLocalized(place.address) || `${getLocalized(place.province)}, ${t('place_detail.country')}`}
                      </p>
                    </div>
                  </div>

                  {(() => {
                    const legacyPlace = place as Place & { location?: { map_url?: string } };
                    const mapUrl =
                      place.googleMapsUrl?.trim() ||
                      legacyPlace.location?.map_url?.trim() ||
                      (Number.isFinite(place.lat) && Number.isFinite(place.lng)
                        ? `https://www.google.com/maps?q=${place.lat},${place.lng}`
                        : undefined);

                    if (!mapUrl) return null;

                    return (
                      <a
                        href={mapUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all shrink-0"
                      >
                        <span>{t('place_detail.open_in_google_maps')}</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    );
                  })()}
                </div>

                <div className="space-y-6 pt-4 border-t border-slate-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <MessageSquare className="w-5 h-5 text-emerald-700" />
                      <span>{t('place_detail.reviews_title', { count: reviews.length })}</span>
                    </h3>
                  </div>

                  <form onSubmit={handleReviewSubmit} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                    <h4 className="text-sm font-bold text-slate-800">{t('place_detail.write_review')}</h4>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500">{t('review.rating')}:</span>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            type="button"
                            key={star}
                            onClick={() => setRatingInput(star)}
                            className="p-1 text-slate-300 hover:scale-110 transition-transform"
                            aria-label={`${t('review.rating')} ${star}`}
                          >
                            <Star
                              className={`w-5 h-5 ${star <= ratingInput ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`}
                            />
                          </button>
                        ))}
                      </div>
                      <span className="text-xs font-bold text-amber-600 ml-2">{ratingInput}.0 {t('review.stars')}</span>
                    </div>

                    <textarea
                      rows={3}
                      value={commentInput}
                      onChange={(e) => setCommentInput(e.target.value)}
                      placeholder={t('review.placeholder')}
                      className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition-colors"
                      required
                    />

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        {user ? (
                          <span>{t('review.posting_as')} <strong className="text-slate-800">{user.name}</strong></span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setIsAuthModalOpen(true)}
                            className="text-emerald-700 hover:underline font-semibold"
                          >
                            {t('place_detail.login_to_review')}
                          </button>
                        )}
                      </div>

                      <button
                        type="submit"
                        disabled={submittingReview || !commentInput.trim()}
                        className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>{submittingReview ? t('review.submitting') : t('review.submit')}</span>
                      </button>
                    </div>
                  </form>

                  <div className="space-y-3">
                    {reviews.length === 0 ? (
                      <p className="text-xs text-slate-400 italic text-center py-4">
                        {t('review.no_reviews')}
                      </p>
                    ) : (
                      reviews.map((rev) => (
                        <div key={rev.id} className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              <img
                                src={rev.userAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}
                                alt={rev.userName}
                                referrerPolicy="no-referrer"
                                onError={(e) => {
                                  (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80';
                                }}
                                className="w-7 h-7 rounded-full object-cover border border-emerald-400/30"
                              />
                              <div>
                                <span className="text-xs font-bold text-slate-800">{rev.userName}</span>
                                <span className="text-[10px] text-slate-400 ml-2">
                                  {new Date(rev.createdAt).toLocaleDateString(dateLocale)}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-0.5 text-amber-400">
                              {Array.from({ length: rev.rating }).map((_, i) => (
                                <Star key={i} className="w-3 h-3 fill-amber-400" />
                              ))}
                            </div>
                          </div>

                          <p className="text-xs text-slate-600 leading-relaxed">{rev.comment}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
