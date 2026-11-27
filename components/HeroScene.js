// HeroScene — approximate from spec description: "figure on dark ridge, lit path to an
// open doorway, large sun, teal and mustard planes". Replace SVG paths with artboard
// assets once the Canva doc is accessible from this conversation.
// Colours via CSS custom properties so the scene works in both Paper and Violet Night.

export default function HeroScene() {
  return (
    <div className="fd-scene" aria-hidden="true">
      <svg viewBox="0 0 480 520" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Large sun — upper right, sits behind everything */}
        <circle cx="318" cy="108" r="118" fill="var(--ill-sun)" />

        {/* Teal plane — dominant left-to-centre shape */}
        <polygon
          points="0,0 0,520 295,520 358,245 232,0"
          fill="var(--ill-teal)"
        />

        {/* Mustard accent — upper right wedge */}
        <polygon
          points="480,0 480,345 358,265 342,0"
          fill="var(--ill-mustard)"
        />

        {/* Ridge — dark curved band that anchors the bottom */}
        <path
          d="M0,418 C65,398 148,410 218,404 C298,397 378,408 480,400 L480,520 L0,520 Z"
          fill="var(--ill-ridge)"
        />

        {/* Lit path — bright corridor from foreground toward the doorway */}
        <polygon
          points="198,520 282,520 254,406 226,406"
          fill="var(--ill-path)"
        />

        {/* Doorway arch at the end of the path */}
        <path
          d="M222,406 L222,370 Q222,350 240,350 Q258,350 258,370 L258,406"
          fill="var(--ill-path)"
        />

        {/* Soft halo around the doorway entrance */}
        <ellipse cx="240" cy="378" rx="26" ry="18" fill="var(--ill-path)" opacity="0.28" />

        {/* Figure silhouette — standing on the ridge to the left of the path */}
        {/* Head */}
        <circle cx="94" cy="400" r="10" fill="var(--ill-ridge)" />
        {/* Torso */}
        <rect x="87" y="410" width="14" height="20" rx="3" fill="var(--ill-ridge)" />
      </svg>
    </div>
  );
}
