/* ==========================================================================
   App Module — Main application controller
   Manages navigation, data loading, and view orchestration
   ========================================================================== */

const App = {

  statesData: null,
  currentView: 'map',
  navigationStack: [{ view: 'map', label: '🏠 India' }],
  selectedState: null,
  selectedCity: null,

  /* ---- Initialization --------------------------------------------------- */

  async init() {
    window.appInstance = this;
    try {
      const response = await fetch('data/states.json');
      if (!response.ok) throw new Error('Failed to load states data');
      this.statesData = await response.json();
    } catch (e) {
      console.error('Error loading states data:', e);
      this.showToast('Failed to load map data. Please refresh.', 'error');
      /* Provide fallback minimal data so the map still renders */
      this.statesData = { states: [] };
    }

    /* Initialize the SVG map */
    IndiaMap.init((stateId) => this.onStateClick(stateId));
    
    /* Initialize Analysis View */
    if (typeof AnalysisView !== 'undefined') {
      AnalysisView.init();
    }

    /* Initial breadcrumb */
    this.updateBreadcrumb();

    /* Fade-in body after load */
    document.body.classList.add('loaded');
  },

  /* ---- View management -------------------------------------------------- */

  showView(viewId) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    const target = document.getElementById(viewId);
    if (target) {
      target.classList.add('active');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    this.currentView = viewId;
  },

  /* ---- State click handler ---------------------------------------------- */

  onStateClick(stateId) {
    const state = this.statesData.states.find(s => s.id === stateId);
    if (!state) {
      /* State exists on map but not in data — show a toast */
      const name = stateId.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      this.showToast(`${name} — data coming soon!`, 'error');
      return;
    }

    this.selectedState = state;
    this.navigationStack = [
      { view: 'map', label: '🏠 India' },
      { view: 'state', label: state.name }
    ];

    IndiaMap.highlightState(stateId);

    StateView.show(
      state,
      (cityName) => this.onCityClick(cityName),
      () => this.goToMap()
    );

    this.showView('state-view');
    this.updateBreadcrumb();
  },

  /* ---- City click handler ----------------------------------------------- */

  onCityClick(cityName) {
    if (!this.selectedState) return;

    const city = this.selectedState.cities.find(c => c.name === cityName);
    if (!city || !city.active) {
      this.showToast(`${cityName} predictions coming soon!`, 'error');
      return;
    }

    this.selectedCity = cityName;
    this.navigationStack = [
      { view: 'map', label: '🏠 India' },
      { view: 'state', label: this.selectedState.name },
      { view: 'prediction', label: cityName }
    ];

    PredictionForm.show(
      { name: cityName, stateName: this.selectedState.name },
      () => this.onStateClick(this.selectedState.id)
    );

    this.showView('prediction-view');
    this.updateBreadcrumb();
  },

  /* ---- Analysis view handler -------------------------------------------- */
  showAnalysisView() {
    // Append to existing stack if we're coming from a city/state, otherwise reset to map -> analysis
    if (this.currentView !== 'map' && this.currentView !== 'analysis-view') {
      this.navigationStack.push({ view: 'analysis', label: '📈 Market Analysis' });
    } else if (this.currentView === 'map') {
      this.navigationStack = [
        { view: 'map', label: '🏠 India' },
        { view: 'analysis', label: '📈 Market Analysis' }
      ];
    }
    
    AnalysisView.render();
    this.showView('analysis-view');
    this.updateBreadcrumb();
  },

  goBack() {
    if (this.navigationStack.length > 1) {
      // Pop current view
      this.navigationStack.pop();
      // Get previous view
      const prev = this.navigationStack[this.navigationStack.length - 1];
      
      if (prev.view === 'map') {
        this.goToMap();
      } else if (prev.view === 'state' && this.selectedState) {
        this.onStateClick(this.selectedState.id);
      } else if (prev.view === 'prediction' && this.selectedCity) {
        this.onCityClick(this.selectedCity);
      }
    } else {
      this.goToMap();
    }
  },

  /* ---- Navigation helpers ----------------------------------------------- */

  goToMap() {
    this.navigationStack = [{ view: 'map', label: '🏠 India' }];
    this.selectedState = null;
    this.selectedCity = null;
    this.showView('map-view');
    this.updateBreadcrumb();
    IndiaMap.resetHighlight();
  },

  /* ---- Breadcrumb -------------------------------------------------------- */

  updateBreadcrumb() {
    const nav = document.getElementById('nav-breadcrumb');
    if (!nav) return;

    nav.innerHTML = this.navigationStack.map((item, i) => {
      const isLast = i === this.navigationStack.length - 1;
      const separator = i > 0 ? '<span class="breadcrumb-separator">›</span>' : '';
      const className = isLast ? 'breadcrumb-item active' : 'breadcrumb-item';

      let onclick = '';
      if (!isLast) {
        if (item.view === 'map') {
          onclick = 'onclick="appInstance.goToMap()"';
        } else if (item.view === 'state' && this.selectedState) {
          onclick = `onclick="appInstance.onStateClick('${this.selectedState.id}')"`;
        } else if (item.view === 'prediction' && this.selectedCity) {
          onclick = `onclick="appInstance.onCityClick('${this.selectedCity}')"`;
        }
      }

      return `${separator}<span class="${className}" ${onclick}>${item.label}</span>`;
    }).join('');
  },

  /* ---- Toast notifications ---------------------------------------------- */

  showToast(message, type = 'info') {
    /* Remove any existing toast */
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    /* Trigger reflow for animation */
    toast.offsetHeight;

    /* Auto-remove after 3s */
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-20px)';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
};

/* ---- Bootstrap ---------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => App.init());
