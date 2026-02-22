// Section Démo Vidéo - À placer sous le Hero
'use client';

import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';

export default function DemoSection() {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [showOverlay, setShowOverlay] = useState(true);
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
      { threshold: 0.2 }
    );
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const update = () => {
      if (video.duration) setProgress((video.currentTime / video.duration) * 100);
    };
    video.addEventListener('timeupdate', update);
    return () => video.removeEventListener('timeupdate', update);
  }, []);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play();
      setIsPlaying(true);
      setTimeout(() => setShowOverlay(false), 300);
    } else {
      video.pause();
      setIsPlaying(false);
      setShowOverlay(true);
    }
  };

  const toggleMute = (e) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const handleVideoEnd = () => {
    setIsPlaying(false);
    setShowOverlay(true);
    setProgress(0);
  };

  const handleProgressClick = (e) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;
    const rect = e.currentTarget.getBoundingClientRect();
    video.currentTime = ((e.clientX - rect.left) / rect.width) * video.duration;
  };

  return (
    <section ref={containerRef} className="relative bg-white py-20 md:py-28 overflow-hidden">
      <div className="relative max-w-5xl mx-auto px-4 sm:px-6">

        {/* Titre */}
        <div className={`text-center mb-14 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <p className="text-yellow-500 text-sm font-semibold tracking-wide uppercase mb-3">Présentation</p>
          <h2 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight">
            Découvrez CashProfit 
          </h2>
        </div>

        {/* Vidéo */}
        <div className={`transition-all duration-1000 delay-200 ${isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-10 scale-[0.97]'}`}>
          <div className="relative rounded-2xl overflow-hidden shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] cursor-pointer" onClick={togglePlay}>

            <video
              ref={videoRef}
              className="w-full aspect-video object-cover bg-gray-900"
              muted={isMuted}
              playsInline
              preload="metadata"
              onEnded={handleVideoEnd}
            >
              <source src="https://res.cloudinary.com/dzird4mfe/video/upload/v1771716800/Untitled_Video_1_vuhb66.mp4" type="video/mp4" />
            </video>

            {/* Overlay Play */}
            <div className={`absolute inset-0 flex items-center justify-center transition-all duration-500 ${showOverlay ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
              style={{ background: 'radial-gradient(circle, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.55) 100%)' }}>
              <div className="relative">
                <div className="absolute inset-0 bg-yellow-400/25 rounded-full animate-ping" style={{ animationDuration: '2.5s' }} />
                <div className="relative w-16 h-16 md:w-20 md:h-20 bg-yellow-400 rounded-full flex items-center justify-center shadow-xl transition-transform duration-300 hover:scale-110">
                  <Play size={28} fill="black" className="text-black ml-0.5" />
                </div>
              </div>
            </div>

            {/* Barre de progression fine en bas */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20 cursor-pointer" onClick={handleProgressClick}>
              <div className="h-full bg-yellow-400 transition-all duration-150" style={{ width: `${progress}%` }} />
            </div>

            {/* Bouton mute discret */}
            {isPlaying && !showOverlay && (
              <button onClick={toggleMute}
                className="absolute bottom-4 right-4 w-9 h-9 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-black/60 transition-all">
                {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}