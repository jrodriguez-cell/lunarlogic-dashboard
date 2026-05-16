export default function DSOMeter({ current, delta, preLive }) {
  return (
    <div className="dso-meter">
      <div className="dso-label">Days Sales Outstanding</div>
      <div className="dso-value">{current}</div>
      <div className="dso-unit">days</div>
      <div className="dso-delta">▼ {delta} days since go-live</div>
      <div className="dso-pre">was {preLive}d before LunarLogic</div>
    </div>
  );
}
