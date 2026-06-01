export default function OfflinePage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#020617",
        fontFamily: "sans-serif",
        textAlign: "center",
        padding: "24px",
      }}
    >
      <div style={{ fontSize: 64, marginBottom: 16 }}>📶</div>
      <h1 style={{ color: "#f1f5f9", fontSize: 24, fontWeight: 700, marginBottom: 8 }}>
        Pas de connexion
      </h1>
      <p style={{ color: "#64748b", fontSize: 15, maxWidth: 320, lineHeight: 1.6, marginBottom: 24 }}>
        Tu es hors-ligne. Tes cours et fiches téléchargés restent accessibles.
      </p>
      <a
        href="/dashboard/offline"
        style={{
          backgroundColor: "#4f46e5",
          color: "white",
          padding: "10px 24px",
          borderRadius: 10,
          textDecoration: "none",
          fontWeight: 600,
          fontSize: 14,
        }}
      >
        Voir mes cours hors-ligne
      </a>
    </div>
  );
}
