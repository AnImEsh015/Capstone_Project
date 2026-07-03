import urllib.request
import xml.etree.ElementTree as ET
import json

url = 'https://code.highcharts.com/mapdata/countries/in/custom/in-all-disputed.svg'
print(f"Downloading Highcharts India SVG from {url}...")

req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
response = urllib.request.urlopen(req, timeout=10)
svg_data = response.read().decode('utf-8')

print(f"Downloaded {len(svg_data)} bytes. Parsing XML...")

root = ET.fromstring(svg_data)
ns = {'svg': 'http://www.w3.org/2000/svg'}
paths = root.findall('.//svg:path', ns)
if not paths:
    paths = root.findall('.//path')

map_paths = {}
name_overrides = {
    'andaman and nicobar': 'andaman-nicobar',
    'dadra and nagar haveli': 'dadra-nagar-haveli',
    'jammu and kashmir': 'jammu-kashmir',
    'daman and diu': 'dadra-nagar-haveli', 
    'odisha': 'odisha',
    'orissa': 'odisha',
    'uttaranchal': 'uttarakhand',
    'nct of delhi': 'delhi'
}

for p in paths:
    state_id_raw = p.get('name') or p.get('id')
    if not state_id_raw or state_id_raw.lower() == 'none':
        state_id_raw = p.get('id')
    if not state_id_raw or state_id_raw.lower() == 'none':
        continue
        
    d = p.get('d')
    if not d:
        continue
        
    normalized = state_id_raw.lower().replace(' ', '-')
    normalized = name_overrides.get(normalized.replace('-', ' '), normalized)
    
    map_paths[normalized] = d

print(f"Extracted {len(map_paths)} state paths. Generating indiaMap.js...")

js_content = f"""/* ==========================================================================
   IndiaMap Module — Interactive SVG Map of India (High-Accuracy Geographic)
   ========================================================================== */

const IndiaMap = {{
  _onStateClick: null,
  
  // High-accuracy SVG path data
  mapPaths: {json.dumps(map_paths, indent=4)},

  init(onStateClick) {{
    this._onStateClick = onStateClick;
    this.render();
  }},

  render() {{
    const container = document.getElementById('india-map-container');
    
    let pathsHtml = '';
    for (const [stateId, pathData] of Object.entries(this.mapPaths)) {{
      pathsHtml += `
        <path d="${{pathData}}" 
              class="state-path" 
              data-state-id="${{stateId}}" 
              id="path-${{stateId}}">
        </path>
      `;
    }}

    container.innerHTML = `
      <svg class="india-svg" viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMid meet">
        <g class="map-group">
          ${{pathsHtml}}
        </g>
      </svg>
    `;

    // Dynamically calculate the bounding box to perfectly frame the map
    setTimeout(() => {{
      const svg = container.querySelector('svg');
      const group = container.querySelector('.map-group');
      if (group && group.getBBox) {{
        const bbox = group.getBBox();
        // Add a 5% padding around the map
        const paddingX = bbox.width * 0.05;
        const paddingY = bbox.height * 0.05;
        svg.setAttribute('viewBox', `${{bbox.x - paddingX}} ${{bbox.y - paddingY}} ${{bbox.width + paddingX * 2}} ${{bbox.height + paddingY * 2}}`);
      }}
    }}, 100);

    this._attachEvents();
  }},

  _attachEvents() {{
    const paths = document.querySelectorAll('.state-path');
    const tooltip = document.getElementById('map-tooltip');

    paths.forEach(path => {{
      path.addEventListener('mouseenter', (e) => {{
        const stateId = e.target.getAttribute('data-state-id');
        this._showTooltip(e, stateId, tooltip);
        e.target.style.fill = 'var(--accent-primary)';
      }});

      path.addEventListener('mousemove', (e) => {{
        tooltip.style.left = (e.pageX + 15) + 'px';
        tooltip.style.top = (e.pageY + 15) + 'px';
      }});

      path.addEventListener('mouseleave', (e) => {{
        tooltip.classList.remove('visible');
        e.target.style.fill = '';
      }});

      path.addEventListener('click', (e) => {{
        const stateId = e.target.getAttribute('data-state-id');
        if (this._onStateClick) this._onStateClick(stateId);
      }});
    }});
  }},

  _showTooltip(e, stateId, tooltip) {{
    const stateName = stateId.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    tooltip.innerHTML = `
      <div style="font-weight:600; margin-bottom:4px">${{stateName}}</div>
      <div style="font-size:0.8rem; color:var(--text-secondary)">Click to explore regional properties</div>
    `;
    tooltip.style.left = (e.pageX + 15) + 'px';
    tooltip.style.top = (e.pageY + 15) + 'px';
    tooltip.classList.add('visible');
  }}
}};
"""

with open('website/js/indiaMap.js', 'w') as f:
    f.write(js_content)
    
print("Successfully generated website/js/indiaMap.js!")
