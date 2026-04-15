import { useState, useEffect } from "react";

const PILLARS = [
  {
    id: "spiritual",
    label: "Spiritual Strength",
    icon: "✦",
    color: "#C9A84C",
    questions: [
      "How consistent is your prayer, meditation, or devotional practice this week?",
      "Do you feel a sense of divine purpose guiding your decisions?",
      "How connected do you feel to your faith community or spiritual relationships?",
    ],
  },
  {
    id: "mental",
    label: "Mental Mastery",
    icon: "◈",
    color: "#5B8DB8",
    questions: [
      "How intentional are you about learning and growing your mind daily?",
      "How well are you managing stress, focus, and mental clarity?",
      "Are you consistently working toward long-term goals with a clear plan?",
    ],
  },
  {
    id: "emotional",
    label: "Emotional Stability",
    icon: "◉",
    color: "#9B7DB8",
    questions: [
      "How well do you understand and process your emotions without suppressing them?",
      "Are you able to maintain inner peace during difficult or uncertain moments?",
      "How healthy are the emotional boundaries you hold in your relationships?",
    ],
  },
  {
    id: "social",
    label: "Social Wisdom",
    icon: "⬡",
    color: "#4CAF88",
    questions: [
      "How intentionally are you investing in meaningful, growth-oriented relationships?",
      "Do the people closest to you reflect the kind of person you're becoming?",
      "How effectively do you communicate, lead, or add value in your social circles?",
    ],
  },
  {
    id: "purpose",
    label: "Purpose Clarity",
    icon: "◎",
    color: "#E07B5A",
    questions: [
      "How clearly can you articulate your life's mission and what you're building?",
      "Are your daily actions aligned with your deeper calling and long-term vision?",
      "How much momentum do you feel in the work that matters most to you?",
    ],
  },
];

const SCALE = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

const SCORE_LABELS = {
  low: "Needs Attention",
  mid: "In Progress",
  good: "Growing Strong",
  high: "Thriving",
};

function getScoreLabel(score) {
  if (score <= 3) return SCORE_LABELS.low;
  if (score <= 5) return SCORE_LABELS.mid;
  if (score <= 7) return SCORE_LABELS.good;
  return SCORE_LABELS.high;
}

function getOverallLabel(avg) {
  if (avg <= 3) return { label: "Foundations Needed", desc: "Your growth journey is just beginning. There's powerful potential waiting to be unlocked." };
  if (avg <= 5) return { label: "Building Momentum", desc: "You're moving — but some areas need more intentional investment to reach your full potential." };
  if (avg <= 7) return { label: "Rising Giant", desc: "You're growing across key areas. With focused effort, you're on the path to becoming an All-Round Giant." };
  return { label: "All-Round Giant", desc: "You're operating at a high level across the pillars. Keep compounding these gains with discipline and purpose." };
}

function RadarChart({ scores }) {
  const size = 220;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 85;
  const n = PILLARS.length;

  const getPoint = (i, r) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    };
  };

  const gridLevels = [0.2, 0.4, 0.6, 0.8, 1];

  const dataPoints = PILLARS.map((p, i) => {
    const score = scores[p.id] !== undefined ? scores[p.id] / 10 : 0;
    return getPoint(i, score * radius);
  });

  const dataPath = dataPoints.map((pt, i) => `${i === 0 ? "M" : "L"}${pt.x},${pt.y}`).join(" ") + " Z";

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {gridLevels.map((level, li) => {
        const pts = PILLARS.map((_, i) => getPoint(i, level * radius));
        const path = pts.map((pt, i) => `${i === 0 ? "M" : "L"}${pt.x},${pt.y}`).join(" ") + " Z";
        return <path key={li} d={path} fill="none" stroke="rgba(201,168,76,0.15)" strokeWidth="1" />;
      })}
      {PILLARS.map((_, i) => {
        const outer = getPoint(i, radius);
        return <line key={i} x1={cx} y1={cy} x2={outer.x} y2={outer.y} stroke="rgba(201,168,76,0.2)" strokeWidth="1" />;
      })}
      <path d={dataPath} fill="rgba(201,168,76,0.2)" stroke="#C9A84C" strokeWidth="2" />
      {PILLARS.map((p, i) => {
        const labelPt = getPoint(i, radius + 20);
        return (
          <text key={i} x={labelPt.x} y={labelPt.y} textAnchor="middle" dominantBaseline="middle" fontSize="9" fill={p.color} fontFamily="'Cinzel', serif" letterSpacing="0.5">
            {p.icon}
          </text>
        );
      })}
      {dataPoints.map((pt, i) => (
        <circle key={i} cx={pt.x} cy={pt.y} r={3} fill={PILLARS[i].color} />
      ))}
    </svg>
  );
}

