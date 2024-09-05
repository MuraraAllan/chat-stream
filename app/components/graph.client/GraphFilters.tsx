export const GraphFilters = () => (
  <defs>
    <filter id="glow">
      <feGaussianBlur stdDeviation="3.5" result="coloredBlur" />
      <feMerge>
        <feMergeNode in="coloredBlur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
    <radialGradient id="mainNodeGradient" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stopColor="#EBF4FF" /> {/* blue-50 */}
      <stop offset="50%" stopColor="#E8EAFF" /> {/* indigo-50 */}
      <stop offset="100%" stopColor="#F3E8FF" /> {/* purple-50 */}
    </radialGradient>
  </defs>
);
