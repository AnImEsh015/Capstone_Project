/* ==========================================================================
   AnalysisView Module — Market Analysis Dashboard
   ========================================================================== */

const AnalysisView = {
  container: null,
  charts: {},

  init() {
    this.container = document.getElementById('analysis-view');
    
    // Add event listener to the "Explore Market Analysis" button
    const btnOpenAnalysis = document.getElementById('btn-open-analysis');
    if (btnOpenAnalysis) {
      btnOpenAnalysis.addEventListener('click', () => {
        if (window.appInstance) {
          window.appInstance.showAnalysisView();
        }
      });
    }
  },

  async render() {
    this.container.innerHTML = `
      <button class="btn-back" onclick="appInstance.goBack()">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        Back
      </button>
      
      <div class="analysis-header" style="margin-bottom: 2rem;">
        <h2 style="font-family: var(--font-heading, Outfit); font-size: 2.2rem; color: var(--text-primary); margin-bottom: 0.5rem;">Market Analysis</h2>
        <p style="color: var(--text-secondary); max-width: 600px;">Explore data-driven insights from the Gurgaon real estate market.</p>
      </div>
      
      <div id="analysis-loading" style="text-align: center; padding: 3rem; color: var(--text-secondary);">
        Loading market data...
      </div>
      
      <div id="analysis-content" style="display: none;">
        <!-- KPIs -->
        <div class="kpi-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; margin-bottom: 2rem;">
          <div class="glass-card kpi-card" style="text-align: center;">
            <div style="font-size: 0.85rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 0.5rem;">Properties Analyzed</div>
            <div id="kpi-total" style="font-size: 2.5rem; font-weight: 700; color: var(--accent-primary);">--</div>
          </div>
          <div class="glass-card kpi-card" style="text-align: center;">
            <div style="font-size: 0.85rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 0.5rem;">Avg Market Price</div>
            <div id="kpi-price" style="font-size: 2.5rem; font-weight: 700; color: var(--accent-primary);">--</div>
            <div style="font-size: 0.8rem; color: var(--text-secondary);">Crores (Cr)</div>
          </div>
          <div class="glass-card kpi-card" style="text-align: center;">
            <div style="font-size: 0.85rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 0.5rem;">Avg Built-up Area</div>
            <div id="kpi-area" style="font-size: 2.5rem; font-weight: 700; color: var(--accent-primary);">--</div>
            <div style="font-size: 0.8rem; color: var(--text-secondary);">Sq. Ft.</div>
          </div>
        </div>
        
        <!-- Charts Grid -->
        <div class="charts-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 1.5rem;">
          
          <div class="glass-card chart-container" style="position: relative; height: 300px; padding: 1.5rem;">
            <h3 style="font-size: 1.1rem; margin-bottom: 1rem; color: var(--text-primary); font-weight: 600;">Top 10 Most Expensive Sectors</h3>
            <canvas id="chart-top-sectors"></canvas>
          </div>
          
          <div class="glass-card chart-container" style="position: relative; height: 300px; padding: 1.5rem;">
            <h3 style="font-size: 1.1rem; margin-bottom: 1rem; color: var(--text-primary); font-weight: 600;">Property Type Distribution</h3>
            <canvas id="chart-type-distribution"></canvas>
          </div>
          
          <div class="glass-card chart-container" style="position: relative; height: 350px; padding: 1.5rem; grid-column: 1 / -1;">
            <h3 style="font-size: 1.1rem; margin-bottom: 1rem; color: var(--text-primary); font-weight: 600;">Built-up Area vs Price</h3>
            <canvas id="chart-scatter-area"></canvas>
          </div>
          
        </div>
      </div>
    `;

    try {
      const response = await fetch('/api/analysis');
      const data = await response.json();
      
      if (data.success) {
        document.getElementById('analysis-loading').style.display = 'none';
        document.getElementById('analysis-content').style.display = 'block';
        
        this.populateKPIs(data.kpis);
        this.renderCharts(data);
      } else {
        throw new Error(data.error || 'Failed to load analysis data');
      }
    } catch (error) {
      console.error('Analysis error:', error);
      document.getElementById('analysis-loading').innerHTML = `
        <div style="color: var(--danger);">Error loading market data. Please try again later.</div>
      `;
    }
  },

  populateKPIs(kpis) {
    document.getElementById('kpi-total').textContent = kpis.total_properties.toLocaleString();
    document.getElementById('kpi-price').textContent = `₹${kpis.avg_price}`;
    document.getElementById('kpi-area').textContent = kpis.avg_area.toLocaleString();
  },

  renderCharts(data) {
    // Shared chart options for dark theme
    Chart.defaults.color = '#94a3b8'; // text-secondary
    Chart.defaults.borderColor = 'rgba(255,255,255,0.05)';
    Chart.defaults.font.family = 'Inter, sans-serif';

    // 1. Top Sectors Bar Chart
    const ctxBar = document.getElementById('chart-top-sectors').getContext('2d');
    if (this.charts.bar) this.charts.bar.destroy();
    this.charts.bar = new Chart(ctxBar, {
      type: 'bar',
      data: {
        labels: data.top_sectors.labels.map(l => l.replace('sector ', 'Sec ')),
        datasets: [{
          label: 'Avg Price (Cr)',
          data: data.top_sectors.values,
          backgroundColor: '#f59e0b', // accent-primary
          borderRadius: 4
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

    // 2. Property Type Doughnut Chart
    const ctxDoughnut = document.getElementById('chart-type-distribution').getContext('2d');
    if (this.charts.doughnut) this.charts.doughnut.destroy();
    this.charts.doughnut = new Chart(ctxDoughnut, {
      type: 'doughnut',
      data: {
        labels: data.type_distribution.labels,
        datasets: [{
          data: data.type_distribution.values,
          backgroundColor: ['#f59e0b', '#06b6d4'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        plugins: {
          legend: { position: 'bottom' }
        }
      }
    });

    // 3. Scatter Plot (Area vs Price)
    const ctxScatter = document.getElementById('chart-scatter-area').getContext('2d');
    if (this.charts.scatter) this.charts.scatter.destroy();
    this.charts.scatter = new Chart(ctxScatter, {
      type: 'scatter',
      data: {
        datasets: [{
          label: 'Properties',
          data: data.scatter_data,
          backgroundColor: 'rgba(6, 182, 212, 0.5)', // accent-secondary with opacity
          borderColor: '#06b6d4',
          pointRadius: 4,
          pointHoverRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (context) => {
                return `Area: ${context.raw.x} sqft | Price: ₹${context.raw.y} Cr`;
              }
            }
          }
        },
        scales: {
          x: {
            title: { display: true, text: 'Built-up Area (Sq. Ft.)' }
          },
          y: {
            title: { display: true, text: 'Price (Cr)' },
            beginAtZero: true
          }
        }
      }
    });
  }
};