function LoadingDots() {
  return (
    <span style={{ display: "inline-flex", gap: 4, alignItems: "center" }}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "#C9A84C",
            animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
          }}
        />
      ))}
    </span>
  );
}

export default function ARGONApp() {
  const [phase, setPhase] = useState("intro"); // intro | quiz | results
  const [currentPillar, setCurrentPillar] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [scores, setScores] = useState({});
  const [todos, setTodos] = useState(null);
  const [loadingTodos, setLoadingTodos] = useState(false);
  const [selected, setSelected] = useState(null);
  const [animating, setAnimating] = useState(false);

  const pillar = PILLARS[currentPillar];
  const question = pillar?.questions[currentQuestion];

  const totalQuestions = PILLARS.reduce((a, p) => a + p.questions.length, 0);
  const answeredCount = Object.values(answers).flat().length;
  const progress = (answeredCount / totalQuestions) * 100;

  function handleAnswer(val) {
    setSelected(val);
  }

  function handleNext() {
    if (selected === null) return;
    const key = `${pillar.id}_${currentQuestion}`;
    const newAnswers = { ...answers, [key]: selected };
    setAnswers(newAnswers);
    setAnimating(true);

    setTimeout(() => {
      setAnimating(false);
      setSelected(null);

      const nextQ = currentQuestion + 1;
      if (nextQ < pillar.questions.length) {
        setCurrentQuestion(nextQ);
      } else {
        const nextP = currentPillar + 1;
        if (nextP < PILLARS.length) {
          setCurrentPillar(nextP);
          setCurrentQuestion(0);
        } else {
          // Compute scores
          const computed = {};
          PILLARS.forEach((p) => {
            const vals = p.questions.map((_, qi) => newAnswers[`${p.id}_${qi}`] || 0);
            computed[p.id] = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
          });
          setScores(computed);
          setPhase("results");
          generateTodos(computed, newAnswers);
        }
      }
    }, 300);
  }

  async function generateTodos(computed, allAnswers) {
    setLoadingTodos(true);
    const summary = PILLARS.map((p) => {
      const avg = computed[p.id];
      const qs = p.questions.map((q, qi) => `Q: ${q} → Score: ${allAnswers[`${p.id}_${qi}`]}/10`).join("\n");
      return `## ${p.label} (Score: ${avg}/10)\n${qs}`;
    }).join("\n\n");

    const prompt = `You are an ARGON Balanced Growth Coach. A person just completed their Balanced Growth Assessment. Here are their scores and responses:

${summary}

Based on their scores and responses, generate a personalized 5-day action plan (5 specific, concrete todos) for the 2 lowest-scoring pillars. Each todo should be:
- Actionable and specific (not vague)
- Achievable within a day
- Tied clearly to the pillar it addresses

Return ONLY a JSON array like this (no markdown, no preamble):
[
  { "pillar": "Pillar Name", "pillarId": "pillar_id", "day": 1, "task": "Specific task here", "why": "One sentence on why this matters" },
  ...
]`;

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{ role: "user", content: prompt }],
        }),
      });
      const data = await res.json();
      const raw = data.content?.find((b) => b.type === "text")?.text || "[]";
      const clean = raw.replace(/```json|```/g, "").trim();
      setTodos(JSON.parse(clean));
    } catch (e) {
      setTodos([]);
    } finally {
      setLoadingTodos(false);
    }
  }

  const overallAvg = scores && Object.keys(scores).length
    ? Math.round(Object.values(scores).reduce((a, b) => a + b, 0) / Object.keys(scores).length)
    : 0;

  const overallInfo = getOverallLabel(overallAvg);

  const pillarColor = pillar?.color || "#C9A84C";

  return (
    <div style={{ minHeight: "100vh", background: "#0A0906", fontFamily: "'Cormorant Garamond', Georgia, serif", color: "#E8DCC8", position: "relative", overflow: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes pulse { 0%,100%{opacity:0.3;transform:scale(0.8)} 50%{opacity:1;transform:scale(1.1)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        @keyframes glow { 0%,100%{box-shadow:0 0 20px rgba(201,168,76,0.1)} 50%{box-shadow:0 0 40px rgba(201,168,76,0.25)} }
        @keyframes shimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
        .fade-up { animation: fadeUp 0.6s ease forwards; }
        .fade-in { animation: fadeIn 0.4s ease forwards; }
        .scale-btn:hover { transform: scale(1.04); transition: transform 0.15s; }
        .scale-btn:active { transform: scale(0.97); }
        .score-bar-fill { transition: width 1.2s cubic-bezier(0.4,0,0.2,1); }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #0A0906; }
        ::-webkit-scrollbar-thumb { background: #C9A84C44; border-radius: 2px; }
      `}</style>

      {/* Background texture */}
      <div style={{ position: "fixed", inset: 0, backgroundImage: "radial-gradient(ellipse at 20% 20%, rgba(201,168,76,0.05) 0%, transparent 60%), radial-gradient(ellipse at 80% 80%, rgba(91,141,184,0.04) 0%, transparent 60%)", pointerEvents: "none" }} />

      {/* INTRO */}
      {phase === "intro" && (
        <div className="fade-in" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: "40px 24px", textAlign: "center" }}>
          <div style={{ marginBottom: 24 }}>
            <span style={{ fontFamily: "'Cinzel', serif", fontSize: 11, letterSpacing: 6, color: "#C9A84C", textTransform: "uppercase", opacity: 0.8 }}>ARGON</span>
          </div>
          <div style={{ display: "flex", gap: 12, marginBottom: 32, fontSize: 22 }}>
            {PILLARS.map((p) => (
              <span key={p.id} style={{ color: p.color, filter: "drop-shadow(0 0 8px currentColor)" }}>{p.icon}</span>
            ))}
          </div>
          <h1 style={{ fontFamily: "'Cinzel', serif", fontSize: "clamp(26px, 5vw, 44px)", fontWeight: 600, lineHeight: 1.2, marginBottom: 16, background: "linear-gradient(135deg, #E8DCC8 0%, #C9A84C 50%, #E8DCC8 100%)", backgroundSize: "200% auto", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", animation: "shimmer 4s linear infinite" }}>
            Balanced Growth<br />Assessment
          </h1>
          <p style={{ fontSize: 17, color: "#B0A08A", maxWidth: 480, lineHeight: 1.8, marginBottom: 12, fontStyle: "italic" }}>
            Discover where you truly stand across the five pillars of an All-Round Giant.
          </p>
          <p style={{ fontSize: 13, color: "#6B5E4A", maxWidth: 400, lineHeight: 1.7, marginBottom: 48 }}>
            15 honest questions · 5 life pillars · Personalized growth plan
          </p>

          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center", marginBottom: 48 }}>
            {PILLARS.map((p) => (
              <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", border: `1px solid ${p.color}33`, borderRadius: 40, background: `${p.color}0A` }}>
                <span style={{ color: p.color, fontSize: 13 }}>{p.icon}</span>
                <span style={{ fontSize: 11, color: "#8A7A68", fontFamily: "'Cinzel', serif", letterSpacing: 1 }}>{p.label.toUpperCase()}</span>
              </div>
            ))}
          </div>

          <button
            className="scale-btn"
            onClick={() => setPhase("quiz")}
            style={{ padding: "16px 48px", background: "linear-gradient(135deg, #C9A84C, #A8873C)", border: "none", borderRadius: 4, color: "#0A0906", fontFamily: "'Cinzel', serif", fontSize: 13, fontWeight: 700, letterSpacing: 3, cursor: "pointer", textTransform: "uppercase", animation: "glow 3s ease-in-out infinite" }}
          >
            Begin Assessment
          </button>
        </div>
      )}

      {/* QUIZ */}
      {phase === "quiz" && (
        <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", padding: "32px 24px", maxWidth: 600, margin: "0 auto" }}>
          {/* Header */}
          <div style={{ marginBottom: 40 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <span style={{ fontFamily: "'Cinzel', serif", fontSize: 10, letterSpacing: 5, color: "#C9A84C55" }}>ARGON</span>
              <span style={{ fontSize: 11, color: "#5A4E40", fontFamily: "'Cinzel', serif", letterSpacing: 2 }}>{answeredCount} / {totalQuestions}</span>
            </div>
            <div style={{ height: 2, background: "#1E1A14", borderRadius: 1, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${progress}%`, background: "linear-gradient(90deg, #C9A84C, #E8C97A)", borderRadius: 1, transition: "width 0.4s ease" }} />
            </div>
          </div>

          {/* Pillar indicator */}
          <div style={{ display: "flex", gap: 8, marginBottom: 32 }}>
            {PILLARS.map((p, i) => (
              <div key={p.id} style={{ flex: 1, height: 3, borderRadius: 2, background: i < currentPillar ? p.color : i === currentPillar ? `${p.color}66` : "#1E1A14", transition: "background 0.4s" }} />
            ))}
          </div>

          {/* Pillar label */}
          <div className="fade-in" key={pillar.id} style={{ marginBottom: 8, display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ color: pillarColor, fontSize: 18, filter: "drop-shadow(0 0 6px currentColor)" }}>{pillar.icon}</span>
            <span style={{ fontFamily: "'Cinzel', serif", fontSize: 11, letterSpacing: 4, color: pillarColor, textTransform: "uppercase" }}>{pillar.label}</span>
          </div>

          {/* Question */}
          <div className={animating ? "fade-in" : "fade-up"} key={`${currentPillar}-${currentQuestion}`} style={{ flex: 1 }}>
            <p style={{ fontSize: "clamp(18px, 3.5vw, 24px)", lineHeight: 1.65, color: "#E8DCC8", marginBottom: 40, fontWeight: 300, fontStyle: "italic" }}>
              "{question}"
            </p>

            {/* Scale */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 11, color: "#4A3E30", fontFamily: "'Cinzel', serif", letterSpacing: 1 }}>NOT AT ALL</span>
                <span style={{ fontSize: 11, color: "#4A3E30", fontFamily: "'Cinzel', serif", letterSpacing: 1 }}>COMPLETELY</span>
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {SCALE.map((val) => (
                  <button
                    key={val}
                    className="scale-btn"
                    onClick={() => handleAnswer(val)}
                    style={{
                      flex: 1,
                      minWidth: 40,
                      height: 48,
                      border: selected === val ? `2px solid ${pillarColor}` : "1px solid #2A2318",
                      borderRadius: 4,
                      background: selected === val ? `${pillarColor}22` : "#12100D",
                      color: selected === val ? pillarColor : "#4A3E30",
                      fontFamily: "'Cinzel', serif",
                      fontSize: 14,
                      fontWeight: selected === val ? 700 : 400,
                      cursor: "pointer",
                      transition: "all 0.15s",
                      boxShadow: selected === val ? `0 0 16px ${pillarColor}33` : "none",
                    }}
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>

            {selected !== null && (
              <p style={{ fontSize: 12, color: pillarColor, textAlign: "center", marginBottom: 24, fontStyle: "italic", opacity: 0.8 }}>
                {selected <= 3 ? "Needs focus" : selected <= 6 ? "Room to grow" : selected <= 8 ? "Doing well" : "Excellent"}
              </p>
            )}
          </div>

          {/* Next button */}
          <button
            className="scale-btn"
            onClick={handleNext}
            disabled={selected === null}
            style={{
              width: "100%",
              padding: "16px",
              background: selected !== null ? "linear-gradient(135deg, #C9A84C, #A8873C)" : "#1A1610",
              border: "none",
              borderRadius: 4,
              color: selected !== null ? "#0A0906" : "#3A3228",
              fontFamily: "'Cinzel', serif",
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: 3,
              cursor: selected !== null ? "pointer" : "not-allowed",
              textTransform: "uppercase",
              transition: "all 0.2s",
              marginTop: 24,
            }}
          >
            {currentPillar === PILLARS.length - 1 && currentQuestion === pillar.questions.length - 1
              ? "Complete Assessment →"
              : "Next Question →"}
          </button>
        </div>
      )}

      {/* RESULTS */}
      {phase === "results" && (
        <div className="fade-in" style={{ maxWidth: 680, margin: "0 auto", padding: "40px 24px 80px" }}>
          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <span style={{ fontFamily: "'Cinzel', serif", fontSize: 10, letterSpacing: 6, color: "#C9A84C55", display: "block", marginBottom: 16 }}>ARGON ASSESSMENT RESULTS</span>
            <div style={{ fontSize: 64, fontFamily: "'Cinzel', serif", fontWeight: 700, background: "linear-gradient(135deg, #E8DCC8, #C9A84C)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", lineHeight: 1, marginBottom: 8 }}>
              {overallAvg}<span style={{ fontSize: 24 }}>/10</span>
            </div>
            <div style={{ fontFamily: "'Cinzel', serif", fontSize: 14, letterSpacing: 3, color: "#C9A84C", textTransform: "uppercase", marginBottom: 8 }}>{overallInfo.label}</div>
            <p style={{ color: "#7A6A58", fontSize: 15, fontStyle: "italic", maxWidth: 420, margin: "0 auto", lineHeight: 1.7 }}>{overallInfo.desc}</p>
          </div>

          {/* Radar + Scores side by side */}
          <div style={{ display: "flex", gap: 32, alignItems: "center", marginBottom: 48, flexWrap: "wrap", justifyContent: "center" }}>
            <RadarChart scores={scores} />
            <div style={{ flex: 1, minWidth: 200 }}>
              {PILLARS.map((p) => {
                const score = scores[p.id] || 0;
                return (
                  <div key={p.id} style={{ marginBottom: 18 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ color: p.color, fontSize: 12 }}>{p.icon}</span>
                        <span style={{ fontFamily: "'Cinzel', serif", fontSize: 10, letterSpacing: 2, color: "#8A7A68", textTransform: "uppercase" }}>{p.label}</span>
                      </div>
                      <span style={{ fontFamily: "'Cinzel', serif", fontSize: 13, color: p.color, fontWeight: 600 }}>{score}</span>
                    </div>
                    <div style={{ height: 3, background: "#1A1610", borderRadius: 2, overflow: "hidden" }}>
                      <div className="score-bar-fill" style={{ height: "100%", width: `${score * 10}%`, background: `linear-gradient(90deg, ${p.color}88, ${p.color})`, borderRadius: 2 }} />
                    </div>
                    <div style={{ fontSize: 10, color: "#4A3E30", marginTop: 3, fontStyle: "italic" }}>{getScoreLabel(score)}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Todos */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
              <div style={{ flex: 1, height: 1, background: "#1E1A14" }} />
              <span style={{ fontFamily: "'Cinzel', serif", fontSize: 11, letterSpacing: 4, color: "#C9A84C", textTransform: "uppercase" }}>Your Growth Plan</span>
              <div style={{ flex: 1, height: 1, background: "#1E1A14" }} />
            </div>

            {loadingTodos ? (
              <div style={{ textAlign: "center", padding: "40px 0", color: "#5A4E40" }}>
                <div style={{ marginBottom: 16 }}><LoadingDots /></div>
                <p style={{ fontStyle: "italic", fontSize: 14 }}>Crafting your personalized plan…</p>
              </div>
            ) : todos && todos.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {todos.map((todo, i) => {
                  const pillarData = PILLARS.find((p) => p.id === todo.pillarId) || PILLARS[0];
                  return (
                    <div key={i} className="fade-up" style={{ animationDelay: `${i * 0.1}s`, padding: "20px 22px", border: `1px solid ${pillarData.color}22`, borderLeft: `3px solid ${pillarData.color}`, borderRadius: 4, background: `${pillarData.color}07`, position: "relative" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                        <span style={{ fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: 3, color: pillarData.color, textTransform: "uppercase", opacity: 0.8 }}>Day {todo.day} · {todo.pillar}</span>
                      </div>
                      <p style={{ fontSize: 15, color: "#D8C9B4", lineHeight: 1.6, marginBottom: 8 }}>{todo.task}</p>
                      <p style={{ fontSize: 12, color: "#5A4E40", fontStyle: "italic", lineHeight: 1.5 }}>↳ {todo.why}</p>
                    </div>
                  );
                })}
              </div>
            ) : todos && todos.length === 0 ? (
              <p style={{ textAlign: "center", color: "#5A4E40", fontStyle: "italic" }}>Could not generate plan. Please try again.</p>
            ) : null}
          </div>

          {/* Restart */}
          <div style={{ textAlign: "center", marginTop: 48 }}>
            <button
              className="scale-btn"
              onClick={() => { setPhase("intro"); setAnswers({}); setScores({}); setTodos(null); setCurrentPillar(0); setCurrentQuestion(0); setSelected(null); }}
              style={{ padding: "12px 36px", background: "transparent", border: "1px solid #2A2318", borderRadius: 4, color: "#5A4E40", fontFamily: "'Cinzel', serif", fontSize: 11, letterSpacing: 3, cursor: "pointer", textTransform: "uppercase" }}
            >
              Retake Assessment
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
