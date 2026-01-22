(function() {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const navToggle = document.querySelector('.nav-toggle');
  const navList = document.getElementById('nav-list');
  if (navToggle && navList) {
    navToggle.addEventListener('click', () => {
      const isOpen = navList.classList.toggle('show');
      navToggle.setAttribute('aria-expanded', String(isOpen));
    });
    navList.querySelectorAll('a').forEach(a => a.addEventListener('click', () => navList.classList.remove('show')));
  }

  // Dark mode toggle switch
  const root = document.documentElement;
  const themeInput = document.getElementById('theme-toggle');
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme) root.setAttribute('data-theme', savedTheme);
  const initial = root.getAttribute('data-theme') || 'light';
  if (themeInput) themeInput.checked = initial === 'dark';
  if (themeInput) {
    themeInput.addEventListener('change', () => {
      const next = themeInput.checked ? 'dark' : 'light';
      root.setAttribute('data-theme', next);
      localStorage.setItem('theme', next);
    });
  }

  const progress = document.getElementById('progress');
  function updateProgress() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    if (progress) progress.style.width = pct + '%';
  }
  updateProgress();
  window.addEventListener('scroll', updateProgress, { passive: true });

  const backToTop = document.getElementById('backToTop');
  function toggleBackToTop() {
    const show = (window.pageYOffset || document.documentElement.scrollTop) > 300;
    if (backToTop) backToTop.classList.toggle('show', show);
  }
  toggleBackToTop();
  window.addEventListener('scroll', toggleBackToTop, { passive: true });
  if (backToTop) backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: prefersReduced ? 'auto' : 'smooth' }));

  const sections = Array.from(document.querySelectorAll('.section'));
  const links = Array.from(document.querySelectorAll('.nav-list a'));

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const sec = entry.target;
      if (entry.isIntersecting) {
        sec.classList.add('in-view');
        const reveals = sec.querySelectorAll('.reveal');
        reveals.forEach((el, idx) => {
          if (prefersReduced) {
            el.classList.add('revealed');
          } else {
            el.style.setProperty('--stagger', `${idx * 0.12}s`);
            el.classList.add('revealed');
          }
        });
      }
    });
  }, { rootMargin: '0px 0px -20% 0px', threshold: 0.15 });

  sections.forEach(sec => revealObserver.observe(sec));

  const navObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const id = entry.target.id;
      const link = links.find(a => a.getAttribute('href') === `#${id}`);
      if (link) {
        if (entry.isIntersecting) {
          links.forEach(a => a.classList.remove('active'));
          link.classList.add('active');
          history.replaceState(null, '', `#${id}`);
        }
      }
    });
  }, { rootMargin: '0px 0px -60% 0px', threshold: 0.4 });

  sections.forEach(sec => navObserver.observe(sec));
  
  // Contact Form Logic (Modified based on sample-frontend-mail.txt)
  const form = document.getElementById("contactForm");
  const statusEl = document.getElementById("status");

  function setStatus(msg, ok = true) {
    if (statusEl) {
      statusEl.textContent = msg;
      statusEl.style.color = ok ? "" : "salmon";
    }
  }

  function isEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      setStatus("");

      const payload = {
        name: form.name.value.trim(),
        email: form.email.value.trim(),
        subject: form.subject.value.trim(),
        message: form.message.value.trim()
      };

      if (!payload.name || !payload.email || !payload.subject || !payload.message) {
        return setStatus("Please fill in all fields.", false);
      }
      if (!isEmail(payload.email)) {
        return setStatus("Please enter a valid email address.", false);
      }

      try {
        setStatus("Sending...");
        const res = await fetch("/api/contact", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        const data = await res.json();

        if (!res.ok || !data.ok) {
          throw new Error(data?.error || "Failed to send.");
        }

        form.reset();
        setStatus("Message sent successfully ✅");
      } catch (err) {
  console.log("%c", "color:#008000; font-weight:700;", err);
  setStatus("Opening your email app…", false);
}
    });
  }
})();
