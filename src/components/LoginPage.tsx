import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { Building2, LogIn, UserPlus, Sun, Moon } from "lucide-react";

const LoginPage: React.FC = () => {
  const [agencyName, setAgencyName] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<
    "login-agency" | "register-agency" | "login-worker"
  >("login-agency");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, register, loginWorker } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    if (!agencyName.trim() || !password.trim()) {
      setError("Please fill in all fields");
      setLoading(false);
      return;
    }

    try {
      if (mode === "register-agency") {
        const success = await register(agencyName, password);
        if (success) {
          setSuccess("Agency registered successfully! You can now login.");
          setMode("login-agency");
          setAgencyName("");
          setPassword("");
        } else {
          setError("Agency name already exists");
        }
      } else if (mode === "login-agency") {
        const success = await login(agencyName, password);
        if (!success) {
          setError("Invalid agency name or password");
        }
      } else if (mode === "login-worker") {
        const success = await loginWorker(agencyName, password);
        if (!success) {
          setError("Invalid worker name or password");
        }
      }
    } catch (error) {
      setError("An error occurred. Please try again.");
      console.error("Auth error:", error);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="flex justify-end">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle dark mode"
            className="inline-flex items-center justify-center p-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors duration-200"
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </button>
        </div>
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mb-4">
            <Building2 className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Creative Agency Finance
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {mode === "register-agency" && "Register your agency"}
            {mode === "login-agency" && "Sign in to your agency account"}
            {mode === "login-worker" && "Sign in as worker"}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-700">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 dark:bg-green-900/40 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 px-4 py-3 rounded-lg mb-4">
              {success}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label
                htmlFor="agencyName"
                className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2"
              >
                {mode.includes("agency") ? "Agency Name" : "Worker Name"}
              </label>
              <input
                id="agencyName"
                name="agencyName"
                type="text"
                required
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder={
                  mode.includes("agency")
                    ? "Enter your agency name"
                    : "Enter your worker name"
                }
                value={agencyName}
                onChange={(e) => setAgencyName(e.target.value)}
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-lg text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Processing...
                </>
              ) : mode === "register-agency" ? (
                <>
                  <UserPlus className="h-5 w-5 mr-2" />
                  Register Agency
                </>
              ) : mode === "login-agency" ? (
                <>
                  <LogIn className="h-5 w-5 mr-2" />
                  Sign In as Agency
                </>
              ) : (
                <>
                  <LogIn className="h-5 w-5 mr-2" />
                  Sign In as Worker
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center space-y-2">
            <button
              type="button"
              onClick={() => {
                if (mode === "login-agency") {
                  setMode("register-agency");
                } else if (mode === "register-agency") {
                  setMode("login-agency");
                } else if (mode === "login-worker") {
                  // No register option for worker, just toggle back to agency
                  setMode("login-agency");
                }
                setError("");
                setSuccess("");
              }}
              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors duration-200"
            >
              {mode === "login-agency" &&
                "Don't have an agency account? Register"}
              {mode === "register-agency" &&
                "Already have an agency account? Sign in"}
              {mode === "login-worker" && "Back to Agency Login"}
            </button>

            <div className="text-gray-400 dark:text-gray-500">|</div>

            <button
              type="button"
              onClick={() => {
                if (mode.includes("agency")) setMode("login-worker");
                else setMode("login-agency");
                setError("");
                setSuccess("");
                setAgencyName("");
                setPassword("");
              }}
              className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium transition-colors duration-200"
            >
              {mode.includes("agency") ? "Login as Worker" : "Login as Agency"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
