import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { toast } from "react-toastify";
import AuthLayout from "../components/AuthLayout";

function Signup() {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] =
    useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/auth/signup`,
        formData
      );

      toast.success(
        "Account created successfully 🚀"
      );

      setTimeout(() => {
        navigate("/login");
      }, 1500);

    } catch (error) {

      toast.error(
        error.response?.data?.message ||
        "Email already exists"
      );
    }
  };

  return (
    <AuthLayout>
      <div className="w-full max-w-md">

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8">

          <span className="inline-block px-4 py-2 bg-purple-500/20 text-purple-300 rounded-full text-sm mb-4">
            Join EchoScript
          </span>

          <h2 className="text-4xl font-bold mb-2 text-white">
            Create Workspace
          </h2>

          <p className="text-gray-400 mb-8">
            Start building your personal transcription library.
          </p>

          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >

            <input
              type="text"
              name="name"
              placeholder="Full Name"
              onChange={handleChange}
              required
              className="w-full p-4 rounded-2xl bg-[#10182d] border border-white/10 text-white outline-none focus:border-purple-400"
            />

            <input
              type="email"
              name="email"
              placeholder="Email Address"
              onChange={handleChange}
              required
              className="w-full p-4 rounded-2xl bg-[#10182d] border border-white/10 text-white outline-none focus:border-purple-400"
            />

            <div className="relative">

              <input
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                name="password"
                placeholder="Create Password"
                onChange={handleChange}
                required
                className="w-full p-4 rounded-2xl bg-[#10182d] border border-white/10 text-white outline-none focus:border-purple-400"
              />

              <button
                type="button"
                onClick={() =>
                  setShowPassword(!showPassword)
                }
                className="absolute right-5 top-5 text-gray-400"
              >
                {showPassword
                  ? <FaEyeSlash />
                  : <FaEye />}
              </button>

            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-500 to-pink-600 py-4 rounded-2xl font-bold hover:scale-105 transition"
            >
              Launch EchoScript
            </button>

          </form>

          <p className="text-center text-gray-400 mt-8">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-purple-400"
            >
              Login
            </Link>
          </p>

        </div>

      </div>
    </AuthLayout>
  );
}

export default Signup;