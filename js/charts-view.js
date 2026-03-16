  (function() {
    if (window.ChartDataLabels) {
      Chart.register(ChartDataLabels);
    }

    const btnCharts = document.getElementById("btn-charts-view");
    const chartsView = document.getElementById("charts-view");
    const btnMapTab = document.getElementById("btn-map-tab");
    const mainArea = document.querySelector(".main-area");
    let chartsBuilt = false;
    let isChartsView = false;

    function buildCharts() {
      const visitData = window.STATE_VISIT_DATA || {};
      const entries = Object.entries(visitData)
        .filter(function(e) { return typeof e[1].visitation2024k === "number"; })
        .sort(function(a, b) { return b[1].visitation2024k - a[1].visitation2024k; });

      const top15 = entries.slice(0, 15);
      const top10 = entries.slice(0, 10);
      const otherTotal = entries.slice(10).reduce(function(s, e) { return s + e[1].visitation2024k; }, 0);

      const chartDefaults = {
        color: "var(--ink)",
        borderColor: "rgba(32,29,24,0.12)"
      };
      const pieTotal = top10.reduce(function(s, e) { return s + (e[1].visitation2024k || 0); }, 0) + (otherTotal || 0);

      // Bar chart — top 15 by 2024 visitation
      new Chart(document.getElementById("bar-chart"), {
        type: "bar",
        data: {
          labels: top15.map(function(e) { return e[0]; }),
          datasets: [{
            label: "2024 Visitation (000s)",
            data: top15.map(function(e) { return e[1].visitation2024k; }),
            backgroundColor: top15.map(function(_, i) {
              const t = i / (top15.length - 1);
              const r = Math.round(110 + t * 100), g = Math.round(50 - t * 30), b = Math.round(12);
              return "rgba(" + r + "," + g + "," + b + ",0.85)";
            }),
            borderRadius: 4
          }]
        },
        options: {
          responsive: true, maintainAspectRatio: false, indexAxis: "y",
          plugins: {
            legend: { display: false },
            datalabels: {
              display: true,
              anchor: "center",
              align: "right",
              clamp: true,
              color: "var(--ink)",
              font: { size: 10, weight: "600" },
              formatter: function(value) { return value != null ? value + "k" : ""; }
            }
          },
          scales: {
            x: { ticks: { color: chartDefaults.color }, grid: { color: chartDefaults.borderColor } },
            y: { ticks: { color: chartDefaults.color, font: { size: 11 } }, grid: { display: false } }
          }
        }
      });

      // Pie chart — top 10 share + other
      const pieColors = ["#c33a1f","#e05a2a","#ef8354","#f4a261","#f8bf85",
                         "#0369a1","#2563a8","#6d28d9","#047857","#be185d","#6b7280"];
      new Chart(document.getElementById("pie-chart"), {
        type: "doughnut",
        data: {
          labels: top10.map(function(e) { return e[0]; }).concat(["All others"]),
          datasets: [{
            data: top10.map(function(e) { return e[1].visitation2024k; }).concat([otherTotal]),
            backgroundColor: pieColors,
            borderWidth: 1,
            borderColor: "#1a1a2e"
          }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: {
            datalabels: {
              color: "var(--ink)",
              clamp: true,
              font: { size: 10, weight: "700" },
              formatter: function(value, ctx) {
                const chart = ctx.chart;
                const label = chart.data.labels ? chart.data.labels[ctx.dataIndex] : "";
                const pct = pieTotal ? ((value / pieTotal) * 100) : 0;
                return label && label !== "All others" ? `${label}` : `${label}`;
              }
            },
            legend: { position: "right", labels: { color: chartDefaults.color, font: { size: 11 }, padding: 10, boxWidth: 12 } }
          }
        }
      });

      // Line chart — 2023 vs 2024 top 15
      new Chart(document.getElementById("line-chart"), {
        type: "bar",
        data: {
          labels: top15.map(function(e) { return e[0]; }),
          datasets: [
            {
              label: "2023",
              data: top15.map(function(e) { return e[1].visitation2023k || 0; }),
              backgroundColor: "rgba(99,179,237,0.7)", borderRadius: 3
            },
            {
              label: "2024",
              data: top15.map(function(e) { return e[1].visitation2024k; }),
              backgroundColor: "rgba(232,195,106,0.85)", borderRadius: 3
            }
          ]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: {
            legend: { labels: { color: chartDefaults.color } },
            datalabels: {
              display: true,
              anchor: "end",
              align: "top",
              offset: 4,
              color: "var(--ink)",
              font: { size: 10, weight: "600" },
              formatter: function(value) { return value != null ? value + "k" : ""; }
            }
          },
          scales: {
            x: { ticks: { color: chartDefaults.color, font: { size: 10 } }, grid: { color: chartDefaults.borderColor } },
            y: { ticks: { color: chartDefaults.color }, grid: { color: chartDefaults.borderColor } }
          }
        }
      });
    }

    function setChartsMode(enabled) {
      isChartsView = enabled;
      if (isChartsView) {
        chartsView.style.display = "";
        mainArea.style.display = "none";
        btnCharts.textContent = "Map View";
        btnCharts.classList.add("active");
        if (!chartsBuilt) { buildCharts(); chartsBuilt = true; }
      } else {
        chartsView.style.display = "none";
        mainArea.style.display = "";
        btnCharts.textContent = "Charts View";
        btnCharts.classList.remove("active");
      }
    }

    btnCharts.addEventListener("click", function() {
      setChartsMode(!isChartsView);
    });

    if (btnMapTab) btnMapTab.addEventListener("click", () => setChartsMode(false));
  })();
