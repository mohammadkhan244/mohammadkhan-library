// Library Checkout Card JSX for next/og image routes.
// Renders the classic manila-pocket checkout card design (1200×630).

export function titleFontSize(title) {
  const l = title.length;
  if (l <= 14) return 54;
  if (l <= 22) return 46;
  if (l <= 36) return 38;
  if (l <= 52) return 30;
  return 23;
}

// stamps: [{ text: 'NOV 20 2026', deg: 1.5 }, ...]  (max 4)
// subtitleFont: 'Gilda Display' | 'Josefin Sans'
export function checkoutCard({ callNo, title, subtitle, stamps = [], subtitleFont = 'Josefin Sans' }) {
  const W = 1200, H = 630;
  const CW = 740, CH = 490;
  const CX = Math.round((W - CW) / 2); // 230
  const CY = Math.round((H - CH) / 2); // 70

  const SHADOW_X = CX + 10;
  const SHADOW_Y = CY + 12;

  const SLEEVE_H = 130;

  const slate  = '#34454c';
  const ivory  = '#ebd3a2';
  const indigo = '#051230';
  const black  = '#111314';
  const amber  = '#d8a37b';
  const carmine = '#a62c37';
  const ecru   = '#c2ae93';

  const stampRots = [1.5, -1.5, 2, -1];
  const emptySlots = Math.max(0, 4 - stamps.length);

  return (
    <div
      style={{
        width: W,
        height: H,
        background: black,
        display: 'flex',
        position: 'relative',
        fontFamily: 'Josefin Sans',
      }}
    >
      {/* Offset shadow block */}
      <div
        style={{
          position: 'absolute',
          left: SHADOW_X,
          top: SHADOW_Y,
          width: CW,
          height: CH,
          background: indigo,
        }}
      />

      {/* Card body */}
      <div
        style={{
          position: 'absolute',
          left: CX,
          top: CY,
          width: CW,
          height: CH,
          background: ivory,
          transform: 'rotate(-2deg)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Content row */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'row',
            padding: '28px 24px 20px 28px',
            gap: 20,
          }}
        >
          {/* Left: header rows + subtitle */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {/* CALL NO */}
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                borderBottom: `1px solid ${slate}`,
                paddingBottom: 10,
                marginBottom: 10,
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: slate,
                  letterSpacing: 2,
                  width: 92,
                  flexShrink: 0,
                }}
              >
                CALL NO.
              </span>
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: black,
                  letterSpacing: 1,
                }}
              >
                {callNo}
              </span>
            </div>

            {/* AUTHOR */}
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                borderBottom: `1px solid ${slate}`,
                paddingBottom: 10,
                marginBottom: 10,
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: slate,
                  letterSpacing: 2,
                  width: 92,
                  flexShrink: 0,
                }}
              >
                AUTHOR
              </span>
              <span style={{ fontSize: 14, fontWeight: 600, color: black, letterSpacing: 1 }}>
                KHAN, MOHAMMAD
              </span>
            </div>

            {/* TITLE */}
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                borderBottom: `1px solid ${slate}`,
                paddingBottom: 12,
                marginBottom: 20,
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: slate,
                  letterSpacing: 2,
                  width: 92,
                  paddingTop: 5,
                  flexShrink: 0,
                }}
              >
                TITLE
              </span>
              <span
                style={{
                  fontSize: titleFontSize(title),
                  fontFamily: 'Gilda Display',
                  color: black,
                  lineHeight: 1.1,
                  flex: 1,
                }}
              >
                {title}
              </span>
            </div>

            {/* Subtitle */}
            {subtitle && (
              <span
                style={{
                  fontSize: 15,
                  fontFamily: subtitleFont,
                  color: slate,
                  letterSpacing: subtitleFont === 'Gilda Display' ? 0 : 0.5,
                  lineHeight: 1.4,
                }}
              >
                {subtitle}
              </span>
            )}
          </div>

          {/* Right: date due column */}
          <div
            style={{
              width: 150,
              display: 'flex',
              flexDirection: 'column',
              borderLeft: `1px solid ${slate}`,
              paddingLeft: 16,
              flexShrink: 0,
            }}
          >
            <span
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: slate,
                letterSpacing: 3,
                marginBottom: 18,
              }}
            >
              DATE DUE
            </span>

            {stamps.map((s, i) => (
              <div key={i} style={{ display: 'flex', marginBottom: 20 }}>
                <span
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: carmine,
                    transform: `rotate(${stampRots[i] ?? 0}deg)`,
                    letterSpacing: 1,
                  }}
                >
                  {s.text}
                </span>
              </div>
            ))}

            {/* Empty ruled lines */}
            {Array.from({ length: emptySlots }).map((_, i) => (
              <div
                key={i}
                style={{ borderBottom: `1px solid ${ecru}`, paddingTop: 20, marginBottom: 2 }}
              />
            ))}
          </div>
        </div>

        {/* Pocket sleeve */}
        <div
          style={{
            height: SLEEVE_H,
            background: amber,
            display: 'flex',
            alignItems: 'flex-end',
            padding: '0 28px 14px 28px',
          }}
        >
          <span
            style={{ fontSize: 10, fontWeight: 600, color: black, letterSpacing: 3 }}
          >
            MOHAMMADKHAN-LIBRARY.VERCEL.APP
          </span>
        </div>
      </div>
    </div>
  );
}
