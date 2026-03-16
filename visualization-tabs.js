(function () {
  const dataObj = window.STATE_VISIT_DATA || {};
  const records = Object.entries(dataObj)
    .filter(([, d]) => typeof d.visitation2024k === "number")
    .map(([state, d]) => ({
      state,
      v2024: d.visitation2024k,
      v2023: typeof d.visitation2023k === "number" ? d.visitation2023k : 0
    }))
    .sort((a, b) => b.v2024 - a.v2024);

  function shortName(name, max = 14) {
    return name.length > max ? `${name.slice(0, max - 1)}...` : name;
  }

  function setupTabs() {
    const buttons = Array.from(document.querySelectorAll(".view-tab"));
    const panels = Array.from(document.querySelectorAll(".tab-panel"));
    if (!buttons.length || !panels.length) return;

    buttons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const target = btn.dataset.tabTarget;
        if (!target) return;

        buttons.forEach((b) => b.classList.toggle("is-active", b === btn));
        panels.forEach((panel) => panel.classList.toggle("is-active", panel.id === target));

        if (window.mainMap && typeof window.mainMap.invalidateSize === "function") {
          setTimeout(() => window.mainMap.invalidateSize(), 0);
        }
      });
    });
  }

  function buildBarChart() {
    const canvas = document.getElementById("bar-chart");
    if (!canvas || !window.Chart) return;

    const top = records.slice(0, 12);
    new Chart(canvas, {
      type: "bar",
      data: {
        labels: top.map((r) => shortName(r.state)),
        datasets: [{
          label: "2024 visitation (000)",
          data: top.map((r) => r.v2024),
          backgroundColor: "rgba(31, 79, 102, 0.85)",
          borderColor: "rgba(31, 79, 102, 1)",
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: { beginAtZero: true }
        }
      }
    });
  }

  function buildPieChart() {
    const canvas = document.getElementById("pie-chart");
    if (!canvas || !window.Chart) return;

    const top = records.slice(0, 8);
    const other = records.slice(8).reduce((sum, r) => sum + r.v2024, 0);
    const labels = top.map((r) => shortName(r.state)).concat("Other");
    const values = top.map((r) => r.v2024).concat(other);

    new Chart(canvas, {
      type: "pie",
      data: {
        labels,
        datasets: [{
          data: values,
          backgroundColor: [
            "#1f4f66", "#2b677e", "#3f88a6", "#53a8ca", "#69bfdc",
            "#8fd3e6", "#b7e4f0", "#d4eef6", "#e8e8e8"
          ]
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: "bottom" }
        }
      }
    });
  }

  function buildLineChart() {
    const canvas = document.getElementById("line-chart");
    if (!canvas || !window.Chart) return;

    const top = records.slice(0, 15);
    new Chart(canvas, {
      type: "line",
      data: {
        labels: top.map((r) => shortName(r.state)),
        datasets: [
          {
            label: "2024 visitation (000)",
            data: top.map((r) => r.v2024),
            borderColor: "#1f4f66",
            backgroundColor: "rgba(31,79,102,0.15)",
            pointRadius: 3,
            pointHoverRadius: 4,
            tension: 0.25,
            fill: false
          },
          {
            label: "2023 visitation (000)",
            data: top.map((r) => r.v2023),
            borderColor: "#ef8354",
            backgroundColor: "rgba(239,131,84,0.12)",
            pointRadius: 3,
            pointHoverRadius: 4,
            tension: 0.25,
            fill: false
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: "bottom" }
        }
      }
    });
  }

  function init() {
    setupTabs();
    buildBarChart();
    buildPieChart();
    buildLineChart();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
