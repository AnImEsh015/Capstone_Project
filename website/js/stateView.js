/* ==========================================================================
   StateView Module — Displays city cards for a selected state
   ========================================================================== */

const StateView = {

  _cityCallback: null,

  /**
   * Render the state view with city cards
   * @param {Object} stateData - { id, name, abbreviation, cities: [{name, active}] }
   * @param {Function} onCityClick - callback when an active city is clicked
   * @param {Function} onBack - callback to go back to map view
   */
  show(stateData, onCityClick, onBack) {
    this._cityCallback = onCityClick;
    this._onBack = onBack;

    const container = document.getElementById('state-view');
    
    // A clean SVG Map Pin to replace emojis
    const mapPinSvg = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="city-icon-svg">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
        <circle cx="12" cy="10" r="3"></circle>
      </svg>
    `;
    
    // A lock icon for coming soon
    const lockSvg = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="city-icon-svg">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
      </svg>
    `;

    const cityCards = stateData.cities.map((city, i) => {
      const activeClass = city.active ? 'active' : 'coming-soon';
      const icon = city.active ? mapPinSvg : lockSvg;
      const statusClass = city.active ? 'available' : '';
      const statusText = city.active ? 'Active Model' : 'In Development';
      const clickHandler = city.active
        ? `onclick="StateView._onCityClick('${city.name.replace(/'/g, "\\'")}')"` : '';
      const delay = Math.min(i + 1, 12);

      return `
        <div class="city-card ${activeClass} glass-card fade-in stagger-${delay}"
             ${clickHandler}
             data-city="${city.name}">
          <div class="city-icon-wrapper" style="margin-bottom:0.75rem; color: ${city.active ? 'var(--accent-primary)' : 'var(--text-muted)'};">${icon}</div>
          <div class="city-name">${city.name}</div>
          <div class="city-status ${statusClass}">
            ${statusText}
          </div>
          ${city.active ? '<div class="city-cta">Predict Prices &rarr;</div>' : ''}
        </div>`;
    }).join('');

    container.innerHTML = `
      <button class="btn btn-back fade-in" onclick="StateView._goBack()">
        &larr; Back to Map
      </button>

      <div class="hero-section">
        <h2 class="hero-title slide-up">${stateData.name}</h2>
        <p class="hero-subtitle fade-in stagger-1">
          Select a regional hub to initiate the predictive analytics model.
        </p>
      </div>

      <div class="city-grid fade-in stagger-2">
        ${cityCards}
      </div>

      ${stateData.cities.every(c => !c.active) ? `
        <div class="glass-card fade-in stagger-3" style="text-align:center; padding:2rem; margin-top:1.5rem;">
          <p style="font-size:1.1rem; opacity:0.7;">
            Predictive models for ${stateData.name} are currently in the training phase.
            <br>Please check back later or explore active regions.
          </p>
        </div>` : ''}
    `;
  },

  /**
   * Handle city card click — delegate to stored callback
   */
  _onCityClick(cityName) {
    if (this._cityCallback) this._cityCallback(cityName);
  },

  /**
   * Handle back button — delegate to stored callback
   */
  _goBack() {
    if (this._onBack) this._onBack();
  }
};
