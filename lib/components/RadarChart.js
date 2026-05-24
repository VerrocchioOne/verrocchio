// lib/components/RadarChart.js
//
// Habit-Stats radar chart (Life Balance Radar). Lazy-loads Chart.js
// from a CDN the first time the chart is mounted so a cold boot ships
// ~190 KB lighter. Originally inline at index.html L2007-L2115 (109
// LOC). Used once at the Habit Stats modal (was L13496).
//
// Browser dependencies:
//   - React (UMD global)
//   - HT (from lib/constants.js — habit-type taxonomy)
//   - Chart.js (loaded on demand by ensureChartJs)

(function () {
  "use strict";
  if (typeof window === "undefined" || !window.React) return;
  const React = window.React;
  const { useRef, useEffect } = React;

/* ── Lazy Chart.js loader. The library is only used by the radar in
   the Habit-Stats modal, so loading it on demand keeps a cold boot
   ~190 KB lighter. Subsequent opens hit the in-memory promise. */
let __chartJsPromise = null;
function ensureChartJs() {
  if (typeof window !== "undefined" && window.Chart) return Promise.resolve(window.Chart);
  if (__chartJsPromise) return __chartJsPromise;
  __chartJsPromise = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.0/chart.umd.min.js";
    s.async = true;
    s.onload = () => resolve(window.Chart);
    s.onerror = () => { __chartJsPromise = null; reject(new Error("Chart.js failed to load")); };
    document.head.appendChild(s);
  });
  return __chartJsPromise;
}

/* ── RADAR CHART COMPONENT ── */
const RadarChart = React.memo(function RadarChart(_ref) {
  let {
    habits,
    selDate
  } = _ref;
  const canvasRef = useRef(null);
  const chartRef = useRef(null);
  useEffect(() => {
    if (!canvasRef.current) return;
    let cancelled = false;
    const cats = HT.map(t => t.value);
    const scores = cats.map(cat => {
      const catH = habits.filter(h => h.type === cat && h.section !== "avoid");
      const avoidH = habits.filter(h => h.type === cat && h.section === "avoid");
      if (catH.length === 0 && avoidH.length === 0) return 0;
      const done = catH.filter(h => !!h.completions?.[selDate]).length;
      const avoided = avoidH.filter(h => !!h.completions?.[selDate]).length;
      const total = catH.length + avoidH.length;
      return total > 0 ? Math.round((done + avoided) / total * 100) : 0;
    });
    ensureChartJs().then(Chart => {
      if (cancelled || !canvasRef.current) return;
      if (chartRef.current) chartRef.current.destroy();
      chartRef.current = new Chart(canvasRef.current, {
      type: "radar",
      data: {
        labels: cats,
        datasets: [{
          label: "Today",
          data: scores,
          backgroundColor: "rgba(124,58,237,0.12)",
          borderColor: "#7c3aed",
          borderWidth: 2,
          pointBackgroundColor: HT.map(t => t.color),
          pointBorderColor: "#fff",
          pointBorderWidth: 1.5,
          pointRadius: 5
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        aspectRatio: 1.4,
        scales: {
          r: {
            min: 0,
            max: 100,
            ticks: {
              display: false,
              stepSize: 25
            },
            grid: {
              color: "rgba(0,0,0,0.06)"
            },
            angleLines: {
              color: "rgba(0,0,0,0.06)"
            },
            pointLabels: {
              color: "#6b7280",
              font: {
                family: "system-ui",
                size: 11,
                weight: "600"
              }
            }
          }
        },
        plugins: {
          legend: {
            display: false
          }
        }
      }
    });
    }).catch(() => { /* swallow — modal stays usable without the radar */ });
    return () => {
      cancelled = true;
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, [habits, selDate]);
  return React.createElement("canvas", {
    ref: canvasRef,
    style: {
      maxWidth: "100%"
    }
  });
});

  window.RadarChart = RadarChart;
  window.ensureChartJs = ensureChartJs;
  if (typeof module !== "undefined" && module.exports) {
    module.exports = { RadarChart, ensureChartJs };
  }
})();
