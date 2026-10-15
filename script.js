// ===== Cabecera: fondo al hacer scroll =====
const header = document.getElementById("header");
const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 40);
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

// ===== Menú móvil =====
const navToggle = document.getElementById("navToggle");
const nav = document.getElementById("nav");

function setMenu(open) {
  nav.classList.toggle("is-open", open);
  navToggle.setAttribute("aria-expanded", open);
  navToggle.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
  document.body.style.overflow = open ? "hidden" : "";
}

navToggle.addEventListener("click", () => setMenu(!nav.classList.contains("is-open")));
nav.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => setMenu(false)));
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && nav.classList.contains("is-open")) {
    setMenu(false);
    navToggle.focus();
  }
});

// ===== Carta: pestañas =====
const tabs = [...document.querySelectorAll(".tab")];

function activateTab(tab) {
  tabs.forEach((t) => {
    const selected = t === tab;
    t.classList.toggle("is-active", selected);
    t.setAttribute("aria-selected", selected);
    t.tabIndex = selected ? 0 : -1;
    const panel = document.getElementById(t.getAttribute("aria-controls"));
    panel.hidden = !selected;
    panel.classList.toggle("is-active", selected);
  });
}

tabs.forEach((tab, i) => {
  tab.addEventListener("click", () => activateTab(tab));
  // Navegación con flechas del teclado
  tab.addEventListener("keydown", (e) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    const next = tabs[(i + (e.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length];
    next.focus();
    activateTab(next);
  });
});

// ===== Galería: lightbox =====
const lightbox = document.getElementById("lightbox");
const lightboxImg = document.getElementById("lightboxImg");

document.querySelectorAll(".gallery__item").forEach((item) => {
  item.addEventListener("click", () => {
    const img = item.querySelector("img");
    lightboxImg.src = img.src;
    lightboxImg.alt = img.alt;
    // showModal() mueve el foco dentro, cierra con Escape y lo devuelve al cerrar
    lightbox.showModal();
    document.body.style.overflow = "hidden";
  });
});

lightbox.addEventListener("click", (e) => {
  if (e.target !== lightboxImg) lightbox.close();
});
lightbox.addEventListener("close", () => {
  document.body.style.overflow = "";
});

// ===== Horario =====
// [inicio, fin] en minutos desde medianoche, por día (0 = domingo)
const horario = {
  0: [[780, 1020]],
  1: [],
  2: [[780, 960], [1200, 1410]],
  3: [[780, 960], [1200, 1410]],
  4: [[780, 960], [1200, 1410]],
  5: [[780, 990], [1200, 1470]],
  6: [[780, 990], [1200, 1470]],
};
const toMins = (hhmm) => { const [h, m] = hhmm.split(":").map(Number); return h * 60 + m; };

// ===== Reservas: formulario =====
const form = document.getElementById("bookingForm");
const fecha = document.getElementById("fecha");
const personas = document.getElementById("personas");
const success = document.getElementById("formSuccess");

// No permitir fechas pasadas
const toISO = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
fecha.min = toISO(new Date());

// Una hora es reservable si cae dentro de un turno de ese día y, si es hoy, aún no ha pasado
function horaDisponible(fechaISO, hhmm) {
  const mins = toMins(hhmm);
  const dia = new Date(fechaISO + "T12:00").getDay();
  if (!horario[dia].some(([ini, fin]) => mins >= ini && mins < fin)) return false;
  if (fechaISO === toISO(new Date())) {
    const now = new Date();
    return mins > now.getHours() * 60 + now.getMinutes();
  }
  return true;
}

// Desactivar las horas no disponibles al elegir fecha
function actualizarHoras() {
  [...form.hora.options].forEach((opt) => {
    if (opt.value) opt.disabled = Boolean(fecha.value) && !horaDisponible(fecha.value, opt.value);
  });
  if (form.hora.selectedOptions[0]?.disabled) form.hora.value = "";
}
fecha.addEventListener("change", actualizarHoras);

// Botones + / −
document.querySelectorAll(".stepper button").forEach((btn) => {
  btn.addEventListener("click", () => {
    const value = Number(personas.value) + Number(btn.dataset.step);
    personas.value = Math.min(Math.max(value, 1), 10);
  });
});

function setError(input, message) {
  input.classList.toggle("is-invalid", Boolean(message));
  input.closest(".form__row").querySelector(".form__error").textContent = message;
}

function validate() {
  let ok = true;
  const nombre = form.nombre;
  const hora = form.hora;

  if (nombre.value.trim().length < 2) { setError(nombre, "Escribe tu nombre."); ok = false; }
  else setError(nombre, "");

  if (!fecha.value) { setError(fecha, "Elige una fecha."); ok = false; }
  else if (fecha.value < fecha.min) { setError(fecha, "La fecha no puede ser pasada."); ok = false; }
  else if (new Date(fecha.value + "T12:00").getDay() === 1) { setError(fecha, "Los lunes cerramos."); ok = false; }
  else setError(fecha, "");

  if (!hora.value) { setError(hora, "Elige una hora."); ok = false; }
  else if (fecha.value && !horaDisponible(fecha.value, hora.value)) { setError(hora, "Esa hora no está disponible."); ok = false; }
  else setError(hora, "");

  const n = Number(personas.value);
  if (!Number.isInteger(n) || n < 1 || n > 10) { setError(personas, "Entre 1 y 10 personas."); ok = false; }
  else setError(personas, "");

  return ok;
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  success.hidden = true;
  if (!validate()) return;

  const fechaTexto = new Date(fecha.value + "T12:00").toLocaleDateString("es-ES", {
    weekday: "long", day: "numeric", month: "long",
  });
  const n = Number(personas.value);
  success.textContent = `¡Gracias, ${form.nombre.value.trim()}! Tu mesa para ${n} ${n === 1 ? "persona" : "personas"} el ${fechaTexto} a las ${form.hora.value} está reservada. (Demo: no se ha enviado ninguna reserva real.)`;
  success.hidden = false;
  form.reset();
  personas.value = 2;
  actualizarHoras();
});

// ===== Horario: ¿abierto ahora? =====
function updateOpenStatus() {
  const status = document.getElementById("openStatus");
  const now = new Date();
  const mins = now.getHours() * 60 + now.getMinutes();
  // Los turnos que pasan de medianoche (viernes/sábado) siguen abiertos de madrugada
  const ayer = horario[(now.getDay() + 6) % 7].some(([, fin]) => fin > 1440 && mins < fin - 1440);
  const open = ayer || horario[now.getDay()].some(([ini, fin]) => mins >= ini && mins < fin);
  status.textContent = open ? "Abierto ahora" : "Cerrado ahora";
  status.className = "open-status " + (open ? "is-open" : "is-closed");
}
updateOpenStatus();
setInterval(updateOpenStatus, 60000);

// ===== Animación de aparición =====
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });
document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));

// ===== Año en el pie =====
document.getElementById("year").textContent = new Date().getFullYear();
