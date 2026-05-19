export default function VideoEmbed({ videoId, title }: { videoId: string, title: string }) {
  if (!videoId) return null;

  return (
    <div className="glass-panel" style={{ marginTop: '2rem' }}>
      <h2>Learning Resource</h2>
      <p style={{ color: 'var(--text-secondary)' }}>{title}</p>
      <div className="video-container">
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0`}
          title="YouTube video player"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        ></iframe>
      </div>
    </div>
  );
}
