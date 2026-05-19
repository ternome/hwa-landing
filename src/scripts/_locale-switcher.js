(function () {
  var LOCALES = [
    { code: 'en',      label: 'EN',   name: 'English',    url: '/v8.html'          },
    { code: 'ru',      label: 'RU',   name: 'Русский',    url: '/v8.ru.html'       },
    { code: 'de',      label: 'DE',   name: 'Deutsch',    url: '/v8.de.html'       },
    { code: 'fr',      label: 'FR',   name: 'Français',   url: '/v8.fr.html'       },
    { code: 'es',      label: 'ES',   name: 'Español',    url: '/v8.es.html'       },
    { code: 'pt',      label: 'PT',   name: 'Português',  url: '/v8.pt.html'       },
    { code: 'it',      label: 'IT',   name: 'Italiano',   url: '/v8.it.html'       },
    { code: 'pl',      label: 'PL',   name: 'Polski',     url: '/v8.pl.html'       },
    { code: 'ja',      label: 'JA',   name: '日本語',      url: '/v8.ja.html'       },
    { code: 'ko',      label: 'KO',   name: '한국어',      url: '/v8.ko.html'       },
    { code: 'zh-Hans', label: 'ZH-S', name: '简体中文',    url: '/v8.zh-hans.html'  },
    { code: 'zh-Hant', label: 'ZH-T', name: '繁體中文',    url: '/v8.zh-hant.html'  },
  ];

  var container = document.getElementById('localeSwitcher');
  if (!container) return;

  var btn      = container.querySelector('.locale-switcher__btn');
  var labelEl  = container.querySelector('.locale-switcher__label');
  var dropdown = container.querySelector('.locale-switcher__dropdown');
  if (!btn || !labelEl || !dropdown) return;

  var currentCode = btn.dataset.locale || 'en';
  var current = LOCALES.find(function (l) { return l.code === currentCode; }) || LOCALES[0];

  labelEl.textContent = current.label;

  LOCALES.forEach(function (loc) {
    var li = document.createElement('li');
    li.className = 'locale-switcher__option' + (loc.code === current.code ? ' is-current' : '');
    li.setAttribute('role', 'option');
    li.setAttribute('aria-selected', loc.code === current.code ? 'true' : 'false');
    li.innerHTML =
      '<span class="locale-switcher__opt-code">' + loc.label + '</span>' +
      '<span class="locale-switcher__opt-name">' + loc.name + '</span>' +
      '<svg class="locale-switcher__opt-check" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="2,7 6,11 12,3"/></svg>';
    if (loc.code !== current.code) {
      li.addEventListener('click', function () { window.location.href = loc.url; });
    }
    dropdown.appendChild(li);
  });

  function open() {
    dropdown.classList.add('is-open');
    btn.setAttribute('aria-expanded', 'true');
  }
  function close() {
    dropdown.classList.remove('is-open');
    btn.setAttribute('aria-expanded', 'false');
  }

  btn.addEventListener('click', function (e) {
    e.stopPropagation();
    dropdown.classList.contains('is-open') ? close() : open();
  });

  document.addEventListener('click', function (e) {
    if (!container.contains(e.target)) close();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') close();
  });
})();
