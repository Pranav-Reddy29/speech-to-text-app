import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { toast } from "react-toastify";
import AuthLayout from "../components/AuthLayout";

function Login() {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] =
    useState(false);

  const [formData, setFormData] = useState({
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
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/auth/login`,
        formData
      );

      localStorage.setItem(
        "token",
        res.data.token
      );

      toast.success(
        "Login Successful! Welcome back 👋"
      );

      setTimeout(() => {
        navigate("/dashboard");
      }, 1500);

    } catch (error) {

      toast.error(
        error.response?.data?.message ||
        "Invalid email or password"
      );
    }
  };

  return (
    <AuthLayout>
      <div className="w-full max-w-md">

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8">

          <span className="inline-block px-4 py-2 bg-cyan-500/20 text-cyan-300 rounded-full text-sm mb-4">
            Welcome Back
          </span>

          <h2 className="text-4xl font-bold mb-2 text-white">
            Sign In
          </h2>

          <p className="text-gray-400 mb-8">
            Continue managing your AI transcriptions.
          </p>

          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >

            <input
              type="email"
              name="email"
              placeholder="Email Address"
              onChange={handleChange}
              required
              className="w-full p-4 rounded-2xl bg-[#10182d] border border-white/10 text-white outline-none focus:border-cyan-400"
            />

            <div className="relative">

              <input
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                name="password"
                placeholder="Password"
                onChange={handleChange}
                required
                className="w-full p-4 rounded-2xl bg-[#10182d] border border-white/10 text-white outline-none focus:border-cyan-400"
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
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 py-4 rounded-2xl font-bold hover:scale-105 transition"
            >
              Login
            </button>

          </form>

          <p className="text-center text-gray-400 mt-8">
            New to EchoScript?{" "}
            <Link
              to="/signup"
              className="text-cyan-400"
            >
              Create Account
            </Link>
          </p>

        </div>

      </div>
    </AuthLayout>
  );
}

export default Login;