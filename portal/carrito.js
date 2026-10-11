/* TuCosto - Carrito por usuario
 * Antes el carrito se guardaba con una sola llave para todo el navegador, asi que dos
 * cuentas que usaban el mismo equipo compartian el carrito. Ahora cada usuario tiene el suyo.
 */
var TCCart = (function () {
  var REF = 'cjimcldhoglgqachcimm';

  // Id del usuario con sesion iniciada (lo guarda Supabase en el navegador)
  function uid() {
    try {
      var raw = localStorage.getItem('sb-' + REF + '-auth-token');
      if (!raw) return null;
      var o = JSON.parse(raw);
      return (o && o.user && o.user.id) || (o && o.currentSession && o.currentSession.user && o.currentSession.user.id) || null;
    } catch (e) { return null; }
  }
  function key() { return 'farmasub_cart_' + (uid() || 'anon'); }

  function get() {
    try { var c = JSON.parse(localStorage.getItem(key()) || '[]'); return Array.isArray(c) ? c : []; }
    catch (e) { return []; }
  }
  function set(c) { try { localStorage.setItem(key(), JSON.stringify(c)); } catch (e) {} }
  function clear() { try { localStorage.removeItem(key()); } catch (e) {} }

  // El carrito antiguo compartido ya no se usa: se elimina para que no pase de una cuenta a otra
  try { localStorage.removeItem('farmasub_cart'); } catch (e) {}

  return { get: get, set: set, clear: clear };
})();
