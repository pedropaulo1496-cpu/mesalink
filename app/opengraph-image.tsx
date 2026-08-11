import { ImageResponse } from "next/og";

export const alt = "MesaLink — software de gestão para restaurantes";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: "#17130F",
        color: "#FFF9F0",
        padding: "70px 78px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div style={{ position: "absolute", width: 520, height: 520, borderRadius: 999, background: "#C8A56A", opacity: 0.16, right: -130, top: -180 }} />
      <div style={{ position: "absolute", width: 360, height: 360, borderRadius: 999, border: "2px solid rgba(200,165,106,.28)", right: 90, bottom: -180 }} />

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", fontSize: 44, fontWeight: 800, letterSpacing: -2 }}>
          <span style={{ color: "#C8A56A" }}>Mesa</span><span>Link</span>
        </div>
        <div style={{ display: "flex", border: "1px solid rgba(200,165,106,.5)", borderRadius: 999, padding: "10px 18px", color: "#D7B267", fontSize: 18, fontWeight: 700, letterSpacing: 2 }}>RESTAURANT OS</div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", maxWidth: 920 }}>
        <div style={{ fontSize: 72, lineHeight: 0.96, letterSpacing: -4.5, fontWeight: 800 }}>Software para restaurantes.</div>
        <div style={{ marginTop: 8, fontSize: 72, lineHeight: 0.96, letterSpacing: -4.5, fontWeight: 800, color: "#C8A56A" }}>Tudo ligado.</div>
        <div style={{ marginTop: 30, fontSize: 24, lineHeight: 1.4, color: "#D8CABB" }}>Reservas · POS · QR Ordering · Website · CRM · Marketing</div>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 18, color: "#B9AA99" }}>
        <span>7 dias grátis · sem comissão por reserva</span>
        <span style={{ color: "#D7B267", fontWeight: 700 }}>mesalink.pt</span>
      </div>
    </div>,
    size,
  );
}
