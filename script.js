/* =========================================================
   AUTOCARE - VEHICLE SERVICE MANAGEMENT SYSTEM
   Complete script.js
   Login + Logout + Local Storage + CRUD
========================================================= */

"use strict";

/* =========================================================
   STORAGE
========================================================= */

const STORAGE = {
    customers: "vsm_customers",
    vehicles: "vsm_vehicles",
    services: "vsm_services",
    activity: "vsm_activity",
    settings: "vsm_settings",
    loggedIn: "vsm_logged_in",
    username: "vsm_username"
};

/* =========================================================
   STATE
========================================================= */

let customers = [];
let vehicles = [];
let services = [];
let activities = [];
let settings = {};

let editingCustomerId = null;
let editingVehicleId = null;
let editingServiceId = null;

let confirmAction = null;

/* =========================================================
   HELPERS
========================================================= */

function $(id) {
    return document.getElementById(id);
}

function all(selector) {
    return Array.from(document.querySelectorAll(selector));
}

function value(id) {
    const element = $(id);
    return element ? element.value.trim() : "";
}

function setValue(id, newValue) {
    const element = $(id);
    if (element) {
        element.value =
            newValue === null ||
            newValue === undefined
                ? ""
                : newValue;
    }
}

function setText(id, text) {
    const element = $(id);
    if (element) {
        element.textContent =
            text === null ||
            text === undefined
                ? ""
                : text;
    }
}

function escapeHTML(text) {
    if (text === null || text === undefined) {
        return "";
    }

    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function generateId(prefix) {
    return (
        prefix +
        "-" +
        Date.now() +
        "-" +
        Math.floor(Math.random() * 10000)
    );
}

function today() {
    const d = new Date();

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function formatDate(dateString) {
    if (!dateString) return "-";

    const date = new Date(
        `${dateString}T00:00:00`
    );

    if (Number.isNaN(date.getTime())) {
        return dateString;
    }

    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}

function formatCurrency(amount) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0
    }).format(Number(amount) || 0);
}

/* =========================================================
   LOCAL STORAGE
========================================================= */

function readStorage(key, fallback) {
    try {
        const saved = localStorage.getItem(key);

        if (!saved) {
            return fallback;
        }

        return JSON.parse(saved);
    } catch (error) {
        console.error(
            "Storage read error:",
            key,
            error
        );

        return fallback;
    }
}

function saveStorage(key, data) {
    try {
        localStorage.setItem(
            key,
            JSON.stringify(data)
        );

        return true;
    } catch (error) {
        console.error(
            "Storage save error:",
            key,
            error
        );

        return false;
    }
}

function loadData() {
    customers = readStorage(
        STORAGE.customers,
        []
    );

    vehicles = readStorage(
        STORAGE.vehicles,
        []
    );

    services = readStorage(
        STORAGE.services,
        []
    );

    activities = readStorage(
        STORAGE.activity,
        []
    );

    settings = readStorage(
        STORAGE.settings,
        {
            workshopName:
                "AutoCare Service Center",
            workshopPhone: "",
            workshopEmail: "",
            workshopAddress: ""
        }
    );

    if (!Array.isArray(customers)) {
        customers = [];
    }

    if (!Array.isArray(vehicles)) {
        vehicles = [];
    }

    if (!Array.isArray(services)) {
        services = [];
    }

    if (!Array.isArray(activities)) {
        activities = [];
    }
}

function saveAll() {
    saveStorage(
        STORAGE.customers,
        customers
    );

    saveStorage(
        STORAGE.vehicles,
        vehicles
    );

    saveStorage(
        STORAGE.services,
        services
    );

    saveStorage(
        STORAGE.activity,
        activities
    );

    saveStorage(
        STORAGE.settings,
        settings
    );
}

/* =========================================================
   LOGIN
========================================================= */

function setupLogin() {
    const loginScreen = $(
        "loginScreen"
    );

    const loginForm = $(
        "loginForm"
    );

    const loginError = $(
        "loginError"
    );

    if (!loginScreen || !loginForm) {
        console.error(
            "Login elements missing from index.html"
        );

        return;
    }

    const loggedIn =
        localStorage.getItem(
            STORAGE.loggedIn
        ) === "true";

    if (loggedIn) {
        loginScreen.style.display = "none";
    } else {
        loginScreen.style.display = "flex";
    }

    loginForm.addEventListener(
        "submit",
        function (event) {

            event.preventDefault();

            const username =
                value("loginUsername");

            const password =
                $("loginPassword")
                    ? $("loginPassword").value
                    : "";

            const users = {
                admin: "admin123",
                administrator: "admin123"
            };

            if (
                users[username] &&
                users[username] === password
            ) {

                localStorage.setItem(
                    STORAGE.loggedIn,
                    "true"
                );

                localStorage.setItem(
                    STORAGE.username,
                    username
                );

                loginError.style.display =
                    "none";

                loginScreen.style.display =
                    "none";

                updateLoggedInUser(
                    username
                );

                showToast(
                    "Login Successful",
                    "Welcome to AutoCare.",
                    "success"
                );

            } else {

                loginError.textContent =
                    "Invalid username or password.";

                loginError.style.display =
                    "block";
            }
        }
    );
}

/* =========================================================
   UPDATE USER PROFILE
========================================================= */

function updateLoggedInUser(
    username
) {
    const profileName =
        document.querySelector(
            ".user-info strong"
        );

    const avatar =
        document.querySelector(
            ".user-avatar span"
        );

    if (profileName) {
        profileName.textContent =
            username === "administrator"
                ? "Administrator"
                : "Admin";
    }

    if (avatar) {
        avatar.textContent =
            username
                .substring(0, 2)
                .toUpperCase();
    }
}

/* =========================================================
   LOGOUT
========================================================= */

function setupLogout() {
    const logoutBtn =
        $("logoutBtn");

    if (!logoutBtn) {
        console.error(
            "Logout button is missing."
        );

        return;
    }

    logoutBtn.addEventListener(
        "click",
        function () {

            const answer =
                window.confirm(
                    "Are you sure you want to logout?"
                );

            if (!answer) {
                return;
            }

            localStorage.removeItem(
                STORAGE.loggedIn
            );

            localStorage.removeItem(
                STORAGE.username
            );

            const loginScreen =
                $("loginScreen");

            const loginForm =
                $("loginForm");

            if (loginForm) {
                loginForm.reset();
            }

            if (loginScreen) {
                loginScreen.style.display =
                    "flex";
            }

            closeAllModals();

            showToast(
                "Logged Out",
                "You have been logged out successfully.",
                "success"
            );
        }
    );
}

/* =========================================================
   NAVIGATION
========================================================= */

function setupNavigation() {

    all(".nav-link").forEach(
        function (link) {

            /* Don't treat logout as page navigation */
            if (
                link.id === "logoutBtn"
            ) {
                return;
            }

            link.addEventListener(
                "click",
                function (event) {

                    event.preventDefault();

                    const section =
                        link.dataset.section;

                    if (section) {
                        navigate(
                            section
                        );
                    }
                }
            );
        }
    );

    all(
        "[data-section]"
    ).forEach(
        function (element) {

            if (
                element.classList.contains(
                    "nav-link"
                )
            ) {
                return;
            }

            element.addEventListener(
                "click",
                function () {

                    const section =
                        element.dataset.section;

                    if (section) {
                        navigate(
                            section
                        );
                    }
                }
            );
        }
    );
}

