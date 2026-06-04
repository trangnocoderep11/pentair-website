import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, ListVideo, Clock, Tag, Film, Video } from 'lucide-react';

interface VideoItem {
  id: string;
  title: string;
  slug: string;
  description: string;
  videoUrl: string;
  thumbnail: string;
  category: 'introduction' | 'operation' | 'installation' | 'review';
  duration: string;
  isFeatured: boolean;
  status: string;
  sortOrder: number;
}

interface ProductVideoSectionProps {
  videoTitle?: string;
  videoSubtitle?: string;
  videoUrl?: string; // fallback YouTube embed
  videoThumbnail?: string;
  videos?: VideoItem[];
}

const VIDEO_CATEGORIES = [
  { value: 'all', label: 'Tất cả video' },
  { value: 'introduction', label: 'Giới thiệu' },
  { value: 'operation', label: 'Vận hành' },
  { value: 'installation', label: 'Lắp đặt' },
  { value: 'review', label: 'Đánh giá / Review' }
];

export default function ProductVideoSection({ 
  videoTitle = "Trải nghiệm hệ thống lọc tổng Pentair qua video",
  videoSubtitle = "Xem cận cảnh cấu tạo màng siêu lọc UF, quy trình sục rửa tự động tối tân bậc nhất và hướng dẫn sử dụng vận hành.",
  videoUrl = "https://www.youtube.com/embed/S28s7-VWeis",
  videoThumbnail = "https://images.unsplash.com/photo-1542013936693-8848e574047a?auto=format&fit=crop&w=1200&q=80",
  videos = []
}: ProductVideoSectionProps) {

  // Load default fallback videos if none are provided
  const activeVideosList = videos && videos.length > 0 ? videos : [
    {
      id: "vid-1",
      title: "Trải nghiệm hệ thống lọc tổng Pentair Đại Diện Chính Hãng Mỹ",
      slug: "trai-nghiem-he-thong-loc",
      description: "Xem chi tiết hệ thống tủ lọc tổng biệt thự cao cấp sử dụng van Fleck tự động lập trình sục rửa.",
      videoUrl: videoUrl,
      thumbnail: videoThumbnail,
      category: "introduction",
      duration: "4:25",
      isFeatured: true,
      status: "published",
      sortOrder: 1
    },
    {
      id: "vid-2",
      title: "Cận cảnh vận hành Màng siêu lọc UF Pentair cao cấp",
      slug: "màng-sieu-loc-uf",
      description: "Quy trình loại bỏ tạp chất siêu vi hạt kích thước nhỏ đến 0.01 micron bảo vệ gia đình toàn nhà.",
      videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      thumbnail: "https://images.unsplash.com/photo-1542013936693-8848e574047a?auto=format&fit=crop&w=600&q=80",
      category: "operation",
      duration: "6:10",
      isFeatured: true,
      sortOrder: 2,
      status: "published"
    }
  ] as VideoItem[];

  const [activeTab, setActiveTab] = React.useState('all');
  
  // Filter video playlist by current active category tab
  const filteredVideos = activeVideosList.filter(vid => {
    if (activeTab === 'all') return true;
    return vid.category === activeTab;
  });

  // State hold active streaming video
  const [selectedVid, setSelectedVid] = React.useState<VideoItem | null>(null);
  const [isPlaying, setIsPlaying] = React.useState(false);

  // Set the first featured video or first video as active on shift or initial mount
  React.useEffect(() => {
    const defaultPlay = filteredVideos.find(v => v.isFeatured) || filteredVideos[0] || null;
    setSelectedVid(defaultPlay);
    setIsPlaying(false);
  }, [activeTab]);

  // When real videos load from API (videos prop changes), reset selection
  React.useEffect(() => {
    if (filteredVideos.length > 0) {
      setSelectedVid(filteredVideos.find(v => v.isFeatured) || filteredVideos[0]);
      setIsPlaying(false);
    }
  }, [videos]);

  // Extract YouTube video ID from any YouTube URL format
  const getYouTubeThumbnail = (url: string): string => {
    if (!url) return '';
    const embedMatch = url.match(/embed\/([^?&/]+)/);
    if (embedMatch) return `https://i.ytimg.com/vi/${embedMatch[1]}/hqdefault.jpg`;
    const watchMatch = url.match(/[?&]v=([^?&]+)/);
    if (watchMatch) return `https://i.ytimg.com/vi/${watchMatch[1]}/hqdefault.jpg`;
    const shortMatch = url.match(/youtu\.be\/([^?&]+)/);
    if (shortMatch) return `https://i.ytimg.com/vi/${shortMatch[1]}/hqdefault.jpg`;
    return '';
  };

  const getThumb = (vid: VideoItem) => {
    if (vid.thumbnail) return vid.thumbnail;
    const rawUrl = (vid as any).videoUrl || (vid as any).url || '';
    return getYouTubeThumbnail(rawUrl) || 'https://img.youtube.com/vi/default/hqdefault.jpg';
  };

  // Convert standard URL format into perfect YouTube embed target URL
  const getEmbedUrl = (url: string) => {
    if (!url) return '';
    if (url.includes('embed/')) return url;
    try {
      const u = new URL(url);
      if (u.hostname.includes('youtube.com') || u.hostname.includes('youtu.be')) {
        let videoId = '';
        if (u.hostname.includes('youtu.be')) {
          videoId = u.pathname.substring(1);
        } else {
          videoId = u.searchParams.get('v') || '';
        }
        if (videoId) {
          return `https://www.youtube.com/embed/${videoId}?autoplay=1`;
        }
      }
    } catch (e) {
      // return back raw fallback
    }
    return url;
  };

  const rawVideoUrl = selectedVid?.videoUrl || (selectedVid as any)?.url || '';
  const finalEmbedUrl = rawVideoUrl
    ? getEmbedUrl(rawVideoUrl) + (rawVideoUrl.includes('?') ? '&autoplay=1' : '?autoplay=1')
    : '';

  return (
    <section className="bg-[#030612] text-white py-20 relative overflow-hidden" id="product-video-section">
      {/* Visual background atmospheric elements */}
      <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] bg-blue-600/5 rounded-full filter blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-80 h-80 bg-blue-900/10 rounded-full filter blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Visual Title Section */}
        <div className="text-center max-w-3xl mx-auto mb-10 space-y-3">
          <span className="text-[9px] font-mono tracking-widest text-amber-500 bg-white/5 border border-white/10 px-3 py-1 rounded inline-block uppercase font-bold">
            Interactive Video Playlist
          </span>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white uppercase tracking-tight">
            {videoTitle}
          </h2>
          <div className="w-12 h-1 bg-[#E6C073] mx-auto mt-2" />
          <p className="text-xs sm:text-sm text-slate-400 font-sans font-light max-w-xl mx-auto leading-relaxed">
            {videoSubtitle}
          </p>
        </div>

        {/* VIDEOS FILTER CATEGORY TAB HEADERS */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-8 border-b border-white/5 pb-4">
          {VIDEO_CATEGORIES.map(cat => {
            const isActive = activeTab === cat.value;
            return (
              <button
                key={cat.value}
                onClick={() => setActiveTab(cat.value)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all duration-300 cursor-pointer ${
                  isActive 
                    ? 'bg-[#E6C073] border-[#E6C073] text-[#030612] shadow-md shadow-amber-500/10' 
                    : 'bg-white/5 border-white/10 text-slate-300 hover:border-white/20'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* INTEGRATED THEATRIC LAYOUT GRID */}
        {selectedVid ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Column (Main Active video frame screen) */}
            <div className="lg:col-span-8 space-y-4">
              <div className="aspect-video w-full rounded-2xl overflow-hidden bg-slate-950 border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.6)] relative group">
                <AnimatePresence mode="wait">
                  {!isPlaying ? (
                    <motion.div 
                      key={selectedVid.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 cursor-pointer"
                      onClick={() => setIsPlaying(true)}
                    >
                      <img
                        src={getThumb(selectedVid)}
                        alt={selectedVid.title}
                        className="w-full h-full object-cover group-hover:scale-101 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-black/45 flex items-center justify-center group-hover:bg-black/35 duration-300 transition-all">
                        {/* Burning Golden Visual Play button */}
                        <div className="relative">
                          <div className="absolute inset-0 bg-amber-500 rounded-full blur-md opacity-30 animate-pulse" />
                          <div className="w-16 h-16 bg-[#E6C073] hover:bg-amber-400 text-slate-950 rounded-full flex items-center justify-center group-hover:scale-110 duration-300 transition-all shadow-xl">
                            <Play className="w-6 h-6 fill-current translate-x-0.5" />
                          </div>
                        </div>
                      </div>

                      {/* Video duration pill */}
                      <span className="absolute bottom-4 right-4 bg-black/80 text-white font-mono text-[10px] px-2 py-1 rounded border border-white/10 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-amber-500" />
                        {selectedVid.duration}
                      </span>
                    </motion.div>
                  ) : (
                    <div className="absolute inset-0 w-full h-full">
                      <iframe 
                        src={finalEmbedUrl}
                        title={selectedVid.title}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  )}
                </AnimatePresence>
              </div>

              {/* Title, Category tags, and Narrative */}
              <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[9px] font-bold uppercase tracking-wider bg-blue-600/20 text-blue-400 px-2 py-0.5 rounded border border-blue-500/10 flex items-center gap-1 font-sans">
                    <Video className="w-3 h-3" />
                    {VIDEO_CATEGORIES.find(c => c.value === selectedVid.category)?.label || selectedVid.category}
                  </span>
                  {selectedVid.isFeatured && (
                    <span className="text-[9px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded border border-amber-500/10 flex items-center gap-0.5 font-sans">
                      ★ Nổi bật
                    </span>
                  )}
                </div>
                <h3 className="text-base sm:text-lg font-bold text-white uppercase leading-snug">
                  {selectedVid.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 font-sans leading-relaxed">
                  {selectedVid.description}
                </p>
              </div>
            </div>

            {/* Right Column (Scrollable vertical Playlist list with metadata and duration triggers) */}
            <div className="lg:col-span-4 space-y-4">
              <div className="bg-slate-950/40 border border-white/5 rounded-2xl p-4 space-y-3 flex flex-col max-h-[500px] overflow-hidden">
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                  <div className="flex items-center gap-1.5">
                    <ListVideo className="w-4 h-4 text-[#E6C073]" />
                    <span className="text-xs font-bold uppercase tracking-wide">Danh sách Playlist ({filteredVideos.length})</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">Stream: HD</span>
                </div>

                <div className="flex-grow space-y-2.5 overflow-y-auto custom-scrollbar pr-1">
                  {filteredVideos.map((vid) => {
                    const isActive = selectedVid?.id === vid.id;
                    return (
                      <div 
                        key={vid.id}
                        onClick={() => {
                          setSelectedVid(vid);
                          setIsPlaying(false);
                        }}
                        className={`flex gap-3 p-2.5 rounded-xl cursor-pointer select-none border transition-all duration-300 ${
                          isActive 
                            ? 'bg-amber-500/10 border-amber-500/35 hover:bg-amber-500/15' 
                            : 'bg-white/[0.01] border-white/5 hover:border-white/10 hover:bg-white/[0.03]'
                        }`}
                      >
                        {/* Smaller thumbnail container */}
                        <div className="w-20 aspect-video rounded-lg overflow-hidden relative flex-shrink-0 bg-gray-950 border border-white/10">
                          <img
                            src={getThumb(vid)}
                            alt={vid.title}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                          <div className={`absolute inset-0 flex items-center justify-center ${isActive ? 'bg-amber-500/10' : 'bg-black/20'}`}>
                            <Play className={`w-3.5 h-3.5 ${isActive ? 'text-amber-500 fill-amber-500 animate-pulse' : 'text-white'}`} />
                          </div>
                        </div>

                        {/* Title details */}
                        <div className="space-y-1 flex-grow">
                          <h4 className={`text-[11px] font-bold uppercase leading-tight line-clamp-2 transition-all ${isActive ? 'text-amber-400' : 'text-slate-200'}`}>
                            {vid.title}
                          </h4>
                          <div className="flex items-center gap-1.5 text-[9px] text-slate-500 font-mono">
                            <Clock className="w-3 h-3 text-slate-600" />
                            <span>{vid.duration}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  
                  {filteredVideos.length === 0 && (
                    <div className="py-12 text-center text-slate-500 text-xs">
                      Không có video trong danh mục này.
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>
        ) : (
          <div className="py-24 text-center text-slate-500 text-xs bg-slate-950/20 border border-dashed border-white/10 rounded-2xl">
            Đang sắp xếp danh sách phát kỹ thuật Pentair...
          </div>
        )}

      </div>
    </section>
  );
}
