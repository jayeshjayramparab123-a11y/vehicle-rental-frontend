import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./AdminDashboard.css";

const API = "https://vehicle-rental-backend-gmwo.onrender.com/api";

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
  status: "available",
  ownerId: ""
};

function AdminDashboard({ onLogout }) {
  const [vehicles, setVehicles] = useState([]);
  const [users, setUsers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [payments, setPayments] = useState([]);

  const [vehicleData, setVehicleData] = useState(emptyVehicle);
  const [showVehicleForm, setShowVehicleForm] = useState(false);
  const [editId, setEditId] = useState(null);

  const [vehicleSearch, setVehicleSearch] = useState("");
  const [vehicleStatus, setVehicleStatus] = useState("all");
  const [bookingFilter, setBookingFilter] = useState("all");
  const [userFilter, setUserFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);

  const owners = useMemo(
    () => users.filter((user) => user.role === "owner"),
    [users]
  );

  const filteredVehicles = useMemo(() => {
    const search = vehicleSearch.trim().toLowerCase();

    return vehicles.filter((vehicle) => {
      const matchesSearch =
        !search ||
        [
          vehicle.vehicleName,
          vehicle.vehicleNumber,
          vehicle.vehicleType,
          vehicle.brand,
          vehicle.model,
          vehicle.ownerId?.name
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(search));

      const matchesStatus =
        vehicleStatus === "all" || vehicle.status === vehicleStatus;

      return matchesSearch && matchesStatus;
    });
  }, [vehicles, vehicleSearch, vehicleStatus]);

  const filteredBookings = useMemo(() => {
    if (bookingFilter === "all") return bookings;

    return bookings.filter((booking) => {
      const ownerDecision = booking.ownerDecision || "pending";
      const paymentStatus = booking.paymentStatus || "pending";

      if (bookingFilter === "pending") return ownerDecision === "pending";
      if (bookingFilter === "approved") {
        return ownerDecision === "approved";
      }
      if (bookingFilter === "rejected") {
        return ownerDecision === "rejected";
      }
      if (bookingFilter === "paid") {
        return paymentStatus === "paid";
      }

      return true;
    });
  }, [bookings, bookingFilter]);

  const filteredUsers = useMemo(() => {
    if (userFilter === "all") return users;
    return users.filter((user) => user.role === userFilter);
  }, [users, userFilter]);

  const paidPayments = payments.filter(
    (payment) => payment.paymentStatus === "success"
  );

  const pendingBookings = bookings.filter(
    (booking) => booking.ownerDecision === "pending"
  );

  const approvedBookings = bookings.filter(
    (booking) => booking.ownerDecision === "approved"
  );

  const loadData = async () => {
    try {
      setLoading(true);

      const [vehiclesResponse, usersResponse, bookingsResponse, paymentsResponse] =
        await Promise.all([
          axios.get(`${API}/vehicles`),
          axios.get(`${API}/users`),
          axios.get(`${API}/bookings`),
          axios.get(`${API}/payments`)
        ]);

      setVehicles(Array.isArray(vehiclesResponse.data) ? vehiclesResponse.data : []);
      setUsers(Array.isArray(usersResponse.data) ? usersResponse.data : []);
      setBookings(Array.isArray(bookingsResponse.data) ? bookingsResponse.data : []);
      setPayments(Array.isArray(paymentsResponse.data) ? paymentsResponse.data : []);
    } catch (error) {
      console.error("Admin data error:", error);
      alert(
        error.response?.data?.message ||
          "Unable to load admin data. Make sure the backend is running."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Automatically check for new bookings/payments/users/vehicles.
    // No page reload is required.
    const refreshTimer = setInterval(() => {
      loadData();
    }, 3000);

    const handleFocus = () => loadData();
    window.addEventListener("focus", handleFocus);

    return () => {
      clearInterval(refreshTimer);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  const handleVehicleChange = (event) => {
    const { name, value } = event.target;

    setVehicleData((previous) => ({
      ...previous,
      [name]: value
    }));
  };

  const openAddVehicle = () => {
    setEditId(null);
    setVehicleData({
      ...emptyVehicle,
      ownerId: owners[0]?._id || ""
    });
    setShowVehicleForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const editVehicle = (vehicle) => {
    setEditId(vehicle._id);

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
      status: vehicle.status || "available",
      ownerId: vehicle.ownerId?._id || vehicle.ownerId || ""
    });

    setShowVehicleForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const closeVehicleForm = () => {
    setShowVehicleForm(false);
    setEditId(null);
    setVehicleData(emptyVehicle);
  };

  const handleVehicleSubmit = async (event) => {
    event.preventDefault();

    if (!vehicleData.ownerId) {
      alert("Please select a vehicle owner.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        ...vehicleData,
        year: vehicleData.year ? Number(vehicleData.year) : undefined,
        seatingCapacity: vehicleData.seatingCapacity
          ? Number(vehicleData.seatingCapacity)
          : undefined,
        pricePerDay: Number(vehicleData.pricePerDay)
      };

      if (editId) {
        await axios.put(`${API}/vehicles/${editId}`, payload);
        alert("Vehicle updated successfully.");
      } else {
        await axios.post(`${API}/vehicles`, payload);
        alert("Vehicle added successfully.");
      }

      closeVehicleForm();
      await loadData();
    } catch (error) {
      console.error("Vehicle operation error:", error);
      alert(
        error.response?.data?.message ||
          "Vehicle operation failed. Check the backend console."
      );
    } finally {
      setSaving(false);
    }
  };

  const deleteVehicle = async (id) => {
    if (!window.confirm("Are you sure you want to delete this vehicle?")) {
      return;
    }

    try {
      await axios.delete(`${API}/vehicles/${id}`);
      alert("Vehicle deleted successfully.");
      await loadData();
    } catch (error) {
      console.error("Delete vehicle error:", error);
      alert(
        error.response?.data?.message ||
          "Delete failed. The vehicle may have an active booking."
      );
    }
  };


  const updateUserStatus = async (user) => {
    if (!user?._id || user.role === "admin") return;

    const isBlocked = user.status === "inactive";
    const nextStatus = isBlocked ? "active" : "inactive";

    const actionText = isBlocked ? "activate" : "block";

    if (
      !window.confirm(
        `Are you sure you want to ${actionText} ${user.name}'s account?`
      )
    ) {
      return;
    }

    try {
      await axios.put(`${API}/users/${user._id}/status`, {
        status: nextStatus
      });

      alert(
        isBlocked
          ? "Account activated successfully."
          : "Account blocked successfully."
      );

      await loadData();
    } catch (error) {
      console.error("Update user status error:", error);
      alert(
        error.response?.data?.message ||
          "Unable to update account status."
      );
    }
  };

  const getStatusClass = (status) => {
    const value = String(status || "").toLowerCase();
    return `admin-badge ${value}`;
  };

  const formatDate = (date) => {
    if (!date) return "-";

    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return "-";

    return parsed.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  };

  const formatCurrency = (amount) =>
    `₹${Number(amount || 0).toLocaleString("en-IN")}`;

  const getInitials = (name) => {
    if (!name) return "U";

    return name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join("");
  };

  const openBookingDetails = (booking) => {
    setSelectedBooking(booking);
  };

  const closeBookingDetails = () => {
    setSelectedBooking(null);
  };

  return (
    <div className="admin-app">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <div className="admin-brand-icon">🚗</div>
          <div>
            <strong>Vehicle Rental</strong>
            <span>Admin Console</span>
          </div>
        </div>

        <nav className="admin-side-nav">
          <a href="#admin-overview" className="active">
            <span>▦</span> Overview
          </a>
          <a href="#admin-vehicles">
            <span>🚘</span> Vehicles
          </a>
          <a href="#admin-users">
            <span>👥</span> Users
          </a>
          <a href="#admin-bookings">
            <span>📋</span> Bookings
          </a>
          <a href="#admin-payments">
            <span>💳</span> Payments
          </a>
        </nav>

        <div className="admin-sidebar-bottom">
          <div className="admin-side-note">
            <span>●</span>
            <div>
              <strong>System Online</strong>
              <small>Backend connected</small>
            </div>
          </div>

          <button className="admin-side-logout" onClick={onLogout}>
            ⇥ <span>Logout</span>
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar">
          <div>
            <span className="admin-kicker">ADMINISTRATION</span>
            <h1>Dashboard Overview</h1>
          </div>

          <div className="admin-top-actions">
            <button
              className="admin-refresh"
              onClick={loadData}
              disabled={loading}
              title="Refresh dashboard"
            >
              ↻
            </button>

            <div className="admin-profile">
              <div className="admin-avatar">A</div>
              <div>
                <strong>Administrator</strong>
                <span>Super Admin</span>
              </div>
            </div>
          </div>
        </header>

        <div className="admin-content" id="admin-overview">
          <section className="admin-welcome">
            <div>
              <span>VEHICLE RENTAL PORTAL</span>
              <h2>Manage your rental ecosystem.</h2>
              <p>
                Monitor vehicles, owners, customers, bookings and payments from
                one place.
              </p>
            </div>

            <div className="admin-welcome-art">🚙</div>
          </section>

          <section className="admin-stats">
            <div className="admin-stat-card">
              <div className="admin-stat-icon blue">🚘</div>
              <div>
                <span>Total Vehicles</span>
                <strong>{vehicles.length}</strong>
                <small>{vehicles.filter((v) => v.status === "available").length} available</small>
              </div>
            </div>

            <div className="admin-stat-card">
              <div className="admin-stat-icon purple">👥</div>
              <div>
                <span>Total Users</span>
                <strong>{users.length}</strong>
                <small>{owners.length} registered owners</small>
              </div>
            </div>

            <div className="admin-stat-card">
              <div className="admin-stat-icon orange">📋</div>
              <div>
                <span>Total Bookings</span>
                <strong>{bookings.length}</strong>
                <small>{pendingBookings.length} waiting for owner</small>
              </div>
            </div>

            <div className="admin-stat-card">
              <div className="admin-stat-icon green">₹</div>
              <div>
                <span>Successful Payments</span>
                <strong>{paidPayments.length}</strong>
                <small>{formatCurrency(paidPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0))} received</small>
              </div>
            </div>
          </section>

          <section className="admin-section" id="admin-vehicles">
            <div className="admin-section-header">
              <div>
                <span className="admin-section-label">FLEET</span>
                <h2>Vehicle Management</h2>
                <p>Add, edit, assign owners and manage vehicle availability.</p>
              </div>

              <button className="admin-primary-btn" onClick={openAddVehicle}>
                + Add Vehicle
              </button>
            </div>

            {showVehicleForm && (
              <form className="admin-editor" onSubmit={handleVehicleSubmit}>
                <div className="admin-editor-head">
                  <div>
                    <span className="admin-section-label">
                      {editId ? "EDIT VEHICLE" : "NEW VEHICLE"}
                    </span>
                    <h3>{editId ? "Update vehicle details" : "Add a vehicle to the fleet"}</h3>
                  </div>

                  <button
                    type="button"
                    className="admin-close-btn"
                    onClick={closeVehicleForm}
                  >
                    ×
                  </button>
                </div>

                <div className="admin-form-grid">
                  <label>
                    Vehicle Name *
                    <input
                      name="vehicleName"
                      value={vehicleData.vehicleName}
                      onChange={handleVehicleChange}
                      placeholder="e.g. Swift Dzire"
                      required
                    />
                  </label>

                  <label>
                    Vehicle Number *
                    <input
                      name="vehicleNumber"
                      value={vehicleData.vehicleNumber}
                      onChange={handleVehicleChange}
                      placeholder="e.g. MH12AB1234"
                      required
                    />
                  </label>

                  <label>
                    Vehicle Type *
                    <select
                      name="vehicleType"
                      value={vehicleData.vehicleType}
                      onChange={handleVehicleChange}
                      required
                    >
                      <option>Car</option>
                      <option>SUV</option>
                      <option>Sedan</option>
                      <option>Hatchback</option>
                      <option>Bike</option>
                      <option>Scooter</option>
                      <option>Luxury</option>
                      <option>Van</option>
                    </select>
                  </label>

                  <label>
                    Owner *
                    <select
                      name="ownerId"
                      value={vehicleData.ownerId}
                      onChange={handleVehicleChange}
                      required
                    >
                      <option value="">Select owner</option>
                      {owners.map((owner) => (
                        <option key={owner._id} value={owner._id}>
                          {owner.name} — {owner.email}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Brand
                    <input
                      name="brand"
                      value={vehicleData.brand}
                      onChange={handleVehicleChange}
                      placeholder="Maruti"
                    />
                  </label>

                  <label>
                    Model
                    <input
                      name="model"
                      value={vehicleData.model}
                      onChange={handleVehicleChange}
                      placeholder="Dzire"
                    />
                  </label>

                  <label>
                    Year
                    <input
                      name="year"
                      type="number"
                      min="1990"
                      max="2100"
                      value={vehicleData.year}
                      onChange={handleVehicleChange}
                      placeholder="2024"
                    />
                  </label>

                  <label>
                    Fuel Type
                    <select
                      name="fuelType"
                      value={vehicleData.fuelType}
                      onChange={handleVehicleChange}
                    >
                      <option>Petrol</option>
                      <option>Diesel</option>
                      <option>Electric</option>
                      <option>CNG</option>
                      <option>Hybrid</option>
                    </select>
                  </label>

                  <label>
                    Transmission
                    <select
                      name="transmissionType"
                      value={vehicleData.transmissionType}
                      onChange={handleVehicleChange}
                    >
                      <option>Manual</option>
                      <option>Automatic</option>
                      <option>AMT</option>
                      <option>CVT</option>
                    </select>
                  </label>

                  <label>
                    Seats
                    <input
                      name="seatingCapacity"
                      type="number"
                      min="1"
                      max="100"
                      value={vehicleData.seatingCapacity}
                      onChange={handleVehicleChange}
                      placeholder="5"
                    />
                  </label>

                  <label>
                    Price / Day *
                    <input
                      name="pricePerDay"
                      type="number"
                      min="1"
                      value={vehicleData.pricePerDay}
                      onChange={handleVehicleChange}
                      placeholder="1500"
                      required
                    />
                  </label>

                  <label>
                    Status
                    <select
                      name="status"
                      value={vehicleData.status}
                      onChange={handleVehicleChange}
                    >
                      <option value="available">Available</option>
                      <option value="booked">Booked</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </label>

                  <label className="admin-form-full">
                    Image URL
                    <input
                      name="image"
                      value={vehicleData.image}
                      onChange={handleVehicleChange}
                      placeholder="https://example.com/car.jpg"
                    />
                    <small>Use a public image URL for the vehicle photo.</small>
                  </label>
                </div>

                <div className="admin-editor-actions">
                  <button
                    type="button"
                    className="admin-secondary-btn"
                    onClick={closeVehicleForm}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="admin-primary-btn"
                    disabled={saving || owners.length === 0}
                  >
                    {saving
                      ? "Saving..."
                      : editId
                        ? "Update Vehicle"
                        : "Add Vehicle"}
                  </button>
                </div>

                {owners.length === 0 && (
                  <p className="admin-warning">
                    No owner account found. Register an owner before adding a vehicle.
                  </p>
                )}
              </form>
            )}

            <div className="admin-toolbar">
              <div className="admin-search">
                🔎
                <input
                  value={vehicleSearch}
                  onChange={(e) => setVehicleSearch(e.target.value)}
                  placeholder="Search vehicle, number, brand or owner..."
                />
              </div>

              <select
                value={vehicleStatus}
                onChange={(e) => setVehicleStatus(e.target.value)}
              >
                <option value="all">All statuses</option>
                <option value="available">Available</option>
                <option value="booked">Booked</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Vehicle</th>
                    <th>Owner</th>
                    <th>Type</th>
                    <th>Price</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredVehicles.map((vehicle) => (
                    <tr key={vehicle._id}>
                      <td>
                        <div className="admin-vehicle-cell">
                          {vehicle.image ? (
                            <img
                              src={vehicle.image}
                              alt={vehicle.vehicleName}
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                                e.currentTarget.nextElementSibling.style.display = "grid";
                              }}
                            />
                          ) : null}
                          <div
                            className="admin-vehicle-placeholder"
                            style={{ display: vehicle.image ? "none" : "grid" }}
                          >
                            🚘
                          </div>
                          <div>
                            <strong>{vehicle.vehicleName}</strong>
                            <span>{vehicle.vehicleNumber}</span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <strong>{vehicle.ownerId?.name || "Unassigned"}</strong>
                        <small>{vehicle.ownerId?.email || "—"}</small>
                      </td>

                      <td>
                        {vehicle.vehicleType}
                        <small>
                          {vehicle.brand || ""} {vehicle.model || ""}
                        </small>
                      </td>

                      <td>
                        <strong>{formatCurrency(vehicle.pricePerDay)}</strong>
                        <small>/ day</small>
                      </td>

                      <td>
                        <span className={getStatusClass(vehicle.status)}>
                          {vehicle.status}
                        </span>
                      </td>

                      <td>
                        <div className="admin-action-group">
                          <button
                            className="admin-icon-btn edit"
                            onClick={() => editVehicle(vehicle)}
                            title="Edit vehicle"
                          >
                            ✎
                          </button>
                          <button
                            className="admin-icon-btn delete"
                            onClick={() => deleteVehicle(vehicle._id)}
                            title="Delete vehicle"
                          >
                            🗑
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {!loading && filteredVehicles.length === 0 && (
                    <tr>
                      <td colSpan="6">
                        <div className="admin-empty">No vehicles found.</div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="admin-section" id="admin-users">
            <div className="admin-section-header compact">
              <div>
                <span className="admin-section-label">PEOPLE</span>
                <h2>Users & Owners</h2>
                <p>All registered portal accounts.</p>
              </div>

              <select
                className="admin-header-filter"
                value={userFilter}
                onChange={(e) => setUserFilter(e.target.value)}
              >
                <option value="all">All users</option>
                <option value="user">Customers</option>
                <option value="owner">Owners</option>
                <option value="admin">Admins</option>
              </select>
            </div>

            <div className="admin-user-grid">
              {filteredUsers.map((user) => (
                <div className="admin-user-card" key={user._id}>
                  <div className="admin-user-avatar">{getInitials(user.name)}</div>
                  <div className="admin-user-info">
                    <strong>{user.name}</strong>
                    <span>{user.email}</span>
                    <small>{user.phone || "No phone"} • {user.role}</small>
                  </div>

                  <div className="admin-user-actions">
                    <span className={getStatusClass(user.status)}>
                      {user.status || "active"}
                    </span>

                    {user.role !== "admin" && (
                      <button
                        type="button"
                        className={`admin-user-action-btn ${
                          user.status === "inactive"
                            ? "activate"
                            : "block"
                        }`}
                        onClick={() => updateUserStatus(user)}
                      >
                        {user.status === "inactive"
                          ? "Activate"
                          : "Block"}
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {!loading && filteredUsers.length === 0 && (
                <div className="admin-empty">No users found.</div>
              )}
            </div>
          </section>

          <section className="admin-section" id="admin-bookings">
            <div className="admin-section-header compact">
              <div>
                <span className="admin-section-label">RENTALS</span>
                <h2>Booking Requests</h2>
                <p>
                  Owners approve or reject requests. Admin can monitor the full
                  workflow.
                </p>
              </div>

              <select
                className="admin-header-filter"
                value={bookingFilter}
                onChange={(e) => setBookingFilter(e.target.value)}
              >
                <option value="all">All bookings</option>
                <option value="pending">Pending owner decision</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="paid">Paid</option>
              </select>
            </div>

            <div className="admin-booking-summary">
              <span><b>{bookings.length}</b> total</span>
              <span><b>{pendingBookings.length}</b> pending</span>
              <span><b>{approvedBookings.length}</b> approved</span>
              <span><b>{bookings.filter((b) => b.ownerDecision === "rejected").length}</b> rejected</span>
            </div>

            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Vehicle / Owner</th>
                    <th>Trip</th>
                    <th>Dates</th>
                    <th>Amount</th>
                    <th>Owner Decision</th>
                    <th>Payment</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredBookings.map((booking) => (
                    <tr key={booking._id}>
                      <td>
                        <strong>{booking.userId?.name || "User"}</strong>
                        <small>{booking.userId?.email || "—"}</small>
                      </td>

                      <td>
                        <strong>{booking.vehicleId?.vehicleName || "Vehicle"}</strong>
                        <small>
                          Owner: {booking.ownerId?.name || "—"}
                        </small>
                      </td>

                      <td>
                        <strong>{booking.pickupLocation}</strong>
                        <small>↓ {booking.dropLocation}</small>
                      </td>

                      <td>
                        <strong>{formatDate(booking.startDate)}</strong>
                        <small>to {formatDate(booking.endDate)}</small>
                      </td>

                      <td>
                        <strong>{formatCurrency(booking.totalAmount)}</strong>
                        <small>{booking.totalDays} day(s)</small>
                      </td>

                      <td>
                        <span className={getStatusClass(booking.ownerDecision)}>
                          {booking.ownerDecision || "pending"}
                        </span>
                      </td>

                      <td>
                        <span
                          className={getStatusClass(
                            booking.paymentStatus || "pending"
                          )}
                        >
                          {booking.paymentStatus || "pending"}
                        </span>
                      </td>

                      <td>
                        <button
                          type="button"
                          className="admin-view-btn"
                          onClick={() => openBookingDetails(booking)}
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}

                  {!loading && filteredBookings.length === 0 && (
                    <tr>
                      <td colSpan="8">
                        <div className="admin-empty">No bookings found.</div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {selectedBooking && (
            <div
              className="admin-modal-overlay"
              onClick={closeBookingDetails}
            >
              <div
                className="admin-modal"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="admin-modal-header">
                  <div>
                    <span className="admin-section-label">
                      BOOKING DETAILS
                    </span>
                    <h2>
                      {selectedBooking.vehicleId?.vehicleName ||
                        "Vehicle Booking"}
                    </h2>
                  </div>

                  <button
                    type="button"
                    className="admin-close-btn"
                    onClick={closeBookingDetails}
                  >
                    ×
                  </button>
                </div>

                <div className="admin-modal-grid">
                  <div className="admin-detail-card">
                    <span>Customer</span>
                    <strong>
                      {selectedBooking.userId?.name || "—"}
                    </strong>
                    <small>
                      {selectedBooking.userId?.email || "—"}
                    </small>
                    <small>
                      {selectedBooking.userId?.phone || "—"}
                    </small>
                  </div>

                  <div className="admin-detail-card">
                    <span>Vehicle</span>
                    <strong>
                      {selectedBooking.vehicleId?.vehicleName || "—"}
                    </strong>
                    <small>
                      {selectedBooking.vehicleId?.vehicleNumber || "—"}
                    </small>
                  </div>

                  <div className="admin-detail-card">
                    <span>Owner</span>
                    <strong>
                      {selectedBooking.ownerId?.name || "—"}
                    </strong>
                    <small>
                      {selectedBooking.ownerId?.email || "—"}
                    </small>
                  </div>

                  <div className="admin-detail-card">
                    <span>Total Amount</span>
                    <strong>
                      {formatCurrency(selectedBooking.totalAmount)}
                    </strong>
                    <small>
                      {selectedBooking.totalDays || 0} day(s)
                    </small>
                  </div>
                </div>

                <div className="admin-detail-section">
                  <h3>Trip Information</h3>

                  <div className="admin-trip-grid">
                    <div>
                      <span>Pickup</span>
                      <strong>
                        {selectedBooking.pickupLocation || "—"}
                      </strong>
                    </div>

                    <div>
                      <span>Drop</span>
                      <strong>
                        {selectedBooking.dropLocation || "—"}
                      </strong>
                    </div>

                    <div>
                      <span>Start Date</span>
                      <strong>
                        {formatDate(selectedBooking.startDate)}
                      </strong>
                    </div>

                    <div>
                      <span>End Date</span>
                      <strong>
                        {formatDate(selectedBooking.endDate)}
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="admin-detail-section">
                  <h3>Booking Status</h3>

                  <div className="admin-status-row">
                    <div>
                      <span>Owner Decision</span>
                      <b
                        className={getStatusClass(
                          selectedBooking.ownerDecision || "pending"
                        )}
                      >
                        {selectedBooking.ownerDecision || "pending"}
                      </b>
                    </div>

                    <div>
                      <span>Booking</span>
                      <b
                        className={getStatusClass(
                          selectedBooking.bookingStatus || "pending"
                        )}
                      >
                        {selectedBooking.bookingStatus || "pending"}
                      </b>
                    </div>

                    <div>
                      <span>Payment</span>
                      <b
                        className={getStatusClass(
                          selectedBooking.paymentStatus || "pending"
                        )}
                      >
                        {selectedBooking.paymentStatus || "pending"}
                      </b>
                    </div>
                  </div>
                </div>

                <div className="admin-modal-footer">
                  <button
                    type="button"
                    className="admin-secondary-btn"
                    onClick={closeBookingDetails}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

          <section className="admin-section" id="admin-payments">
            <div className="admin-section-header compact">
              <div>
                <span className="admin-section-label">FINANCE</span>
                <h2>Payment Records</h2>
                <p>Successful and failed payment transactions.</p>
              </div>
            </div>

            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Booking</th>
                    <th>Customer</th>
                    <th>Amount</th>
                    <th>Method</th>
                    <th>Transaction</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>

                <tbody>
                  {payments.map((payment) => (
                    <tr key={payment._id}>
                      <td>
                        <strong>
                          {payment.bookingId?._id || payment.bookingId || "—"}
                        </strong>
                      </td>
                      <td>
                        {payment.bookingId?.userId?.name || "—"}
                      </td>
                      <td>
                        <strong>{formatCurrency(payment.amount)}</strong>
                      </td>
                      <td>{payment.paymentMethod || "—"}</td>
                      <td>
                        <span className="transaction-id">
                          {payment.transactionId || "—"}
                        </span>
                      </td>
                      <td>
                        <span
                          className={getStatusClass(
                            payment.paymentStatus || "pending"
                          )}
                        >
                          {payment.paymentStatus || "pending"}
                        </span>
                      </td>
                      <td>{formatDate(payment.paymentDate || payment.createdAt)}</td>
                    </tr>
                  ))}

                  {!loading && payments.length === 0 && (
                    <tr>
                      <td colSpan="7">
                        <div className="admin-empty">No payment records found.</div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <footer className="admin-footer">
            Vehicle Rental Portal • Admin Console
          </footer>
        </div>
      </main>
    </div>
  );
}

export default AdminDashboard;
