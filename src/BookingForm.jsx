import React, { useMemo, useState } from "react";
import axios from "axios";
import "./BookingForm.css";

const API = "http://localhost:5000";

function BookingForm({ vehicle, onBack, onSuccess }) {
  const [form, setForm] = useState({
    pickupLocation: "",
    dropLocation: "",
    pickupDate: "",
    returnDate: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const today = new Date().toISOString().split("T")[0];

  const totalDays = useMemo(() => {
    if (!form.pickupDate || !form.returnDate) return 0;

    const pickup = new Date(`${form.pickupDate}T00:00:00`);
    const returned = new Date(`${form.returnDate}T00:00:00`);

    const diff = returned.getTime() - pickup.getTime();

    if (diff <= 0) return 0;

    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }, [form.pickupDate, form.returnDate]);

  const totalAmount = totalDays * Number(vehicle?.pricePerDay || 0);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (error) {
      setError("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const userId = localStorage.getItem("userId");

    if (!userId) {
      setError("Please login first to continue booking.");
      return;
    }

    const pickupLocation = form.pickupLocation.trim();
    const dropLocation = form.dropLocation.trim();

    if (!pickupLocation || !dropLocation) {
      setError("Please enter pickup and drop locations.");
      return;
    }

    if (!form.pickupDate || !form.returnDate) {
      setError("Please select pickup and return dates.");
      return;
    }

    if (form.pickupDate < today) {
      setError("Pickup date cannot be before today.");
      return;
    }

    if (form.returnDate <= form.pickupDate) {
      setError("Return date must be after the pickup date.");
      return;
    }

    if (totalDays <= 0) {
      setError("Please select valid rental dates.");
      return;
    }

    if (!vehicle?._id) {
      setError("Vehicle information is missing. Please go back and select the vehicle again.");
      return;
    }

    if (
      vehicle?.status &&
      String(vehicle.status).toLowerCase() !== "available"
    ) {
      setError("This vehicle is currently not available.");
      return;
    }

    const ownerId =
      typeof vehicle.ownerId === "object"
        ? vehicle.ownerId?._id
        : vehicle.ownerId;

    if (!ownerId) {
      setError(
        "Owner information is missing for this vehicle. Please contact the administrator."
      );
      return;
    }

    const payload = {
      // Current/new booking field names
      userId,
      vehicleId: vehicle._id,
      ownerId,
      pickupLocation,
      dropLocation,
      pickupDate: form.pickupDate,
      returnDate: form.returnDate,

      // Existing backend compatibility
      startDate: form.pickupDate,
      endDate: form.returnDate,

      totalDays,
      totalAmount,
      amount: totalAmount,
    };

    try {
      setLoading(true);

      const response = await axios.post(
        `${API}/api/bookings`,
        payload
      );

      const message =
        response.data?.message ||
        "Booking request submitted successfully!";

      if (onSuccess) {
        await onSuccess(response.data);
      } else {
        alert(message);
      }
    } catch (err) {
      console.error("Booking error:", err);
      console.error("Booking response:", err.response?.data);

      const serverMessage =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.response?.data?.errors;

      if (Array.isArray(serverMessage)) {
        setError(serverMessage.join(", "));
      } else {
        setError(
          serverMessage ||
            `Booking failed (${err.response?.status || "server error"}). Please try again.`
        );
      }
    } finally {
      setLoading(false);
    }
  };

  if (!vehicle) return null;

  return (
    <div className="booking-page">
      <div className="booking-topbar">
        <button
          type="button"
          className="booking-back-btn"
          onClick={onBack}
          disabled={loading}
        >
          ← Back to Vehicle
        </button>

        <div className="booking-step-indicator">
          <span className="active">1</span>
          <span className="line"></span>
          <span>2</span>
          <span className="line"></span>
          <span>3</span>
        </div>
      </div>

      <div className="booking-wrapper">
        <div className="booking-main-card">
          <div className="booking-heading">
            <span className="booking-label">BOOK YOUR VEHICLE</span>
            <h1>Complete Your Booking</h1>
            <p>
              Enter your trip details and submit a booking request to the
              vehicle owner.
            </p>
          </div>

          {error && (
            <div className="booking-error" role="alert">
              ⚠ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="booking-section">
              <h2>📍 Trip Information</h2>

              <div className="booking-grid">
                <div className="booking-field">
                  <label htmlFor="pickupLocation">Pickup Location</label>
                  <input
                    id="pickupLocation"
                    type="text"
                    name="pickupLocation"
                    value={form.pickupLocation}
                    onChange={handleChange}
                    placeholder="Enter pickup location"
                    autoComplete="street-address"
                  />
                </div>

                <div className="booking-field">
                  <label htmlFor="dropLocation">Drop Location</label>
                  <input
                    id="dropLocation"
                    type="text"
                    name="dropLocation"
                    value={form.dropLocation}
                    onChange={handleChange}
                    placeholder="Enter drop location"
                    autoComplete="street-address"
                  />
                </div>

                <div className="booking-field">
                  <label htmlFor="pickupDate">Pickup Date</label>
                  <input
                    id="pickupDate"
                    type="date"
                    name="pickupDate"
                    value={form.pickupDate}
                    min={today}
                    onChange={handleChange}
                  />
                </div>

                <div className="booking-field">
                  <label htmlFor="returnDate">Return Date</label>
                  <input
                    id="returnDate"
                    type="date"
                    name="returnDate"
                    value={form.returnDate}
                    min={form.pickupDate || today}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            <div className="booking-section">
              <h2>🚗 Vehicle Information</h2>

              <div className="booking-vehicle-mini">
                <div className="booking-mini-image">
                  {vehicle.image ? (
                    <img
                      src={vehicle.image}
                      alt={vehicle.vehicleName}
                    />
                  ) : (
                    <span>🚗</span>
                  )}
                </div>

                <div className="booking-mini-info">
                  <h3>{vehicle.vehicleName}</h3>
                  <p>
                    {vehicle.brand || "Vehicle"} •{" "}
                    {vehicle.model || "Model"}
                  </p>
                  <span>
                    {vehicle.vehicleNumber || "Vehicle Number N/A"}
                  </span>
                </div>

                <div className="booking-mini-price">
                  <strong>₹{Number(vehicle.pricePerDay || 0)}</strong>
                  <small>per day</small>
                </div>
              </div>
            </div>

            <div className="booking-summary-mobile">
              <div>
                <span>Rental Days</span>
                <strong>{totalDays}</strong>
              </div>
              <div>
                <span>Daily Rate</span>
                <strong>
                  ₹{Number(vehicle.pricePerDay || 0).toLocaleString("en-IN")}
                </strong>
              </div>
              <div>
                <span>Total</span>
                <strong>₹{totalAmount.toLocaleString("en-IN")}</strong>
              </div>
            </div>

            <button
              className="confirm-booking-btn"
              type="submit"
              disabled={loading}
            >
              {loading
                ? "Submitting Booking..."
                : "✓ Confirm Booking Request"}
            </button>
          </form>
        </div>

        <aside className="booking-summary-card">
          <div className="summary-image">
            {vehicle.image ? (
              <img src={vehicle.image} alt={vehicle.vehicleName} />
            ) : (
              <span>🚗</span>
            )}
          </div>

          <div className="summary-content">
            <span className="summary-type">
              {vehicle.vehicleType || "Vehicle"}
            </span>

            <h2>{vehicle.vehicleName}</h2>

            <p className="summary-brand">
              {vehicle.brand || "N/A"} • {vehicle.model || "N/A"}
            </p>

            <div className="summary-divider"></div>

            <div className="summary-row">
              <span>Price / Day</span>
              <strong>
                ₹{Number(vehicle.pricePerDay || 0).toLocaleString("en-IN")}
              </strong>
            </div>

            <div className="summary-row">
              <span>Rental Days</span>
              <strong>{totalDays}</strong>
            </div>

            <div className="summary-row">
              <span>Vehicle</span>
              <strong>{vehicle.vehicleNumber || "N/A"}</strong>
            </div>

            <div className="summary-total">
              <span>Total Amount</span>
              <strong>₹{totalAmount.toLocaleString("en-IN")}</strong>
            </div>

            <div className="booking-note">
              <span>🔐</span>
              <p>
                Your request will be sent to the vehicle owner for approval.
                Payment is made after approval.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default BookingForm;
