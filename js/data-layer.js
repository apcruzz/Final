(function() {
  const SECTOR_COLORS = {
    "Mining & Oil/Gas":"#a16207","Utilities":"#0369a1","Construction":"#b45309",
    "Wholesale Trade":"#0891b2","Information":"#7c3aed","Finance & Insurance":"#be185d",
    "Real Estate":"#0f766e","Professional Services":"#4f46e5","Management":"#6d28d9",
    "Admin & Waste Mgmt":"#9d174d","Educational Services":"#1d4ed8","Health Care":"#059669",
    "Arts & Entertainment":"#d97706","Accommodation & Food":"#dc2626","Other Services":"#6b7280"
  };

  const DATASETS = {
    visitors: {
      label: "Visitors",
      overlayType: "none",
      desc: () => "Choropleth by 2024 overseas visitor volume — darker = more visitors",
      choroplethFn: (state) => {
        const d = visitData()[state];
        if (!d || typeof d.visitation2024k !== "number") return null;
        const v = d.visitation2024k;
        if (v > 8000) return "#6e1711"; if (v > 4000) return "#9b2219";
        if (v > 2000) return "#c33a1f"; if (v > 1000) return "#e05a2a";
        if (v >  500) return "#ef8354"; if (v >  250) return "#f4a261";
        if (v >  100) return "#f8bf85"; if (v >   50) return "#fbd7ac";
        return "#fee9cf";
      },
      tooltipFn: (state) => {
        const d = visitData()[state];
        if (!d) return null;
        const fmtK = v => typeof v === "number" ? v.toLocaleString()+"k" : "—";
        const fmtP = v => typeof v === "number" ? (v*100).toFixed(1)+"%" : "—";
        const gColor = d.pctChange > 0 ? "#4ade80" : d.pctChange < 0 ? "#f87171" : "#aaa";
        const gArrow = d.pctChange > 0 ? "▲" : d.pctChange < 0 ? "▼" : "—";
        return `<div class="tt-label">Overseas Visitors (2024)</div>
          <div><span class="tt-k">Rank:</span> <strong>#${d.rank ?? "—"}</strong></div>
          <div><span class="tt-k">2024:</span> <strong>${fmtK(d.visitation2024k)}</strong></div>
          <div><span class="tt-k">2023:</span> <strong>${fmtK(d.visitation2023k)}</strong></div>
          <div><span class="tt-k">YoY:</span> <strong style="color:${gColor}">${gArrow} ${fmtP(d.pctChange)}</strong></div>
          <div><span class="tt-k">Mkt share:</span> <strong>${fmtP(d.marketShare2024)}</strong></div>`;
      }
    },

    population: {
      label: "Population",
      overlayType: "none",
      desc: () => "State population by 2022 ACS — darker blue = more residents",
      choroplethFn: (state) => {
        const d = demogData()[state]?.["2022"];
        if (!d?.population) return null;
        const v = d.population;
        if (v > 25e6) return "#08306b"; if (v > 15e6) return "#08519c";
        if (v > 10e6) return "#2171b5"; if (v >  7e6) return "#4292c6";
        if (v >  4e6) return "#6baed6"; if (v >  2e6) return "#9ecae1";
        if (v >  1e6) return "#c6dbef"; return "#deebf7";
      },
      tooltipFn: (state) => {
        const d = demogData()[state]?.["2022"];
        if (!d) return null;
        const fmt = v => v >= 1e6 ? (v/1e6).toFixed(2)+"M" : (v/1e3).toFixed(0)+"K";
        return `<div class="tt-label">Population (2022 ACS)</div>
          <div><span class="tt-k">Total:</span> <strong>${d.population ? fmt(d.population) : "—"}</strong></div>
          <div><span class="tt-k">Median age:</span> <strong>${d.medianAge ? d.medianAge.toFixed(1)+" yrs" : "—"}</strong></div>`;
      }
    },

    gender: {
      label: "Gender",
      overlayType: "pie",
      bubbleField: "male", bubbleMin: 45, bubbleMax: 55,
      desc: () => "Gender split — blue = higher male %, pink = higher female % (2022 ACS)",
      choroplethFn: (state) => {
        const d = demogData()[state]?.["2022"];
        if (!d || typeof d.male !== "number") return null;
        const m = d.male;
        if (m > 51.5) return "#08519c"; if (m > 51.0) return "#2171b5";
        if (m > 50.5) return "#6baed6"; if (m > 50.0) return "#b0cfe8";
        if (m > 49.5) return "#f7b6d2"; if (m > 49.0) return "#f768a1";
        if (m > 48.5) return "#dd3497"; return "#ae017e";
      },
      tooltipFn: (state) => {
        const d = demogData()[state]?.["2022"];
        if (!d) return null;
        return `<div class="tt-label">Gender (2022 ACS)</div>
          <div><span class="tt-k">Male:</span> <strong>${d.male?.toFixed(1)}%</strong></div>
          <div><span class="tt-k">Female:</span> <strong>${d.female?.toFixed(1)}%</strong></div>`;
      }
    },

    race: {
      label: "Race",
      overlayType: "bar",
      barGroups: [
        {key:"white",label:"White",color:"#6baed6"},{key:"hispanic",label:"Hispanic",color:"#fd8d3c"},
        {key:"black",label:"Black",color:"#74c476"},{key:"asian",label:"Asian",color:"#9e9ac8"},
        {key:"nativeAmerican",label:"Native Am.",color:"#f768a1"},{key:"twoOrMore",label:"Two+",color:"#bdbdbd"}
      ],
      desc: () => "Racial diversity index — darker green = more diverse; bar charts show breakdown per state (2022 ACS)",
      choroplethFn: (state) => {
        const d = demogData()[state]?.["2022"];
        if (!d) return null;
        const ks = ["white","black","hispanic","asian","nativeAmerican","pacificIslander","twoOrMore"];
        const tot = ks.reduce((s,k)=>s+(d[k]||0),0);
        if (tot <= 0) return null;
        const hhi = ks.reduce((s,k)=>{const p=(d[k]||0)/tot;return s+p*p;},0);
        const div = 1 - hhi;
        if (div > 0.70) return "#1b4332"; if (div > 0.60) return "#2d6a4f";
        if (div > 0.50) return "#40916c"; if (div > 0.42) return "#52b788";
        if (div > 0.35) return "#74c69d"; if (div > 0.28) return "#95d5b2";
        if (div > 0.20) return "#b7e4c7"; return "#d8f3dc";
      },
      tooltipFn: (state) => {
        const d = demogData()[state]?.["2022"];
        if (!d) return null;
        const pct = v => typeof v==="number" ? v.toFixed(1)+"%" : "—";
        return `<div class="tt-label">Race & Ethnicity (2022 ACS)</div>
          <div><span class="tt-k">White:</span> <strong>${pct(d.white)}</strong></div>
          <div><span class="tt-k">Hispanic:</span> <strong>${pct(d.hispanic)}</strong></div>
          <div><span class="tt-k">Black:</span> <strong>${pct(d.black)}</strong></div>
          <div><span class="tt-k">Asian:</span> <strong>${pct(d.asian)}</strong></div>
          <div><span class="tt-k">Native Am.:</span> <strong>${pct(d.nativeAmerican)}</strong></div>
          <div><span class="tt-k">Two+:</span> <strong>${pct(d.twoOrMore)}</strong></div>`;
      }
    },

    economy: {
      label: "Economy",
      overlayType: "none",
      desc: () => "Dominant industry by employment — color = top sector per state (2022 Economic Census)",

      SECTOR_CHORO_COLORS: {
        "Accommodation & Food": "#c2410c",
        "Health Care":          "#0369a1",
        "Admin & Waste Mgmt":   "#6d28d9",
        "Other Services":       "#047857"
      },

      choroplethFn(state) {
        const d = econData()[state];
        if (!d || !d.dominantSector) return null;
        return this.SECTOR_CHORO_COLORS[d.dominantSector] || "#555";
      },

      tooltipFn(state) {
        const d = econData()[state];
        if (!d || !d.sectors) return null;

        const sectors = Object.values(d.sectors)
          .filter(s => s.employees > 0)
          .sort((a, b) => b.employees - a.employees);
        const maxEmp = sectors[0] ? sectors[0].employees : 1;
        const totalEmp = sectors.reduce((sum, x) => sum + x.employees, 0);
        const fmtN = function(v) {
          if (v >= 1e6) return (v/1e6).toFixed(1) + "M";
          if (v >= 1e3) return (v/1e3).toFixed(0) + "K";
          return String(v);
        };

        const top8 = sectors.slice(0, 8);
        const barH = 10, gap = 5, labelW = 108, barMaxW = 110, numW = 36;
        const chartH = top8.length * (barH + gap) - gap;
        const chartW = labelW + barMaxW + numW;

        const bars = top8.map(function(s, i) {
          const bw = Math.max(2, Math.round((s.employees / maxEmp) * barMaxW));
          const y = i * (barH + gap);
          const color = SECTOR_COLORS[s.label] || "#888";
          const isDom = s.label === d.dominantSector;
          const shortLabel = s.label.length > 16 ? s.label.slice(0, 15) + "…" : s.label;
          const textFill = isDom ? "#e8c36a" : "rgba(255,255,255,0.6)";
          const textWeight = isDom ? "700" : "400";
          const barOpacity = isDom ? "1" : "0.6";
          return [
            '<g>',
            '<text x="0" y="' + (y + barH - 1) + '" font-size="8" fill="' + textFill + '" font-weight="' + textWeight + '" font-family="DM Sans,sans-serif">' + shortLabel + '</text>',
            '<rect x="' + labelW + '" y="' + y + '" width="' + bw + '" height="' + barH + '" fill="' + color + '" opacity="' + barOpacity + '" rx="2"/>',
            '<text x="' + (labelW + bw + 4) + '" y="' + (y + barH - 1) + '" font-size="8" fill="rgba(255,255,255,0.45)" font-family="DM Sans,sans-serif">' + fmtN(s.employees) + '</text>',
            '</g>'
          ].join("");
        }).join("");

        const fM = function(v) { return v ? "$" + (v/1e9).toFixed(1) + "B" : "—"; };

        return '<div class="tt-label">Economy (2022 Census)</div>'
          + '<div style="margin-bottom:6px"><span class="tt-k">Top sector: </span>'
          + '<strong style="color:#e8c36a">' + d.dominantSector + '</strong></div>'
          + '<svg width="' + chartW + '" height="' + chartH + '" viewBox="0 0 ' + chartW + ' ' + chartH + '" style="display:block;margin-bottom:6px;overflow:visible">'
          + bars
          + '</svg>'
          + '<div style="display:flex;gap:12px;font-size:10px;color:rgba(255,255,255,0.4);border-top:1px solid rgba(255,255,255,0.08);padding-top:5px">'
          + '<span>Employees: <strong style="color:rgba(255,255,255,0.65)">' + fmtN(totalEmp) + '</strong></span>'
          + '<span>Revenue: <strong style="color:rgba(255,255,255,0.65)">' + fM(d.totalRevenue) + '</strong></span>'
          + '</div>';
      }
    }
  };

  window.DATASETS = DATASETS;
})();
