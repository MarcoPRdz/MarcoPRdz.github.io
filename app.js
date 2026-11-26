// Estado de la aplicación
let todosLosCantos = [];
let cantoActual = null;
let tamanoLetra = 20;

// Referencias al DOM
const listView = document.getElementById('listView');
const detailView = document.getElementById('detailView');
const songListEl = document.getElementById('songList');
const searchInput = document.getElementById('searchInput');
const themeToggle = document.getElementById('themeToggle');
const cantosDataEl = document.getElementById('cantos-data');

// Elementos de detalle
const detailType = document.getElementById('detailType');
const detailTitle = document.getElementById('detailTitle');
const videoWrapper = document.getElementById('videoWrapper');
const detailLyrics = document.getElementById('detailLyrics');

// Botones de acción
const backBtn = document.getElementById('backBtn');
const increaseFontBtn = document.getElementById('increaseFontBtn');
const decreaseFontBtn = document.getElementById('decreaseFontBtn');
const copyBtn = document.getElementById('copyBtn');
const lyricsOnlyBtn = document.getElementById('lyricsOnlyBtn');
const exitLyricsOnlyBtn = document.getElementById('exitLyricsOnlyBtn');

// 1. Leer cantos desde el JSON integrado en el HTML
function cargarCantos() {
  try {
    todosLosCantos = JSON.parse(cantosDataEl.textContent);
    renderizarLista(todosLosCantos);
  } catch (error) {
    console.error(error);
    songListEl.innerHTML = `
      <div class="status-msg">
        ⚠️ Error al leer los datos de cantos.<br>
        <small>Revisa que no falten comas o comillas en el bloque JSON.</small>
      </div>
    `;
  }
}

// 2. Renderizar tarjetas en la pantalla principal
function renderizarLista(cantos) {
  if (cantos.length === 0) {
    songListEl.innerHTML = '<div class="status-msg">No se encontraron cantos con esa búsqueda.</div>';
    return;
  }

  songListEl.innerHTML = '';
  cantos.forEach(canto => {
    const card = document.createElement('article');
    card.className = 'song-card';
    card.innerHTML = `
      <div class="song-info">
        <span class="song-badge">${escaparHTML(canto.tipo)}</span>
        <h2 class="song-title">${escaparHTML(canto.titulo)}</h2>
      </div>
      <button class="btn-primary" onclick="abrirCanto(${canto.id})">Ver letra</button>
    `;
    songListEl.appendChild(card);
  });
}

// 3. Filtrar por título, tipo o letra (ignorando tildes y mayúsculas)
function normalizarTexto(texto) {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

searchInput.addEventListener('input', e => {
  const termino = normalizarTexto(e.target.value.trim());
  if (!termino) {
    renderizarLista(todosLosCantos);
    return;
  }

  const filtrados = todosLosCantos.filter(canto => {
    const tituloNorm = normalizarTexto(canto.titulo);
    const letraNorm = normalizarTexto(canto.letra);
    const tipoNorm = normalizarTexto(canto.tipo);
    return (
      tituloNorm.includes(termino) ||
      letraNorm.includes(termino) ||
      tipoNorm.includes(termino)
    );
  });

  renderizarLista(filtrados);
});

// 4. Formatear letra para resaltar el CORO en negritas
function formatearLetra(letraCruda) {
  const bloques = letraCruda.split(/\n\s*\n/);
  return bloques
    .map(bloque => {
      const bloqueLimpio = escaparHTML(bloque.trim());
      if (/^(coro|estribillo)\b/i.test(bloqueLimpio)) {
        return `<span class="chorus-block">${bloqueLimpio}</span>`;
      }
      return `<span>${bloqueLimpio}</span>`;
    })
    .join('\n\n');
}

// 5. Abrir la vista de un canto específico
window.abrirCanto = function(id) {
  cantoActual = todosLosCantos.find(c => c.id === id);
  if (!cantoActual) return;

  detailType.textContent = cantoActual.tipo;
  detailTitle.textContent = cantoActual.titulo;
  detailLyrics.innerHTML = formatearLetra(cantoActual.letra);
  detailLyrics.style.fontSize = tamanoLetra + 'px';

  const ytId = cantoActual.youtubeId ? cantoActual.youtubeId.trim() : '';
  if (ytId) {
    videoWrapper.innerHTML = `
      <div class="video-container">
        <iframe 
          src="https://www.youtube.com/embed/${encodeURIComponent(ytId)}" 
          title="${escaparHTML(cantoActual.titulo)}"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
          allowfullscreen>
        </iframe>
      </div>
    `;
  } else {
    videoWrapper.innerHTML = '<div class="no-video-msg">Sin video agregado todavía</div>';
  }

  listView.style.display = 'none';
  detailView.classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

// 6. Volver a la lista (y detener el video de YouTube)
backBtn.addEventListener('click', () => {
  videoWrapper.innerHTML = '';
  detailView.classList.remove('active');
  listView.style.display = 'block';
  cantoActual = null;
});

// 7. Controles de tamaño de fuente (+ / -)
increaseFontBtn.addEventListener('click', () => {
  if (tamanoLetra < 42) {
    tamanoLetra += 2;
    detailLyrics.style.fontSize = tamanoLetra + 'px';
  }
});

decreaseFontBtn.addEventListener('click', () => {
  if (tamanoLetra > 14) {
    tamanoLetra -= 2;
    detailLyrics.style.fontSize = tamanoLetra + 'px';
  }
});

// 8. Copiar letra al portapapeles
copyBtn.addEventListener('click', async () => {
  if (!cantoActual) return;
  const textoACopiar = `${cantoActual.titulo} (${cantoActual.tipo})\n\n${cantoActual.letra}`;
  try {
    await navigator.clipboard.writeText(textoACopiar);
    const textoOriginal = copyBtn.textContent;
    copyBtn.textContent = '✅ ¡Copiada!';
    setTimeout(() => {
      copyBtn.textContent = textoOriginal;
    }, 2000);
  } catch (err) {
    alert('No se pudo copiar la letra automáticamente.');
  }
});

// 9. Modo "Solo letra"
lyricsOnlyBtn.addEventListener('click', () => {
  document.body.classList.add('lyrics-only-mode');
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

exitLyricsOnlyBtn.addEventListener('click', () => {
  document.body.classList.remove('lyrics-only-mode');
});

// 10. Modo Oscuro
function aplicarTemaGuardado() {
  const temaOscuro = localStorage.getItem('coroDarkMode') === 'true';
  if (temaOscuro) {
    document.body.classList.add('dark-mode');
    themeToggle.textContent = '☀️ Modo Claro';
  }
}

themeToggle.addEventListener('click', () => {
  const esOscuro = document.body.classList.toggle('dark-mode');
  localStorage.setItem('coroDarkMode', esOscuro);
  themeToggle.textContent = esOscuro ? '☀️ Modo Claro' : '🌙 Modo Oscuro';
});

function escaparHTML(texto) {
  const div = document.createElement('div');
  div.textContent = texto;
  return div.innerHTML;
}

aplicarTemaGuardado();
cargarCantos();