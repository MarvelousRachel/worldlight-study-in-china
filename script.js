(() => {
  const $ = (sel) => document.querySelector(sel);

  const BUSINESS = {
    whatsappE164: "8617888227482",
    email: "infoatworldlightltd@gmail.com",
  };

  const buildLeadText = (payload) => {
    const lines = [
      "WORLDLIGHT — New Student Application",
      "",
      `Full name: ${payload.fullName || ""}`,
      `Email: ${payload.email || ""}`,
      `Phone/WhatsApp: ${payload.phone || ""}`,
      `Program level: ${payload.level || ""}`,
      `Preferred major: ${payload.major || ""}`,
      "",
      "Message:",
      `${payload.message || ""}`,
    ];
    return lines.join("\n").trim();
  };

  const getPayloadFromForm = (form) => {
    const data = new FormData(form);
    return Object.fromEntries(data.entries());
  };

  const openWhatsApp = (text) => {
    const url = `https://wa.me/${BUSINESS.whatsappE164}?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const openEmail = (subject, body) => {
    const url = `mailto:${encodeURIComponent(BUSINESS.email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = url;
  };

  // --- Flyers: render from manifest.json so adding flyers is easy ---
  const flyerGrid = $("#flyer-grid");
  const flyerFilterBar = document.querySelector(".flyer-filters");

  const normalizeTags = (tags) =>
    (tags || [])
      .map((t) => String(t || "").trim())
      .filter(Boolean)
      .map((t) => t.toLowerCase());

  const renderFlyerCard = (item) => {
    const file = String(item.file || "");
    const title = String(item.title || file.replace(/\.[^/.]+$/, "") || "Flyer");
    const tags = normalizeTags(item.tags);

    const href = `./flyers/${encodeURIComponent(file)}`;

    const a = document.createElement("a");
    a.className = "flyer";
    a.href = href;
    a.setAttribute("data-flyer-src", href);
    a.setAttribute("data-flyer-name", title);
    a.setAttribute("data-flyer-tags", tags.join(" "));
    a.setAttribute("aria-label", `Open ${title} in viewer`);

    const img = document.createElement("img");
    img.loading = "lazy";
    img.src = href;
    img.alt = `WorldLight flyer — ${title}`;
    a.appendChild(img);

    return a;
  };

  const setupFlyerFiltering = () => {
    if (!flyerFilterBar) return;

  const buttons = flyerFilterBar.querySelectorAll("[data-flyer-filter]");
    if (!buttons.length) return;

    const setActive = (active) => {
      buttons.forEach((btn) => {
        const isActive = btn.getAttribute("data-flyer-filter") === active;
        btn.setAttribute("aria-pressed", String(isActive));
        btn.classList.toggle("active", isActive);
      });
    };

  const applyFilter = (filter) => {
      if (!flyerGrid) return;
      const cards = flyerGrid.querySelectorAll("a.flyer");
      cards.forEach((card) => {
        const tags = (card.getAttribute("data-flyer-tags") || "")
          .split(/\s+/)
          .map((t) => t.trim().toLowerCase())
          .filter(Boolean);

        const show = filter === "all" ? true : tags.includes(filter);
        card.style.display = show ? "block" : "none";
      });
    };

    buttons.forEach((btn) => {
      btn.addEventListener("click", () => {
  const filter = btn.getAttribute("data-flyer-filter") || "all";
        setActive(filter);
        applyFilter(filter);
      });
    });

    setActive("all");
    applyFilter("all");
  };

  const loadFlyersFromManifest = async () => {
    if (!flyerGrid) return;

    try {
      const res = await fetch("./flyers/manifest.json", { cache: "no-store" });
      if (!res.ok) throw new Error(`Failed to load manifest: ${res.status}`);
      const json = await res.json();
      const items = Array.isArray(json.items) ? json.items : [];

      flyerGrid.innerHTML = "";
      items.forEach((item) => {
        flyerGrid.appendChild(renderFlyerCard(item));
      });

      setupFlyerFiltering();
    } catch (err) {
      // If manifest fails, leave the grid empty but don't break the page.
      // eslint-disable-next-line no-console
      console.warn("Flyer manifest load failed:", err);
    }
  };

  void loadFlyersFromManifest();

  // Flyers lightbox
  const lightbox = $("#flyer-lightbox");
  const lightboxImg = $("#flyer-lightbox-img");
  const lightboxTitle = $("#flyer-lightbox-title");
  const flyerDownload = $("#flyer-download");
  const flyerOpen = $("#flyer-open");
  const flyerShare = $("#flyer-share");
  const flyerWhatsApp = $("#flyer-whatsapp");

  const openLightbox = ({ src, name }) => {
    if (!lightbox || !lightboxImg || !flyerDownload || !flyerOpen || !flyerWhatsApp) return;

    lightboxImg.src = src;
    lightboxImg.alt = name ? `${name} (WorldLight flyer)` : "WorldLight flyer";
    if (lightboxTitle) lightboxTitle.textContent = name || "Flyer";

    flyerDownload.href = src;
    flyerDownload.setAttribute("download", (name || "worldlight-flyer") + ".jpg");
    flyerOpen.href = src;

    const pageUrl = window.location.href.split("#")[0] + "#flyers";
    const shareText = `WORLDLIGHT Study in China — ${name || "Flyer"}. Contact WhatsApp +86 178 8822 7482`;
    flyerWhatsApp.href = `https://wa.me/?text=${encodeURIComponent(`${shareText}\n${pageUrl}`)}`;

    lightbox.classList.add("open");
    lightbox.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  };

  const closeLightbox = () => {
    if (!lightbox) return;
    lightbox.classList.remove("open");
    lightbox.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  };

  if (lightbox) {
    lightbox.addEventListener("click", (e) => {
      const el = e.target;
      if (!(el instanceof HTMLElement)) return;
      if (el.matches("[data-lightbox-close]")) closeLightbox();
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && lightbox.classList.contains("open")) closeLightbox();
    });
  }

  const flyerLinks = document.querySelectorAll(".flyer-grid a.flyer");
  if (flyerLinks.length && lightbox) {
    flyerLinks.forEach((a) => {
      a.addEventListener("click", (e) => {
        e.preventDefault();
        const src = a.getAttribute("data-flyer-src") || a.getAttribute("href") || "";
        const name = a.getAttribute("data-flyer-name") || "Flyer";
        openLightbox({ src, name });
      });
    });
  }

  // Handle flyers added dynamically after manifest load.
  if (flyerGrid && lightbox) {
    flyerGrid.addEventListener("click", (e) => {
      const target = e.target;
      const a = target instanceof Element ? target.closest("a.flyer") : null;
      if (!a) return;
      e.preventDefault();
      const src = a.getAttribute("data-flyer-src") || a.getAttribute("href") || "";
      const name = a.getAttribute("data-flyer-name") || "Flyer";
      openLightbox({ src, name });
    });
  }

  if (flyerShare) {
    flyerShare.addEventListener("click", async () => {
      if (!lightboxImg) return;
      const title = lightboxTitle?.textContent || "WORLDLIGHT flyer";
      const url = flyerOpen?.getAttribute("href") || window.location.href;
      const text = `WORLDLIGHT Study in China — ${title}`;

      try {
        if (navigator.share) {
          await navigator.share({ title, text, url });
          return;
        }
      } catch {
        // fall through to clipboard
      }

      try {
        await navigator.clipboard.writeText(url);
        const note = $("#form-note");
        if (note) note.textContent = "Flyer link copied to clipboard.";
      } catch {
        // ignore
      }
    });
  }

  // Mobile nav
  const toggle = $(".nav-toggle");
  const links = $("#nav-links");
  if (toggle && links) {
    toggle.addEventListener("click", () => {
      const isOpen = links.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(isOpen));
    });

    // Close menu after clicking a link (mobile)
    links.addEventListener("click", (e) => {
      const target = e.target;
      if (target instanceof HTMLAnchorElement) {
        links.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  // Footer year
  const year = $("#year");
  if (year) year.textContent = String(new Date().getFullYear());

  // Demo form handler (no backend)
  const form = $("#lead-form");
  const note = $("#form-note");
  const sendWhatsAppBtn = $("#send-whatsapp");
  const sendEmailBtn = $("#send-email");
  if (form && note) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const payload = getPayloadFromForm(form);
      const leadText = buildLeadText(payload);

      // Default action: open WhatsApp with pre-filled message.
      openWhatsApp(leadText);

      note.textContent =
        "Opening WhatsApp with your message. If it didn’t open, use the WhatsApp/Email buttons.";
    });

    if (sendWhatsAppBtn) {
      sendWhatsAppBtn.addEventListener("click", () => {
        const payload = getPayloadFromForm(form);
        openWhatsApp(buildLeadText(payload));
        note.textContent = "Opening WhatsApp with your message…";
      });
    }

    if (sendEmailBtn) {
      sendEmailBtn.addEventListener("click", () => {
        const payload = getPayloadFromForm(form);
        const body = buildLeadText(payload);
        openEmail("WORLDLIGHT — Student Application", body);
        note.textContent = "Opening your email app…";
      });
    }
  }
})();
