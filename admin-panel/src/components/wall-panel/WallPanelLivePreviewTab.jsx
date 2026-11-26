import React, { useState } from 'react'
import { Monitor, Tablet, Smartphone, ExternalLink, ChevronLeft, ChevronRight, CalendarCheck, Sparkles, Layers, Sliders, LayoutGrid, List } from 'lucide-react'
import { Button, Badge } from '../ui'
import { websiteApiOrigin } from '../../services/websiteOrigin'

export function WallPanelLivePreviewTab({ banners = [], categories = [], products = [], sections = [] }) {
  const [viewport, setViewport] = useState('desktop') // 'desktop' | 'tablet' | 'mobile'
  const [activeBannerIdx, setActiveBannerIdx] = useState(0)

  const activeBanners = banners.filter((b) => b.active !== false)
  const activeSections = [...sections]
    .filter((s) => s.active !== false)
    .sort((a, b) => Number(a.sortOrder ?? 0) - Number(b.sortOrder ?? 0))

  const currentBanner = activeBanners[activeBannerIdx] || activeBanners[0]

  const viewportWidthClass = {
    desktop: 'max-w-5xl',
    tablet: 'max-w-2xl',
    mobile: 'max-w-[400px]',
  }[viewport]

  return (
    <div className="space-y-6">
      {/* Top Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            Live Website Studio Preview
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
              Interactive
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Test how the Wall Panels studio looks on Desktop, Tablet, and Mobile viewports with live synced data.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Viewport switcher */}
          <div className="flex items-center rounded-xl bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setViewport('desktop')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewport === 'desktop'
                  ? 'bg-white dark:bg-slate-900 text-[#C45508] shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Monitor className="size-3.5" /> Desktop
            </button>
            <button
              type="button"
              onClick={() => setViewport('tablet')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewport === 'tablet'
                  ? 'bg-white dark:bg-slate-900 text-[#C45508] shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Tablet className="size-3.5" /> Tablet
            </button>
            <button
              type="button"
              onClick={() => setViewport('mobile')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewport === 'mobile'
                  ? 'bg-white dark:bg-slate-900 text-[#C45508] shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Smartphone className="size-3.5" /> Mobile
            </button>
          </div>

          <a
            href={`${websiteApiOrigin()}/wall-panel`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#C45508] text-white text-xs font-bold hover:bg-[#A84504] shadow-xs transition-colors"
          >
            <span>Open Website</span>
            <ExternalLink className="size-3.5" />
          </a>
        </div>
      </div>

      {/* Frame Container */}
      <div className="flex justify-center bg-slate-100 dark:bg-slate-950 p-4 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 min-h-[600px] overflow-x-auto">
        <div
          className={`w-full ${viewportWidthClass} bg-[#FDFBF7] text-slate-900 rounded-3xl shadow-2xl border border-slate-300 dark:border-slate-800 overflow-hidden relative transition-all duration-300 pb-28`}
        >
          {/* Studio Top Navigation Bar (No standard website header) */}
          <div className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 py-3 flex items-center justify-between sticky top-0 z-30 shadow-xs">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-[#C45508] animate-pulse" />
              <span className="font-extrabold text-sm tracking-tight text-slate-900">
                Wall Panels Studio
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-[#C45508]">
                Architectural
              </span>
            </div>
            <span className="text-xs font-semibold text-slate-500">
              ₹49 At-Home Consultation
            </span>
          </div>

          {/* Hero Banner Slideshow */}
          {currentBanner ? (
            <div className="relative aspect-[16/9] sm:aspect-[21/9] w-full bg-slate-900 overflow-hidden">
              <img
                src={currentBanner.imageUrl}
                alt={currentBanner.title}
                className="h-full w-full object-cover transition-all duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/20" />

              <div className="absolute inset-0 flex flex-col justify-end p-5 sm:p-8 text-white max-w-xl">
                <span className="text-[10px] sm:text-xs font-extrabold uppercase tracking-widest text-orange-400">
                  Architectural Collection
                </span>
                <h1 className="text-xl sm:text-3xl font-black mt-1 leading-tight drop-shadow-md">
                  {currentBanner.title}
                </h1>
                {currentBanner.subtitle ? (
                  <p className="text-xs sm:text-sm text-white/85 line-clamp-2 mt-1 drop-shadow">
                    {currentBanner.subtitle}
                  </p>
                ) : null}
                <div className="mt-3">
                  <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#C45508] to-[#8C2C04] text-white text-xs sm:text-sm font-bold shadow-lg">
                    <CalendarCheck className="size-4" />
                    <span>{currentBanner.ctaText || 'Book Consultation – ₹49'}</span>
                  </span>
                </div>
              </div>

              {/* Slider indicators */}
              {activeBanners.length > 1 ? (
                <div className="absolute bottom-3 right-4 flex items-center gap-1.5 z-10">
                  {activeBanners.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setActiveBannerIdx(i)}
                      className={`h-1.5 rounded-full transition-all ${
                        i === activeBannerIdx ? 'w-5 bg-white' : 'w-1.5 bg-white/40'
                      }`}
                    />
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}

          {/* Dynamic Sections */}
          <div className="p-4 sm:p-6 space-y-8">
            {activeSections.map((sec) => {
              const secCategories = categories.filter((c) =>
                sec.selectedItemIds?.includes(c.id),
              )
              const secProducts = products.filter((p) =>
                sec.selectedItemIds?.includes(p.id),
              )

              return (
                <div key={sec.id} className="space-y-3">
                  {sec.showTitle ? (
                    <div className="flex items-center justify-between">
                      <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                        {sec.title}
                      </h2>
                      <span className="text-xs font-bold text-[#C45508]">Explore →</span>
                    </div>
                  ) : null}

                  {/* Render based on contentType and displayType */}
                  {sec.contentType === 'categories' ? (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {secCategories.map((cat) => (
                        <div
                          key={cat.id}
                          className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-xs border border-slate-200 group"
                        >
                          <img
                            src={cat.image}
                            alt={cat.name}
                            className="h-full w-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                          <div className="absolute bottom-2.5 left-2.5 right-2 text-white">
                            <p className="font-bold text-xs sm:text-sm leading-tight">
                              {cat.name || cat.title}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : sec.contentType === 'customCards' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {(sec.customCards || []).map((card, i) => (
                        <div
                          key={card.id || i}
                          className="relative aspect-[16/10] rounded-2xl overflow-hidden shadow-xs border border-slate-200"
                        >
                          <img
                            src={card.image}
                            alt={card.title}
                            className="h-full w-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                          {card.serialNumber ? (
                            <span className="absolute top-2.5 left-2.5 bg-white/20 backdrop-blur-md text-white text-[10px] font-black px-2 py-0.5 rounded-full border border-white/30">
                              #{card.serialNumber}
                            </span>
                          ) : null}
                          <div className="absolute bottom-3 left-3 right-3 text-white">
                            <p className="font-bold text-xs sm:text-sm leading-tight">
                              {card.title}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    /* Product cards */
                    <div
                      className={
                        sec.displayType === 'grid'
                          ? 'grid grid-cols-2 gap-3 sm:gap-4'
                          : 'flex gap-3 overflow-x-auto pb-2 scrollbar-none'
                      }
                    >
                      {secProducts.map((prod) => (
                        <div
                          key={prod.id}
                          className={`rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs flex flex-col ${
                            sec.displayType === 'grid' ? '' : 'min-w-[220px] sm:min-w-[260px]'
                          }`}
                        >
                          <div className="aspect-[16/11] relative bg-slate-100">
                            <img
                              src={prod.images?.[0] || prod.imageUrl}
                              alt={prod.title}
                              className="h-full w-full object-cover"
                            />
                            <div className="absolute bottom-2 left-2">
                              <span className="text-[10px] font-bold uppercase tracking-wider bg-white/90 text-slate-900 px-2 py-0.5 rounded-md shadow-xs">
                                {prod.categoryName || 'Wall Panel'}
                              </span>
                            </div>
                          </div>

                          <div className="p-3 flex-1 flex flex-col justify-between">
                            <div>
                              <h3 className="font-bold text-xs sm:text-sm text-slate-900 line-clamp-1">
                                {prod.title || prod.name}
                              </h3>
                              <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                                {prod.tagline}
                              </p>
                            </div>

                            <div className="mt-2 flex items-baseline gap-1">
                              <span className="text-[10px] text-slate-500">Starts</span>
                              <span className="text-xs sm:text-sm font-extrabold text-[#C45508]">
                                ₹{Number(prod.price || 0).toLocaleString('en-IN')}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Floating "Book Consultation – ₹49" Button with subtle pulse animation */}
          <div className="fixed bottom-6 inset-x-0 flex justify-center px-4 pointer-events-none z-30">
            <div className="pointer-events-auto flex items-center gap-3 rounded-full bg-gradient-to-r from-[#C45508] via-[#B84E07] to-[#8C2C04] text-white px-5 py-3 shadow-[0_10px_25px_-5px_rgba(196,85,8,0.5)] border border-orange-400/30 animate-pulse hover:scale-105 transition-transform cursor-pointer">
              <CalendarCheck className="size-5" />
              <div className="text-left">
                <span className="block text-xs font-black tracking-wide leading-none">
                  Book Consultation – ₹49
                </span>
                <span className="block text-[10px] text-orange-100 leading-none mt-0.5">
                  Laser measurement & material samples at doorstep
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
