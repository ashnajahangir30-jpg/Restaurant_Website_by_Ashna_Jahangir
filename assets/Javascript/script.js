

(function () {
    "use strict";

    var root = document.documentElement;

    var toastEl = document.getElementById("toast");
    var toastTimer;

    function showToast(text, ms) {
        if (!toastEl) return;
        toastEl.textContent = text;
        toastEl.classList.add("show");
        clearTimeout(toastTimer);
        toastTimer = setTimeout(function () {
            toastEl.classList.remove("show");
        }, ms || 1600);
    }

    var drawer = document.getElementById("drawer");
    var backdrop = document.getElementById("drawerBackdrop");
    var drawerClose = document.getElementById("drawerClose");
    var openButtons = [document.getElementById("menuBtn"), document.getElementById("mobileMenu")].filter(Boolean);
    var lastFocus = null;

    function focusableInDrawer() {
        return Array.prototype.slice.call(
            drawer.querySelectorAll("a[href], button:not([disabled])")
        );
    }

    function setExpanded(value) {
        openButtons.forEach(function (b) {
            b.setAttribute("aria-expanded", value ? "true" : "false");
        });
    }

    function openDrawer() {
        if (!drawer) return;
        lastFocus = document.activeElement;
        drawer.inert = false;
        drawer.removeAttribute("inert");
        drawer.classList.add("open");
        backdrop.classList.add("open");
        drawer.setAttribute("aria-hidden", "false");
        setExpanded(true);
        if (drawerClose) drawerClose.focus();
    }

    function closeDrawer() {
        if (!drawer || !drawer.classList.contains("open")) return;
        drawer.classList.remove("open");
        backdrop.classList.remove("open");
        drawer.setAttribute("aria-hidden", "true");
        drawer.inert = true;
        setExpanded(false);
        if (lastFocus && lastFocus.focus) lastFocus.focus();
    }

    if (drawer) {
        drawer.inert = true;
        openButtons.forEach(function (b) { b.addEventListener("click", openDrawer); });
        if (drawerClose) drawerClose.addEventListener("click", closeDrawer);
        if (backdrop) backdrop.addEventListener("click", closeDrawer);

        document.addEventListener("keydown", function (e) {
            if (!drawer.classList.contains("open")) return;
            if (e.key === "Escape") {
                closeDrawer();
                return;
            }
            if (e.key !== "Tab") return;
            var items = focusableInDrawer();
            if (!items.length) return;
            var first = items[0];
            var last = items[items.length - 1];
            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        });
    }

    var sideThemeBtn = document.getElementById("themeToggle");
    var drawerThemeBtn = document.getElementById("drawerTheme");

    function updateThemeUI() {
        var dark = root.classList.contains("dark");

        if (sideThemeBtn) {
            sideThemeBtn.querySelector("i").className = dark ? "bi bi-sun" : "bi bi-moon";
            sideThemeBtn.querySelector(".label").textContent = dark ? "Light Mode" : "Dark Mode";
            sideThemeBtn.title = dark ? "Switch to light mode" : "Switch to dark mode";
            sideThemeBtn.setAttribute("aria-label", sideThemeBtn.title);
        }
        if (drawerThemeBtn) {
            drawerThemeBtn.setAttribute("aria-checked", dark ? "true" : "false");
            document.getElementById("drawerThemeText").textContent = dark ? "ENABLED" : "DISABLED";
        }
    }

    function toggleTheme() {
        root.classList.add("theme-fade");
        root.classList.toggle("dark");
        clearTimeout(window.__themeTimer);
        window.__themeTimer = setTimeout(function () {
            root.classList.remove("theme-fade");
        }, 600);
        try {
            localStorage.setItem("theme", root.classList.contains("dark") ? "dark" : "light");
        } catch (e) {  }
        updateThemeUI();
    }

    [sideThemeBtn, drawerThemeBtn].forEach(function (b) {
        if (b) b.addEventListener("click", toggleTheme);
    });
    updateThemeUI();

    function getCart() {
        try {
            var raw = JSON.parse(localStorage.getItem("tb_cart")) || {};
            var clean = {};
            Object.keys(raw).forEach(function (key) {
                var item = raw[key];
                if (item && typeof item === "object" && Number(item.qty) > 0) clean[key] = item;
            });
            return clean;
        } catch (e) {
            return {};
        }
    }

    function updateCartBadge() {
        var total = Object.values(getCart()).reduce(function (sum, item) {
            return sum + Number(item.qty);
        }, 0);

        document.querySelectorAll("[data-cart-link]").forEach(function (link) {
            var badge = link.querySelector(".cart-badge");
            if (!badge) {
                badge = document.createElement("span");
                badge.className = "cart-badge";
                badge.setAttribute("aria-hidden", "true");
                link.appendChild(badge);
            }
            badge.textContent = total;
            badge.style.display = total ? "flex" : "none";
            link.setAttribute("aria-label", total ? "Cart, " + total + (total === 1 ? " item" : " items") : "Cart");
        });
    }

    function saveCart(cart) {
        try {
            localStorage.setItem("tb_cart", JSON.stringify(cart));
        } catch (e) {  }
        updateCartBadge();
    }

    function slug(text) {
        return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    }

    function parsePrice(text) {
        return Number(String(text).replace(/[^0-9.]/g, ""));
    }

    function rs(n) {
        return "Rs. " + Number(n).toLocaleString("en-US");
    }

    function addToCart(opts) {
        var cart = getCart();
        var id = slug(opts.name);
        cart[id] = {
            name: opts.name,
            price: opts.price,
            img: opts.img || "",
            qty: (cart[id] ? Number(cart[id].qty) : 0) + 1
        };
        saveCart(cart);
        showToast(opts.name + " added to cart");

        var btn = opts.button;
        if (btn) {
            btn.classList.add("added");
            btn.innerHTML = opts.addedHTML;
            setTimeout(function () {
                btn.classList.remove("added");
                btn.innerHTML = opts.idleHTML;
            }, 900);
        }
    }

    updateCartBadge();

    window.addEventListener("storage", function (e) {
        if (e.key === "tb_cart" || e.key === null) {
            updateCartBadge();
            if (typeof window.__renderCart === "function") window.__renderCart();
        }
    });

    var tabsInner = document.getElementById("menuTabsInner");

    if (tabsInner) {
        var sections = Array.prototype.slice.call(document.querySelectorAll(".menu-section"));

        tabsInner.addEventListener("click", function (e) {
            var tab = e.target.closest(".menu-tab");
            if (!tab) return;
            e.preventDefault();
            document.getElementById(tab.dataset.target).scrollIntoView({ behavior: "smooth", block: "start" });
        });

        var currentId = null;
        var scrollTimer;

        var onScroll = function () {

            root.classList.add("is-scrolling");
            clearTimeout(scrollTimer);
            scrollTimer = setTimeout(function () {
                root.classList.remove("is-scrolling");
            }, 120);

            var current = sections[0].id;
            sections.forEach(function (s) {
                if (s.getBoundingClientRect().top <= 200) current = s.id;
            });

            if (current === currentId) return;
            currentId = current;

            tabsInner.querySelectorAll(".menu-tab").forEach(function (t) {
                var on = t.dataset.target === current;
                t.classList.toggle("active", on);
                if (on) {
                    t.setAttribute("aria-current", "true");
                    var left = t.offsetLeft - tabsInner.clientWidth / 2 + t.clientWidth / 2;
                    tabsInner.scrollTo({ left: left, behavior: "smooth" });
                } else {
                    t.removeAttribute("aria-current");
                }
            });
        };

        window.addEventListener("scroll", onScroll, { passive: true });
        onScroll();

        document.addEventListener("click", function (e) {
            var btn = e.target.closest(".food-card .add-btn");
            if (!btn) return;
            var card = btn.closest(".food-card");
            var img = card.querySelector(".food-img img");
            addToCart({
                name: card.querySelector(".food-name").textContent.trim(),
                price: parsePrice(card.querySelector(".food-price strong").textContent),
                img: img ? img.getAttribute("src") : "",
                button: btn,
                addedHTML: '<i class="bi bi-check-lg"></i>',
                idleHTML: '<i class="bi bi-plus-lg"></i>'
            });
        });
    }

    if (document.getElementById("dealsPage")) {
        document.addEventListener("click", function (e) {
            var btn = e.target.closest(".deal-card .add-btn");
            if (!btn) return;
            var card = btn.closest(".deal-card");
            var img = card.querySelector(".deal-photo img");
            addToCart({
                name: card.querySelector(".food-name").textContent.trim(),
                price: parsePrice(card.querySelector(".food-price strong").textContent),
                img: img ? img.getAttribute("src") : "",
                button: btn,
                addedHTML: '<i class="bi bi-check-lg"></i> Added',
                idleHTML: '<i class="bi bi-plus-lg"></i> Add'
            });
        });
    }

    if (document.getElementById("reviewsGrid")) {

        var STORE_KEY = "tb_reviews";
        var avatarColors = ["#e98b00", "#c4570a", "#2e9e4f", "#7a4cc2", "#d62828", "#1f78b4"];
        var ratingWords = ["", "Poor", "Fair", "Good", "Very good", "Excellent"];

        var grid = document.getElementById("reviewsGrid");
        var form = document.getElementById("reviewForm");
        var starInput = document.getElementById("starInput");
        var starWord = document.getElementById("starWord");
        var nameBox = document.getElementById("rvName");
        var msgBox = document.getElementById("rvText");
        var formError = document.getElementById("formError");

        var seedReviews = [
            { name: "Ayesha Khan",  rating: 5, item: "Zinger Burger",        branch: "Clifton",      date: "2026-10-28", text: "Crispy, juicy and perfectly spicy. The best zinger I have had in a long time, and it arrived piping hot." },
            { name: "Hamza Ali",    rating: 5, item: "Fajita Pizza (Large)", branch: "Gulshan",      date: "2026-10-25", text: "The large pizza easily fed three of us. Loaded with toppings and the crust was spot on." },
            { name: "Sana Malik",   rating: 4, item: "Loaded Fries",         branch: "DHA",          date: "2026-10-22", text: "Generous portion and lovely sauce. Slightly salty for my taste but I would definitely order again." },
            { name: "Bilal Ahmed",  rating: 5, item: "Smash Beef Burger",    branch: "Tariq Road",   date: "2026-10-18", text: "Proper smash patty with a great crust. Staff were friendly and the service was quick." },
            { name: "Fatima Noor",  rating: 4, item: "Choco Lava Cake",      branch: "Online Order", date: "2026-10-15", text: "Warm, gooey centre exactly as promised. Delivery took a bit longer than expected but the cake made up for it." },
            { name: "Usman Tariq",  rating: 3, item: "Hot Wings (6 pcs)",    branch: "Saddar",       date: "2026-10-09", text: "Tasty sauce but the wings were a little smaller than I hoped. Good value with the discount though." },
            { name: "Zara Hussain", rating: 5, item: "Mint Margarita",       branch: "Dolmen Mall",  date: "2026-10-04", text: "So refreshing! Perfect with the garlic bread. Will be back for this drink alone." },
            { name: "Daniyal Shah", rating: 4, item: "Tikka Pizza (Medium)", branch: "Gulshan",      date: "2026-09-29", text: "Great smoky tikka flavour and a generous amount of cheese. A solid choice for two people." },
            { name: "Maryam Iqbal", rating: 2, item: "Paratha Roll",         branch: "Online Order", date: "2026-09-21", text: "Roll arrived lukewarm and a bit dry. Taste was fine, just hoping for better packaging next time." }
        ];

        var userReviews = [];
        try {
            var saved = JSON.parse(localStorage.getItem(STORE_KEY));
            if (Array.isArray(saved)) {
                userReviews = saved.filter(function (r) {
                    return r && r.name && r.text && Number(r.rating) >= 1 && Number(r.rating) <= 5;
                });
            }
        } catch (e) {  }

        function allReviews() {
            return seedReviews.concat(userReviews);
        }

        var selectedRating = 0;

        function starsHTML(n) {
            var h = "";
            for (var i = 1; i <= 5; i++) {
                h += '<span class="' + (i <= n ? "" : "off") + '" aria-hidden="true">\u2605</span>';
            }
            return h;
        }

        function formatDate(iso) {
            var d = new Date(iso);
            return isNaN(d) ? "" : d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
        }

        function renderReviews() {
            var list = allReviews()
                                .sort(function (a, b) { return a.date < b.date ? 1 : a.date > b.date ? -1 : 0; });

            grid.innerHTML = "";

            if (!list.length) {
                var empty = document.createElement("div");
                empty.className = "reviews-empty";
                empty.textContent = "No reviews yet. Be the first to share your Tasty Bites experience!";
                grid.appendChild(empty);
                return;
            }

            list.forEach(function (r) {
                var card = document.createElement("article");
                card.className = "review-card";

                var top = document.createElement("div");
                top.className = "review-top";

                var av = document.createElement("span");
                av.className = "review-avatar";
                av.setAttribute("aria-hidden", "true");
                av.style.background = avatarColors[(r.name.charCodeAt(0) || 0) % avatarColors.length];
                av.textContent = r.name.trim().split(/\s+/).slice(0, 2).map(function (w) { return w[0]; }).join("").toUpperCase();

                var who = document.createElement("div");
                who.className = "review-who";
                var nm = document.createElement("strong");
                nm.textContent = r.name;
                var dt = document.createElement("small");
                dt.textContent = formatDate(r.date);
                who.append(nm, dt);
                top.append(av, who);

                var stars = document.createElement("div");
                stars.className = "stars";
                stars.setAttribute("role", "img");
                stars.setAttribute("aria-label", r.rating + " out of 5 stars");
                stars.innerHTML = starsHTML(Number(r.rating));

                var p = document.createElement("p");
                p.className = "review-text";
                p.textContent = r.text;

                card.append(top, stars, p);

                if (r.item || r.branch) {
                    var meta = document.createElement("div");
                    meta.className = "review-meta";
                    [r.item, r.branch].filter(Boolean).forEach(function (t) {
                        var chip = document.createElement("span");
                        chip.textContent = t;
                        meta.appendChild(chip);
                    });
                    card.appendChild(meta);
                }

                grid.appendChild(card);
            });
        }

        var starButtons = [];

        function paintStars(n) {
            starButtons.forEach(function (b, i) {
                b.classList.toggle("on", i < n);
            });
            starWord.textContent = ratingWords[n] || "";
        }

        function selectRating(n) {
            selectedRating = n;
            starButtons.forEach(function (b, i) {
                var on = i + 1 === n;
                b.setAttribute("aria-checked", on ? "true" : "false");
                b.tabIndex = on || (!n && i === 0) ? 0 : -1;
            });
            paintStars(n);
            formError.textContent = "";
        }

        for (var s = 1; s <= 5; s++) {
            (function (i) {
                var b = document.createElement("button");
                b.type = "button";
                b.setAttribute("role", "radio");
                b.setAttribute("aria-checked", "false");
                b.setAttribute("aria-label", i + (i > 1 ? " stars" : " star"));
                b.tabIndex = i === 1 ? 0 : -1;
                b.textContent = "\u2605";
                b.addEventListener("mouseenter", function () { paintStars(i); });
                b.addEventListener("click", function () { selectRating(i); });
                b.addEventListener("keydown", function (e) {
                    var next = 0;
                    if (e.key === "ArrowRight" || e.key === "ArrowUp") next = Math.min(5, (selectedRating || i) + 1);
                    if (e.key === "ArrowLeft" || e.key === "ArrowDown") next = Math.max(1, (selectedRating || i) - 1);
                    if (next) {
                        e.preventDefault();
                        selectRating(next);
                        starButtons[next - 1].focus();
                    }
                });
                starInput.appendChild(b);
                starButtons.push(b);
            })(s);
        }
        starInput.addEventListener("mouseleave", function () { paintStars(selectedRating); });

        function checkName(text) {
            var v = text.trim();
            if (!v) return "Please enter your name.";
            if (!/^\p{L}+(?:[ '\u2019-]\p{L}+)*$/u.test(v)) return "Use letters only in the name (spaces, ' and - are fine).";
            if ((v.match(/\p{L}/gu) || []).length < 3) return "Name must have at least 3 letters.";
            if (v.length > 35) return "Name can have at most 35 characters.";
            return "";
        }

        function checkMessage(text) {
            var v = text.trim();
            if (!v) return "Please write your review.";
            if (/\p{N}/u.test(v)) return "Numbers are not allowed in the review.";
            var letters = (v.match(/\p{L}/gu) || []).length;
            if (letters < 10) return "Review must have at least 10 letters (" + letters + "/10).";
            return "";
        }

        function liveCheck(input, checker) {
            input.addEventListener("input", function () {
                if (!input.value.trim()) {
                    input.classList.remove("invalid");
                    formError.textContent = "";
                    return;
                }
                var err = checker(input.value);
                input.classList.toggle("invalid", !!err);
                formError.textContent = err;
            });
        }
        liveCheck(nameBox, checkName);
        liveCheck(msgBox, checkMessage);

        form.addEventListener("submit", function (e) {
            e.preventDefault();

            var nameErr = checkName(nameBox.value);
            if (nameErr) {
                nameBox.classList.add("invalid");
                formError.textContent = nameErr;
                nameBox.focus();
                return;
            }
            if (!selectedRating) {
                formError.textContent = "Please select a star rating.";
                starButtons[0].focus();
                return;
            }
            var err = checkMessage(msgBox.value);
            if (err) {
                msgBox.classList.add("invalid");
                formError.textContent = err;
                msgBox.focus();
                return;
            }

            userReviews.push({
                name: nameBox.value.trim(),
                rating: selectedRating,
                date: new Date().toISOString(),
                text: msgBox.value.trim()
            });
            try {
                localStorage.setItem(STORE_KEY, JSON.stringify(userReviews));
            } catch (error) {  }

            form.reset();
            selectRating(0);
            nameBox.classList.remove("invalid");
            msgBox.classList.remove("invalid");
            formError.textContent = "";
            renderReviews();
            showToast("Thank you! Your review was added.", 1800);
            grid.scrollIntoView({ behavior: "smooth", block: "start" });
        });

        renderReviews();
    }

    function cartTotals(cart) {
        var items = Object.values(cart);
        return {
            count: items.reduce(function (s, i) { return s + Number(i.qty); }, 0),
            total: items.reduce(function (s, i) { return s + Number(i.price) * Number(i.qty); }, 0)
        };
    }

    if (document.getElementById("cartPage")) {

        var MAX_QTY = 99;
        var listBox = document.getElementById("cartItems");
        var layout = document.getElementById("cartLayout");
        var emptyBox = document.getElementById("cartEmpty");

        var renderCart = function () {
            var cart = getCart();
            var ids = Object.keys(cart);

            if (!ids.length) {
                layout.hidden = true;
                emptyBox.hidden = false;
                return;
            }
            layout.hidden = false;
            emptyBox.hidden = true;
            listBox.innerHTML = "";

            ids.forEach(function (id) {
                var item = cart[id];
                var qty = Number(item.qty);

                var row = document.createElement("div");
                row.className = "cart-row";
                row.dataset.id = id;

                var imgBox = document.createElement("div");
                imgBox.className = "cart-img";
                if (item.img) {
                    var im = document.createElement("img");
                    im.src = item.img;
                    im.alt = item.name;
                    im.width = 84;
                    im.height = 84;
                    im.onerror = function () { im.remove(); };
                    imgBox.appendChild(im);
                }

                var info = document.createElement("div");
                info.className = "cart-info";
                var h = document.createElement("h3");
                h.className = "cart-item-name";
                h.textContent = item.name;
                var sm = document.createElement("small");
                sm.textContent = rs(item.price) + " each";
                info.append(h, sm);

                var qtyBox = document.createElement("div");
                qtyBox.className = "qty-box";
                qtyBox.innerHTML =
                    '<button type="button" data-act="minus" aria-label="Decrease quantity"' + (qty <= 1 ? " disabled" : "") + '>\u2212</button>' +
                    '<span aria-live="polite">' + qty + '</span>' +
                    '<button type="button" data-act="plus" aria-label="Increase quantity"' + (qty >= MAX_QTY ? " disabled" : "") + '>+</button>';

                var lineTotal = document.createElement("div");
                lineTotal.className = "cart-line-total";
                lineTotal.textContent = rs(item.price * qty);

                var rm = document.createElement("button");
                rm.type = "button";
                rm.className = "cart-remove";
                rm.dataset.act = "remove";
                rm.title = "Remove item";
                rm.setAttribute("aria-label", "Remove " + item.name);
                rm.innerHTML = '<i class="bi bi-trash" aria-hidden="true"></i>';

                row.append(imgBox, info, qtyBox, lineTotal, rm);
                listBox.appendChild(row);
            });

            var t = cartTotals(cart);
            document.getElementById("cartCount").textContent = "(" + t.count + (t.count === 1 ? " item)" : " items)");
            document.getElementById("sumItems").textContent = t.count;
            document.getElementById("sumSub").textContent = rs(t.total);
            document.getElementById("sumTotal").textContent = rs(t.total);
        };
        window.__renderCart = renderCart;

        listBox.addEventListener("click", function (e) {
            var btn = e.target.closest("[data-act]");
            if (!btn) return;
            var id = btn.closest(".cart-row").dataset.id;
            var cart = getCart();
            if (!cart[id]) return;

            var act = btn.dataset.act;
            if (act === "plus" && cart[id].qty < MAX_QTY) cart[id].qty = Number(cart[id].qty) + 1;
            if (act === "minus" && cart[id].qty > 1) cart[id].qty = Number(cart[id].qty) - 1;
            if (act === "remove") delete cart[id];

            saveCart(cart);
            renderCart();
        });

        document.getElementById("clearCart").addEventListener("click", function () {
            if (confirm("Remove all items from your cart?")) {
                saveCart({});
                renderCart();
            }
        });

        renderCart();
    }

    if (document.getElementById("checkoutPage")) {

        var ALLOW_NUMBERS_IN_ADDRESS = true;

        var cart = getCart();
        var orderForm = document.getElementById("orderForm");
        var coLayout = document.getElementById("checkoutLayout");
        var processing = document.getElementById("orderProcessing");
        var done = document.getElementById("orderDone");
        var coEmpty = document.getElementById("checkoutEmpty");

        var nameIn = document.getElementById("orderName");
        var phoneIn = document.getElementById("orderPhone");
        var addrIn = document.getElementById("orderAddress");

        var totals = cartTotals(cart);

        if (!Object.keys(cart).length) {
            coLayout.hidden = true;
            coEmpty.hidden = false;
        } else {
            var lines = document.getElementById("orderLines");
            Object.values(cart).forEach(function (item) {
                var row = document.createElement("div");
                row.className = "order-line";
                var left = document.createElement("span");
                left.textContent = item.name + " \u00d7 " + item.qty;
                var right = document.createElement("b");
                right.textContent = rs(item.price * item.qty);
                row.append(left, right);
                lines.appendChild(row);
            });
            document.getElementById("orderTotal").textContent = rs(totals.total);
        }

        function checkOrderName(v) {
            v = v.trim();
            if (!v) return "Please enter your name.";
            if (/\p{N}/u.test(v)) return "Numbers are not allowed in the name.";
            if (!/^\p{L}+(?:[ '\u2019-]\p{L}+)*$/u.test(v)) return "Use only letters in the name (spaces, ' and - are fine).";
            if ((v.match(/\p{L}/gu) || []).length < 3) return "Name must have at least 3 letters.";
            if (v.length > 35) return "Name can have at most 35 characters.";
            return "";
        }

        function normalizePhone(v) {
            return v.replace(/[\s-]/g, "").replace(/^\+/, "");
        }
        function checkPhone(v) {
            var n = normalizePhone(v);
            if (!n) return "Please enter your phone number.";
            if (!/^\d+$/.test(n)) return "Phone number can only contain digits.";
            if (n.indexOf("03") !== 0 && n.indexOf("92") !== 0) return "Number must start with 03 or 92.";
            if (n.indexOf("03") === 0) {
                if (n.length !== 11) return "Numbers starting with 03 must be 11 digits (" + n.length + "/11).";
                return "";
            }
            if (n.length !== 12) return "Numbers starting with 92 must be 12 digits (" + n.length + "/12).";
            if (n[2] !== "3") return "After 92 the number must start with 3 (e.g. 923001234567).";
            return "";
        }

        function checkAddress(v) {
            v = v.trim();
            if (!v) return "Please enter your delivery address.";
            if (!ALLOW_NUMBERS_IN_ADDRESS && /\p{N}/u.test(v)) return "Numbers are not allowed in the address.";
            if (!/^[\p{L}\p{N}\s,.\-/#()']+$/u.test(v)) return "Address contains invalid characters.";
            if ((v.match(/\p{L}/gu) || []).length < 5) return "Please enter a complete address.";
            if (v.length < 10) return "Address must be at least 10 characters.";
            return "";
        }

        var fields = [
            { input: nameIn, error: document.getElementById("nameError"), check: checkOrderName },
            { input: phoneIn, error: document.getElementById("phoneError"), check: checkPhone },
            { input: addrIn, error: document.getElementById("addressError"), check: checkAddress }
        ];

        function validateField(f, show) {
            var msg = f.check(f.input.value);
            if (show) {
                f.error.textContent = msg;
                f.input.closest(".field").classList.toggle("invalid", !!msg);
                f.input.setAttribute("aria-invalid", msg ? "true" : "false");
            }
            return !msg;
        }

        fields.forEach(function (f) {
            f.input.addEventListener("input", function () {
                if (f.input.value.trim()) {
                    validateField(f, true);
                } else {
                    f.error.textContent = "";
                    f.input.closest(".field").classList.remove("invalid");
                    f.input.removeAttribute("aria-invalid");
                }
            });
            f.input.addEventListener("blur", function () {
                if (f.input.value.trim()) validateField(f, true);
            });
        });

        function makeOrderId() {
            var rand = Math.random().toString(36).slice(2, 6).toUpperCase();
            return "TB-" + Date.now().toString(36).slice(-5).toUpperCase() + rand;
        }

        orderForm.addEventListener("submit", function (e) {
            e.preventDefault();

            var firstBad = null;
            fields.forEach(function (f) {
                if (!validateField(f, true) && !firstBad) firstBad = f.input;
            });
            if (firstBad) {
                firstBad.focus();
                return;
            }

            var order = {
                id: makeOrderId(),
                name: nameIn.value.trim(),
                phone: normalizePhone(phoneIn.value),
                address: addrIn.value.trim(),
                items: cart,
                total: totals.total,
                date: new Date().toISOString()
            };

            coLayout.hidden = true;
            processing.hidden = false;
            window.scrollTo({ top: 0, behavior: "smooth" });

            setTimeout(function () {
                try {
                    var old = JSON.parse(localStorage.getItem("tb_orders")) || [];
                    old.push(order);
                    localStorage.setItem("tb_orders", JSON.stringify(old));
                } catch (err) {  }

                saveCart({});

                processing.hidden = true;
                document.getElementById("doneText").textContent =
                    "Thank you, " + order.name + "! We will call you on " + order.phone + " to confirm your order.";
                document.getElementById("doneId").textContent = order.id;
                document.getElementById("doneTotal").textContent = rs(order.total);
                done.hidden = false;
                done.setAttribute("tabindex", "-1");
                done.focus();
            }, 2500);
        });
    }

})();