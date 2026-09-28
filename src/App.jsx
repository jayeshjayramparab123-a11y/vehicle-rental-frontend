import { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";

import AdminDashboard from "./AdminDashboard";
import OwnerDashboard from "./OwnerDashboard";
import UserDashboard from "./UserDashboard";
import VehicleDetails from "./VehicleDetails";
import BookingForm from "./BookingForm";

function App() {

  // =====================================================
  // VEHICLES
  // =====================================================

  const [vehicles, setVehicles] = useState([]);


  // =====================================================
  // USER / ADMIN
  // =====================================================

  const [isAdmin, setIsAdmin] = useState(
    localStorage.getItem("role") === "admin"
  );

  const [isOwner, setIsOwner] = useState(
    localStorage.getItem("role") === "owner"
  );

  const [isUserDashboard, setIsUserDashboard] = useState(
    localStorage.getItem("role") === "user"
  );

  const [selectedVehicleDetails, setSelectedVehicleDetails] = useState(null);
  const [showBookingForm, setShowBookingForm] = useState(false);


  // =====================================================
  // LOGIN
  // =====================================================

  const [showLogin, setShowLogin] = useState(false);

  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");


  // =====================================================
  // REGISTER
  // =====================================================

  const [showRegister, setShowRegister] = useState(false);

  const [registerData, setRegisterData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    aadhaarNumber: "",
    drivingLicenceNumber: "",
    address: "",
    role: "user"
  });


  // =====================================================
  // EMAIL VERIFICATION
  // =====================================================

  const [showOTP, setShowOTP] = useState(false);

  const [verificationEmail, setVerificationEmail] = useState("");

  const [otp, setOtp] = useState("");

  const [otpLoading, setOtpLoading] = useState(false);

  const [resendLoading, setResendLoading] = useState(false);


  // =====================================================
  // BOOKING
  // =====================================================

  const [selectedVehicle, setSelectedVehicle] = useState(null);


  // =====================================================
  // PAYMENT
  // =====================================================

  const [showPayment, setShowPayment] = useState(false);

  const [currentBooking, setCurrentBooking] = useState(null);

  const [paymentData, setPaymentData] = useState({
    paymentMethod: "UPI",
    transactionId: ""
  });


  // =====================================================
  // MY BOOKINGS
  // =====================================================

  const [showDashboard, setShowDashboard] = useState(false);

  const [myBookings, setMyBookings] = useState([]);


  // =====================================================
  // GET VEHICLES
  // =====================================================

  useEffect(() => {

    axios
      .get("https://vehicle-rental-backend-gmwo.onrender.com/api/vehicles")
      .then((response) => {

        console.log("VEHICLES:", response.data);

        setVehicles(response.data);

      })
      .catch((error) => {

        console.log("Vehicle Error:", error);

      });

  }, []);


  // =====================================================
  // LOGIN
  // =====================================================

  const handleLogin = async (e) => {

    e.preventDefault();

    try {

      const loginEmail = email.trim().toLowerCase();

      const response = await axios.post(
        "https://vehicle-rental-backend-gmwo.onrender.com/api/users/login",
        {
          email: loginEmail,
          password: password
        }
      );

      console.log(
        "LOGIN RESPONSE:",
        response.data
      );

      const user = response.data.user;

      if (!user) {

        alert(
          "User data not received from server"
        );

        return;
      }


      // =================================================
      // SAVE USER INFORMATION
      // =================================================

      localStorage.setItem(
        "userId",
        user._id
      );

      localStorage.setItem(
        "role",
        user.role
      );


      // =================================================
      // ADMIN
      // =================================================

      if (user.role === "admin") {

        setIsAdmin(true);

        setIsOwner(false);

        setIsUserDashboard(false);

        setShowLogin(false);

        setEmail("");

        setPassword("");

        alert(
          "Admin login successful!"
        );

        return;
      }


      // =================================================
      // OWNER
      // =================================================

      if (user.role === "owner") {

        setIsAdmin(false);

        setIsOwner(true);

        setIsUserDashboard(false);

        setShowLogin(false);

        setEmail("");

        setPassword("");

        alert(
          "Owner login successful!"
        );

        return;
      }


      // =================================================
      // NORMAL USER
      // =================================================

      setIsAdmin(false);

      setIsOwner(false);

      setIsUserDashboard(true);

      setShowLogin(false);

      setEmail("");

      setPassword("");

      alert(
        "Login successful!"
      );


    } catch (error) {

      console.log(
        "LOGIN ERROR:",
        error
      );


      // =================================================
      // EMAIL NOT VERIFIED
      // =================================================

      if (
        error.response?.data?.emailNotVerified
      ) {

        const unverifiedEmail =
          error.response.data.email ||
          email.trim().toLowerCase();


        setVerificationEmail(
          unverifiedEmail
        );

        setOtp("");

        setShowLogin(false);

        setShowRegister(false);

        setShowOTP(true);


        alert(
          "Please verify your email before login."
        );

        return;
      }


      alert(
        error.response?.data?.message ||
        "Login failed"
      );

    }

  };


  // =====================================================
  // REGISTER
  // =====================================================

  const handleRegister = async (e) => {

    e.preventDefault();

    try {

      const response = await axios.post(
        "https://vehicle-rental-backend-gmwo.onrender.com/api/users/register",
        registerData
      );


      console.log(
        "REGISTER RESPONSE:",
        response.data
      );


      // =================================================
      // OTP VERIFICATION REQUIRED
      // =================================================

      if (
        response.data.requiresVerification
      ) {

        setVerificationEmail(
          registerData.email
            .trim()
            .toLowerCase()
        );

        setOtp("");

        setShowRegister(false);

        setShowLogin(false);

        setShowOTP(true);


        alert(
          "Registration successful! Verification OTP has been sent to your email."
        );

        return;
      }


      // =================================================
      // FALLBACK
      // =================================================

      alert(
        response.data.message ||
        "Registration successful"
      );

      setShowRegister(false);


      setRegisterData({
        name: "",
        email: "",
        password: "",
        phone: "",
        aadhaarNumber: "",
        drivingLicenceNumber: "",
        address: "",
        role: "user"
      });


    } catch (error) {

      console.log(
        "REGISTER ERROR:",
        error
      );


      alert(
        error.response?.data?.message ||
        "Registration failed"
      );

    }

  };


  // =====================================================
  // VERIFY EMAIL OTP
  // =====================================================

  const handleVerifyOTP = async (e) => {

    e.preventDefault();


    if (!verificationEmail) {

      alert(
        "Verification email not found."
      );

      return;
    }


    if (!/^\d{6}$/.test(otp)) {

      alert(
        "Please enter a valid 6-digit OTP."
      );

      return;
    }


    try {

      setOtpLoading(true);


      const response = await axios.post(
        "https://vehicle-rental-backend-gmwo.onrender.com/api/users/verify-email",
        {
          email: verificationEmail,
          otp: otp
        }
      );


      console.log(
        "VERIFY RESPONSE:",
        response.data
      );


      if (response.data.verified) {

        setShowOTP(false);

        setOtp("");

        setVerificationEmail("");

        setShowLogin(true);


        setRegisterData({
          name: "",
          email: "",
          password: "",
          phone: "",
          aadhaarNumber: "",
          drivingLicenceNumber: "",
          address: "",
          role: "user"
        });


        alert(
          "Email verified successfully! You can now login."
        );

      }


    } catch (error) {

      console.log(
        "OTP VERIFY ERROR:",
        error
      );


      alert(
        error.response?.data?.message ||
        "OTP verification failed"
      );

    } finally {

      setOtpLoading(false);

    }

  };


  // =====================================================
  // RESEND OTP
  // =====================================================

  const handleResendOTP = async () => {

    if (!verificationEmail) {

      alert(
        "Verification email not found."
      );

      return;
    }


    try {

      setResendLoading(true);


      const response = await axios.post(
        "https://vehicle-rental-backend-gmwo.onrender.com/api/users/resend-otp",
        {
          email: verificationEmail
        }
      );


      alert(
        response.data.message ||
        "New OTP sent successfully."
      );


      setOtp("");


    } catch (error) {

      console.log(
        "RESEND OTP ERROR:",
        error
      );


      alert(
        error.response?.data?.message ||
        "Unable to resend OTP"
      );


    } finally {

      setResendLoading(false);

    }

  };


  // =====================================================
  // PAYMENT
  // =====================================================

  const handlePayment = async (e) => {

    e.preventDefault();

    try {

      if (!currentBooking) {

        alert(
          "No booking selected for payment."
        );

        return;
      }


      if (
        currentBooking.ownerDecision !==
        "approved"
      ) {

        alert(
          "Payment is available only after the vehicle owner approves your booking."
        );

        return;
      }


      const response = await axios.post(
        "https://vehicle-rental-backend-gmwo.onrender.com/api/payments",
        {
          bookingId:
            currentBooking._id,

          amount:
            currentBooking.totalAmount,

          paymentMethod:
            paymentData.paymentMethod,

          transactionId:
            paymentData.transactionId
        }
      );


      alert(
        response.data.message ||
        "Payment successful!"
      );


      setShowPayment(false);


      setPaymentData({
        paymentMethod: "UPI",
        transactionId: ""
      });


    } catch (error) {

      console.log(
        "PAYMENT ERROR:",
        error
      );


      alert(
        error.response?.data?.message ||
        "Payment failed"
      );

    }

  };


  // =====================================================
  // MY BOOKINGS
  // =====================================================

  const handleMyBookings = async () => {

    try {

      const userId =
        localStorage.getItem("userId");


      if (!userId) {

        alert(
          "Please login first"
        );

        setShowLogin(true);

        return;
      }


      const response =
        await axios.get(
          `https://vehicle-rental-backend-gmwo.onrender.com/api/bookings/user/${userId}`
        );


      setMyBookings(
        response.data
      );


      setShowDashboard(true);


    } catch (error) {

      console.log(
        "MY BOOKINGS ERROR:",
        error
      );


      alert(
        error.response?.data?.message ||
        "Unable to load bookings"
      );

    }

  };


  // =====================================================
  // LOGOUT ADMIN
  // =====================================================

  const handleAdminLogout = () => {

    localStorage.removeItem(
      "userId"
    );

    localStorage.removeItem(
      "role"
    );


    setIsAdmin(false);

    alert(
      "Logged out successfully"
    );

  };


  // =====================================================
  // PROFESSIONAL BOOKING FORM
  // =====================================================

  if (showBookingForm && selectedVehicle) {
    return (
      <BookingForm
        vehicle={selectedVehicle}
        onBack={() => {
          setShowBookingForm(false);
          setSelectedVehicleDetails(selectedVehicle);
        }}
        onSuccess={(bookingResponse) => {
          setShowBookingForm(false);
          setSelectedVehicle(null);

          const userId = localStorage.getItem("userId");

          if (bookingResponse?.booking) {
            setCurrentBooking(bookingResponse.booking);
          }

          if (userId) {
            axios
              .get(`https://vehicle-rental-backend-gmwo.onrender.com/api/bookings/user/${userId}`)
              .then((response) => {
                setMyBookings(response.data || []);
              })
              .catch((error) => {
                console.log("BOOKING REFRESH ERROR:", error);
              });
          }

          setIsUserDashboard(true);
          alert(
            "Booking request submitted successfully. Please wait for owner approval."
          );
        }}
      />
    );
  }


  // =====================================================
  // VEHICLE DETAILS PAGE
  // =====================================================

  if (selectedVehicleDetails) {

    return (
      <VehicleDetails
        vehicle={selectedVehicleDetails}

        onBack={() => {
          setSelectedVehicleDetails(null);
        }}

        onBook={(vehicle) => {

          const userId =
            localStorage.getItem("userId");

          if (!userId) {

            setSelectedVehicleDetails(null);

            setShowLogin(true);

            return;
          }

          setSelectedVehicle(vehicle);

          setSelectedVehicleDetails(null);

          setShowBookingForm(true);

        }}
      />
    );

  }


  // =====================================================
  // ADMIN DASHBOARD
  // =====================================================

  if (isAdmin) {

    return (
      <AdminDashboard
        onLogout={
          handleAdminLogout
        }
      />
    );

  }


  // =====================================================
  // OWNER DASHBOARD
  // =====================================================

  if (isOwner) {

    return (
      <OwnerDashboard
        onLogout={() => {

          localStorage.removeItem(
            "userId"
          );

          localStorage.removeItem(
            "role"
          );

          setIsOwner(false);

          alert(
            "Owner logged out successfully"
          );

        }}
      />
    );

  }


  // =====================================================
  // NORMAL USER DASHBOARD
  // =====================================================

  if (isUserDashboard) {

    return (
      <UserDashboard

        myBookings={
          myBookings
        }

        onRefresh={
          handleMyBookings
        }

        onBookVehicle={() => {

          setIsUserDashboard(false);

          setShowDashboard(false);


          setTimeout(() => {

            document
              .getElementById(
                "vehicles"
              )
              ?.scrollIntoView({
                behavior: "smooth"
              });

          }, 0);

        }}

        onPay={(booking) => {

          setCurrentBooking(
            booking
          );

          setShowPayment(true);

        }}

        onLogout={() => {

          localStorage.removeItem(
            "userId"
          );

          localStorage.removeItem(
            "role"
          );

          setIsUserDashboard(false);

          setMyBookings([]);

        }}

      />
    );

  }


  // =====================================================
  // MAIN WEBSITE
  // =====================================================

  return (

    <div>


      {/* =================================================
          NAVBAR
      ================================================= */}

      <nav className="navbar">

        <div className="logo">
          🚗 Vehicle Rental Portal
        </div>


        <div className="nav-links">

          <a href="/">
            Home
          </a>


          <a href="#vehicles">
            Vehicles
          </a>


          <button
            className="nav-button"
            onClick={
              handleMyBookings
            }
          >
            My Bookings
          </button>


          <button
            className="nav-button"
            onClick={() =>
              setShowLogin(true)
            }
          >
            Login
          </button>

        </div>

      </nav>


      {/* =================================================
          HERO
      ================================================= */}

      <section className="hero">

        <div className="hero-content">

          <h1>
            Rent Your Perfect Vehicle
          </h1>


          <p>
            Find reliable cars and bikes at affordable prices.
            Book your vehicle easily and enjoy your journey.
          </p>


          <button
            onClick={() =>
              document
                .getElementById(
                  "vehicles"
                )
                ?.scrollIntoView({
                  behavior: "smooth"
                })
            }
          >
            Explore Vehicles
          </button>

        </div>

      </section>


      {/* =================================================
          VEHICLES
      ================================================= */}

      <section
        className="vehicles-section"
        id="vehicles"
      >

        <h2>
          Available Vehicles
        </h2>


        <div className="vehicle-container">

          {vehicles.length === 0 ? (

            <p>
              No vehicles available.
            </p>

          ) : (

            vehicles.map(
              (vehicle) => (

                <div
                  className="vehicle-card"
                  key={vehicle._id}
                  onClick={() => setSelectedVehicleDetails(vehicle)}
                  style={{ cursor: "pointer" }}
                >

                  <div className="vehicle-image">

                    {vehicle.image ? (

                      <img
                        src={
                          vehicle.image
                        }
                        alt={
                          vehicle.vehicleName
                        }
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          borderRadius: "10px"
                        }}
                      />

                    ) : (

                      "🚗"

                    )}

                  </div>


                  <h3>
                    {
                      vehicle.vehicleName
                    }
                  </h3>


                  <p>
                    <strong>
                      Brand:
                    </strong>{" "}
                    {
                      vehicle.brand
                    }
                  </p>


                  <p>
                    <strong>
                      Model:
                    </strong>{" "}
                    {
                      vehicle.model
                    }
                  </p>


                  <p>
                    <strong>
                      Type:
                    </strong>{" "}
                    {
                      vehicle.vehicleType
                    }
                  </p>


                  <p>
                    <strong>
                      Fuel:
                    </strong>{" "}
                    {
                      vehicle.fuelType
                    }
                  </p>


                  <p>
                    <strong>
                      Seats:
                    </strong>{" "}
                    {
                      vehicle.seatingCapacity
                    }
                  </p>


                  <div className="price">
                    ₹
                    {
                      vehicle.pricePerDay
                    }{" "}
                    / Day
                  </div>


                  <button
                    className="book-btn"
                    onClick={(e) => {

                      e.stopPropagation();

                      const userId =
                        localStorage.getItem(
                          "userId"
                        );


                      if (!userId) {

                        alert(
                          "Please login first to book a vehicle."
                        );

                        setShowLogin(
                          true
                        );

                        return;
                      }


                      setSelectedVehicle(
                        vehicle
                      );

                      setShowBookingForm(
                        true
                      );

                    }}
                  >
                    Book Now
                  </button>

                </div>

              )
            )

          )}

        </div>

      </section>


      {/* =================================================
          LOGIN POPUP
      ================================================= */}

      {showLogin && (

        <div className="login-overlay">

          <div className="login-box">

            <button
              className="close-btn"
              onClick={() =>
                setShowLogin(false)
              }
            >
              ×
            </button>


            <h2>
              Login
            </h2>


            <p className="login-subtitle">
              Login to your Vehicle Rental account
            </p>


            <form
              onSubmit={
                handleLogin
              }
            >

              <label>
                Email
              </label>


              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) =>
                  setEmail(
                    e.target.value
                  )
                }
                required
              />


              <label>
                Password
              </label>


              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) =>
                  setPassword(
                    e.target.value
                  )
                }
                required
              />


              <button
                type="submit"
                className="login-btn"
              >
                Login
              </button>

            </form>


            <p className="register-text">

              Don't have an account?{" "}

              <span
                onClick={() => {

                  setShowLogin(false);

                  setShowRegister(
                    true
                  );

                }}
              >
                Register
              </span>

            </p>

          </div>

        </div>

      )}


      {/* =================================================
          REGISTER POPUP
      ================================================= */}

      {showRegister && (

        <div className="login-overlay">

          <div className="login-box register-box">

            <button
              className="close-btn"
              onClick={() =>
                setShowRegister(
                  false
                )
              }
            >
              ×
            </button>


            <h2>
              Create Account
            </h2>


            <p className="login-subtitle">
              Register for Vehicle Rental Portal
            </p>


            <form
              onSubmit={
                handleRegister
              }
            >

              {/* NAME */}

              <label>
                Full Name
              </label>


              <input
                type="text"
                placeholder="Enter your full name"
                value={
                  registerData.name
                }
                onChange={(e) =>
                  setRegisterData({
                    ...registerData,
                    name: e.target.value
                  })
                }
                required
              />


              {/* EMAIL */}

              <label>
                Email
              </label>


              <input
                type="email"
                placeholder="Enter your email"
                value={
                  registerData.email
                }
                onChange={(e) =>
                  setRegisterData({
                    ...registerData,
                    email:
                      e.target.value
                  })
                }
                required
              />


              {/* PASSWORD */}

              <label>
                Password
              </label>


              <input
                type="password"
                placeholder="Create password"
                value={
                  registerData.password
                }
                onChange={(e) =>
                  setRegisterData({
                    ...registerData,
                    password:
                      e.target.value
                  })
                }
                required
              />


              {/* PHONE */}

              <label>
                Phone Number
              </label>


              <input
                type="tel"
                placeholder="Enter phone number"
                value={
                  registerData.phone
                }
                onChange={(e) =>
                  setRegisterData({
                    ...registerData,
                    phone:
                      e.target.value
                  })
                }
                required
              />


              {/* AADHAAR */}

              <label>
                Aadhaar Number
              </label>


              <input
                type="text"
                placeholder="Enter 12 digit Aadhaar number"
                maxLength="12"
                value={
                  registerData.aadhaarNumber
                }
                onChange={(e) =>
                  setRegisterData({
                    ...registerData,
                    aadhaarNumber:
                      e.target.value
                  })
                }
                required
              />


              {/* DRIVING LICENCE */}

              <label>
                Driving Licence Number
              </label>


              <input
                type="text"
                placeholder="Enter driving licence number"
                value={
                  registerData.drivingLicenceNumber
                }
                onChange={(e) =>
                  setRegisterData({
                    ...registerData,
                    drivingLicenceNumber:
                      e.target.value
                  })
                }
                required
              />


              {/* ADDRESS */}

              <label>
                Address
              </label>


              <input
                type="text"
                placeholder="Enter your address"
                value={
                  registerData.address
                }
                onChange={(e) =>
                  setRegisterData({
                    ...registerData,
                    address:
                      e.target.value
                  })
                }
                required
              />


              {/* ACCOUNT TYPE */}

              <label>
                Account Type
              </label>


              <select
                value={
                  registerData.role
                }
                onChange={(e) =>
                  setRegisterData({
                    ...registerData,
                    role:
                      e.target.value
                  })
                }
              >

                <option value="user">
                  User - Rent Vehicle
                </option>


                <option value="owner">
                  Vehicle Owner - List My Vehicle
                </option>

              </select>


              <button
                type="submit"
                className="login-btn"
              >
                Register
              </button>

            </form>


            <p className="register-text">

              Already have an account?{" "}

              <span
                onClick={() => {

                  setShowRegister(
                    false
                  );

                  setShowLogin(
                    true
                  );

                }}
              >
                Login
              </span>

            </p>

          </div>

        </div>

      )}


      {/* =================================================
          EMAIL VERIFICATION OTP POPUP
      ================================================= */}

      {showOTP && (

        <div className="login-overlay">

          <div
            className="login-box"
            style={{
              maxWidth: "450px",
              textAlign: "center"
            }}
          >

            <button
              className="close-btn"
              onClick={() => {

                setShowOTP(false);

                setOtp("");

              }}
            >
              ×
            </button>


            {/* EMAIL ICON */}

            <div
              style={{
                fontSize: "55px",
                marginBottom: "10px"
              }}
            >
              📧
            </div>


            <h2>
              Verify Your Email
            </h2>


            <p
              className="login-subtitle"
              style={{
                lineHeight: "1.6"
              }}
            >
              We have sent a 6-digit verification
              OTP to
              <br />

              <strong>
                {verificationEmail}
              </strong>
            </p>


            {/* OTP FORM */}

            <form
              onSubmit={
                handleVerifyOTP
              }
            >

              <label
                style={{
                  display: "block",
                  textAlign: "left"
                }}
              >
                Enter Verification OTP
              </label>


              <input
                type="text"
                inputMode="numeric"
                maxLength="6"
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={(e) => {

                  const value =
                    e.target.value
                      .replace(/\D/g, "");

                  setOtp(value);

                }}
                style={{
                  textAlign: "center",
                  fontSize: "24px",
                  letterSpacing: "8px",
                  fontWeight: "bold"
                }}
                autoFocus
                required
              />


              <button
                type="submit"
                className="login-btn"
                disabled={otpLoading}
                style={{
                  marginTop: "15px"
                }}
              >

                {otpLoading
                  ? "Verifying..."
                  : "Verify Email"}

              </button>

            </form>


            {/* OTP INFO */}

            <p
              style={{
                marginTop: "18px",
                fontSize: "14px",
                color: "#666"
              }}
            >
              OTP is valid for
              <strong>
                {" "}10 minutes
              </strong>.
            </p>


            {/* RESEND */}

            <button
              type="button"
              onClick={
                handleResendOTP
              }
              disabled={resendLoading}
              style={{
                border: "none",
                background: "transparent",
                color: "#2563eb",
                fontWeight: "600",
                cursor: resendLoading
                  ? "not-allowed"
                  : "pointer",
                marginTop: "5px",
                fontSize: "15px"
              }}
            >

              {resendLoading
                ? "Sending..."
                : "Resend OTP"}

            </button>


            <p
              style={{
                marginTop: "15px",
                fontSize: "13px",
                color: "#888"
              }}
            >
              Didn't receive the email?
              <br />
              Check your Spam/Junk folder.
            </p>

          </div>

        </div>

      )}


      {/* =================================================
          PAYMENT POPUP
      ================================================= */}

      {showPayment &&
        currentBooking && (

          <div className="login-overlay">

            <div className="login-box payment-box">

              <button
                className="close-btn"
                onClick={() =>
                  setShowPayment(
                    false
                  )
                }
              >
                ×
              </button>


              <h2>
                Payment
              </h2>


              <p className="login-subtitle">
                Complete your vehicle rental payment
              </p>


              <div className="payment-summary">

                <p>
                  <strong>
                    Vehicle:
                  </strong>{" "}
                  {
                    currentBooking.vehicleId
                      ?.vehicleName ||
                    selectedVehicle
                      ?.vehicleName ||
                    "Vehicle"
                  }
                </p>


                <p>
                  <strong>
                    Total Days:
                  </strong>{" "}
                  {
                    currentBooking.totalDays
                  }
                </p>


                <p className="total-payment">
                  Total Amount: ₹
                  {
                    currentBooking.totalAmount
                  }
                </p>

              </div>


              <form
                onSubmit={
                  handlePayment
                }
              >

                <label>
                  Payment Method
                </label>


                <select
                  value={
                    paymentData.paymentMethod
                  }
                  onChange={(e) =>
                    setPaymentData({
                      ...paymentData,
                      paymentMethod:
                        e.target.value
                    })
                  }
                >

                  <option value="UPI">
                    UPI
                  </option>


                  <option value="Card">
                    Card
                  </option>


                  <option value="Cash">
                    Cash
                  </option>

                </select>


                <label>
                  Transaction ID
                </label>


                <input
                  type="text"
                  placeholder="Enter transaction ID"
                  value={
                    paymentData.transactionId
                  }
                  onChange={(e) =>
                    setPaymentData({
                      ...paymentData,
                      transactionId:
                        e.target.value
                    })
                  }
                  required
                />


                <button
                  type="submit"
                  className="login-btn"
                >
                  Pay ₹
                  {
                    currentBooking.totalAmount
                  }
                </button>

              </form>

            </div>

          </div>

        )}


      {/* =================================================
          MY BOOKINGS
      ================================================= */}

      {showDashboard && (

        <div className="login-overlay">

          <div className="dashboard-box">

            <button
              className="close-btn"
              onClick={() =>
                setShowDashboard(
                  false
                )
              }
            >
              ×
            </button>


            <h2>
              My Bookings
            </h2>


            <p className="dashboard-subtitle">
              Your vehicle rental bookings
            </p>


            {myBookings.length === 0 ? (

              <div className="no-bookings">

                <p>
                  You have no bookings yet.
                </p>


                <button
                  className="login-btn"
                  onClick={() => {

                    setShowDashboard(
                      false
                    );


                    document
                      .getElementById(
                        "vehicles"
                      )
                      ?.scrollIntoView({
                        behavior:
                          "smooth"
                      });

                  }}
                >
                  Book a Vehicle
                </button>

              </div>

            ) : (

              <div className="booking-list">

                {myBookings.map(
                  (booking) => (

                    <div
                      className="booking-card"
                      key={
                        booking._id
                      }
                    >

                      <h3>
                        {
                          booking.vehicleId
                            ?.vehicleName ||
                          "Vehicle"
                        }
                      </h3>


                      <p>
                        <strong>
                          Pickup:
                        </strong>{" "}
                        {
                          booking.pickupLocation
                        }
                      </p>


                      <p>
                        <strong>
                          Drop:
                        </strong>{" "}
                        {
                          booking.dropLocation
                        }
                      </p>


                      <p>
                        <strong>
                          Start Date:
                        </strong>{" "}
                        {
                          new Date(
                            booking.startDate
                          ).toLocaleDateString()
                        }
                      </p>


                      <p>
                        <strong>
                          End Date:
                        </strong>{" "}
                        {
                          new Date(
                            booking.endDate
                          ).toLocaleDateString()
                        }
                      </p>


                      <p>
                        <strong>
                          Total Days:
                        </strong>{" "}
                        {
                          booking.totalDays
                        }
                      </p>


                      <p className="booking-total">
                        Total Amount: ₹
                        {
                          booking.totalAmount
                        }
                      </p>


                      <p>
                        <strong>
                          Booking Status:
                        </strong>{" "}
                        {
                          booking.bookingStatus
                        }
                      </p>


                      <p>
                        <strong>
                          Payment Status:
                        </strong>{" "}
                        {
                          booking.paymentStatus
                        }
                      </p>

                    </div>

                  )
                )}

              </div>

            )}

          </div>

        </div>

      )}

    </div>

  );

}

export default App;