import React from "react";
import "./VehicleDetails.css";

function VehicleDetails({ vehicle, onBack, onBook }) {
  if (!vehicle) return null;

  return (
    <div className="vehicle-details-page">

      {/* HEADER */}
      <div className="details-header">
        <button className="back-btn" onClick={onBack}>
          ← Back to Vehicles
        </button>
      </div>

      {/* MAIN */}
      <div className="details-container">

        {/* IMAGE */}
        <div className="details-image-section">
          {vehicle.image ? (
            <img
              src={vehicle.image}
              alt={vehicle.vehicleName}
              className="details-image"
            />
          ) : (
            <div className="no-image">
              🚗
            </div>
          )}

          <div className="availability-badge">
            ● {vehicle.status || "Available"}
          </div>
        </div>

        {/* INFORMATION */}
        <div className="details-info">

          <span className="vehicle-type">
            {vehicle.vehicleType}
          </span>

          <h1>{vehicle.vehicleName}</h1>

          <p className="vehicle-brand">
            {vehicle.brand} • {vehicle.model}
          </p>

          <div className="price-box">
            <span>₹{vehicle.pricePerDay}</span>
            <small> / Day</small>
          </div>

          <div className="specifications">

            <div className="spec-item">
              <span>🚘</span>
              <div>
                <small>Brand</small>
                <strong>{vehicle.brand || "N/A"}</strong>
              </div>
            </div>

            <div className="spec-item">
              <span>📋</span>
              <div>
                <small>Model</small>
                <strong>{vehicle.model || "N/A"}</strong>
              </div>
            </div>

            <div className="spec-item">
              <span>📅</span>
              <div>
                <small>Year</small>
                <strong>{vehicle.year || "N/A"}</strong>
              </div>
            </div>

            <div className="spec-item">
              <span>⛽</span>
              <div>
                <small>Fuel Type</small>
                <strong>{vehicle.fuelType || "N/A"}</strong>
              </div>
            </div>

            <div className="spec-item">
              <span>⚙️</span>
              <div>
                <small>Transmission</small>
                <strong>
                  {vehicle.transmissionType || "N/A"}
                </strong>
              </div>
            </div>

            <div className="spec-item">
              <span>👥</span>
              <div>
                <small>Seats</small>
                <strong>
                  {vehicle.seatingCapacity || "N/A"}
                </strong>
              </div>
            </div>

          </div>

          <div className="vehicle-number">
            <span>Vehicle Number</span>
            <strong>
              {vehicle.vehicleNumber || "Not Available"}
            </strong>
          </div>

          <button
            className="details-book-btn"
            onClick={() => onBook(vehicle)}
            disabled={vehicle.status !== "available"}
          >
            {vehicle.status === "available"
              ? "🚗 Book This Vehicle"
              : "Vehicle Not Available"}
          </button>

        </div>
      </div>

      {/* EXTRA INFORMATION */}
      <div className="details-bottom">

        <div className="info-card">
          <div className="info-icon">🔒</div>
          <div>
            <h3>Secure Booking</h3>
            <p>
              Your booking request is securely sent to the vehicle owner.
            </p>
          </div>
        </div>

        <div className="info-card">
          <div className="info-icon">⚡</div>
          <div>
            <h3>Quick Approval</h3>
            <p>
              The owner reviews and approves your booking request.
            </p>
          </div>
        </div>

        <div className="info-card">
          <div className="info-icon">💳</div>
          <div>
            <h3>Easy Payment</h3>
            <p>
              Payment becomes available after owner approval.
            </p>
          </div>
        </div>

      </div>

    </div>
  );
}

export default VehicleDetails;