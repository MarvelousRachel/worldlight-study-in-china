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

  const appendToMessageBox = (text) => {
    const box = document.querySelector("#message");
    if (!(box instanceof HTMLTextAreaElement)) return;
    const existing = String(box.value || "").trim();
    const next = existing ? `${existing}\n\n${text}` : text;
    box.value = next;
  };

  // If arriving with ?university=... from universities.html, prefill the message.
  try {
    const params = new URLSearchParams(window.location.search);
    const uni = params.get("university");
    const city = params.get("city");
    if (uni) {
      const line = [`University: ${uni}`, city ? `City: ${city}` : ""].filter(Boolean).join(" | ");
      appendToMessageBox(`Hello WorldLight, I want to apply to: ${line}`);
    }
  } catch {
    // ignore
  }

  // --- Homepage search (static, client-side) ---
  const searchInput = $("#site-search");
  const searchBtn = document.querySelector("[data-search-trigger]");

  const normalize = (s) => String(s || "").toLowerCase().trim();

  const applyHomepageSearch = () => {
    if (!searchInput) return;
    const q = normalize(searchInput.value);

    const cards = document.querySelectorAll(
      ".uni-card, .program-tile, [data-search-item]"
    );

    cards.forEach((card) => {
      const text = normalize(card.textContent || "");
      const show = !q || text.includes(q);
      card.style.display = show ? "" : "none";
    });
  };

  if (searchInput) {
    searchInput.addEventListener("input", applyHomepageSearch);
    searchInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") applyHomepageSearch();
    });
  }

  if (searchBtn) {
    searchBtn.addEventListener("click", applyHomepageSearch);
  }

  // --- Universities page (filters + search history) ---
  const uniSearch = $("#uni-search");
  const uniSearchTrigger = document.querySelector("[data-uni-search-trigger]");
  const uniNameInput = $("#uni-name");
  const uniNameGo = document.querySelector("[data-uni-name-search]");
  const uniTagSelect = $("#uni-tags");
  const uniCityInput = $("#uni-city");
  const uniRows = document.querySelectorAll("[data-uni]");
  const uniHistoryEl = $("#uni-history");
  const uniHistoryClear = document.querySelector("[data-uni-history-clear]");
  const uniQuickButtons = document.querySelectorAll("[data-uni-quick]");

  const UNI_HISTORY_KEY = "worldlight_uni_search_history_v1";

  const readUniHistory = () => {
    try {
      const raw = localStorage.getItem(UNI_HISTORY_KEY);
      const list = raw ? JSON.parse(raw) : [];
      return Array.isArray(list) ? list.filter(Boolean) : [];
    } catch {
      return [];
    }
  };

  const writeUniHistory = (list) => {
    try {
      localStorage.setItem(UNI_HISTORY_KEY, JSON.stringify(list.slice(0, 10)));
    } catch {
      // ignore
    }
  };

  const addUniHistoryItem = (value) => {
    const v = normalize(value);
    if (!v) return;
    const existing = readUniHistory();
    const next = [v, ...existing.filter((x) => x !== v)];
    writeUniHistory(next);
    renderUniHistory();
  };

  const renderUniHistory = () => {
    if (!uniHistoryEl) return;
    const items = readUniHistory();
    uniHistoryEl.innerHTML = "";

    if (!items.length) {
      const p = document.createElement("p");
      p.className = "muted";
      p.style.margin = "0";
      p.textContent = "No searches yet.";
      uniHistoryEl.appendChild(p);
      return;
    }

    items.forEach((q) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = q;
      btn.addEventListener("click", () => {
        if (uniSearch) uniSearch.value = q;
        if (uniNameInput) uniNameInput.value = q;
        applyUniversityFilters();
      });
      uniHistoryEl.appendChild(btn);
    });
  };

  const getUniversityFilterState = () => {
    const q = normalize((uniSearch && uniSearch.value) || (uniNameInput && uniNameInput.value) || "");
    const city = normalize(uniCityInput?.value || "");
    const tag = normalize(uniTagSelect?.value || "");
    return { q, city, tag };
  };

  const applyUniversityFilters = () => {
    if (!uniRows.length) return;

    const { q, city, tag } = getUniversityFilterState();

    uniRows.forEach((row) => {
      const name = normalize(row.getAttribute("data-name") || row.textContent || "");
      const rowCity = normalize(row.getAttribute("data-city") || "");
      const rowProv = normalize(row.getAttribute("data-province") || "");
      const rowTags = normalize(row.getAttribute("data-tags") || "");

      const matchesQ = !q || name.includes(q) || rowCity.includes(q) || rowProv.includes(q) || rowTags.includes(q);
      const matchesCity = !city || rowCity.includes(city) || rowProv.includes(city);
      const matchesTag = !tag || rowTags.split(/\s+/).includes(tag);

      row.style.display = matchesQ && matchesCity && matchesTag ? "" : "none";
    });

    if (q) addUniHistoryItem(q);
  };

  // Wire universities inputs
  if (uniSearch) {
    uniSearch.addEventListener("input", applyUniversityFilters);
    uniSearch.addEventListener("keydown", (e) => {
      if (e.key === "Enter") applyUniversityFilters();
    });
  }

  if (uniSearchTrigger) uniSearchTrigger.addEventListener("click", applyUniversityFilters);

  if (uniNameInput) {
    uniNameInput.addEventListener("input", applyUniversityFilters);
    uniNameInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") applyUniversityFilters();
    });
  }

  if (uniNameGo) uniNameGo.addEventListener("click", applyUniversityFilters);
  if (uniCityInput) uniCityInput.addEventListener("input", applyUniversityFilters);
  if (uniTagSelect) uniTagSelect.addEventListener("change", applyUniversityFilters);

  if (uniHistoryClear) {
    uniHistoryClear.addEventListener("click", () => {
      writeUniHistory([]);
      renderUniHistory();
    });
  }

  if (uniQuickButtons.length) {
    uniQuickButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const v = btn.getAttribute("data-uni-quick") || "";
        if (uniTagSelect) uniTagSelect.value = v;
        applyUniversityFilters();
      });
    });
  }

  // Prefill contact message when clicking "View details"
  const viewDetailsLinks = document.querySelectorAll("[data-view-details]");
  if (viewDetailsLinks.length) {
    viewDetailsLinks.forEach((a) => {
      a.addEventListener("click", (e) => {
        const target = e.currentTarget;
        if (!(target instanceof HTMLElement)) return;
        const container = target.closest("[data-uni]");
        const uniName = container?.getAttribute("data-name") || "";
        const city = container?.getAttribute("data-city") || "";
        const province = container?.getAttribute("data-province") || "";

        // Store a draft message so index.html can pick it up if implemented later.
        // For now, we at least add to search history.
        addUniHistoryItem(uniName);

        // If the universities page has a querystring to index, append it.
        if (target instanceof HTMLAnchorElement && uniName) {
          const url = new URL(target.href, window.location.href);
          url.searchParams.set("university", uniName);
          if (city || province) url.searchParams.set("city", [city, province].filter(Boolean).join(", "));
          target.href = url.toString();
        }
      });
    });
  }

  // Initial render for universities page
  if (uniHistoryEl) renderUniHistory();

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
