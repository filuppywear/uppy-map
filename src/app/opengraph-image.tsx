import { ImageResponse } from "next/og";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          padding: "52px",
          background:
            "radial-gradient(circle at top left, rgba(201,152,115,0.22), transparent 340px), linear-gradient(180deg, #fbf7f1 0%, #f0e7db 100%)",
          color: "#241b19",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: "100%",
            height: "100%",
            borderRadius: "34px",
            border: "1px solid rgba(36,27,25,0.12)",
            background: "rgba(255,250,244,0.78)",
            padding: "40px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "14px",
              color: "#7a5846",
              fontSize: 24,
              fontWeight: 700,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
            }}
          >
            <span>Uppy presents</span>
            <span>Thrifter Map</span>
          </div>

          <div style={{ display: "flex", gap: "28px", alignItems: "stretch" }}>
            <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", flex: 1 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <div
                  style={{
                    fontSize: 80,
                    fontWeight: 900,
                    lineHeight: 0.95,
                    maxWidth: "760px",
                    letterSpacing: "-0.05em",
                  }}
                >
                  Europe&apos;s best secondhand and vintage stores, mapped for people with taste.
                </div>
                <div
                  style={{
                    fontSize: 28,
                    lineHeight: 1.35,
                    color: "#5f544f",
                    maxWidth: "760px",
                  }}
                >
                  Curated city guides for thrifter tourists and locals. Join early access to unlock the live beta.
                </div>
              </div>

              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                {["Europe-first beta", "Hidden gems over tourist traps", "Real city coverage"].map((item) => (
                  <div
                    key={item}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      padding: "10px 16px",
                      borderRadius: "999px",
                      border: "1px solid rgba(36,27,25,0.1)",
                      background: "rgba(255,255,255,0.65)",
                      fontSize: 20,
                      color: "#5f544f",
                    }}
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                width: "300px",
                borderRadius: "28px",
                border: "1px solid rgba(36,27,25,0.08)",
                background:
                  "linear-gradient(180deg, rgba(255,250,244,0.96), rgba(237,226,211,0.96))",
                padding: "28px",
              }}
            >
              <div
                style={{
                  color: "#7a5846",
                  fontSize: 22,
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                }}
              >
                Already inside
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                {[
                  ["London", "439 stores"],
                  ["Paris", "430 stores"],
                  ["Berlin", "341 stores"],
                  ["Budapest", "154 stores"],
                ].map(([city, count]) => (
                  <div
                    key={city}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "4px",
                      padding: "14px 16px",
                      borderRadius: "20px",
                      background: "rgba(255,255,255,0.74)",
                      border: "1px solid rgba(36,27,25,0.08)",
                    }}
                  >
                    <div style={{ fontSize: 30, fontWeight: 700 }}>{city}</div>
                    <div style={{ fontSize: 18, color: "#5f544f" }}>{count}</div>
                  </div>
                ))}
              </div>

              <div
                style={{
                  fontSize: 18,
                  color: "#5f544f",
                  lineHeight: 1.4,
                }}
              >
                4,002 mapped stores across 83 cities in 28 countries.
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
    size
  );
}
