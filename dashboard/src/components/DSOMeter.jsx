export default function DSOMeter({ current, delta, preLive, efficiency }) {
  return (
    <div className="dso-meter">
      <div className="dso-label">Days Sales Outstanding</div>
      <div className="dso-value">{current}</div>
      <div className="dso-unit">days</div>
      <div className="dso-delta">
        <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
          <path d="M5 8L1 3h8z"/>
        </svg>
        {delta} days since go-live
      </div>
      <div className="dso-pre">was {preLive}d before LunarLogic</div>
    </div>
  );
}
