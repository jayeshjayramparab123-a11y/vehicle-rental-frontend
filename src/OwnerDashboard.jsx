import { useEffect, useState } from "react";
import axios from "axios";
import "./OwnerDashboard.css";

const API = "https://vehicle-rental-backend-gmwo.onrender.com";

const emptyVehicle = {
  vehicleName: "",
  vehicleNumber: "",
  vehicleType: "Car",
  brand: "",
  model: "",
  year: "",
  fuelType: "Petrol",
  transmissionType: "Manual",
  seatingCapacity: "",
  pricePerDay: "",
  image: "",
  status: "available"
};

function OwnerDashboard({ ownerId: ownerIdProp, onLogout }) {
  const ownerId = ownerIdProp || localStorage.getItem("userId");

  const [activePage, setActivePage] = useState("dashboard");
  const [showNotifications, setShowNotifications] = useState(false);
  const [owner, setOwner] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [stats, setStats] = useState({
    vehicles: 0,
    bookings: 0,
    pendingBookings: 0,
    approvedBookings: 0,
    rejectedBookings: 0
  });

  const [showVehicleForm, setShowVehicleForm] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [vehicleData, setVehicleData] = useState(emptyVehicle);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const loadData = async () => {
    if (!ownerId) return;

    try {
      const [ownerRes, vehiclesRes, bookingsRes, statsRes] =
        await Promise.all([
          axios.get(`${API}/api/owners/${ownerId}`),
          axios.get(`${API}/api/owners/${ownerId}/vehicles`),
          axios.get(`${API}/api/owners/${ownerId}/bookings`),
          axios.get(`${API}/api/owners/${ownerId}/stats`)
        ]);

      setOwner(ownerRes.data);
      setVehicles(vehiclesRes.data || []);
      setBookings(bookingsRes.data || []);
      setStats(statsRes.data || {
        vehicles: vehiclesRes.data?.length || 0,
        bookings: bookingsRes.data?.length || 0,
        pendingBookings: 0,
        approvedBookings: 0,
        rejectedBookings: 0
      });
    } catch (error) {
      console.log("OWNER DASHBOARD ERROR:", error);
      alert(
        error.response?.data?.message ||
        "Unable to load owner dashboard"
      );
    }
  };

  useEffect(() => {
    loadData();

    // Automatically check for new booking requests every 3 seconds.
    // This means the owner does NOT need to refresh the page.
    const refreshTimer = setInterval(() => {
      loadData();
    }, 3000);

    return () => clearInterval(refreshTimer);
  }, [ownerId]);

  useEffect(() => {
    const handleFocus = () => loadData();

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [ownerId]);

  const handleChange = (e) => {
    setVehicleData({
      ...vehicleData,
      [e.target.name]: e.target.value
    });
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { alert("Please select an image file."); return; }
    if (file.size > 2 * 1024 * 1024) { alert("Please select an image smaller than 2 MB."); return; }
    const reader = new FileReader();
    reader.onload = () => setVehicleData((prev) => ({ ...prev, image: reader.result }));
    reader.onerror = () => alert("Unable to read image.");
    reader.readAsDataURL(file);
  };

  const openAddForm = () => {
    setEditingVehicle(null);
    setVehicleData({ ...emptyVehicle });
    setShowVehicleForm(true);
    setActivePage("vehicles");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const editVehicle = (vehicle) => {
    setEditingVehicle(vehicle);
    setVehicleData({
      vehicleName: vehicle.vehicleName || "",
      vehicleNumber: vehicle.vehicleNumber || "",
      vehicleType: vehicle.vehicleType || "Car",
      brand: vehicle.brand || "",
      model: vehicle.model || "",
      year: vehicle.year || "",
      fuelType: vehicle.fuelType || "Petrol",
      transmissionType: vehicle.transmissionType || "Manual",
      seatingCapacity: vehicle.seatingCapacity || "",
      pricePerDay: vehicle.pricePerDay || "",
      image: vehicle.image || "",
      status: vehicle.status || "available"
    });
    setShowVehicleForm(true);
    setActivePage("vehicles");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleVehicleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingVehicle) {
        await axios.put(
          `${API}/api/owners/${ownerId}/vehicles/${editingVehicle._id}`,
          vehicleData
        );
        alert("Vehicle updated successfully");
      } else {
        await axios.post(
          `${API}/api/owners/${ownerId}/vehicles`,
          vehicleData
        );
        alert("Vehicle added successfully");
      }

      setVehicleData({ ...emptyVehicle });
      setEditingVehicle(null);
      setShowVehicleForm(false);
      await loadData();
    } catch (error) {
      console.log("VEHICLE OPERATION ERROR:", error);
      alert(
        error.response?.data?.message ||
        error.message ||
        "Vehicle operation failed"
      );
    }
  };

  const deleteVehicle = async (vehicleId) => {
    if (!window.confirm("Delete this vehicle?")) return;

    try {
      await axios.delete(
        `${API}/api/owners/${ownerId}/vehicles/${vehicleId}`
      );
      alert("Vehicle deleted successfully");
      loadData();
    } catch (error) {
      alert(
        error.response?.data?.message ||
        "Unable to delete vehicle"
      );
    }
  };

  const handleBookingDecision = async (
    bookingId,
    decision,
    shareUserDetails
  ) => {
    try {
      await axios.put(
        `${API}/api/bookings/${bookingId}/owner-decision`,
        {
          ownerId,
          decision,
          shareUserDetails
        }
      );

      alert(
        decision === "approved"
          ? "Booking approved successfully"
          : "Booking rejected successfully"
      );

      loadData();
    } catch (error) {
      alert(
        error.response?.data?.message ||
        "Unable to update booking"
      );
    }
  };

  const logout = () => {
    localStorage.removeItem("userId");
    localStorage.removeItem("role");
    onLogout();
  };

  const filteredVehicles = vehicles.filter((vehicle) => {
    const text = `${vehicle.vehicleName || ""} ${vehicle.brand || ""} ${vehicle.model || ""} ${vehicle.vehicleNumber || ""}`.toLowerCase();
    const matchesSearch = text.includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === "all" ||
      (vehicle.status || "available").toLowerCase() === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const renderVehicleForm = () => (
    <section className="owner-card vehicle-editor">
      <div className="editor-heading">
        <div>
          <span className="mini-label">
            {editingVehicle ? "UPDATE LISTING" : "NEW LISTING"}
          </span>
          <h2>{editingVehicle ? "Edit Vehicle" : "Add New Vehicle"}</h2>
          <p>List your vehicle and start earning today!</p>
        </div>

        <button
          type="button"
          className="icon-close"
          onClick={() => setShowVehicleForm(false)}
        >
          ×
        </button>
      </div>

      <form onSubmit={handleVehicleSubmit}>
        <div className="vehicle-editor-grid">
          <div className="vehicle-fields">

            <div className="field-row">
              <div className="field">
                <label>Vehicle Name *</label>
                <div className="input-icon">
                  <span>🚘</span>
                  <input
                    name="vehicleName"
                    placeholder="e.g. Thar"
                    value={vehicleData.vehicleName}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="field">
                <label>Vehicle Number *</label>
                <div className="input-icon">
                  <span>▣</span>
                  <input
                    name="vehicleNumber"
                    placeholder="MH12AB1234"
                    value={vehicleData.vehicleNumber}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="field-row">
              <div className="field">
                <label>Vehicle Type *</label>
                <select
                  name="vehicleType"
                  value={vehicleData.vehicleType}
                  onChange={handleChange}
                >
                  <option>Car</option>
                  <option>Bike</option>
                  <option>SUV</option>
                  <option>Van</option>
                </select>
              </div>

              <div className="field">
                <label>Brand *</label>
                <input
                  name="brand"
                  placeholder="Mahindra"
                  value={vehicleData.brand}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="field-row">
              <div className="field">
                <label>Model *</label>
                <input
                  name="model"
                  placeholder="Thar"
                  value={vehicleData.model}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="field">
                <label>Year *</label>
                <input
                  name="year"
                  type="number"
                  placeholder="2024"
                  value={vehicleData.year}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="field-row">
              <div className="field">
                <label>Fuel Type *</label>
                <select
                  name="fuelType"
                  value={vehicleData.fuelType}
                  onChange={handleChange}
                >
                  <option>Petrol</option>
                  <option>Diesel</option>
                  <option>Electric</option>
                  <option>CNG</option>
                </select>
              </div>

              <div className="field">
                <label>Transmission *</label>
                <select
                  name="transmissionType"
                  value={vehicleData.transmissionType}
                  onChange={handleChange}
                >
                  <option>Manual</option>
                  <option>Automatic</option>
                </select>
              </div>
            </div>

            <div className="field-row">
              <div className="field">
                <label>Seating Capacity *</label>
                <input
                  name="seatingCapacity"
                  type="number"
                  placeholder="5"
                  value={vehicleData.seatingCapacity}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="field">
                <label>Price Per Day (₹) *</label>
                <div className="input-icon">
                  <span>₹</span>
                  <input
                    name="pricePerDay"
                    type="number"
                    placeholder="2500"
                    value={vehicleData.pricePerDay}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="field-row">
               <div className="field">
                 <label>Vehicle Image</label>
                 <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleImageUpload} />
                 <small className="file-help">JPG, PNG or WebP • Max 2 MB</small>
               </div>

              <div className="field">
                <label>Status *</label>
                <select
                  name="status"
                  value={vehicleData.status}
                  onChange={handleChange}
                >
                  <option value="available">Available</option>
                  <option value="inactive">Not Available</option>
                </select>
              </div>
            </div>

          </div>

          <div className="image-uploader">
            <label>Vehicle Image *</label>

            {vehicleData.image ? (
              <div className="image-preview-box">
                <img
                  src={vehicleData.image}
                  alt="Vehicle preview"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                    const fallback = e.currentTarget.parentElement.querySelector(".image-error");
                    if (fallback) fallback.style.display = "flex";
                  }}
                />
                <div className="image-error">
                  Image could not be loaded
                </div>
                <button
                  type="button"
                  className="remove-image"
                  onClick={() =>
                    setVehicleData({ ...vehicleData, image: "" })
                  }
                >
                  ×
                </button>
              </div>
            ) : (
              <div className="upload-placeholder">
                <div className="upload-icon">☁</div>
                <strong>Choose vehicle image</strong>
                <span>JPG, PNG or WebP recommended</span>
              </div>
            )}

            <div className="image-tip">
              💡 Select an image above. It will be saved with the vehicle and shown to customers.
            </div>
          </div>
        </div>

        <div className="editor-actions">
          <button type="submit" className="primary-action">
            ＋ {editingVehicle ? "Update Vehicle" : "Add Vehicle"}
          </button>

          <button
            type="button"
            className="secondary-action"
            onClick={() => {
              setShowVehicleForm(false);
              setEditingVehicle(null);
            }}
          >
            × Cancel
          </button>
        </div>
      </form>
    </section>
  );

  const renderVehicles = () => (
    <>
      {showVehicleForm && renderVehicleForm()}

      <section className="owner-card">
        <div className="section-header">
          <div className="section-title-wrap">
            <div className="section-icon">🚘</div>
            <div>
              <span className="mini-label">YOUR FLEET</span>
              <h2>My Vehicles</h2>
              <p>Manage your listed vehicles</p>
            </div>
          </div>

          <div className="vehicle-toolbar">
            <div className="search-box">
              🔍
              <input
                placeholder="Search vehicles..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <select
              className="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="available">Available</option>
              <option value="inactive">Not Available</option>
            </select>

            <button className="primary-small" onClick={openAddForm}>
              + Add Vehicle
            </button>
          </div>
        </div>

        {filteredVehicles.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🚘</div>
            <h3>No vehicles found</h3>
            <p>Add a vehicle or change your search/filter.</p>
            <button className="primary-action" onClick={openAddForm}>
              + Add Vehicle
            </button>
          </div>
        ) : (
          <div className="vehicle-grid">
            {filteredVehicles.map((vehicle) => (
              <article className="vehicle-list-card" key={vehicle._id}>
                <div className="vehicle-photo">
                  {vehicle.image ? (
                    <img
                      src={vehicle.image}
                      alt={vehicle.vehicleName}
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                        const fallback = e.currentTarget.parentElement.querySelector(".photo-fallback");
                        if (fallback) fallback.style.display = "flex";
                      }}
                    />
                  ) : null}

                  <div
                    className="photo-fallback"
                    style={{ display: vehicle.image ? "none" : "flex" }}
                  >
                    🚗
                  </div>

                  <span className={`status-pill ${vehicle.status === "available" ? "available" : "unavailable"}`}>
                    {vehicle.status === "available" ? "Available" : "Not Available"}
                  </span>
                </div>

                <div className="vehicle-list-body">
                  <div className="vehicle-card-title">
                    <div>
                      <h3>{vehicle.vehicleName}</h3>
                      <p>
                        🚘 {vehicle.vehicleType} · {vehicle.brand || "Brand"} · {vehicle.year || "Year"}
                      </p>
                    </div>
                  </div>

                  <div className="vehicle-specs">
                    <span>▣ {vehicle.vehicleNumber}</span>
                    <span>⛽ {vehicle.fuelType || "N/A"}</span>
                    <span>⚙ {vehicle.transmissionType || "N/A"}</span>
                    <span>👥 {vehicle.seatingCapacity || "N/A"} Seats</span>
                  </div>

                  <div className="vehicle-card-bottom">
                    <div>
                      <small>Starting from</small>
                      <strong>₹{vehicle.pricePerDay}<em>/day</em></strong>
                    </div>

                    <div className="vehicle-card-actions">
                      <button onClick={() => editVehicle(vehicle)}>✎ Edit</button>
                      <button onClick={() => deleteVehicle(vehicle._id)}>⌫ Delete</button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </>
  );

  const renderBookings = () => (
    <section className="owner-card">
      <div className="section-header">
        <div className="section-title-wrap">
          <div className="section-icon">📋</div>
          <div>
            <span className="mini-label">CUSTOMER REQUESTS</span>
            <h2>Booking Requests</h2>
            <p>Review customers before approving their request</p>
          </div>
        </div>
      </div>

      {bookings.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <h3>No booking requests</h3>
          <p>New customer requests will appear here.</p>
        </div>
      ) : (
        <div className="booking-list">
          {bookings.map((booking) => (
            <article className="booking-request" key={booking._id}>
              <div className="booking-request-head">
                <div>
                  <span className="mini-label">BOOKING REQUEST</span>
                  <h3>{booking.vehicleId?.vehicleName || "Vehicle"}</h3>
                </div>
                <span className={`request-status status-${booking.ownerDecision || "pending"}`}>
                  {booking.ownerDecision || "pending"}
                </span>
              </div>

              <div className="booking-request-grid">
                <div><small>Customer</small><strong>{booking.userId?.name || "Customer"}</strong></div>
                <div><small>Pickup</small><strong>{booking.pickupLocation || "-"}</strong></div>
                <div><small>Drop</small><strong>{booking.dropLocation || "-"}</strong></div>
                <div><small>Amount</small><strong>₹{booking.totalAmount || 0}</strong></div>
              </div>

              <div className="booking-date-row">
                <span>Start: {new Date(booking.startDate).toLocaleDateString()}</span>
                <span>End: {new Date(booking.endDate).toLocaleDateString()}</span>
              </div>

              {booking.userId ? (
                <div className="customer-details">
                  <h4>👤 Customer Details</h4>
                  <div className="customer-detail-grid">
                    <span><b>Name:</b> {booking.userId.name || "-"}</span>
                    <span><b>Email:</b> {booking.userId.email || "-"}</span>
                    <span><b>Phone:</b> {booking.userId.phone || "-"}</span>
                    <span><b>Address:</b> {booking.userId.address || "-"}</span>
                    <span><b>Aadhaar:</b> {booking.userId.aadhaarNumber || "-"}</span>
                    <span><b>Driving Licence:</b> {booking.userId.drivingLicenceNumber || "-"}</span>
                  </div>
                </div>
              ) : (
                <div className="details-hidden">
                  Customer details are not available.
                </div>
              )}

              {(!booking.ownerDecision || booking.ownerDecision === "pending") && (
                <div className="booking-actions">
                  <button
                    className="approve-btn"
                    onClick={() => handleBookingDecision(booking._id, "approved", false)}
                  >
                    ✓ Approve
                  </button>
                  <button
                    className="share-btn"
                    onClick={() => handleBookingDecision(booking._id, "approved", true)}
                  >
                    ✓ Approve & Share Details
                  </button>
                  <button
                    className="reject-btn"
                    onClick={() => handleBookingDecision(booking._id, "rejected", false)}
                  >
                    ✕ Reject
                  </button>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );

  const renderDashboard = () => (
    <>
      <section className="owner-hero">
        <div>
          <span className="hero-kicker">OWNER CONTROL CENTER</span>
          <h1>Welcome back, {owner?.name || "Owner"} 👋</h1>
          <p>Manage your fleet, review booking requests and grow your rental business.</p>
        </div>

        <button className="primary-action" onClick={openAddForm}>
          + Add New Vehicle
        </button>
      </section>

      <section className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue">🚘</div>
          <div><strong>{stats.vehicles}</strong><span>My Vehicles</span></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon purple">📋</div>
          <div><strong>{stats.bookings}</strong><span>Total Bookings</span></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon orange">⏳</div>
          <div><strong>{stats.pendingBookings}</strong><span>Pending Requests</span></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green">✓</div>
          <div><strong>{stats.approvedBookings}</strong><span>Approved</span></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon red">✕</div>
          <div><strong>{stats.rejectedBookings || 0}</strong><span>Rejected</span></div>
        </div>
      </section>

      <section className="quick-panel">
        <div>
          <span className="mini-label">QUICK START</span>
          <h2>Add your vehicle and reach more riders</h2>
          <p>Complete your vehicle listing with a clear image, pricing and specifications.</p>
        </div>
        <button className="outline-action" onClick={openAddForm}>Add Vehicle →</button>
      </section>

      <section className="owner-card">
        <div className="section-header">
          <div className="section-title-wrap">
            <div className="section-icon">🚘</div>
            <div>
              <span className="mini-label">YOUR FLEET</span>
              <h2>Recent Vehicles</h2>
              <p>Quick overview of your listed vehicles</p>
            </div>
          </div>
          <button className="outline-action" onClick={() => setActivePage("vehicles")}>
            View All →
          </button>
        </div>

        <div className="vehicle-grid">
          {vehicles.slice(0, 3).map((vehicle) => (
            <article className="vehicle-list-card" key={vehicle._id}>
              <div className="vehicle-photo compact">
                {vehicle.image ? (
                  <img src={vehicle.image} alt={vehicle.vehicleName} />
                ) : (
                  <div className="photo-fallback" style={{ display: "flex" }}>🚗</div>
                )}
                <span className={`status-pill ${vehicle.status === "available" ? "available" : "unavailable"}`}>
                  {vehicle.status === "available" ? "Available" : "Not Available"}
                </span>
              </div>
              <div className="vehicle-list-body">
                <h3>{vehicle.vehicleName}</h3>
                <p>🚘 {vehicle.vehicleType} · {vehicle.brand || "Brand"} · {vehicle.year || "Year"}</p>
                <div className="compact-price">₹{vehicle.pricePerDay}<small>/day</small></div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  );

  return (
    <div className="owner-app">

      <aside className="owner-sidebar">
        <div className="brand-block">
          <div className="brand-car">🚘</div>
          <div>
            <strong>Vehicle Rental</strong>
            <span>Drive Your Dreams</span>
          </div>
        </div>

        <nav className="owner-nav">
          <button className={activePage === "dashboard" ? "active" : ""} onClick={() => setActivePage("dashboard")}>
            <span>⌂</span> Dashboard
          </button>

          <button className={activePage === "vehicles" ? "active" : ""} onClick={() => setActivePage("vehicles")}>
            <span>🚘</span> My Vehicles
          </button>

          <button className={activePage === "bookings" ? "active" : ""} onClick={() => setActivePage("bookings")}>
            <span>☷</span> Booking Requests
            {stats.pendingBookings > 0 && <b>{stats.pendingBookings}</b>}
          </button>

          <button className={activePage === "profile" ? "active" : ""} onClick={() => setActivePage("profile")}>
            <span>●</span> Profile
          </button>

          <button className={activePage === "settings" ? "active" : ""} onClick={() => setActivePage("settings")}>
            <span>⚙</span> Settings
          </button>
        </nav>

        <div className="sidebar-journey">
          <div className="journey-image">🏔️</div>
          <h3>“Good Vehicles<br />Better Journeys”</h3>
          <div className="journey-line"></div>
        </div>

        <button className="sidebar-logout" onClick={logout}>
          ⇥ Logout
        </button>
      </aside>

      <div className="owner-content">

        <header className="owner-topbar">
          <button className="mobile-menu">☰</button>

          <div className="global-search">
            🔍
            <input placeholder="Search anything..." />
          </div>

          <div className="topbar-right">
            <div className="notification-wrap">
              <button
                type="button"
                className="notification"
                onClick={() => setShowNotifications((prev) => !prev)}
                title="Notifications"
              >
                🔔
                {stats.pendingBookings > 0 && <b>{stats.pendingBookings}</b>}
              </button>

              {showNotifications && (
                <div className="notification-popup">
                  <div className="notification-popup-header">
                    <div>
                      <strong>Notifications</strong>
                      <span>Booking requests</span>
                    </div>
                    <button
                      type="button"
                      className="notification-close"
                      onClick={() => setShowNotifications(false)}
                    >
                      ×
                    </button>
                  </div>

                  {stats.pendingBookings > 0 ? (
                    <button
                      type="button"
                      className="notification-item"
                      onClick={() => {
                        setActivePage("bookings");
                        setShowNotifications(false);
                      }}
                    >
                      <div className="notification-icon">📋</div>
                      <div className="notification-text">
                        <strong>New booking request</strong>
                        <span>
                          You have {stats.pendingBookings} pending booking
                          {stats.pendingBookings > 1 ? "s" : ""}.
                        </span>
                      </div>
                      <span className="notification-arrow">›</span>
                    </button>
                  ) : (
                    <div className="notification-empty">
                      <div>🔕</div>
                      <strong>No new notifications</strong>
                      <span>You're all caught up.</span>
                    </div>
                  )}

                  <button
                    type="button"
                    className="notification-view-all"
                    onClick={() => {
                      setActivePage("bookings");
                      setShowNotifications(false);
                    }}
                  >
                    View Booking Requests
                  </button>
                </div>
              )}
            </div>


            <div className="profile-mini">
              <div className="avatar">
                {(owner?.name || "O").charAt(0).toUpperCase()}
              </div>
              <div>
                <strong>{owner?.name || "Vehicle Owner"}</strong>
                <span>Vehicle Owner</span>
              </div>
              <span>⌄</span>
            </div>
          </div>
        </header>

        <main className="owner-page">

          {activePage === "dashboard" && renderDashboard()}

          {activePage === "vehicles" && (
            <>
              {!showVehicleForm && (
                <section className="page-heading">
                  <div>
                    <span className="hero-kicker">MY VEHICLES</span>
                    <h1>Manage Your Fleet</h1>
                    <p>Add, edit and manage all your rental vehicles.</p>
                  </div>
                  <button className="primary-action" onClick={openAddForm}>+ Add New Vehicle</button>
                </section>
              )}
              {renderVehicles()}
            </>
          )}

          {activePage === "bookings" && renderBookings()}

          {activePage === "profile" && (
            <section className="owner-card profile-panel">
              <span className="mini-label">ACCOUNT</span>
              <h2>Owner Profile</h2>
              <div className="profile-large-avatar">
                {(owner?.name || "O").charAt(0).toUpperCase()}
              </div>
              <div className="profile-details">
                <p><span>Name</span><strong>{owner?.name || "-"}</strong></p>
                <p><span>Email</span><strong>{owner?.email || "-"}</strong></p>
                <p><span>Role</span><strong>Vehicle Owner</strong></p>
              </div>
            </section>
          )}

          {activePage === "settings" && (
            <section className="owner-card settings-panel">
              <span className="mini-label">PREFERENCES</span>
              <h2>Settings</h2>
              <p>Your account settings can be managed here.</p>
              <div className="setting-row">
                <div><strong>Account Status</strong><span>Your owner account is active.</span></div>
                <span className="active-dot">Active</span>
              </div>
              <div className="setting-row">
                <div><strong>Vehicle Visibility</strong><span>Available vehicles can be shown to customers.</span></div>
                <span className="active-dot">Enabled</span>
              </div>
            </section>
          )}

        </main>
      </div>
    </div>
  );
}

export default OwnerDashboard;