function navigate(section) {

    all(".page-section").forEach(
        function (item) {
            item.classList.remove(
                "active"
            );
        }
    );

    const target =
        $(
            section +
            "Section"
        );

    if (target) {
        target.classList.add(
            "active"
        );
    }

    all(
        ".sidebar-nav .nav-link"
    ).forEach(
        function (link) {

            if (
                link.id === "logoutBtn"
            ) {
                return;
            }

            link.classList.toggle(
                "active",
                link.dataset.section ===
                    section
            );
        }
    );

    const titles = {
        dashboard: [
            "Dashboard",
            "Welcome back! Here's what's happening today."
        ],
        customers: [
            "Customers",
            "Manage your workshop customers."
        ],
        vehicles: [
            "Vehicles",
            "Manage all registered vehicles."
        ],
        services: [
            "Service Bookings",
            "Schedule and manage vehicle services."
        ],
        history: [
            "Service History",
            "View completed and previous services."
        ],
        reports: [
            "Reports",
            "View workshop performance."
        ],
        settings: [
            "Settings",
            "Configure your AutoCare system."
        ]
    };

    if (titles[section]) {
        setText(
            "pageTitle",
            titles[section][0]
        );

        setText(
            "pageSubtitle",
            titles[section][1]
        );
    }

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

/* =========================================================
   SIDEBAR
========================================================= */

function setupSidebar() {

    const menuToggle =
        $("menuToggle");

    const sidebar =
        $("sidebar");

    const overlay =
        $("sidebarOverlay");

    if (menuToggle) {
        menuToggle.addEventListener(
            "click",
            function () {

                if (sidebar) {
                    sidebar.classList.toggle(
                        "open"
                    );
                }

                if (overlay) {
                    overlay.classList.toggle(
                        "show"
                    );
                }
            }
        );
    }

    if (overlay) {
        overlay.addEventListener(
            "click",
            function () {

                sidebar?.classList.remove(
                    "open"
                );

                overlay.classList.remove(
                    "show"
                );
            }
        );
    }
}

/* =========================================================
   MODALS
========================================================= */

function openModal(id) {
    const modal = $(id);

    if (!modal) return;

    modal.style.display = "flex";

    modal.classList.add(
        "show"
    );

    modal.setAttribute(
        "aria-hidden",
        "false"
    );
}

function closeModal(idOrElement) {

    const modal =
        typeof idOrElement === "string"
            ? $(idOrElement)
            : idOrElement;

    if (!modal) return;

    modal.style.display = "none";

    modal.classList.remove(
        "show"
    );

    modal.setAttribute(
        "aria-hidden",
        "true"
    );
}

function closeAllModals() {
    all(
        ".modal-overlay"
    ).forEach(
        function (modal) {
            closeModal(modal);
        }
    );
}

function setupModalClose() {

    all(
        "[data-close-modal]"
    ).forEach(
        function (button) {

            button.addEventListener(
                "click",
                function () {

                    closeModal(
                        button.dataset.closeModal
                    );
                }
            );
        }
    );

    all(
        ".modal-overlay"
    ).forEach(
        function (overlay) {

            overlay.addEventListener(
                "click",
                function (event) {

                    if (
                        event.target ===
                        overlay
                    ) {
                        closeModal(
                            overlay
                        );
                    }
                }
            );
        }
    );

    document.addEventListener(
        "keydown",
        function (event) {

            if (
                event.key === "Escape"
            ) {
                closeAllModals();
            }
        }
    );
}

/* =========================================================
   CUSTOMER
========================================================= */

function setupCustomers() {

    $("addCustomerBtn")
        ?.addEventListener(
            "click",
            function () {
                openCustomerModal();
            }
        );

    $("emptyAddCustomerBtn")
        ?.addEventListener(
            "click",
            function () {
                openCustomerModal();
            }
        );

    $("quickAddCustomer")
        ?.addEventListener(
            "click",
            function () {
                openCustomerModal();
            }
        );

    $("customerSearch")
        ?.addEventListener(
            "input",
            renderCustomers
        );

    $("customerForm")
        ?.addEventListener(
            "submit",
            function (event) {

                event.preventDefault();

                saveCustomer();
            }
        );
}

function openCustomerModal(
    customerId = null
) {

    editingCustomerId =
        customerId;

    const form =
        $("customerForm");

    if (form) {
        form.reset();
    }

    if (customerId) {

        const customer =
            customers.find(
                function (item) {
                    return (
                        item.id ===
                        customerId
                    );
                }
            );

        if (!customer) return;

        setValue(
            "customerName",
            customer.name
        );

        setValue(
            "customerPhone",
            customer.phone
        );

        setValue(
            "customerEmail",
            customer.email
        );

        setValue(
            "customerAddress",
            customer.address
        );

        setText(
            "customerModalTitle",
            "Edit Customer"
        );

    } else {

        setText(
            "customerModalTitle",
            "Add Customer"
        );
    }

    openModal(
        "customerModal"
    );
}

function saveCustomer() {

    const name =
        value("customerName");

    const phone =
        value("customerPhone");

    const email =
        value("customerEmail");

    const address =
        value("customerAddress");

    if (!name || !phone) {

        showToast(
            "Missing Information",
            "Name and phone number are required.",
            "warning"
        );

        return;
    }

    if (editingCustomerId) {

        const customer =
            customers.find(
                function (item) {
                    return (
                        item.id ===
                        editingCustomerId
                    );
                }
            );

        if (customer) {

            customer.name =
                name;

            customer.phone =
                phone;

            customer.email =
                email;

            customer.address =
                address;
        }

        addActivity(
            "Customer updated",
            `${name}'s information was updated.`
        );

        showToast(
            "Customer Updated",
            "Customer updated successfully.",
            "success"
        );

    } else {

        customers.push({
            id: generateId("CUS"),
            name,
            phone,
            email,
            address,
            createdAt:
                new Date().toISOString()
        });

        addActivity(
            "Customer added",
            `${name} was added to the system.`
        );

        showToast(
            "Customer Added",
            `${name} was added successfully.`,
            "success"
        );
    }

    saveAll();

    closeModal(
        "customerModal"
    );

    editingCustomerId =
        null;

    renderAll();
}

function renderCustomers() {

    const table =
        $("customersTable");

    if (!table) return;

    const search =
        value("customerSearch")
            .toLowerCase();

    const filtered =
        customers.filter(
            function (customer) {

                const text =
                    `${customer.name}
                    ${customer.phone}
                    ${customer.email}
                    ${customer.address}`
                        .toLowerCase();

                return text.includes(
                    search
                );
            }
        );

    table.innerHTML = "";

    setText(
        "customerCountText",
        `${customers.length} customer${
            customers.length === 1
                ? ""
                : "s"
        } registered`
    );

    if (filtered.length === 0) {

        table.innerHTML = `
            <tr class="empty-row">
                <td colspan="6">
                    <div class="empty-state">
                        <div class="empty-icon">
                            <i class="fa-solid fa-users"></i>
                        </div>
                        <h4>No customers found</h4>
                        <p>Add a customer to get started.</p>
                    </div>
                </td>
            </tr>
        `;

        return;
    }

    filtered.forEach(
        function (customer) {

            const vehicleCount =
                vehicles.filter(
                    function (vehicle) {
                        return (
                            vehicle.ownerId ===
                            customer.id
                        );
                    }
                ).length;

            const row =
                document.createElement(
                    "tr"
                );

            row.innerHTML = `
                <td>
                    <strong>
                        ${escapeHTML(customer.name)}
                    </strong>
                </td>

                <td>
                    ${escapeHTML(customer.phone)}
                </td>

                <td>
                    ${escapeHTML(customer.email || "-")}
                </td>

                <td>
                    ${vehicleCount}
                </td>

                <td>
                    ${formatDate(
                        customer.createdAt
                            ?.split("T")[0]
                    )}
                </td>

                <td>
                    <div class="table-actions">

                        <button
                            class="icon-btn"
                            title="Edit"
                            onclick="window.editCustomer('${customer.id}')"
                        >
                            <i class="fa-solid fa-pen"></i>
                        </button>

                        <button
                            class="icon-btn danger"
                            title="Delete"
                            onclick="window.deleteCustomer('${customer.id}')"
                        >
                            <i class="fa-solid fa-trash"></i>
                        </button>

                    </div>
                </td>
            `;

            table.appendChild(
                row
            );
        }
    );
}

window.editCustomer =
    function (id) {
        openCustomerModal(id);
    };

window.deleteCustomer =
    function (id) {

        const customer =
            customers.find(
                function (item) {
                    return (
                        item.id === id
                    );
                }
            );

        if (!customer) return;

        askConfirmation(
            "Delete Customer",
            `Delete ${customer.name}?`,
            function () {

                customers =
                    customers.filter(
                        function (item) {
                            return (
                                item.id !==
                                id
                            );
                        }
                    );

                saveAll();

                addActivity(
                    "Customer deleted",
                    `${customer.name} was removed.`
                );

                renderAll();

                showToast(
                    "Customer Deleted",
                    "Customer removed successfully.",
                    "success"
                );
            }
        );
    };

/* =========================================================
   VEHICLES
========================================================= */

function setupVehicles() {

    $("addVehicleBtn")
        ?.addEventListener(
            "click",
            function () {
                openVehicleModal();
            }
        );

    $("emptyAddVehicleBtn")
        ?.addEventListener(
            "click",
            function () {
                openVehicleModal();
            }
        );

    $("quickAddVehicle")
        ?.addEventListener(
            "click",
            function () {
                openVehicleModal();
            }
        );

    $("vehicleSearch")
        ?.addEventListener(
            "input",
            renderVehicles
        );

    $("vehicleForm")
        ?.addEventListener(
            "submit",
            function (event) {

                event.preventDefault();

                saveVehicle();
            }
        );
}

function populateVehicleOwnerSelect() {

    const select =
        $("vehicleOwner");

    if (!select) return;

    const current =
        select.value;

    select.innerHTML = `
        <option value="">
            Select customer
        </option>
    `;

    customers.forEach(
        function (customer) {

            const option =
                document.createElement(
                    "option"
                );

            option.value =
                customer.id;

            option.textContent =
                customer.name +
                " - " +
                customer.phone;

            select.appendChild(
                option
            );
        }
    );

    select.value =
        current;
}

function openVehicleModal(
    vehicleId = null
) {

    editingVehicleId =
        vehicleId;

    populateVehicleOwnerSelect();

    const form =
        $("vehicleForm");

    if (form) {
        form.reset();
    }

    populateVehicleOwnerSelect();

    if (vehicleId) {

        const vehicle =
            vehicles.find(
                function (item) {
                    return (
                        item.id ===
                        vehicleId
                    );
                }
            );

        if (!vehicle) return;

        setValue(
            "vehicleOwner",
            vehicle.ownerId
        );

        setValue(
            "vehicleRegistration",
            vehicle.registration
        );

        setValue(
            "vehicleType",
            vehicle.type
        );

        setValue(
            "vehicleBrand",
            vehicle.brand
        );

        setValue(
            "vehicleModel",
            vehicle.model
        );

        setValue(
            "vehicleYear",
            vehicle.year
        );

        setValue(
            "vehicleColor",
            vehicle.color
        );

        setText(
            "vehicleModalTitle",
            "Edit Vehicle"
        );

    } else {

        setText(
            "vehicleModalTitle",
            "Add Vehicle"
        );
    }

    openModal(
        "vehicleModal"
    );
}

function saveVehicle() {

    const ownerId =
        value("vehicleOwner");

    const registration =
        value(
            "vehicleRegistration"
        ).toUpperCase();

    const type =
        value("vehicleType");

    const brand =
        value("vehicleBrand");

    const model =
        value("vehicleModel");

    const year =
        value("vehicleYear");

    const color =
        value("vehicleColor");

    if (
        !ownerId ||
        !registration ||
        !type ||
        !brand ||
        !model
    ) {

        showToast(
            "Missing Information",
            "Please fill all required vehicle details.",
            "warning"
        );

        return;
    }

    const duplicate =
        vehicles.find(
            function (vehicle) {

                return (
                    vehicle.registration.toLowerCase() ===
                        registration.toLowerCase() &&
                    vehicle.id !==
                        editingVehicleId
                );
            }
        );

    if (duplicate) {

        showToast(
            "Duplicate Registration",
            "This registration number already exists.",
            "warning"
        );

        return;
    }

    const owner =
        customers.find(
            function (customer) {
                return (
                    customer.id ===
                    ownerId
                );
            }
        );

    if (editingVehicleId) {

        const vehicle =
            vehicles.find(
                function (item) {
                    return (
                        item.id ===
                        editingVehicleId
                    );
                }
            );

        if (vehicle) {

            vehicle.ownerId =
                ownerId;

            vehicle.ownerName =
                owner
                    ? owner.name
                    : "";

            vehicle.registration =
                registration;

            vehicle.type =
                type;

            vehicle.brand =
                brand;

            vehicle.model =
                model;

            vehicle.year =
                year;

            vehicle.color =
                color;
        }

        addActivity(
            "Vehicle updated",
            `${registration} was updated.`
        );

        showToast(
            "Vehicle Updated",
            "Vehicle updated successfully.",
            "success"
        );

    } else {

        vehicles.push({
            id: generateId("VEH"),
            ownerId,
            ownerName:
                owner
                    ? owner.name
                    : "",
            registration,
            type,
            brand,
            model,
            year,
            color,
            lastService: "",
            createdAt:
                new Date().toISOString()
        });

        addActivity(
            "Vehicle added",
            `${registration} was registered.`
        );

        showToast(
            "Vehicle Added",
            `${registration} registered successfully.`,
            "success"
        );
    }

    saveAll();

    closeModal(
        "vehicleModal"
    );

    editingVehicleId =
        null;

    renderAll();
}

function renderVehicles() {

    const table =
        $("vehiclesTable");

    if (!table) return;

    const search =
        value("vehicleSearch")
            .toLowerCase();

    const filtered =
        vehicles.filter(
            function (vehicle) {

                const owner =
                    customers.find(
                        function (customer) {
                            return (
                                customer.id ===
                                vehicle.ownerId
                            );
                        }
                    );

                const text =
                    `${vehicle.registration}
                    ${vehicle.brand}
                    ${vehicle.model}
                    ${vehicle.type}
                    ${owner?.name || ""}`
                        .toLowerCase();

                return text.includes(
                    search
                );
            }
        );

    table.innerHTML = "";

    setText(
        "vehicleCountText",
        `${vehicles.length} vehicle${
            vehicles.length === 1
                ? ""
                : "s"
        } registered`
    );

    if (!filtered.length) {

        table.innerHTML = `
            <tr class="empty-row">
                <td colspan="6">
                    <div class="empty-state">
                        <div class="empty-icon">
                            <i class="fa-solid fa-car"></i>
                        </div>
                        <h4>No vehicles found</h4>
                        <p>Register your first vehicle.</p>
                    </div>
                </td>
            </tr>
        `;

        return;
    }

    filtered.forEach(
        function (vehicle) {

            const owner =
                customers.find(
                    function (customer) {
                        return (
                            customer.id ===
                            vehicle.ownerId
                        );
                    }
                );

            const lastService =
                services
                    .filter(
                        function (service) {
                            return (
                                service.vehicleId ===
                                vehicle.id
                            );
                        }
                    )
                    .sort(
                        function (a, b) {
                            return (
                                new Date(
                                    b.serviceDate
                                ) -
                                new Date(
                                    a.serviceDate
                                )
                            );
                        }
                    )[0];

            const row =
                document.createElement(
                    "tr"
                );

            row.innerHTML = `
                <td>
                    <strong>
                        ${escapeHTML(
                            vehicle.brand
                        )}
                        ${escapeHTML(
                            vehicle.model
                        )}
                    </strong>
                    <small style="display:block;color:#94a3b8;">
                        ${escapeHTML(
                            vehicle.type
                        )}
                    </small>
                </td>

                <td>
                    <strong>
                        ${escapeHTML(
                            vehicle.registration
                        )}
                    </strong>
                </td>

                <td>
                    ${escapeHTML(
                        owner?.name || "-"
                    )}
                </td>

                <td>
                    ${escapeHTML(
                        vehicle.year || "-"
                    )}
                </td>

                <td>
                    ${
                        lastService
                            ? formatDate(
                                  lastService.serviceDate
                              )
                            : "Never"
                    }
                </td>

                <td>
                    <div class="table-actions">

                        <button
                            class="icon-btn"
                            title="Edit"
                            onclick="window.editVehicle('${vehicle.id}')"
                        >
                            <i class="fa-solid fa-pen"></i>
                        </button>

                        <button
                            class="icon-btn danger"
                            title="Delete"
                            onclick="window.deleteVehicle('${vehicle.id}')"
                        >
                            <i class="fa-solid fa-trash"></i>
                        </button>

                    </div>
                </td>
            `;

            table.appendChild(
                row
            );
        }
    );
}

window.editVehicle =
    function (id) {
        openVehicleModal(id);
    };

window.deleteVehicle =
    function (id) {

        const vehicle =
            vehicles.find(
                function (item) {
                    return (
                        item.id === id
                    );
                }
            );

        if (!vehicle) return;

        askConfirmation(
            "Delete Vehicle",
            `Delete ${vehicle.registration}?`,
            function () {

                vehicles =
                    vehicles.filter(
                        function (item) {
                            return (
                                item.id !==
                                id
                            );
                        }
                    );

                saveAll();

                addActivity(
                    "Vehicle deleted",
                    `${vehicle.registration} was removed.`
                );

                renderAll();

                showToast(
                    "Vehicle Deleted",
                    "Vehicle removed successfully.",
                    "success"
                );
            }
        );
    };

/* =========================================================
   SERVICES
========================================================= */

function setupServices() {

    $("addServiceBtn")
        ?.addEventListener(
            "click",
            function () {
                openServiceModal();
            }
        );

    $("emptyAddServiceBtn")
        ?.addEventListener(
            "click",
            function () {
                openServiceModal();
            }
        );

    $("quickBookService")
        ?.addEventListener(
            "click",
            function () {
                openServiceModal();
            }
        );

    $("welcomeBookServiceBtn")
        ?.addEventListener(
            "click",
            function () {
                openServiceModal();
            }
        );

    $("serviceSearch")
        ?.addEventListener(
            "input",
            renderServices
        );

    $("serviceStatusFilter")
        ?.addEventListener(
            "change",
            renderServices
        );

    $("serviceDateFilter")
        ?.addEventListener(
            "change",
            renderServices
        );

    $("clearServiceFilters")
        ?.addEventListener(
            "click",
            function () {

                setValue(
                    "serviceStatusFilter",
                    "all"
                );

                setValue(
                    "serviceDateFilter",
                    ""
                );

                setValue(
                    "serviceSearch",
                    ""
                );

                renderServices();
            }
        );

    $("serviceCustomer")
        ?.addEventListener(
            "change",
            function () {

                populateServiceVehicles(
                    value("serviceCustomer")
                );
            }
        );

    $("serviceForm")
        ?.addEventListener(
            "submit",
            function (event) {

                event.preventDefault();

                saveService();
            }
        );
}

function populateServiceCustomers() {

    const select =
        $("serviceCustomer");

    if (!select) return;

    const current =
        select.value;

    select.innerHTML = `
        <option value="">
            Select customer
        </option>
    `;

    customers.forEach(
        function (customer) {

            const option =
                document.createElement(
                    "option"
                );

            option.value =
                customer.id;

            option.textContent =
                customer.name +
                " - " +
                customer.phone;

            select.appendChild(
                option
            );
        }
    );

    select.value =
        current;
}

function populateServiceVehicles(
    customerId
) {

    const select =
        $("serviceVehicle");

    if (!select) return;

    const current =
        select.value;

    select.innerHTML = `
        <option value="">
            Select vehicle
        </option>
    `;

    vehicles
        .filter(
            function (vehicle) {

                return (
                    !customerId ||
                    vehicle.ownerId ===
                        customerId
                );
            }
        )
        .forEach(
            function (vehicle) {

                const option =
                    document.createElement(
                        "option"
                    );

                option.value =
                    vehicle.id;

                option.textContent =
                    vehicle.registration +
                    " - " +
                    vehicle.brand +
                    " " +
                    vehicle.model;

                select.appendChild(
                    option
                );
            }
        );

    select.value =
        current;
}

function openServiceModal(
    serviceId = null
) {

    editingServiceId =
        serviceId;

    const form =
        $("serviceForm");

    if (form) {
        form.reset();
    }

    populateServiceCustomers();

    populateServiceVehicles("");

    if (serviceId) {

        const service =
            services.find(
                function (item) {
                    return (
                        item.id ===
                        serviceId
                    );
                }
            );

        if (!service) return;

        setValue(
            "serviceCustomer",
            service.customerId
        );

        populateServiceVehicles(
            service.customerId
        );

        setValue(
            "serviceVehicle",
            service.vehicleId
        );

        setValue(
            "serviceType",
            service.serviceType
        );

        setValue(
            "serviceDate",
            service.serviceDate
        );

        setValue(
            "serviceMechanic",
            service.mechanic
        );

        setValue(
            "serviceCost",
            service.cost
        );

        setValue(
            "serviceStatus",
            service.status
        );

        setValue(
            "serviceMileage",
            service.mileage
        );

        setValue(
            "serviceNotes",
            service.notes
        );

        setText(
            "serviceModalTitle",
            "Edit Service Booking"
        );

    } else {

        setValue(
            "serviceDate",
            today()
        );

        setValue(
            "serviceStatus",
            "booked"
        );

        setText(
            "serviceModalTitle",
            "New Service Booking"
        );
    }

    openModal(
        "serviceModal"
    );
}

function saveService() {

    const customerId =
        value("serviceCustomer");

    const vehicleId =
        value("serviceVehicle");

    const serviceType =
        value("serviceType");

    const serviceDate =
        value("serviceDate");

    const mechanic =
        value("serviceMechanic");

    const cost =
        Number(
            value("serviceCost")
        ) || 0;

    const status =
        value("serviceStatus") ||
        "booked";

    const mileage =
        value("serviceMileage");

    const notes =
        value("serviceNotes");

    if (
        !customerId ||
        !vehicleId ||
        !serviceType ||
        !serviceDate
    ) {

        showToast(
            "Missing Information",
            "Customer, vehicle, service and date are required.",
            "warning"
        );

        return;
    }

    const customer =
        customers.find(
            function (item) {
                return (
                    item.id ===
                    customerId
                );
            }
        );

    const vehicle =
        vehicles.find(
            function (item) {
                return (
                    item.id ===
                    vehicleId
                );
            }
        );

    if (!customer || !vehicle) {

        showToast(
            "Invalid Selection",
            "Please select a valid customer and vehicle.",
            "warning"
        );

        return;
    }

    if (editingServiceId) {

        const service =
            services.find(
                function (item) {
                    return (
                        item.id ===
                        editingServiceId
                    );
                }
            );

        if (service) {

            service.customerId =
                customerId;

            service.vehicleId =
                vehicleId;

            service.customerName =
                customer.name;

            service.registration =
                vehicle.registration;

            service.vehicleName =
                `${vehicle.brand} ${vehicle.model}`;

            service.serviceType =
                serviceType;

            service.serviceDate =
                serviceDate;

            service.mechanic =
                mechanic;

            service.cost =
                cost;

            service.status =
                status;

            service.mileage =
                mileage;

            service.notes =
                notes;

            service.updatedAt =
                new Date().toISOString();
        }

        addActivity(
            "Service booking updated",
            `${vehicle.registration} - ${serviceType}`
        );

        showToast(
            "Booking Updated",
            "Service booking updated successfully.",
            "success"
        );

    } else {

        services.push({
            id: generateId("SRV"),

            customerId,
            vehicleId,

            customerName:
                customer.name,

            registration:
                vehicle.registration,

            vehicleName:
                `${vehicle.brand} ${vehicle.model}`,

            serviceType,
            serviceDate,
            mechanic,
            cost,
            status,
            mileage,
            notes,

            createdAt:
                new Date().toISOString(),

            updatedAt:
                new Date().toISOString()
        });

        addActivity(
            "New service booking",
            `${vehicle.registration} booked for ${serviceType}.`
        );

        showToast(
            "Booking Created",
            "Service booking created successfully.",
            "success"
        );
    }

    saveAll();

    closeModal(
        "serviceModal"
    );

    editingServiceId =
        null;

    renderAll();
}

function renderServices() {

    const table =
        $("servicesTable");

    if (!table) return;

    const search =
        value("serviceSearch")
            .toLowerCase();

    const status =
        value(
            "serviceStatusFilter"
        );

    const dateFilter =
        value(
            "serviceDateFilter"
        );

    const filtered =
        services
            .filter(
                function (service) {

                    const text =
                        `${service.id}
                        ${service.customerName}
                        ${service.registration}
                        ${service.vehicleName}
                        ${service.serviceType}
                        ${service.status}
                        ${service.mechanic}`
                            .toLowerCase();

                    return text.includes(
                        search
                    );
                }
            )
            .filter(
                function (service) {

                    if (
                        !status ||
                        status === "all"
                    ) {
                        return true;
                    }

                    return (
                        service.status ===
                        status
                    );
                }
            )
            .filter(
                function (service) {

                    if (!dateFilter) {
                        return true;
                    }

                    return (
                        service.serviceDate ===
                        dateFilter
                    );
                }
            )
            .sort(
                function (a, b) {

                    return (
                        new Date(
                            a.serviceDate
                        ) -
                        new Date(
                            b.serviceDate
                        )
                    );
                }
            );

    table.innerHTML = "";

    setText(
        "serviceCountText",
        `${services.length} booking${
            services.length === 1
                ? ""
                : "s"
        }`
    );

    if (!filtered.length) {

        table.innerHTML = `
            <tr class="empty-row">
                <td colspan="8">
                    <div class="empty-state">
                        <div class="empty-icon">
                            <i class="fa-solid fa-screwdriver-wrench"></i>
                        </div>
                        <h4>No service bookings</h4>
                        <p>Create a new booking to see it here.</p>
                    </div>
                </td>
            </tr>
        `;

        return;
    }

    filtered.forEach(
        function (service) {

            const row =
                document.createElement(
                    "tr"
                );

            row.innerHTML = `
                <td>
                    <strong>
                        ${escapeHTML(
                            service.id
                        )}
                    </strong>
                </td>

                <td>
                    ${escapeHTML(
                        service.customerName
                    )}
                </td>

                <td>
                    <strong>
                        ${escapeHTML(
                            service.registration
                        )}
                    </strong>
                    <small style="display:block;color:#94a3b8;">
                        ${escapeHTML(
                            service.vehicleName
                        )}
                    </small>
                </td>

                <td>
                    ${escapeHTML(
                        service.serviceType
                    )}
                </td>

                <td>
                    ${formatDate(
                        service.serviceDate
                    )}
                </td>

                <td>
                    ${formatCurrency(
                        service.cost
                    )}
                </td>

                <td>
                    <span class="badge ${getStatusClass(service.status)}">
                        ${escapeHTML(
                            statusLabel(
                                service.status
                            )
                        )}
                    </span>
                </td>

                <td>
                    <div class="table-actions">

                        <button
                            class="icon-btn"
                            title="View"
                            onclick="window.viewService('${service.id}')"
                        >
                            <i class="fa-solid fa-eye"></i>
                        </button>

                        <button
                            class="icon-btn"
                            title="Edit"
                            onclick="window.editService('${service.id}')"
                        >
                            <i class="fa-solid fa-pen"></i>
                        </button>

                        <button
                            class="icon-btn danger"
                            title="Delete"
                            onclick="window.deleteService('${service.id}')"
                        >
                            <i class="fa-solid fa-trash"></i>
                        </button>

                    </div>
                </td>
            `;

            table.appendChild(
                row
            );
        }
    );
}

function statusLabel(status) {

    const labels = {
        "booked": "Booked",
        "in-service": "In Service",
        "completed": "Completed",
        "delivered": "Delivered"
    };

    return (
        labels[status] ||
        status
    );
}

function getStatusClass(status) {

    if (
        status === "booked"
    ) {
        return "pending";
    }

    if (
        status === "in-service"
    ) {
        return "in-progress";
    }

    if (
        status === "completed"
    ) {
        return "completed";
    }

    if (
        status === "delivered"
    ) {
        return "confirmed";
    }

    return "pending";
}

window.viewService =
    function (id) {

        const service =
            services.find(
                function (item) {
                    return (
                        item.id === id
                    );
                }
            );

        if (!service) return;

        const content =
            $("serviceDetailsContent");

        if (!content) return;

        content.innerHTML = `
            <div class="detail-box">
                <span>Booking ID</span>
                <strong>
                    ${escapeHTML(service.id)}
                </strong>
            </div>

            <div class="detail-box">
                <span>Customer</span>
                <strong>
                    ${escapeHTML(service.customerName)}
                </strong>
            </div>

            <div class="detail-box">
                <span>Vehicle</span>
                <strong>
                    ${escapeHTML(service.registration)}
                </strong>
            </div>

            <div class="detail-box">
                <span>Vehicle Model</span>
                <strong>
                    ${escapeHTML(service.vehicleName)}
                </strong>
            </div>

            <div class="detail-box">
                <span>Service</span>
                <strong>
                    ${escapeHTML(service.serviceType)}
                </strong>
            </div>

            <div class="detail-box">
                <span>Date</span>
                <strong>
                    ${formatDate(service.serviceDate)}
                </strong>
            </div>

            <div class="detail-box">
                <span>Mechanic</span>
                <strong>
                    ${escapeHTML(
                        service.mechanic || "-"
                    )}
                </strong>
            </div>

            <div class="detail-box">
                <span>Cost</span>
                <strong>
                    ${formatCurrency(
                        service.cost
                    )}
                </strong>
            </div>

            <div class="detail-box">
                <span>Status</span>
                <strong>
                    <span class="badge ${getStatusClass(service.status)}">
                        ${statusLabel(
                            service.status
                        )}
                    </span>
                </strong>
            </div>

            <div class="detail-box">
                <span>Mileage</span>
                <strong>
                    ${escapeHTML(
                        service.mileage || "-"
                    )}
                </strong>
            </div>

            <div class="detail-box full">
                <span>Notes</span>
                <strong>
                    ${escapeHTML(
                        service.notes ||
                        "No notes added."
                    )}
                </strong>
            </div>
        `;

        openModal(
            "viewServiceModal"
        );
    };

window.editService =
    function (id) {
        openServiceModal(id);
    };

window.deleteService =
    function (id) {

        const service =
            services.find(
                function (item) {
                    return (
                        item.id === id
                    );
                }
            );

        if (!service) return;

        askConfirmation(
            "Delete Service",
            `Delete booking ${service.id}?`,
            function () {

                services =
                    services.filter(
                        function (item) {
                            return (
                                item.id !==
                                id
                            );
                        }
                    );

                saveAll();

                addActivity(
                    "Service deleted",
                    `${service.registration} - ${service.serviceType}`
                );

                renderAll();

                showToast(
                    "Booking Deleted",
                    "Service booking deleted successfully.",
                    "success"
                );
            }
        );
    };

/* =========================================================
   HISTORY
========================================================= */

function setupHistory() {

    $("historySearch")
        ?.addEventListener(
            "input",
            renderHistory
        );

    $("exportHistoryBtn")
        ?.addEventListener(
            "click",
            exportHistory
        );
}

function renderHistory() {

    const table =
        $("historyTable");

    if (!table) return;

    const search =
        value("historySearch")
            .toLowerCase();

    const history =
        services
            .filter(
                function (service) {

                    return (
                        service.status ===
                        "completed"
                    );
                }
            )
            .filter(
                function (service) {

                    const text =
                        `${service.id}
                        ${service.customerName}
                        ${service.registration}
                        ${service.vehicleName}
                        ${service.serviceType}`
                            .toLowerCase();

                    return text.includes(
                        search
                    );
                }
            )
            .sort(
                function (a, b) {

                    return (
                        new Date(
                            b.serviceDate
                        ) -
                        new Date(
                            a.serviceDate
                        )
                    );
                }
            );

    table.innerHTML = "";

    if (!history.length) {

        table.innerHTML = `
            <tr class="empty-row">
                <td colspan="8">
                    <div class="empty-state">
                        <div class="empty-icon">
                            <i class="fa-solid fa-clock-rotate-left"></i>
                        </div>
                        <h4>No service history</h4>
                        <p>Completed services will appear here.</p>
                    </div>
                </td>
            </tr>
        `;

        return;
    }

    history.forEach(
        function (service) {

            const row =
                document.createElement(
                    "tr"
                );

            row.innerHTML = `
                <td>
                    ${escapeHTML(
                        service.id
                    )}
                </td>

                <td>
                    ${escapeHTML(
                        service.customerName
                    )}
                </td>

                <td>
                    ${escapeHTML(
                        service.registration
                    )}
                </td>

                <td>
                    ${escapeHTML(
                        service.serviceType
                    )}
                </td>

                <td>
                    ${formatDate(
                        service.serviceDate
                    )}
                </td>

                <td>
                    ${formatCurrency(
                        service.cost
                    )}
                </td>

                <td>
                    <span class="badge completed">
                        Completed
                    </span>
                </td>

                <td>
                    <button
                        class="icon-btn"
                        onclick="window.viewService('${service.id}')"
                        title="View"
                    >
                        <i class="fa-solid fa-eye"></i>
                    </button>
                </td>
            `;

            table.appendChild(
                row
            );
        }
    );
}

function exportHistory() {

    const history =
        services.filter(
            function (service) {
                return (
                    service.status ===
                    "completed"
                );
            }
        );

    if (!history.length) {

        showToast(
            "Nothing to Export",
            "There is no completed service history.",
            "warning"
        );

        return;
    }

    const rows = [
        [
            "Booking ID",
            "Customer",
            "Vehicle",
            "Service",
            "Date",
            "Cost",
            "Status"
        ]
    ];

    history.forEach(
        function (service) {

            rows.push([
                service.id,
                service.customerName,
                service.registration,
                service.serviceType,
                service.serviceDate,
                service.cost,
                service.status
            ]);
        }
    );

    const csv =
        rows
            .map(
                function (row) {
                    return row
                        .map(
                            function (cell) {
                                return `"${String(
                                    cell ?? ""
                                ).replace(
                                    /"/g,
                                    '""'
                                )}"`;
                            }
                        )
                        .join(",");
                }
            )
            .join("\n");

    const blob =
        new Blob(
            [csv],
            {
                type:
                    "text/csv;charset=utf-8;"
            }
        );

    const url =
        URL.createObjectURL(
            blob
        );

    const link =
        document.createElement(
            "a"
        );

    link.href = url;

    link.download =
        `autocare-history-${today()}.csv`;

    document.body.appendChild(
        link
    );

    link.click();

    link.remove();

    URL.revokeObjectURL(
        url
    );

    showToast(
        "Export Complete",
        "Service history exported successfully.",
        "success"
    );
}

/* =========================================================
   DASHBOARD
========================================================= */

function renderDashboard() {

    setText(
        "totalCustomers",
        customers.length
    );

    setText(
        "totalVehicles",
        vehicles.length
    );

    const pending =
        services.filter(
            function (service) {
                return (
                    service.status ===
                    "booked"
                );
            }
        ).length;

    const completed =
        services.filter(
            function (service) {
                return (
                    service.status ===
                    "completed"
                );
            }
        ).length;

    setText(
        "pendingServices",
        pending
    );

    setText(
        "completedServices",
        completed
    );

    renderUpcoming();

    renderActivity();

    updateCurrentYear();
}

function renderUpcoming() {

    const table =
        $("upcomingServicesTable");

    if (!table) return;

    const upcoming =
        services
            .filter(
                function (service) {

                    return (
                        service.serviceDate >=
                            today() &&
                        service.status !==
                            "delivered"
                    );
                }
            )
            .sort(
                function (a, b) {
                    return (
                        new Date(
                            a.serviceDate
                        ) -
                        new Date(
                            b.serviceDate
                        )
                    );
                }
            )
            .slice(0, 5);

    table.innerHTML = "";

    if (!upcoming.length) {

        table.innerHTML = `
            <tr class="empty-row">
                <td colspan="5">
                    <div class="empty-state small">
                        <i class="fa-solid fa-calendar-xmark"></i>
                        <p>No upcoming services</p>
                    </div>
                </td>
            </tr>
        `;

        return;
    }

    upcoming.forEach(
        function (service) {

            const row =
                document.createElement(
                    "tr"
                );

            row.innerHTML = `
                <td>
                    ${escapeHTML(
                        service.customerName
                    )}
                </td>

                <td>
                    <strong>
                        ${escapeHTML(
                            service.registration
                        )}
                    </strong>
                </td>

                <td>
                    ${escapeHTML(
                        service.serviceType
                    )}
                </td>

                <td>
                    ${formatDate(
                        service.serviceDate
                    )}
                </td>

                <td>
                    <span class="badge ${getStatusClass(service.status)}">
                        ${statusLabel(
                            service.status
                        )}
                    </span>
                </td>
            `;

            table.appendChild(
                row
            );
        }
    );
}

/* =========================================================
   ACTIVITY
========================================================= */

function addActivity(
    title,
    description
) {

    activities.unshift({
        id: generateId("ACT"),
        title,
        description,
        createdAt:
            new Date().toISOString()
    });

    activities =
        activities.slice(
            0,
            50
        );
}

function renderActivity() {

    const list =
        $("activityList");

    if (!list) return;

    const recent =
        activities.slice(
            0,
            7
        );

    if (!recent.length) {

        list.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">
                    <i class="fa-solid fa-bolt"></i>
                </div>
                <h4>No recent activity</h4>
                <p>Your recent actions will appear here.</p>
            </div>
        `;

        return;
    }

    list.innerHTML = "";

    recent.forEach(
        function (activity) {

            const div =
                document.createElement(
                    "div"
                );

            div.className =
                "activity-item";

            div.innerHTML = `
                <div class="activity-dot"></div>

                <div class="activity-content">

                    <strong>
                        ${escapeHTML(
                            activity.title
                        )}
                    </strong>

                    <p>
                        ${escapeHTML(
                            activity.description
                        )}
                    </p>

                    <p>
                        ${formatDateTime(
                            activity.createdAt
                        )}
                    </p>

                </div>
            `;

            list.appendChild(
                div
            );
        }
    );
}

function formatDateTime(
    dateString
) {

    if (!dateString) {
        return "-";
    }

    const date =
        new Date(
            dateString
        );

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return "-";
    }

    return date.toLocaleString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        }
    );
}

/* =========================================================
   CLEAR ACTIVITY
========================================================= */

function setupActivity() {

    $("clearActivityBtn")
        ?.addEventListener(
            "click",
            function () {

                if (
                    !activities.length
                ) {
                    showToast(
                        "No Activity",
                        "There is no activity to clear.",
                        "info"
                    );

                    return;
                }

                askConfirmation(
                    "Clear Activity",
                    "Clear recent activity?",
                    function () {

                        activities = [];

                        saveAll();

                        renderActivity();

                        showToast(
                            "Activity Cleared",
                            "Recent activity has been removed.",
                            "success"
                        );
                    }
                );
            }
        );
}

/* =========================================================
   REPORTS
========================================================= */

function renderReports() {

    const completed =
        services.filter(
            function (service) {
                return (
                    service.status ===
                    "completed"
                );
            }
        );

    const booked =
        services.filter(
            function (service) {
                return (
                    service.status ===
                    "booked"
                );
            }
        );

    const inService =
        services.filter(
            function (service) {
                return (
                    service.status ===
                    "in-service"
                );
            }
        );

    const delivered =
        services.filter(
            function (service) {
                return (
                    service.status ===
                    "delivered"
                );
            }
        );

    const revenue =
        completed.reduce(
            function (total, service) {
                return (
                    total +
                    Number(
                        service.cost
                    ) ||
                    0
                );
            },
            0
        );

    setText(
        "totalRevenue",
        formatCurrency(
            revenue
        )
    );

    setText(
        "mostServicedCount",
        mostServicedVehicle()
    );

    setText(
        "activeCustomers",
        new Set(
            services.map(
                function (service) {
                    return service.customerId;
                }
            )
        ).size
    );

    setText(
        "totalBookings",
        services.length
    );

    setText(
        "reportBooked",
        booked.length
    );

    setText(
        "reportInService",
        inService.length
    );

    setText(
        "reportCompleted",
        completed.length
    );

    setText(
        "reportDelivered",
        delivered.length
    );
}

function mostServicedVehicle() {

    if (!services.length) {
        return "0";
    }

    const counts = {};

    services.forEach(
        function (service) {

            if (!service.vehicleId) {
                return;
            }

            counts[
                service.vehicleId
            ] =
                (
                    counts[
                        service.vehicleId
                    ] || 0
                ) + 1;
        }
    );

    let best = null;
    let highest = 0;

    Object.keys(
        counts
    ).forEach(
        function (vehicleId) {

            if (
                counts[
                    vehicleId
                ] > highest
            ) {

                highest =
                    counts[
                        vehicleId
                    ];

                best =
                    vehicleId;
            }
        }
    );

    if (!best) {
        return "0";
    }

    return highest;
}

/* =========================================================
   SETTINGS
========================================================= */

function setupSettings() {

    $("workshopSettingsForm")
        ?.addEventListener(
            "submit",
            function (event) {

                event.preventDefault();

                settings = {
                    workshopName:
                        value(
                            "workshopName"
                        ),

                    workshopPhone:
                        value(
                            "workshopPhone"
                        ),

                    workshopEmail:
                        value(
                            "workshopEmail"
                        ),

                    workshopAddress:
                        value(
                            "workshopAddress"
                        )
                };

                saveAll();

                addActivity(
                    "Workshop settings updated",
                    "Workshop information was saved."
                );

                saveAll();

                showToast(
                    "Settings Saved",
                    "Workshop information saved successfully.",
                    "success"
                );
            }
        );

    $("clearAllDataBtn")
        ?.addEventListener(
            "click",
            clearAllData
        );
}

function renderSettings() {

    setValue(
        "workshopName",
        settings.workshopName ||
            "AutoCare Service Center"
    );

    setValue(
        "workshopPhone",
        settings.workshopPhone
    );

    setValue(
        "workshopEmail",
        settings.workshopEmail
    );

    setValue(
        "workshopAddress",
        settings.workshopAddress
    );
}

function clearAllData() {

    askConfirmation(
        "Clear All Data",
        "This will permanently remove all customers, vehicles and service records from this browser.",
        function () {

            customers = [];
            vehicles = [];
            services = [];
            activities = [];

            settings = {
                workshopName:
                    "AutoCare Service Center",
                workshopPhone: "",
                workshopEmail: "",
                workshopAddress: ""
            };

            saveAll();

            renderAll();

            showToast(
                "Data Cleared",
                "All application data has been cleared.",
                "success"
            );
        }
    );
}

/* =========================================================
   CONFIRMATION
========================================================= */

function askConfirmation(
    title,
    message,
    action
) {

    confirmAction =
        action;

    setText(
        "confirmTitle",
        title
    );

    setText(
        "confirmMessage",
        message
    );

    openModal(
        "confirmModal"
    );
}

function setupConfirmation() {

    $("confirmCancelBtn")
        ?.addEventListener(
            "click",
            function () {

                confirmAction =
                    null;

                closeModal(
                    "confirmModal"
                );
            }
        );

    $("confirmOkBtn")
        ?.addEventListener(
            "click",
            function () {

                const action =
                    confirmAction;

                confirmAction =
                    null;

                closeModal(
                    "confirmModal"
                );

                if (
                    typeof action ===
                    "function"
                ) {
                    action();
                }
            }
        );
}

/* =========================================================
   TOAST
========================================================= */

function showToast(
    title,
    message,
    type = "info"
) {

    const container =
        $("toastContainer");

    if (!container) return;

    const toast =
        document.createElement(
            "div"
        );

    toast.className =
        `toast ${type}`;

    let icon =
        "fa-circle-info";

    if (type === "success") {
        icon =
            "fa-circle-check";
    }

    if (type === "warning") {
        icon =
            "fa-triangle-exclamation";
    }

    if (type === "error") {
        icon =
            "fa-circle-xmark";
    }

    toast.innerHTML = `
        <div style="
            font-size:18px;
            min-width:22px;
        ">
            <i class="fa-solid ${icon}"></i>
        </div>

        <div>
            <strong>
                ${escapeHTML(title)}
            </strong>

            <p>
                ${escapeHTML(message)}
            </p>
        </div>
    `;

    container.appendChild(
        toast
    );

    setTimeout(
        function () {

            toast.style.opacity =
                "0";

            toast.style.transform =
                "translateX(20px)";

            setTimeout(
                function () {
                    toast.remove();
                },
                250
            );

        },
        3500
    );
}

/* =========================================================
   GLOBAL SEARCH
========================================================= */

function setupSearch() {

    const input =
        $("globalSearch");

    if (!input) return;

    input.addEventListener(
        "keydown",
        function (event) {

            if (
                event.key !==
                "Enter"
            ) {
                return;
            }

            const search =
                input.value
                    .trim()
                    .toLowerCase();

            if (!search) {
                return;
            }

            const customerFound =
                customers.some(
                    function (customer) {

                        return `${customer.name}
                            ${customer.phone}
                            ${customer.email}`
                            .toLowerCase()
                            .includes(
                                search
                            );
                    }
                );

            const vehicleFound =
                vehicles.some(
                    function (vehicle) {

                        return `${vehicle.registration}
                            ${vehicle.brand}
                            ${vehicle.model}`
                            .toLowerCase()
                            .includes(
                                search
                            );
                    }
                );

            const serviceFound =
                services.some(
                    function (service) {

                        return `${service.id}
                            ${service.customerName}
                            ${service.registration}
                            ${service.serviceType}`
                            .toLowerCase()
                            .includes(
                                search
                            );
                    }
                );

            if (customerFound) {
                navigate(
                    "customers"
                );

                setValue(
                    "customerSearch",
                    search
                );

                renderCustomers();

            } else if (vehicleFound) {

                navigate(
                    "vehicles"
                );

                setValue(
                    "vehicleSearch",
                    search
                );

                renderVehicles();

            } else if (serviceFound) {

                navigate(
                    "services"
                );

                setValue(
                    "serviceSearch",
                    search
                );

                renderServices();

            } else {

                showToast(
                    "No Results",
                    "No matching record was found.",
                    "info"
                );
            }
        }
    );
}

/* =========================================================
   CURRENT YEAR
========================================================= */

function updateCurrentYear() {

    setText(
        "currentYear",
        new Date()
            .getFullYear()
    );
}

/* =========================================================
   RENDER ALL
========================================================= */

function renderAll() {

    renderDashboard();

    renderCustomers();

    renderVehicles();

    renderServices();

    renderHistory();

    renderReports();

    renderSettings();
}

/* =========================================================
   START APPLICATION
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        loadData();

        setupLogin();
        setupLogout();

        setupNavigation();
        setupSidebar();

        setupModalClose();
        setupConfirmation();

        setupCustomers();
        setupVehicles();
        setupServices();
        setupHistory();
        setupActivity();
        setupSettings();

        setupSearch();

        renderAll();

        const username =
            localStorage.getItem(
                STORAGE.username
            );

        if (username) {
            updateLoggedInUser(
                username
            );
        }

        console.log(
            "AutoCare application loaded successfully."
        );
    }
);
/* =========================================================
   FINAL LOGIN / LOGOUT FIX
========================================================= */

document.addEventListener("DOMContentLoaded", function () {

    // ---------- LOGIN ----------
    const loginForm = document.getElementById("loginForm");
    const loginScreen = document.getElementById("loginScreen");
    const loginError = document.getElementById("loginError");

    if (loginScreen) {

        const loggedIn =
            localStorage.getItem("vsm_logged_in") === "true";

        if (loggedIn) {
            loginScreen.style.display = "none";
        } else {
            loginScreen.style.display = "flex";
        }
    }

    if (loginForm) {

        loginForm.addEventListener("submit", function (event) {

            event.preventDefault();

            const username =
                document.getElementById("loginUsername").value.trim();

            const password =
                document.getElementById("loginPassword").value;

            if (
                (username === "admin" ||
                 username === "administrator") &&
                password === "admin123"
            ) {

                localStorage.setItem(
                    "vsm_logged_in",
                    "true"
                );

                localStorage.setItem(
                    "vsm_username",
                    username
                );

                if (loginScreen) {
                    loginScreen.style.display = "none";
                }

                if (loginError) {
                    loginError.style.display = "none";
                }

                console.log("LOGIN SUCCESS");

            } else {

                if (loginError) {
                    loginError.textContent =
                        "Invalid username or password.";

                    loginError.style.display =
                        "block";
                }

                console.log("LOGIN FAILED");
            }
        });
    }


    // ---------- LOGOUT ----------
    const logoutBtn =
        document.getElementById("logoutBtn");

    if (logoutBtn) {

        logoutBtn.addEventListener("click", function () {

            console.log("LOGOUT BUTTON CLICKED");

            localStorage.removeItem(
                "vsm_logged_in"
            );

            localStorage.removeItem(
                "vsm_username"
            );

            if (loginScreen) {

                loginScreen.style.display =
                    "flex";
            }

            if (loginForm) {
                loginForm.reset();
            }

        });

    } else {

        console.error(
            "ERROR: logoutBtn was not found."
        );
    }

});