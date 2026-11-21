// Train Ticket JSX for next/og image routes (1200×630).

export function trainTicket({
  firstName,
  lastName,
  midTowns = [],
  question,
  noQuestion,
  date,
  seats,
  car,
  ticketNo,
}) {
  const TW = 840, STUB_W = 185, TH = 490;
  const TOTAL_W = TW + STUB_W;
  const TX = Math.round((1200 - TOTAL_W) / 2); // ~87
  const TY = Math.round((630 - TH) / 2);        // 70

  const sulphur = '#f5ecc2';
  const black   = '#111314';
  const olive   = '#635a3a';
  const carmine = '#a62c37';
  const sep     = '#a1a39a';

  const rFS = (() => {
    const len = firstName.length + lastName.length;
    if (len <= 10) return 62;
    if (len <= 14) return 56;
    if (len <= 20) return 50;
    return 44;
  })();

  const qFS = question
    ? question.length > 100 ? 25
    : question.length > 70  ? 29
    : 33
    : 29;

  // Full question text (with ? if present); red ? rendered separately via absolute overlay.
  const qText = question || '';

  return (
    <div
      style={{
        width: 1200,
        height: 630,
        background: black,
        display: 'flex',
        position: 'relative',
        fontFamily: 'Josefin Sans',
      }}
    >
      {/* ── Main ticket body ── */}
      <div
        style={{
          position: 'absolute',
          left: TX,
          top: TY,
          width: TW,
          height: TH,
          background: sulphur,
          display: 'flex',
          flexDirection: 'column',
          padding: '32px 40px',
          overflow: 'hidden',
        }}
      >
        {/* Punched hole (left edge, vertically centered) */}
        <div
          style={{
            display: 'flex',
            position: 'absolute',
            left: -18,
            top: TH / 2 - 18,
            width: 36,
            height: 36,
            borderRadius: 18,
            background: black,
          }}
        />

        {/* ADMIT ONE · TRAIN OF THOUGHT */}
        <span
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: olive,
            letterSpacing: 3,
            marginBottom: 22,
          }}
        >
          ADMIT ONE  ·  TRAIN OF THOUGHT
        </span>

        {/* Route: FROM ___ → TO ___ */}
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 14,
            marginBottom: 18,
          }}
        >
          <span
            style={{
              fontSize: rFS,
              fontFamily: 'Gilda Display',
              color: black,
              lineHeight: 1,
              whiteSpace: 'nowrap',
            }}
          >
            {`FROM ${firstName.toUpperCase()}`}
          </span>
          <span
            style={{
              fontSize: Math.round(rFS * 0.6),
              fontWeight: 600,
              color: olive,
              letterSpacing: 2,
              paddingBottom: 4,
              whiteSpace: 'nowrap',
            }}
          >
            →
          </span>
          <span
            style={{
              fontSize: rFS,
              fontFamily: 'Gilda Display',
              color: black,
              lineHeight: 1,
              whiteSpace: 'nowrap',
            }}
          >
            {`TO ${lastName.toUpperCase()}`}
          </span>
        </div>

        {/* Intermediate stops */}
        {midTowns.length > 0 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 28,
              marginBottom: 20,
            }}
          >
            {midTowns.map((town, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 5,
                    background: olive,
                  }}
                />
                <span
                  style={{ fontSize: 11, color: olive, letterSpacing: 2 }}
                >
                  {town.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Question / fare area */}
        <div
          style={{ flex: 1, display: 'flex', alignItems: 'center', paddingRight: 10 }}
        >
          {qText ? (
            <span
              style={{
                fontSize: qFS,
                fontFamily: 'Gilda Display',
                color: black,
                lineHeight: 1.35,
              }}
            >
              {qText}
            </span>
          ) : noQuestion ? (
            <span
              style={{
                fontSize: 22,
                fontFamily: 'Gilda Display',
                color: black,
                lineHeight: 1.35,
              }}
            >
              {noQuestion}
            </span>
          ) : null}
        </div>

        {/* Footer URL */}
        <span style={{ fontSize: 10, color: olive, letterSpacing: 2 }}>
          MOHAMMADKHAN-LIBRARY.VERCEL.APP
        </span>
      </div>

      {/* ── Dashed separator + notches ── */}
      {/* Top notch */}
      <div
        style={{
          display: 'flex',
          position: 'absolute',
          left: TX + TW - 15,
          top: TY - 15,
          width: 30,
          height: 30,
          borderRadius: 15,
          background: black,
        }}
      />
      {/* Bottom notch */}
      <div
        style={{
          display: 'flex',
          position: 'absolute',
          left: TX + TW - 15,
          top: TY + TH - 15,
          width: 30,
          height: 30,
          borderRadius: 15,
          background: black,
        }}
      />

      {/* ── Stub ── */}
      <div
        style={{
          position: 'absolute',
          left: TX + TW,
          top: TY,
          width: STUB_W,
          height: TH,
          background: sulphur,
          borderLeft: `2px dashed ${sep}`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '28px 20px',
        }}
      >
        {/* Rotated ADMIT ONE */}
        <div style={{ display: 'flex', transform: 'rotate(90deg)', marginBottom: 20 }}>
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              color: olive,
              letterSpacing: 3,
              whiteSpace: 'nowrap',
            }}
          >
            ADMIT ONE
          </span>
        </div>

        {/* Stub fields */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            width: '100%',
          }}
        >
          {/* SEATS */}
          <div
            style={{ borderBottom: `1px solid ${sep}`, paddingBottom: 12, display: 'flex', flexDirection: 'column' }}
          >
            <span style={{ fontSize: 9, color: olive, letterSpacing: 2 }}>SEATS</span>
            <span
              style={{
                fontSize: 26,
                fontWeight: 600,
                color: black,
                lineHeight: 1.1,
              }}
            >
              {seats}
            </span>
          </div>

          {/* DATE */}
          <div
            style={{ borderBottom: `1px solid ${sep}`, paddingBottom: 12, display: 'flex', flexDirection: 'column' }}
          >
            <span style={{ fontSize: 9, color: olive, letterSpacing: 2 }}>DATE</span>
            <span
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: black,
                lineHeight: 1.3,
              }}
            >
              {date}
            </span>
          </div>

          {/* CAR (optional) */}
          {car && (
            <div
              style={{ borderBottom: `1px solid ${sep}`, paddingBottom: 12, display: 'flex', flexDirection: 'column' }}
            >
              <span style={{ fontSize: 9, color: olive, letterSpacing: 2 }}>CAR</span>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: black,
                  lineHeight: 1.3,
                }}
              >
                {car.toUpperCase()}
              </span>
            </div>
          )}

          {/* NO. */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 9, color: olive, letterSpacing: 2 }}>NO.</span>
            <span
              style={{
                fontSize: 17,
                fontWeight: 600,
                color: black,
                letterSpacing: 2,
                lineHeight: 1.2,
              }}
            >
              {ticketNo}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
