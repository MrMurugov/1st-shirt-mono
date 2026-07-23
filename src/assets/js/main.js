(() => {
  "use strict";

  const body = document.body;
  const menuToggle = document.querySelector("[data-menu-toggle]");
  const siteNav = document.querySelector("[data-site-nav]");
  const quoteModal = document.querySelector("[data-quote-modal]");
  const quoteClose = document.querySelector("[data-quote-close]");

  const closeMenu = () => {
    if (!menuToggle || !siteNav) return;
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Відкрити меню");
    siteNav.classList.remove("is-open");
    body.classList.remove("menu-open");
  };

  if (menuToggle && siteNav) {
    menuToggle.addEventListener("click", () => {
      const willOpen = menuToggle.getAttribute("aria-expanded") !== "true";
      menuToggle.setAttribute("aria-expanded", String(willOpen));
      menuToggle.setAttribute("aria-label", willOpen ? "Закрити меню" : "Відкрити меню");
      siteNav.classList.toggle("is-open", willOpen);
      body.classList.toggle("menu-open", willOpen);
    });

    siteNav.addEventListener("click", (event) => {
      if (event.target.closest("a")) closeMenu();
    });
  }

  const setQuoteProduct = (trigger) => {
    if (!quoteModal) return;
    const productSlug = trigger?.dataset.productSlug || "";
    const productName = trigger?.dataset.productName || "";
    const productInput = quoteModal.querySelector("[data-quote-product]");
    const modalTitle = quoteModal.querySelector("#quote-modal-title");

    if (productInput) productInput.value = productSlug;
    if (modalTitle) {
      modalTitle.textContent = productName ? `Розрахуємо ${productName}` : "Порахуємо ваш тираж";
    }
  };

  const openQuote = (trigger) => {
    if (!quoteModal || typeof quoteModal.showModal !== "function") return false;
    setQuoteProduct(trigger);
    closeMenu();
    quoteModal.showModal();
    body.classList.add("modal-open");
    window.setTimeout(() => quoteModal.querySelector("input:not([type='hidden'])")?.focus(), 80);
    return true;
  };

  document.addEventListener("click", (event) => {
    const trigger = event.target.closest("[data-quote-open]");
    if (!trigger) return;
    if (openQuote(trigger)) event.preventDefault();
  });

  const closeQuote = () => {
    if (!quoteModal?.open) return;
    quoteModal.close();
  };

  quoteClose?.addEventListener("click", closeQuote);
  quoteModal?.addEventListener("click", (event) => {
    if (event.target === quoteModal) closeQuote();
  });
  quoteModal?.addEventListener("close", () => body.classList.remove("modal-open"));

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    closeMenu();
    closeQuote();
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 860) closeMenu();
  });

  document.querySelectorAll("[data-quote-form]").forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const status = form.querySelector("[data-form-status]");
      const submit = form.querySelector("button[type='submit']");

      if (!form.reportValidity()) return;
      if (submit) submit.disabled = true;
      if (status) status.textContent = "Демо-заявку сформовано. На WordPress тут працюватиме реальна відправка менеджеру.";

      window.setTimeout(() => {
        if (submit) submit.disabled = false;
      }, 1200);
    });
  });

  document.querySelectorAll("[data-product-gallery]").forEach((gallery) => {
    const mainImage = gallery.querySelector("[data-gallery-main]");
    const counter = gallery.querySelector("[data-gallery-count]");
    const thumbs = [...gallery.querySelectorAll("[data-gallery-thumb]")];

    if (!mainImage || thumbs.length < 2) return;

    thumbs.forEach((thumb) => {
      thumb.addEventListener("click", () => {
        const nextSrc = thumb.dataset.gallerySrc;
        const nextAlt = thumb.dataset.galleryAlt;
        if (!nextSrc) return;

        mainImage.src = nextSrc;
        mainImage.alt = nextAlt || "";
        if (counter) counter.textContent = `${thumb.dataset.galleryIndex} / ${String(thumbs.length).padStart(2, "0")}`;

        thumbs.forEach((item) => {
          const active = item === thumb;
          item.classList.toggle("is-active", active);
          item.setAttribute("aria-pressed", String(active));
        });

        if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
          mainImage.animate(
            [
              { opacity: 0.45, transform: "scale(0.992)" },
              { opacity: 1, transform: "scale(1)" }
            ],
            { duration: 260, easing: "ease-out" }
          );
        }
      });
    });
  });

  const catalog = document.querySelector("[data-catalog]");

  if (catalog) {
    const cards = [...catalog.querySelectorAll("[data-product-card]")];
    const categoryButtons = [...catalog.querySelectorAll("[data-filter-category]")];
    const methodSelect = catalog.querySelector("[data-filter-method]");
    const searchInput = catalog.querySelector("[data-product-search]");
    const resetButton = catalog.querySelector("[data-filter-reset]");
    const count = catalog.querySelector("[data-product-count]");
    const empty = catalog.querySelector("[data-catalog-empty]");
    const params = new URLSearchParams(window.location.search);

    let category = params.get("category") || "all";
    let method = params.get("method") || "all";
    let query = params.get("q") || "";

    const categoryExists = categoryButtons.some((button) => button.dataset.filterCategory === category);
    if (!categoryExists) category = "all";
    if (methodSelect && [...methodSelect.options].some((option) => option.value === method)) {
      methodSelect.value = method;
    } else {
      method = "all";
    }
    if (searchInput) searchInput.value = query;

    const updateUrl = () => {
      const next = new URLSearchParams();
      if (category !== "all") next.set("category", category);
      if (method !== "all") next.set("method", method);
      if (query) next.set("q", query);
      const suffix = next.toString();
      window.history.replaceState({}, "", `${window.location.pathname}${suffix ? `?${suffix}` : ""}`);
    };

    const applyFilters = () => {
      const normalizedQuery = query.trim().toLocaleLowerCase("uk-UA");
      let visible = 0;

      cards.forEach((card) => {
        const matchesCategory =
          category === "all" || card.dataset.category === category || card.dataset.parentCategory === category;
        const methods = (card.dataset.methods || "").split(/\s+/);
        const matchesMethod = method === "all" || methods.includes(method);
        const matchesQuery = !normalizedQuery || (card.dataset.name || "").includes(normalizedQuery);
        const show = matchesCategory && matchesMethod && matchesQuery;

        card.hidden = !show;
        if (show) visible += 1;
      });

      categoryButtons.forEach((button) => {
        const active = button.dataset.filterCategory === category;
        button.classList.toggle("is-active", active);
        button.setAttribute("aria-pressed", String(active));
      });

      if (count) count.textContent = String(visible);
      if (empty) empty.hidden = visible !== 0;
      updateUrl();
    };

    categoryButtons.forEach((button) => {
      button.addEventListener("click", () => {
        category = button.dataset.filterCategory || "all";
        applyFilters();
      });
    });

    methodSelect?.addEventListener("change", () => {
      method = methodSelect.value;
      applyFilters();
    });

    searchInput?.addEventListener("input", () => {
      query = searchInput.value;
      applyFilters();
    });

    resetButton?.addEventListener("click", () => {
      category = "all";
      method = "all";
      query = "";
      if (methodSelect) methodSelect.value = "all";
      if (searchInput) searchInput.value = "";
      applyFilters();
    });

    applyFilters();
  }

  document.querySelectorAll("[data-accordion]").forEach((accordion) => {
    accordion.addEventListener("toggle", (event) => {
      if (event.target.tagName !== "DETAILS" || !event.target.open) return;
      accordion.querySelectorAll("details[open]").forEach((item) => {
        if (item !== event.target) item.removeAttribute("open");
      });
    }, true);
  });
})();
