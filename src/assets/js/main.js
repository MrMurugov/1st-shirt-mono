(() => {
  "use strict";

  const root = document.documentElement;
  const body = document.body;
  const menuToggle = document.querySelector("[data-menu-toggle]");
  const mobileMenu = document.querySelector("[data-mobile-menu]");
  const mobileMenuShell = document.querySelector("[data-mobile-menu-shell]");
  const menuClose = document.querySelector("[data-menu-close]");
  const quoteModal = document.querySelector("[data-quote-modal]");
  const quoteClose = document.querySelector("[data-quote-close]");
  const mobileNavigation = window.matchMedia("(max-width: 1180px)");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const menuStateKey = "__formaBureauMenu";

  let menuHistoryActive = false;
  let menuClosing = false;
  let actionAfterMenuClose = null;

  const setOverlayClasses = () => {
    const menuOpen = Boolean(mobileMenu?.open);
    const modalOpen = Boolean(quoteModal?.open);

    root.classList.toggle("menu-open", menuOpen);
    root.classList.toggle("modal-open", modalOpen);
    body.classList.toggle("menu-open", menuOpen);
    body.classList.toggle("modal-open", modalOpen);
  };

  const focusableSelector = [
    "a[href]",
    "button:not([disabled])",
    "input:not([disabled]):not([type='hidden'])",
    "select:not([disabled])",
    "textarea:not([disabled])",
    "[tabindex]:not([tabindex='-1'])"
  ].join(",");

  const trapDialogFocus = (dialog, event) => {
    if (event.key !== "Tab" || !dialog?.open) return;

    const focusable = [...dialog.querySelectorAll(focusableSelector)].filter((element) => {
      const style = window.getComputedStyle(element);
      return style.visibility !== "hidden" && style.display !== "none" && element.getClientRects().length > 0;
    });

    if (!focusable.length) {
      event.preventDefault();
      dialog.focus({ preventScroll: true });
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const activeInside = dialog.contains(document.activeElement);

    if (event.shiftKey && (!activeInside || document.activeElement === first)) {
      event.preventDefault();
      last.focus({ preventScroll: true });
    } else if (!event.shiftKey && (!activeInside || document.activeElement === last)) {
      event.preventDefault();
      first.focus({ preventScroll: true });
    }
  };

  const setMenuToggleState = (open) => {
    if (!menuToggle) return;
    menuToggle.setAttribute("aria-expanded", String(open));
    menuToggle.setAttribute("aria-label", open ? "Закрити меню" : "Відкрити меню");
  };

  const runMenuCloseAction = () => {
    const action = actionAfterMenuClose;
    actionAfterMenuClose = null;
    if (typeof action === "function") action();
  };

  const finishMenuClose = () => {
    if (!mobileMenu?.open) {
      menuClosing = false;
      setMenuToggleState(false);
      runMenuCloseAction();
      setOverlayClasses();
      return;
    }

    mobileMenu.classList.remove("is-visible");

    const complete = () => {
      if (mobileMenu.open) mobileMenu.close();
      menuClosing = false;
      setMenuToggleState(false);
      runMenuCloseAction();
      setOverlayClasses();
    };

    window.setTimeout(complete, reducedMotion.matches ? 0 : 280);
  };

  const requestMenuClose = (afterClose) => {
    if (typeof afterClose === "function") actionAfterMenuClose = afterClose;

    if (!mobileMenu?.open) {
      runMenuCloseAction();
      return;
    }

    if (menuClosing) return;
    menuClosing = true;

    if (menuHistoryActive && history.state?.[menuStateKey]) {
      history.back();
      return;
    }

    menuHistoryActive = false;
    finishMenuClose();
  };

  const openMenu = ({ pushHistory = true } = {}) => {
    if (!mobileMenu || !menuToggle || !mobileNavigation.matches || mobileMenu.open) return;

    if (pushHistory) {
      history.pushState({ ...(history.state || {}), [menuStateKey]: true }, "");
      menuHistoryActive = true;
    } else {
      menuHistoryActive = Boolean(history.state?.[menuStateKey]);
    }

    mobileMenu.showModal();
    setMenuToggleState(true);
    setOverlayClasses();

    window.requestAnimationFrame(() => {
      mobileMenu.classList.add("is-visible");
      const preferredFocus =
        mobileMenu.querySelector('[aria-current="page"]') ||
        mobileMenu.querySelector(".mobile-nav__link") ||
        menuClose;
      preferredFocus?.focus({ preventScroll: true });
    });
  };

  if (history.state?.[menuStateKey]) {
    const cleanState = { ...history.state };
    delete cleanState[menuStateKey];
    history.replaceState(Object.keys(cleanState).length ? cleanState : null, "");
  }

  menuToggle?.addEventListener("click", () => {
    if (mobileMenu?.open) requestMenuClose();
    else openMenu();
  });

  menuClose?.addEventListener("click", () => requestMenuClose());

  mobileMenu?.addEventListener("cancel", (event) => {
    event.preventDefault();
    requestMenuClose();
  });
  mobileMenu?.addEventListener("keydown", (event) => trapDialogFocus(mobileMenu, event));

  mobileMenu?.addEventListener("close", () => {
    mobileMenu.classList.remove("is-visible");
    menuClosing = false;
    menuHistoryActive = false;
    setMenuToggleState(false);
    setOverlayClasses();
  });

  mobileMenu?.addEventListener("click", (event) => {
    if (event.target !== mobileMenu || !mobileMenuShell) return;
    const rect = mobileMenuShell.getBoundingClientRect();
    const clickedOutside =
      event.clientX < rect.left ||
      event.clientX > rect.right ||
      event.clientY < rect.top ||
      event.clientY > rect.bottom;

    if (clickedOutside) requestMenuClose();
  });

  mobileMenu?.querySelectorAll(".mobile-nav__link, .brand--menu").forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      requestMenuClose(() => window.location.assign(link.href));
    });
  });

  window.addEventListener("popstate", () => {
    if (mobileMenu?.open && !history.state?.[menuStateKey]) {
      menuHistoryActive = false;
      finishMenuClose();
      return;
    }

    if (!mobileMenu?.open && history.state?.[menuStateKey] && mobileNavigation.matches) {
      openMenu({ pushHistory: false });
    }
  });

  mobileNavigation.addEventListener("change", (event) => {
    if (!event.matches && mobileMenu?.open) {
      requestMenuClose(() => {
        document.querySelector(".site-header .brand")?.focus({ preventScroll: true });
      });
    }
  });

  window.addEventListener("pagehide", () => {
    mobileMenu?.classList.remove("is-visible");
  });

  const contextFromTrigger = (trigger) => {
    const url = new URL(trigger?.href || window.location.href, window.location.href);
    const params = url.searchParams;

    return {
      product: trigger?.dataset.productSlug || params.get("product") || "",
      productName: trigger?.dataset.productName || "",
      solution: trigger?.dataset.solutionSlug || params.get("solution") || "",
      solutionName: trigger?.dataset.solutionName || "",
      method: trigger?.dataset.methodId || params.get("method") || "",
      methodName: trigger?.dataset.methodName || "",
      category: trigger?.dataset.categoryId || params.get("category") || "",
      categoryName: trigger?.dataset.categoryName || ""
    };
  };

  const optionLabel = (form, fieldName, value) => {
    if (!value) return "";
    const select = form.elements.namedItem(fieldName);
    if (!(select instanceof HTMLSelectElement)) return "";
    return [...select.options].find((option) => option.value === value)?.textContent?.trim() || "";
  };

  const applyQuoteContext = (form, context) => {
    if (!form) return;

    ["product", "solution", "method", "category"].forEach((key) => {
      const input = form.querySelector(`[data-quote-${key}]`);
      if (input) input.value = context[key] || "";
    });

    const methodSelect = form.elements.namedItem("printMethod");
    if (methodSelect instanceof HTMLSelectElement && context.method) {
      const hasMethod = [...methodSelect.options].some((option) => option.value === context.method);
      if (hasMethod) methodSelect.value = context.method;
    }

    const categorySelect = form.elements.namedItem("category");
    if (categorySelect instanceof HTMLSelectElement && context.category) {
      const hasCategory = [...categorySelect.options].some((option) => option.value === context.category);
      if (hasCategory) categorySelect.value = context.category;
    }

    const labels = [
      context.productName || context.product,
      context.solutionName || optionLabel(form, "solution", context.solution) || context.solution,
      context.methodName || optionLabel(form, "printMethod", context.method) || context.method,
      context.categoryName || optionLabel(form, "category", context.category) || context.category
    ].filter(Boolean);
    const summary = form.querySelector("[data-quote-context]");

    if (summary) {
      summary.hidden = labels.length === 0;
      summary.textContent = labels.length ? `Контекст запиту: ${labels.join(" · ")}` : "";
    }
  };

  const openQuote = (trigger) => {
    if (!quoteModal || typeof quoteModal.showModal !== "function") return false;

    const context = contextFromTrigger(trigger);
    const form = quoteModal.querySelector("[data-quote-form]");
    const modalTitle = quoteModal.querySelector("#quote-modal-title");

    applyQuoteContext(form, context);

    if (modalTitle) {
      if (context.productName) modalTitle.textContent = `Розрахуємо ${context.productName}`;
      else if (context.methodName) modalTitle.textContent = `Розрахунок: ${context.methodName}`;
      else if (context.solutionName) modalTitle.textContent = `Рішення для ${context.solutionName}`;
      else modalTitle.textContent = "Порахуємо ваш тираж";
    }

    quoteModal.showModal();
    setOverlayClasses();
    window.setTimeout(() => quoteModal.querySelector("input:not([type='hidden'])")?.focus(), 60);
    return true;
  };

  document.addEventListener("click", (event) => {
    const trigger = event.target.closest("[data-quote-open]");
    if (!trigger) return;

    event.preventDefault();
    const action = () => openQuote(trigger);

    if (mobileMenu?.open) requestMenuClose(action);
    else action();
  });

  const closeQuote = () => {
    if (quoteModal?.open) quoteModal.close();
  };

  quoteClose?.addEventListener("click", closeQuote);
  quoteModal?.addEventListener("click", (event) => {
    if (event.target !== quoteModal) return;
    const inner = quoteModal.querySelector(".quote-modal__inner");
    if (!inner) return;
    const rect = inner.getBoundingClientRect();
    const clickedOutside =
      event.clientX < rect.left ||
      event.clientX > rect.right ||
      event.clientY < rect.top ||
      event.clientY > rect.bottom;
    if (clickedOutside) closeQuote();
  });
  quoteModal?.addEventListener("close", setOverlayClasses);
  quoteModal?.addEventListener("keydown", (event) => trapDialogFocus(quoteModal, event));

  if (body.classList.contains("quote-page")) {
    const context = contextFromTrigger();
    document.querySelectorAll("[data-quote-form]").forEach((form) => applyQuoteContext(form, context));
  }

  document.querySelectorAll("[data-quote-form]").forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const status = form.querySelector("[data-form-status]");
      const submit = form.querySelector("button[type='submit']");

      if (!form.reportValidity()) return;

      form.setAttribute("aria-busy", "true");
      if (submit) submit.disabled = true;
      if (status) {
        status.textContent =
          "Демо-заявку сформовано. На WordPress тут працюватиме реальна відправка менеджеру.";
      }

      window.setTimeout(() => {
        form.removeAttribute("aria-busy");
        if (submit) submit.disabled = false;
      }, 1200);
    });
  });

  document.querySelectorAll("[data-product-gallery]").forEach((gallery) => {
    const mainImage = gallery.querySelector("[data-gallery-main]");
    const counter = gallery.querySelector("[data-gallery-count]");
    const thumbsContainer = gallery.querySelector(".product-gallery__thumbs");
    const thumbs = [...gallery.querySelectorAll("[data-gallery-thumb]")];
    const previousButton = gallery.querySelector("[data-gallery-prev]");
    const nextButton = gallery.querySelector("[data-gallery-next]");

    if (!mainImage || thumbs.length < 2) return;

    let activeIndex = Math.max(
      0,
      thumbs.findIndex((thumb) => thumb.classList.contains("is-active"))
    );

    const showGalleryImage = (requestedIndex) => {
      const index = (requestedIndex + thumbs.length) % thumbs.length;
      const thumb = thumbs[index];
      const nextSrc = thumb.dataset.gallerySrc;
      const nextAlt = thumb.dataset.galleryAlt;
      if (!nextSrc) return;

      activeIndex = index;
      mainImage.src = nextSrc;
      mainImage.alt = nextAlt || "";
      if (counter) {
        counter.textContent = `${String(index + 1).padStart(2, "0")} / ${String(thumbs.length).padStart(2, "0")}`;
      }

      thumbs.forEach((item, itemIndex) => {
        const active = itemIndex === index;
        item.classList.toggle("is-active", active);
        item.setAttribute("aria-pressed", String(active));
      });

      if (thumbsContainer) {
        const thumbRect = thumb.getBoundingClientRect();
        const containerRect = thumbsContainer.getBoundingClientRect();
        const outsideViewport =
          thumbRect.left < containerRect.left || thumbRect.right > containerRect.right;

        if (outsideViewport) {
          thumb.scrollIntoView({
            behavior: reducedMotion.matches ? "auto" : "smooth",
            block: "nearest",
            inline: "nearest"
          });
        }
      }

      if (!reducedMotion.matches) {
        mainImage.animate(
          [
            { opacity: 0.45, transform: "scale(0.992)" },
            { opacity: 1, transform: "scale(1)" }
          ],
          { duration: 260, easing: "ease-out" }
        );
      }
    };

    thumbs.forEach((thumb, index) => {
      thumb.addEventListener("click", () => showGalleryImage(index));
    });

    previousButton?.addEventListener("click", () => showGalleryImage(activeIndex - 1));
    nextButton?.addEventListener("click", () => showGalleryImage(activeIndex + 1));

    gallery.addEventListener("keydown", (event) => {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      event.preventDefault();
      showGalleryImage(activeIndex + (event.key === "ArrowLeft" ? -1 : 1));
    });
  });

  const catalog = document.querySelector("[data-catalog]");

  if (catalog) {
    const cards = [...catalog.querySelectorAll("[data-product-card]")];
    const categoryButtons = [...catalog.querySelectorAll("[data-filter-category]")];
    const categorySelect = catalog.querySelector("[data-filter-category-select]");
    const methodSelect = catalog.querySelector("[data-filter-method]");
    const searchInput = catalog.querySelector("[data-product-search]");
    const resetButton = catalog.querySelector("[data-filter-reset]");
    const count = catalog.querySelector("[data-product-count]");
    const empty = catalog.querySelector("[data-catalog-empty]");
    const params = new URLSearchParams(window.location.search);

    let category = params.get("category") || "all";
    let method = params.get("method") || "all";
    let query = params.get("q") || "";

    const validCategories = new Set(["all"]);
    cards.forEach((card) => {
      if (card.dataset.category) validCategories.add(card.dataset.category);
      if (card.dataset.parentCategory) validCategories.add(card.dataset.parentCategory);
    });
    if (!validCategories.has(category)) category = "all";

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
          category === "all" ||
          card.dataset.category === category ||
          card.dataset.parentCategory === category;
        const methods = (card.dataset.methods || "").split(/\s+/);
        const matchesMethod = method === "all" || methods.includes(method);
        const matchesQuery = !normalizedQuery || (card.dataset.name || "").includes(normalizedQuery);
        const show = matchesCategory && matchesMethod && matchesQuery;

        card.hidden = !show;
        if (show) visible += 1;
      });

      categoryButtons.forEach((button) => {
        const selectedOption =
          categorySelect instanceof HTMLSelectElement
            ? [...categorySelect.options].find((option) => option.value === category)
            : null;
        const activeCategory = selectedOption?.dataset.parentCategory || category;
        const active = button.dataset.filterCategory === activeCategory;
        button.classList.toggle("is-active", active);
        button.setAttribute("aria-pressed", String(active));
      });

      if (categorySelect instanceof HTMLSelectElement) {
        const hasExactOption = [...categorySelect.options].some((option) => option.value === category);
        categorySelect.value = hasExactOption ? category : "";
      }

      if (count) count.textContent = String(visible);
      if (empty) empty.hidden = visible !== 0;
      updateUrl();
    };

    categoryButtons.forEach((button) => {
      button.addEventListener("click", () => {
        category = button.dataset.filterCategory || "all";
        applyFilters();
        button.scrollIntoView({ behavior: reducedMotion.matches ? "auto" : "smooth", block: "nearest", inline: "center" });
      });
    });

    categorySelect?.addEventListener("change", () => {
      if (!categorySelect.value) return;
      category = categorySelect.value;
      applyFilters();
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
      if (categorySelect) categorySelect.value = "";
      applyFilters();
      searchInput?.focus();
    });

    applyFilters();
  }

  document.querySelectorAll("[data-accordion]").forEach((accordion) => {
    accordion.addEventListener(
      "toggle",
      (event) => {
        if (event.target.tagName !== "DETAILS" || !event.target.open) return;
        accordion.querySelectorAll("details[open]").forEach((item) => {
          if (item !== event.target) item.removeAttribute("open");
        });
      },
      true
    );
  });
})();
