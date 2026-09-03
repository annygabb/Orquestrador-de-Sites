import { ImageResponse } from "next/og";

export const alt = "Orquestrador de Sites — uma direção que a IA entende";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", overflow: "hidden", background: "#061733", color: "#f7f9ff", fontFamily: "Arial, sans-serif", padding: "70px 76px" }}>
      <div style={{ position: "absolute", width: 680, height: 680, borderRadius: "50%", right: -180, top: -250, background: "radial-gradient(circle, #347cff 0%, rgba(52,124,255,.2) 48%, transparent 70%)" }} />
      <div style={{ position: "absolute", width: 520, height: 220, border: "2px solid rgba(123,170,255,.55)", borderRadius: 48, right: 58, bottom: 70, transform: "rotate(-7deg)", boxShadow: "0 0 55px rgba(47,115,255,.38)", background: "linear-gradient(135deg, rgba(18,50,102,.92), rgba(9,25,57,.72))" }} />
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: 700 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}><div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 58, height: 58, borderRadius: 16, background: "#2f73ff", fontWeight: 900 }}>OS</div><div style={{ fontSize: 24, fontWeight: 800, letterSpacing: -1 }}>ORQUESTRADOR DE SITES</div></div>
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}><div style={{ display: "flex", flexDirection: "column", fontSize: 60, lineHeight: .94, fontWeight: 800, letterSpacing: -4 }}><span>Referências soltas viram</span><span><span style={{ color: "#79a9ff" }}>uma direção</span> que a IA entende.</span></div><div style={{ fontSize: 23, lineHeight: 1.4, color: "#b9c8e4", maxWidth: 630 }}>Skills, critérios e referências organizados antes da execução.</div></div>
        <div style={{ display: "flex", gap: 12, color: "#dce8ff", fontSize: 17 }}><span>Você escolhe</span><span style={{ color: "#2f73ff" }}>●</span><span>O sistema organiza</span><span style={{ color: "#2f73ff" }}>●</span><span>A IA executa com contexto</span></div>
      </div>
    </div>,
    size,
  );
}
