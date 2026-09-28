import { useEffect, useState } from "react";
import axios from "axios";
import "./UserDashboard.css";
import BookingForm from "./BookingForm";

const API = "http://localhost:5000";

function UserDashboard({ onLogout }) {
  const userId = localStorage.getItem("userId");
  const [user, setUser] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [activePage, setActivePage] = useState("home");
  const [search, setSearch] = useState("");
  const [type, setType] = useState("all");
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [showBookingForm, setShowBookingForm] = useState(false);

  const loadData = async () => {
    try {
      const [u, v, b] = await Promise.all([
        axios.get(`${API}/api/users/${userId}`),
        axios.get(`${API}/api/vehicles`),
        axios.get(`${API}/api/bookings/user/${userId}`)
      ]);
      setUser(u.data);
      setVehicles(v.data || []);
      setBookings(b.data || []);
    } catch (error) {
      console.log("USER DASHBOARD:", error);
      try {
        const [v, b] = await Promise.all([
          axios.get(`${API}/api/vehicles`),
          axios.get(`${API}/api/bookings/user/${userId}`)
        ]);
        setVehicles(v.data || []);
        setBookings(b.data || []);
      } catch (e) {
        console.log(e);
      }
    }
  };

  useEffect(() => {
    if (!userId) return;

    let cancelled = false;

    const fetchUserDashboardData = async () => {
      try {
        const [u, v, b] = await Promise.all([
          axios.get(`${API}/api/users/${userId}`),
          axios.get(`${API}/api/vehicles`),
          axios.get(`${API}/api/bookings/user/${userId}`)
        ]);

        if (cancelled) return;

        setUser(u.data);
        setVehicles(v.data || []);
        setBookings(b.data || []);
      } catch (error) {
        console.log("USER DASHBOARD:", error);

        try {
          const [v, b] = await Promise.all([
            axios.get(`${API}/api/vehicles`),
            axios.get(`${API}/api/bookings/user/${userId}`)
          ]);

          if (cancelled) return;

          setVehicles(v.data || []);
          setBookings(b.data || []);
        } catch (fallbackError) {
          console.log("USER DASHBOARD FALLBACK:", fallbackError);
        }
      }
    };

    fetchUserDashboardData();

    // Automatically check booking status every 3 seconds.
    // This updates the user's My Bookings without page reload.
    const refreshTimer = setInterval(() => {
      fetchUserDashboardData();
    }, 3000);

    const handleFocus = () => {
      fetchUserDashboardData();
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      cancelled = true;
      clearInterval(refreshTimer);
      window.removeEventListener("focus", handleFocus);
    };
  }, [userId]);

  const openBooking = (vehicle) => {
    setSelectedVehicle(vehicle);
    setShowBookingForm(true);
  };

  // =====================================================
  // RAZORPAY PAYMENT
  // =====================================================

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }

      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async (booking) => {
    try {
      if (!booking?._id) {
        alert("Booking information is missing.");
        return;
      }

      if (booking.ownerDecision !== "approved") {
        alert("Payment is available only after owner approval.");
        return;
      }

      if (booking.paymentStatus === "paid") {
        alert("This booking is already paid.");
        return;
      }

      const scriptLoaded = await loadRazorpayScript();

      if (!scriptLoaded) {
        alert("Unable to load Razorpay Checkout. Please check your internet connection.");
        return;
      }

      const orderResponse = await axios.post(
        `${API}/api/payments/create-order`,
        { bookingId: booking._id }
      );

      const { orderId, amount, currency, keyId } = orderResponse.data;

      if (!orderId || !keyId) {
        alert("Unable to create Razorpay order.");
        return;
      }

      const options = {
        key: keyId,
        amount,
        currency,
        name: "Vehicle Rental Portal",
        description: `Vehicle booking - ${booking.vehicleId?.vehicleName || "Vehicle"}`,
        order_id: orderId,

        prefill: {
          name: user?.name || "",
          email: user?.email || "",
          contact: user?.phone || ""
        },

        notes: {
          bookingId: booking._id
        },

        theme: {
          color: "#2563eb"
        },

        handler: async function (response) {
          try {
            const verifyResponse = await axios.post(
              `${API}/api/payments/verify`,
              {
                bookingId: booking._id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              }
            );

            alert(
              verifyResponse.data?.message ||
              "Payment successful! Your booking is confirmed."
            );

            await loadData();
            setActivePage("bookings");
          } catch (error) {
            console.error("PAYMENT VERIFY ERROR:", error);
            alert(
              error.response?.data?.message ||
              "Payment verification failed. Please contact support."
            );
          }
        },

        modal: {
          ondismiss: function () {
            console.log("Razorpay checkout closed.");
          }
        }
      };

      const razorpay = new window.Razorpay(options);

      razorpay.on("payment.failed", function (response) {
        console.error("RAZORPAY PAYMENT FAILED:", response.error);
        alert(
          response.error?.description ||
          "Payment failed. Please try again."
        );
      });

      razorpay.open();
    } catch (error) {
      console.error("RAZORPAY PAYMENT ERROR:", error);
      alert(
        error.response?.data?.message ||
        "Unable to start payment. Please try again."
      );
    }
  };

  const logout = () => {
    localStorage.removeItem("userId");
    localStorage.removeItem("role");
    onLogout();
  };

  const filteredVehicles = vehicles.filter((v) => {
    const text = `${v.vehicleName} ${v.brand || ""} ${v.model || ""} ${v.vehicleNumber || ""}`.toLowerCase();
    return (
      text.includes(search.toLowerCase()) &&
      (type === "all" || (v.vehicleType || "").toLowerCase() === type)
    );
  });

  if (showBookingForm && selectedVehicle) {
    return (
      <BookingForm
        vehicle={selectedVehicle}
        onBack={() => {
          setShowBookingForm(false);
          setSelectedVehicle(null);
        }}
        onSuccess={async () => {
          setShowBookingForm(false);
          setSelectedVehicle(null);
          setActivePage("bookings");
          await loadData();
          alert(
            "Booking request submitted successfully. Please wait for owner approval."
          );
        }}
      />
    );
  }

  return (
    <div className="user-app">
      <aside className="user-sidebar">
        <div className="user-brand">
          <div className="brand-car">🚘</div>
          <div>
            <strong>Vehicle Rental</strong>
            <span>Drive Your Dreams</span>
          </div>
        </div>

        <nav>
          <button className={activePage === "home" ? "active" : ""} onClick={() => setActivePage("home")}>⌂ Dashboard</button>
          <button className={activePage === "vehicles" ? "active" : ""} onClick={() => setActivePage("vehicles")}>🚘 Browse Vehicles</button>
          <button className={activePage === "bookings" ? "active" : ""} onClick={() => setActivePage("bookings")}>
            📋 My Bookings
            {bookings.filter(b => (b.bookingStatus || "pending") === "pending").length > 0 &&
              <b>{bookings.filter(b => (b.bookingStatus || "pending") === "pending").length}</b>}
          </button>
          <button className={activePage === "profile" ? "active" : ""} onClick={() => setActivePage("profile")}>● My Profile</button>
        </nav>

        <div className="user-sidebar-card">
          <div>🗺️</div>
          <strong>Your journey<br />starts here.</strong>
          <span>Find a vehicle and hit the road.</span>
        </div>

        <button className="user-logout" onClick={logout}>⇥ Logout</button>
      </aside>

      <div className="user-main">
        <header className="user-topbar">
          <div className="user-search">🔍 <input placeholder="Search vehicles, brands..." value={search} onChange={e => setSearch(e.target.value)} /></div>
          <div className="user-top-profile">
            <div className="user-avatar">{(user?.name || "U").charAt(0).toUpperCase()}</div>
            <div><strong>{user?.name || "Customer"}</strong><span>Customer</span></div>
          </div>
        </header>

        <main className="user-page">
          {activePage === "home" && (
            <>
              <section className="user-hero">
                <div>
                  <span>READY FOR YOUR NEXT RIDE?</span>
                  <h1>Find your perfect<br /><em>vehicle.</em></h1>
                  <p>Choose from trusted vehicles, send a booking request and let the owner approve your journey.</p>
                  <button onClick={() => setActivePage("vehicles")}>Explore Vehicles →</button>
                </div>
                <div className="hero-car">🚙</div>
              </section>

              <section className="user-stats">
                <div><span>🚘</span><strong>{vehicles.length}</strong><small>Available Vehicles</small></div>
                <div><span>📋</span><strong>{bookings.length}</strong><small>My Bookings</small></div>
                <div><span>✓</span><strong>{bookings.filter(b => b.bookingStatus === "approved").length}</strong><small>Approved</small></div>
              </section>

              <section className="user-section">
                <div className="section-head">
                  <div><span>RECOMMENDED FOR YOU</span><h2>Popular Vehicles</h2></div>
                  <button onClick={() => setActivePage("vehicles")}>View all →</button>
                </div>
                <VehicleGrid vehicles={filteredVehicles.slice(0, 3)} onBook={openBooking} />
              </section>
            </>
          )}

          {activePage === "vehicles" && (
            <section className="user-section">
              <div className="page-title">
                <div><span>EXPLORE</span><h1>Available Vehicles</h1><p>Choose a vehicle that matches your journey.</p></div>
                <select value={type} onChange={e => setType(e.target.value)}>
                  <option value="all">All Types</option>
                  <option value="car">Car</option>
                  <option value="bike">Bike</option>
                  <option value="suv">SUV</option>
                  <option value="van">Van</option>
                </select>
              </div>
              <VehicleGrid vehicles={filteredVehicles} onBook={openBooking} />
            </section>
          )}

          {activePage === "bookings" && (
            <section className="user-section">
              <div className="page-title"><div><span>YOUR JOURNEY</span><h1>My Bookings</h1><p>Track your booking requests, approvals and payments.</p></div></div>
              {bookings.length === 0 ? (
                <div className="user-empty">📋<h2>No bookings yet</h2><p>Choose a vehicle to start your journey.</p></div>
              ) : (
                <div className="booking-cards">
                  {bookings.map(b => (
                    <div className="my-booking" key={b._id}>
                      <div className="booking-photo">{b.vehicleId?.image ? <img src={b.vehicleId.image} alt="" /> : "🚘"}</div>
                      <div className="booking-info">
                        <span className={`booking-status ${b.bookingStatus || "pending"}`}>
                          {b.paymentStatus === "paid"
                            ? "confirmed"
                            : b.ownerDecision === "approved"
                              ? "approved"
                              : (b.bookingStatus || "pending")}
                        </span>

                        <h3>{b.vehicleId?.vehicleName || "Vehicle"}</h3>

                        <p>
                          {b.vehicleId?.vehicleType || "Vehicle"} ·{" "}
                          {b.vehicleId?.brand || ""} {b.vehicleId?.model || ""}
                        </p>

                        <div className="booking-meta">
                          <span>📅 {new Date(b.startDate).toLocaleDateString()}</span>
                          <span>→ {new Date(b.endDate).toLocaleDateString()}</span>
                          <strong>₹{b.totalAmount || 0}</strong>
                        </div>

                        {b.ownerDecision === "approved" && b.paymentStatus !== "paid" && (
                          <button
                            type="button"
                            onClick={() => handlePayment(b)}
                            style={{
                              marginTop: "14px",
                              width: "100%",
                              padding: "12px 18px",
                              border: "none",
                              borderRadius: "10px",
                              background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
                              color: "#fff",
                              fontWeight: "700",
                              fontSize: "14px",
                              cursor: "pointer",
                              boxShadow: "0 6px 18px rgba(37, 99, 235, 0.22)"
                            }}
                          >
                            💳 Pay Now · ₹{b.totalAmount || 0}
                          </button>
                        )}

                        {b.paymentStatus === "paid" && (
                          <div
                            style={{
                              marginTop: "14px",
                              padding: "11px 14px",
                              borderRadius: "10px",
                              background: "#ecfdf5",
                              color: "#047857",
                              fontWeight: "700",
                              fontSize: "13px"
                            }}
                          >
                            ✓ Payment Completed
                          </div>
                        )}

                        {b.ownerDecision === "rejected" && (
                          <div
                            style={{
                              marginTop: "14px",
                              padding: "11px 14px",
                              borderRadius: "10px",
                              background: "#fef2f2",
                              color: "#b91c1c",
                              fontWeight: "700",
                              fontSize: "13px"
                            }}
                          >
                            ✕ Booking Rejected
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {activePage === "profile" && (
            <section className="user-section profile-card">
              <span>ACCOUNT</span><h1>My Profile</h1>
              <div className="profile-avatar">{(user?.name || "U").charAt(0).toUpperCase()}</div>
              <div className="profile-grid">
                <div><small>Name</small><strong>{user?.name || "-"}</strong></div>
                <div><small>Email</small><strong>{user?.email || "-"}</strong></div>
                <div><small>Phone</small><strong>{user?.phone || "-"}</strong></div>
                <div><small>Address</small><strong>{user?.address || "-"}</strong></div>
              </div>
            </section>
          )}
        </main>
      </div>

    </div>
  );
}

function VehicleGrid({ vehicles, onBook }) {
  if (!vehicles.length) return <div className="user-empty">🚘<h2>No vehicles found</h2><p>Try another search or check back later.</p></div>;

  return (
    <div className="user-vehicle-grid">
      {vehicles.map(v => (
        <article className="user-vehicle" key={v._id}>
          <div className="user-vehicle-image">
            {v.image ? <img src={v.image} alt={v.vehicleName} /> : <div>🚘</div>}
            <span>Available</span>
          </div>
          <div className="user-vehicle-body">
            <small>{v.vehicleType} · {v.brand || "Brand"} · {v.year || "Year"}</small>
            <h3>{v.vehicleName}</h3>
            <div className="user-specs">
              <span>⚙ {v.transmissionType || "Manual"}</span>
              <span>👥 {v.seatingCapacity || "-"} Seats</span>
              <span>⛽ {v.fuelType || "-"}</span>
              <span>▣ {v.vehicleNumber || "-"}</span>
            </div>
            <div className="vehicle-footer">
              <strong>₹{v.pricePerDay}<small>/day</small></strong>
              <button onClick={() => onBook(v)}>Book Now →</button>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

export default UserDashboard;
