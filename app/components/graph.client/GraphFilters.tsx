export const GraphFilters = () => (
  <defs>
    <radialGradient id="mainNodeGradient">
      <stop offset="0%" stopColor="#34D399" />
      <stop offset="100%" stopColor="#3CCF91" />
    </radialGradient>
    <filter id="drop-shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="1" />
      <feOffset dx="1" dy="1" result="offsetblur" />
      <feFlood floodColor="rgba(0,0,0,0.2)" />
      <feComposite in2="offsetblur" operator="in" />
      <feMerge>
        <feMergeNode />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>
);
