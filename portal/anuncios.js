/* TuCosto - Anuncios (carrusel + tarjeta de WhatsApp)
 * Uso:
 *   TCAnuncios.montarCarrusel(_db, 'contenedor-id');
 *   TCAnuncios.tarjetaWhatsappHtml('texto buscado opcional');
 */
var TCAnuncios = (function () {
  var WA_NUM = '593987373549';
  var cssListo = false;

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  // Solo se aceptan enlaces http(s); cualquier otra cosa (javascript:, data:) se descarta
  function urlSegura(u) {
    return (typeof u === 'string' && /^https?:\/\//i.test(u.trim())) ? u.trim() : null;
  }

  function waUrl(mensaje) {
    return 'https://wa.me/' + WA_NUM + '?text=' + encodeURIComponent(mensaje);
  }

  function hoyLocal() {
    var d = new Date();
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var dia = String(d.getDate()).padStart(2, '0');
    return d.getFullYear() + '-' + m + '-' + dia;
  }

  function inyectarCss() {
    if (cssListo) return;
    cssListo = true;
    var css = ''
      + '.tca{position:relative;margin-bottom:22px;border-radius:16px;overflow:hidden;background:#F3F4F6;box-shadow:0 2px 12px rgba(0,0,0,.08);}'
      + '.tca-track{display:flex;transition:transform .5s ease;will-change:transform;}'
      + '.tca-slide{flex:0 0 100%;display:block;aspect-ratio:16/5;position:relative;}'
      + '.tca-slide img{width:100%;height:100%;object-fit:cover;display:block;}'
      + '.tca-btn{position:absolute;top:50%;transform:translateY(-50%);width:34px;height:34px;border-radius:50%;border:none;background:rgba(255,255,255,.88);color:#1A1A2E;font-size:20px;line-height:1;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,.18);}'
      + '.tca-btn:hover{background:#fff;}'
      + '.tca-prev{left:10px;}.tca-next{right:10px;}'
      + '.tca-dots{position:absolute;left:0;right:0;bottom:8px;display:flex;justify-content:center;gap:6px;}'
      + '.tca-dot{width:8px;height:8px;border-radius:50%;border:none;padding:0;background:rgba(255,255,255,.55);cursor:pointer;box-shadow:0 0 0 1px rgba(0,0,0,.28);}'
      + '.tca-dot.on{background:#fff;width:20px;border-radius:8px;box-shadow:0 0 0 1px rgba(0,0,0,.45);}'
      + '@media(max-width:700px){.tca{border-radius:12px;margin-bottom:16px;}.tca-btn{display:none;}.tca-dots{bottom:5px;}}'
      + '.tca-wa{display:flex;align-items:center;gap:16px;background:#ECFDF5;border:1.5px solid #A7F3D0;border-radius:16px;padding:18px 20px;margin-top:28px;}'
      + '.tca-wa-ico{width:46px;height:46px;border-radius:50%;background:#25D366;display:flex;align-items:center;justify-content:center;flex-shrink:0;}'
      + '.tca-wa-txt{flex:1;min-width:0;}'
      + '.tca-wa-t{font-weight:700;font-size:.98rem;color:#065F46;margin-bottom:2px;}'
      + '.tca-wa-s{font-size:.84rem;color:#047857;line-height:1.45;}'
      + '.tca-wa-btn{box-sizing:border-box;background:#25D366;color:#fff;font-weight:600;font-size:.86rem;text-decoration:none;padding:11px 18px;border-radius:10px;white-space:nowrap;}'
      + '.tca-wa-btn:hover{background:#1EBE5A;}'
      + '@media(max-width:600px){.tca-wa{flex-direction:column;align-items:flex-start;text-align:left;}.tca-wa-btn{width:100%;text-align:center;}}';
    var st = document.createElement('style');
    st.textContent = css;
    document.head.appendChild(st);
  }

  function montarCarrusel(db, contenedorId) {
    var cont = document.getElementById(contenedorId);
    if (!cont) return Promise.resolve();
    inyectarCss();

    return db.from('anuncios')
      .select('id, titulo, imagen_url, enlace, orden, fecha_inicio, fecha_fin')
      .eq('activo', true)
      .order('orden', { ascending: true })
      .order('created_at', { ascending: false })
      .then(function (res) {
        if (res.error) { console.error('[TuCosto] Anuncios:', res.error); return; }
        var hoy = hoyLocal();
        var lista = (res.data || []).filter(function (a) {
          if (!urlSegura(a.imagen_url)) return false;
          if (a.fecha_inicio && a.fecha_inicio > hoy) return false;
          if (a.fecha_fin && a.fecha_fin < hoy) return false;
          return true;
        });
        if (!lista.length) { cont.innerHTML = ''; return; }
        pintar(cont, lista);
      })
      .catch(function (e) { console.error('[TuCosto] Anuncios:', e); });
  }

  function pintar(cont, lista) {
    var n = lista.length;
    var html = '<div class="tca" role="region" aria-roledescription="carrusel" aria-label="Anuncios">'
      + '<div class="tca-track" id="tca-track">';
    for (var i = 0; i < n; i++) {
      var a = lista[i];
      var img = '<img src="' + esc(urlSegura(a.imagen_url)) + '" alt="' + esc(a.titulo) + '"'
        + (i === 0 ? '' : ' loading="lazy"') + ' draggable="false"/>';
      var link = urlSegura(a.enlace);
      html += link
        ? '<a class="tca-slide" href="' + esc(link) + '" target="_blank" rel="noopener noreferrer">' + img + '</a>'
        : '<div class="tca-slide">' + img + '</div>';
    }
    html += '</div>';
    if (n > 1) {
      html += '<button class="tca-btn tca-prev" aria-label="Anterior">&#8249;</button>'
        + '<button class="tca-btn tca-next" aria-label="Siguiente">&#8250;</button>'
        + '<div class="tca-dots">';
      for (var d = 0; d < n; d++) {
        html += '<button class="tca-dot' + (d === 0 ? ' on' : '') + '" aria-label="Ir al anuncio ' + (d + 1) + '"></button>';
      }
      html += '</div>';
    }
    html += '</div>';
    cont.innerHTML = html;
    if (n < 2) return;

    var root = cont.querySelector('.tca');
    var track = root.querySelector('.tca-track');
    var dots = root.querySelectorAll('.tca-dot');
    var idx = 0, timer = null;
    var reducido = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function ir(i) {
      idx = (i + n) % n;
      track.style.transform = 'translateX(-' + (idx * 100) + '%)';
      for (var k = 0; k < dots.length; k++) { dots[k].classList.toggle('on', k === idx); }
    }
    function iniciar() { if (reducido || timer) return; timer = setInterval(function () { ir(idx + 1); }, 6000); }
    function parar() { if (timer) { clearInterval(timer); timer = null; } }

    root.querySelector('.tca-prev').addEventListener('click', function () { ir(idx - 1); parar(); iniciar(); });
    root.querySelector('.tca-next').addEventListener('click', function () { ir(idx + 1); parar(); iniciar(); });
    for (var j = 0; j < dots.length; j++) {
      (function (k) { dots[k].addEventListener('click', function () { ir(k); parar(); iniciar(); }); })(j);
    }

    root.addEventListener('mouseenter', parar);
    root.addEventListener('mouseleave', iniciar);
    document.addEventListener('visibilitychange', function () { if (document.hidden) { parar(); } else { iniciar(); } });

    var x0 = null;
    root.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; parar(); }, { passive: true });
    root.addEventListener('touchend', function (e) {
      if (x0 !== null) {
        var dx = e.changedTouches[0].clientX - x0;
        if (Math.abs(dx) > 40) { ir(dx < 0 ? idx + 1 : idx - 1); }
      }
      x0 = null; iniciar();
    }, { passive: true });

    iniciar();
  }

  function tarjetaWhatsappHtml(termino) {
    inyectarCss();
    var t = (termino || '').trim();
    var msg = t
      ? 'Hola TuCosto, no encontre este producto en el catalogo: ' + t + '. Pueden conseguirmelo?'
      : 'Hola TuCosto, no encontre un producto en el catalogo. Pueden conseguirmelo?';
    return '<div class="tca-wa">'
      + '<div class="tca-wa-ico"><svg width="26" height="26" viewBox="0 0 32 32"><path fill="#fff" d="M16.001 3.2c-7.06 0-12.8 5.74-12.8 12.8 0 2.259.594 4.46 1.723 6.4L3.2 28.8l6.573-1.706a12.74 12.74 0 0 0 6.228 1.606h.005c7.06 0 12.8-5.74 12.8-12.8s-5.741-12.8-12.805-12.8zm7.477 18.078c-.318.894-1.582 1.639-2.588 1.85-.688.144-1.588.259-4.617-.994-3.878-1.607-6.375-5.539-6.569-5.797-.187-.258-1.573-2.098-1.573-4.001s.994-2.845 1.346-3.235c.318-.352.694-.44.925-.44.232 0 .463.002.665.012.213.01.499-.081.78.596.288.694.978 2.398 1.064 2.573.087.176.145.383.029.617-.116.234-.174.383-.348.588-.174.204-.365.457-.522.614-.174.174-.355.363-.153.71.203.348.902 1.489 1.936 2.412 1.331 1.19 2.453 1.559 2.801 1.733.348.174.551.146.754-.087.203-.234.868-1.012 1.1-1.36.232-.348.465-.29.783-.174.318.116 2.02.953 2.367 1.127.348.174.58.26.667.406.087.146.087.844-.231 1.738z"/></svg></div>'
      + '<div class="tca-wa-txt">'
      + '<p class="tca-wa-t">&iquest;No encuentras el producto que buscas?</p>'
      + '<p class="tca-wa-s">Escr&iacute;benos por WhatsApp y nosotros lo conseguimos para ti.</p>'
      + '</div>'
      + '<a class="tca-wa-btn" href="' + esc(waUrl(msg)) + '" target="_blank" rel="noopener noreferrer">Pedirlo por WhatsApp</a>'
      + '</div>';
  }

  return { montarCarrusel: montarCarrusel, tarjetaWhatsappHtml: tarjetaWhatsappHtml, esc: esc };
})();
