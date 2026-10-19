export default function LinearProgress({ className = "" }) {
  return (
    <div role="progressbar" aria-busy="true" className={`lp h-1 ${className || "relative"}`}>
      <div className="lp-bar lp-bar1" />
      <div className="lp-bar lp-bar2" />
    </div>
  );
}
