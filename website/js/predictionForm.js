/* ==========================================================================
   PredictionForm Module — 12-feature ML form + simulated prediction + recommender
   ========================================================================== */

const PredictionForm = {

  /* ---- Form state ------------------------------------------------------- */
  formData: {
    property_type: 'flat',
    sector: '',
    bedRoom: 2,
    bathroom: 2,
    balcony: '1',
    agePossession: 'New Property',
    built_up_area: 1200,
    servant_room: 0,
    store_room: 0,
    furnishing_type: '1',       // 0=Unfurnished, 1=Semi, 2=Furnished
    luxury_category: 'Medium',
    floor_category: 'Mid floor'
  },

  sectors: [],
  features: null,
  _onBack: null,

  /* ---- Hardcoded recommender data --------------------------------------- */
  recommendedProperties: [
    {
      name: 'DLF The Camellias',
      location: 'Sector 42, Gurgaon',
      price: '₹7 — 15 Cr',
      tags: ['Swimming Pool', 'Club House', 'Gym', 'Concierge', 'Golf Course'],
      match: 94
    },
    {
      name: 'Smartworld One DXP',
      location: 'Sector 113, Gurgaon',
      price: '₹2 — 4.5 Cr',
      tags: ['Swimming Pool', 'Salon', 'Restaurant', 'Spa', '24×7 Security'],
      match: 87
    },
    {
      name: 'M3M Crown',
      location: 'Sector 111, Gurgaon',
      price: '₹2.2 — 3.7 Cr',
      tags: ['Mini Theatre', 'Garden', 'Swimming Pool', 'Golf Course', 'Barbecue'],
      match: 85
    },
    {
      name: 'Sobha City',
      location: 'Sector 108, Gurgaon',
      price: '₹1.5 — 6 Cr',
      tags: ['Swimming Pool', 'Volleyball', 'Aerobics', 'Steam Room', 'Skating'],
      match: 82
    },
    {
      name: 'Adani Samsara Vilasa',
      location: 'Sector 63, Gurgaon',
      price: '₹2.4 — 22.5 Cr',
      tags: ['Terrace Garden', 'Amphitheatre', 'Basketball', 'Yoga', 'Indoor Games'],
      match: 79
    },
    {
      name: 'Godrej Aria',
      location: 'Sector 79, Gurgaon',
      price: '₹1.5 — 3.5 Cr',
      tags: ['Clubhouse', 'Jogging Track', 'Landscape Garden', 'Kids Play', 'Power Backup'],
      match: 76
    }
  ],

  /* ---- Public API ------------------------------------------------------- */

  async show(cityData, onBack) {
    this._onBack = onBack;
    this.formData.sector = '';

    /* Load sector data */
    try {
      const res = await fetch('data/gurgaon_sectors.json');
      const json = await res.json();
      this.sectors = json.sectors || [];
      this.features = json.features || {};
    } catch (e) {
      this.sectors = Array.from({ length: 104 }, (_, i) => 'Sector ' + (i + 1));
      this.features = {};
    }

    if (this.sectors.length > 0 && !this.formData.sector) {
      this.formData.sector = this.sectors[0];
    }

    this._render(cityData);
  },

  updateField(field, value) {
    this.formData[field] = value;
    this._updateUIState(field, value);
  },

  async predict() {
    const resultArea = document.getElementById('prediction-result');
    if (!resultArea) return;

    /* Show spinner */
    resultArea.innerHTML = `
      <div class="glass-card" style="text-align:center; padding:3rem;">
        <div class="spinner"></div>
        <p style="margin-top:1rem; opacity:0.7;">Analyzing market data via ML Model…</p>
      </div>`;
    resultArea.style.display = 'block';

    try {
      const response = await fetch('/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.formData)
      });
      
      if (!response.ok) throw new Error('Prediction API failed');
      const data = await response.json();
      
      this._renderResult(data.price);
      
      /* Fetch recommendations */
      try {
        const recResponse = await fetch('/api/recommend', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sector: this.formData.sector })
        });
        if (recResponse.ok) {
          const recData = await recResponse.json();
          if (recData.recommendations && recData.recommendations.length > 0) {
            this.recommendedProperties = recData.recommendations;
          }
        }
      } catch (recErr) {
        console.warn('Recommender API fallback to default recommendations', recErr);
      }
      
      this._renderRecommender();
    } catch (err) {
      console.warn('API error, falling back to simulated price', err);
      const price = this._simulatePrice();
      this._renderResult(price);
      this._renderRecommender();
    }

    /* Smooth scroll to result */
    resultArea.scrollIntoView({ behavior: 'smooth', block: 'start' });
  },

  /* ---- Private: Render form --------------------------------------------- */

  _render(cityData) {
    const container = document.getElementById('prediction-view');

    container.innerHTML = `
      <button class="btn btn-back fade-in" onclick="PredictionForm._goBack()">
        ← Back to ${cityData.stateName || 'State'}
      </button>

      <div class="hero-section">
        <h2 class="hero-title slide-up">${cityData.name}</h2>
        <p class="hero-subtitle fade-in stagger-1">Configure property details for ML-powered price prediction</p>
        <button class="btn btn-secondary fade-in stagger-1" onclick="appInstance.showAnalysisView()" style="margin-top: 1.5rem;">
          Explore Market Analysis
        </button>
      </div>

      <!-- Section 1: Property Basics -->
      <div class="form-section glass-card fade-in stagger-2">
        <div class="form-section-title">Property Basics</div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Property Type</label>
            <div class="btn-group" id="grp-property-type">
              <button class="btn btn-toggle ${this.formData.property_type === 'flat' ? 'selected' : ''}"
                      onclick="PredictionForm.updateField('property_type','flat')">
                Flat
              </button>
              <button class="btn btn-toggle ${this.formData.property_type === 'house' ? 'selected' : ''}"
                      onclick="PredictionForm.updateField('property_type','house')">
                House
              </button>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="sector-select">Sector / Locality</label>
            <div style="position:relative;">
              <input type="text" class="form-input" id="sector-search"
                     placeholder="Search sector…"
                     oninput="PredictionForm._filterSectors(this.value)"
                     onfocus="PredictionForm._showSectorDropdown()"
                     autocomplete="off" />
              <div id="sector-dropdown" class="sector-dropdown" style="display:none;"></div>
            </div>
            <div class="form-hint">Selected: <strong id="sector-display">${this.formData.sector || 'None'}</strong></div>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label" for="built-up-area">Built-up Area (sq.ft.)</label>
            <input type="number" class="form-input" id="built-up-area"
                   min="300" max="10000" step="50"
                   value="${this.formData.built_up_area}"
                   onchange="PredictionForm.updateField('built_up_area', parseInt(this.value))" />
            <div class="form-hint">Range: 300 — 10,000 sq.ft.</div>
          </div>

          <div class="form-group">
            <label class="form-label" for="age-select">Age / Possession</label>
            <select class="form-select" id="age-select"
                    onchange="PredictionForm.updateField('agePossession', this.value)">
              ${['New Property', 'Relatively New', 'Moderately Old', 'Old Property', 'Under Construction'].map(opt =>
                `<option value="${opt}" ${this.formData.agePossession === opt ? 'selected' : ''}>${opt}</option>`
              ).join('')}
            </select>
          </div>
        </div>
      </div>

      <!-- Section 2: Room Configuration -->
      <div class="form-section glass-card fade-in stagger-3">
        <div class="form-section-title">Room Configuration</div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Bedrooms</label>
            <div class="btn-group" id="grp-bedrooms">
              ${[1,2,3,4,5,6,7,8,9].map(n => `
                <button class="btn btn-toggle ${this.formData.bedRoom === n ? 'selected' : ''}"
                        onclick="PredictionForm.updateField('bedRoom',${n})">${n}</button>`).join('')}
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Bathrooms</label>
            <div class="btn-group" id="grp-bathrooms">
              ${[1,2,3,4,5,6,7,8,9,10].map(n => `
                <button class="btn btn-toggle ${this.formData.bathroom === n ? 'selected' : ''}"
                        onclick="PredictionForm.updateField('bathroom',${n})">${n}</button>`).join('')}
            </div>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Balconies</label>
            <div class="btn-group" id="grp-balcony">
              ${['0','1','2','3','3+'].map(v => `
                <button class="btn btn-toggle ${this.formData.balcony === v ? 'selected' : ''}"
                        onclick="PredictionForm.updateField('balcony','${v}')">${v}</button>`).join('')}
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Additional Rooms</label>
            <div style="display:flex; gap:1.5rem; flex-wrap:wrap;">
              <label class="toggle-label">
                <span>Servant Room</span>
                <label class="toggle-switch">
                  <input type="checkbox" id="servant-room-toggle"
                         ${this.formData.servant_room ? 'checked' : ''}
                         onchange="PredictionForm.updateField('servant_room', this.checked ? 1 : 0)" />
                  <span class="toggle-slider"></span>
                </label>
              </label>
              <label class="toggle-label">
                <span>Store Room</span>
                <label class="toggle-switch">
                  <input type="checkbox" id="store-room-toggle"
                         ${this.formData.store_room ? 'checked' : ''}
                         onchange="PredictionForm.updateField('store_room', this.checked ? 1 : 0)" />
                  <span class="toggle-slider"></span>
                </label>
              </label>
            </div>
          </div>
        </div>
      </div>

      <!-- Section 3: Property Features -->
      <div class="form-section glass-card fade-in stagger-4">
        <div class="form-section-title">Property Features</div>

        <div class="form-group">
          <label class="form-label">Furnishing</label>
          <div class="btn-group" id="grp-furnishing">
            ${[
              { value: '0', label: 'Unfurnished', icon: '' },
              { value: '1', label: 'Semi-Furnished', icon: '' },
              { value: '2', label: 'Furnished', icon: '' }
            ].map(opt => `
              <button class="btn btn-toggle ${this.formData.furnishing_type === opt.value ? 'selected' : ''}"
                      onclick="PredictionForm.updateField('furnishing_type','${opt.value}')">
                ${opt.label}
              </button>`).join('')}
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Luxury Category</label>
            <div class="btn-group" id="grp-luxury">
              ${['Low', 'Medium', 'High'].map(v => `
                <button class="btn btn-toggle ${this.formData.luxury_category === v ? 'selected' : ''}"
                        onclick="PredictionForm.updateField('luxury_category','${v}')">
                  ${v}
                </button>`).join('')}
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Floor Category</label>
            <div class="btn-group" id="grp-floor">
              ${['Low floor', 'Mid floor', 'High floor'].map(v => `
                <button class="btn btn-toggle ${this.formData.floor_category === v ? 'selected' : ''}"
                        onclick="PredictionForm.updateField('floor_category','${v}')">
                  ${v}
                </button>`).join('')}
            </div>
          </div>
        </div>
      </div>

      <!-- Predict Button -->
      <div class="fade-in stagger-5" style="text-align:center; margin:2rem 0;">
        <button class="btn btn-primary" id="predict-btn" onclick="PredictionForm.predict()"
                style="padding:1rem 3rem; font-size:1.1rem;">
          Predict Price
        </button>
      </div>

      <!-- Result Area (hidden until prediction) -->
      <div id="prediction-result" style="display:none;"></div>

      <!-- Recommender Area (hidden until prediction) -->
      <div id="recommender-area" style="display:none;"></div>
    `;

    /* Close sector dropdown on outside click */
    document.addEventListener('click', (e) => {
      const dd = document.getElementById('sector-dropdown');
      const search = document.getElementById('sector-search');
      if (dd && search && !dd.contains(e.target) && e.target !== search) {
        dd.style.display = 'none';
      }
    });
  },

  /* ---- Private: UI state updates ---------------------------------------- */

  _updateUIState(field, value) {
    /* Toggle button groups — deselect siblings, select current */
    const groupMap = {
      property_type: 'grp-property-type',
      bedRoom: 'grp-bedrooms',
      bathroom: 'grp-bathrooms',
      balcony: 'grp-balcony',
      furnishing_type: 'grp-furnishing',
      luxury_category: 'grp-luxury',
      floor_category: 'grp-floor'
    };

    const groupId = groupMap[field];
    if (groupId) {
      const grp = document.getElementById(groupId);
      if (grp) {
        grp.querySelectorAll('.btn-toggle').forEach(btn => btn.classList.remove('selected'));
        /* Find matching button by checking onclick attribute */
        grp.querySelectorAll('.btn-toggle').forEach(btn => {
          const onclick = btn.getAttribute('onclick') || '';
          if (typeof value === 'string') {
            if (onclick.includes(`'${value}'`) || onclick.includes(`"${value}"`)) {
              btn.classList.add('selected');
            }
          } else {
            if (onclick.includes(`,${value})`) || onclick.includes(`, ${value})`)) {
              btn.classList.add('selected');
            }
          }
        });
      }
    }
  },

  /* ---- Private: Sector search dropdown ---------------------------------- */

  _showSectorDropdown() {
    this._filterSectors(document.getElementById('sector-search')?.value || '');
  },

  _filterSectors(query) {
    const dd = document.getElementById('sector-dropdown');
    if (!dd) return;

    const filtered = this.sectors
      .filter(s => s.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 20);

    if (filtered.length === 0) {
      dd.innerHTML = '<div class="sector-item" style="opacity:0.5;">No matches found</div>';
    } else {
      dd.innerHTML = filtered.map(s =>
        `<div class="sector-item" onclick="PredictionForm._selectSector('${s.replace(/'/g, "\\'")}')">${s}</div>`
      ).join('');
    }
    dd.style.display = 'block';
  },

  _selectSector(sector) {
    this.formData.sector = sector;
    const search = document.getElementById('sector-search');
    const display = document.getElementById('sector-display');
    const dd = document.getElementById('sector-dropdown');
    if (search) search.value = sector;
    if (display) display.textContent = sector;
    if (dd) dd.style.display = 'none';
  },

  /* ---- Private: Simulated price calculation ----------------------------- */

  _simulatePrice() {
    let base = this.formData.built_up_area * 0.004; /* Crores */

    /* Property type multiplier */
    if (this.formData.property_type === 'house') base *= 1.3;

    /* Luxury multiplier */
    if (this.formData.luxury_category === 'High') base *= 1.5;
    else if (this.formData.luxury_category === 'Medium') base *= 1.2;

    /* Furnishing multiplier */
    if (this.formData.furnishing_type === '2') base *= 1.2;
    else if (this.formData.furnishing_type === '1') base *= 1.1;

    /* Floor multiplier */
    if (this.formData.floor_category === 'High floor') base *= 1.1;

    /* Age multiplier */
    const ageMap = {
      'New Property': 1.15,
      'Ready to move': 1.0,
      'Relatively New': 1.05,
      'Under Construction': 0.9,
      'Old Property': 0.8
    };
    base *= (ageMap[this.formData.agePossession] || 1.0);

    /* Bedroom bonus */
    base *= (1 + (this.formData.bedRoom - 2) * 0.08);

    /* Servant/store room bonus */
    if (this.formData.servant_room) base *= 1.05;
    if (this.formData.store_room) base *= 1.03;

    /* Random ±10% variation */
    const variation = 0.9 + Math.random() * 0.2;
    base *= variation;

    /* Clamp */
    return Math.max(0.2, Math.min(50, base));
  },

  /* ---- Private: Render result panel ------------------------------------- */

  _renderResult(price) {
    const resultArea = document.getElementById('prediction-result');
    if (!resultArea) return;

    const formattedPrice = price.toFixed(2);
    const priceRange = {
      low: (price * 0.88).toFixed(2),
      high: (price * 1.12).toFixed(2)
    };

    const furnishLabels = { '0': 'Unfurnished', '1': 'Semi-Furnished', '2': 'Furnished' };

    resultArea.style.display = 'block';
    resultArea.innerHTML = `
      <div class="result-panel glass-card fade-in">
        <div class="price-label">Estimated Property Price</div>
        <div class="price-display">
          <span id="animated-price">₹ 0.00</span>
          <span class="price-unit">Cr</span>
        </div>
        <div class="form-hint" style="text-align:center; margin-top:0.5rem;">
          Expected Range: ₹ ${priceRange.low} Cr — ₹ ${priceRange.high} Cr
        </div>

        <div class="result-details">
          <div class="result-detail-item glass-card">
            <div class="result-detail-value">${this.formData.built_up_area.toLocaleString()}</div>
            <div class="result-detail-label">Sq.Ft. Area</div>
          </div>
          <div class="result-detail-item glass-card">
            <div class="result-detail-value">${this.formData.bedRoom} BHK</div>
            <div class="result-detail-label">Bedrooms</div>
          </div>
          <div class="result-detail-item glass-card">
            <div class="result-detail-value">${this.formData.property_type === 'flat' ? 'Flat' : 'House'}</div>
            <div class="result-detail-label">Property Type</div>
          </div>
          <div class="result-detail-item glass-card">
            <div class="result-detail-value">${this.formData.sector || 'N/A'}</div>
            <div class="result-detail-label">Location</div>
          </div>
          <div class="result-detail-item glass-card">
            <div class="result-detail-value">${this.formData.bathroom}</div>
            <div class="result-detail-label">Bathrooms</div>
          </div>
          <div class="result-detail-item glass-card">
            <div class="result-detail-value">${furnishLabels[this.formData.furnishing_type]}</div>
            <div class="result-detail-label">Furnishing</div>
          </div>
        </div>

        <p class="form-hint" style="text-align:center; margin-top:1.5rem;">
          Note: This is an estimated price based on market analysis. Actual prices may vary based on
          specific property conditions, negotiations, and market fluctuations.
        </p>
      </div>
    `;

    /* Animated counter */
    this._animateCounter('animated-price', 0, price, 1200);
  },

  /* ---- Private: Animated counter ---------------------------------------- */

  _animateCounter(elementId, start, end, duration) {
    const el = document.getElementById(elementId);
    if (!el) return;

    const startTime = performance.now();
    const tick = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      /* Ease out cubic */
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = start + (end - start) * eased;
      el.textContent = '₹ ' + current.toFixed(2);
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  },

  /* ---- Private: Render recommender -------------------------------------- */

  _renderRecommender() {
    const area = document.getElementById('recommender-area');
    if (!area) return;

    area.style.display = 'block';
    area.innerHTML = `
      <div class="recommender-section fade-in">
        <div class="recommender-section-title">Similar Properties You May Like</div>
        <div class="recommender-grid">
          ${this.recommendedProperties.map((prop, i) => `
            <div class="recommender-card glass-card fade-in stagger-${i + 1}">
              <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:0.75rem;">
                <div>
                  <div class="property-name">${prop.name}</div>
                  <div class="property-location">${prop.location}</div>
                </div>
                <span class="similarity-badge">${prop.match}% Match</span>
              </div>
              <div class="property-price">${prop.price}</div>
              <div class="tags-container">
                ${prop.tags.map(t => `<span class="tag">${t}</span>`).join('')}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },

  /* ---- Private: Navigation ---------------------------------------------- */

  _goBack() {
    if (this._onBack) this._onBack();
  }
};
