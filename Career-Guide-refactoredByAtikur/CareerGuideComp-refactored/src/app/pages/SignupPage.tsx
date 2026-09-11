import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth, Role } from "../context/AuthContext";
import {
  Eye, EyeOff, Sparkles, GraduationCap, Briefcase, CheckCircle2,
  ArrowRight, ArrowLeft, Loader2, User, Mail, Lock, BookOpen,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";

const ROLE_OPTIONS: { id: Role; label: string; icon: React.ElementType; description: string; color: string; bg: string }[] = [
  {
    id: "student",
    label: "Student",
    icon: GraduationCap,
    description: "Get personalized AI career recommendations and connect with counselors",
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    id: "counselor",
    label: "Career Counselor",
    icon: Briefcase,
    description: "Guide students, post articles and host webinars on the platform",
    color: "text-purple-600",
    bg: "bg-purple-50",
  },
];

const MAJORS = [
  "Computer Science", "Business Administration", "Engineering",
  "Psychology", "Medicine", "Law", "Arts & Design",
  "Data Science", "Economics", "Education", "Other",
];

export function SignupPage() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [selectedRole, setSelectedRole] = useState<Role>("student");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [major, setMajor] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [agreed, setAgreed] = useState(false);

  const validateStep1 = () => {
    if (!name.trim()) { setError("Please enter your full name."); return false; }
    if (!email.includes("@")) { setError("Please enter a valid email."); return false; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return false; }
    if (password !== confirmPassword) { setError("Passwords do not match."); return false; }
    return true;
  };

  const handleNext = () => {
    setError("");
    if (step === 1 && validateStep1()) setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed) { setError("Please accept the terms to continue."); return; }
    setLoading(true);
    setError("");
    try {
      await signup({ name, email, password, role: "student", major });
navigate("/student");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-5/12 bg-gradient-to-br from-indigo-700 via-indigo-800 to-blue-900 p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-white font-bold text-xl">CareerPath AI</span>
          </div>

          <h1 className="text-3xl font-bold text-white mb-4 leading-tight">
            Start your journey<br />toward a fulfilling career.
          </h1>
          <p className="text-indigo-200 leading-relaxed max-w-xs">
            Join thousands of students and counselors already using our platform.
          </p>
        </div>

        {/* Feature list */}
        <div className="relative z-10 space-y-4">
          {[
            "AI-powered career matching in seconds",
            "100+ verified expert counselors",
            "Step-by-step career roadmaps",
            "Download PDF reports & guides",
          ].map((f) => (
            <div key={f} className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-green-400/20 border border-green-400/50 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-3 h-3 text-green-400" />
              </div>
              <span className="text-indigo-100 text-sm">{f}</span>
            </div>
          ))}

          <div className="mt-6 rounded-2xl overflow-hidden aspect-video shadow-2xl">
            <ImageWithFallback
              src="https://images.unsplash.com/photo-1758518727653-5650fd9e146c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800"
              alt="Career guidance"
              className="w-full h-full object-cover opacity-80"
            />
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-white overflow-y-auto">
        <div className="w-full max-w-md">
          {/* Progress */}
          <div className="flex items-center gap-3 mb-8">
            {[1, 2].map((s) => (
              <div key={s} className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  step >= s ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-400"
                }`}>
                  {step > s ? <CheckCircle2 className="w-4 h-4" /> : s}
                </div>
                <span className={`text-sm font-medium hidden sm:block ${step >= s ? "text-gray-800" : "text-gray-400"}`}>
                  {s === 1 ? "Your Details" : "Preferences"}
                </span>
                {s < 2 && <div className={`w-12 h-0.5 ${step > s ? "bg-blue-600" : "bg-gray-200"}`}></div>}
              </div>
            ))}
          </div>

          {step === 1 ? (
            <>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Create your account</h2>
                <p className="text-gray-500 mt-1">Join CareerPath AI — it's completely free</p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-1.5 block">Full Name</Label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <Input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="John Smith"
                      className="pl-9 h-11"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-1.5 block">Email Address</Label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="pl-9 h-11"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-1.5 block">Password</Label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min. 6 characters"
                      className="pl-9 pr-10 h-11"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-1.5 block">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <Input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter your password"
                      className="pl-9 h-11"
                    />
                  </div>
                </div>

                {error && (
                  <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
                )}

                <Button
                  onClick={handleNext}
                  className="w-full h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-0"
                >
                  Continue <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="mb-6">
                <button onClick={() => setStep(1)} type="button" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4">
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <h2 className="text-2xl font-bold text-gray-900">Almost there!</h2>
                <p className="text-gray-500 mt-1">Tell us a little more about yourself</p>
              </div>

              {/* Role Selection */}
              <div className="mb-5">
                <Label className="text-sm font-medium text-gray-700 mb-2 block">I am joining as a...</Label>
                <div className="grid gap-3">
                  {ROLE_OPTIONS.map(({ id, label, icon: Icon, description, color, bg }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setSelectedRole(id)}
                      className={`flex items-start gap-4 p-4 rounded-xl border-2 text-left transition-all ${
                        selectedRole === id
                          ? `border-blue-500 ${bg}`
                          : "border-gray-200 hover:border-gray-300 bg-white"
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center shrink-0 mt-0.5`}>
                        <Icon className={`w-5 h-5 ${color}`} />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 text-sm">{label}</div>
                        <div className="text-gray-500 text-xs mt-0.5 leading-relaxed">{description}</div>
                      </div>
                      {selectedRole === id && (
                        <CheckCircle2 className="w-5 h-5 text-blue-600 ml-auto shrink-0 mt-0.5" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Additional fields for students */}
              {selectedRole === "student" && (
                <div className="mb-5">
                  <Label className="text-sm font-medium text-gray-700 mb-1.5 block">Academic Major / Field</Label>
                  <div className="relative">
                    <BookOpen className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <select
                      value={major}
                      onChange={(e) => setMajor(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                    >
                      <option value="">Select your major...</option>
                      {MAJORS.map((m) => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                </div>
              )}

              {/* Terms */}
              <div className="flex items-start gap-3 mb-5">
                <input
                  type="checkbox"
                  id="terms"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-1 w-4 h-4 accent-blue-600 cursor-pointer"
                />
                <label htmlFor="terms" className="text-sm text-gray-600 leading-relaxed cursor-pointer">
                  I agree to the{" "}
                  <span className="text-blue-600 font-medium hover:underline cursor-pointer">Terms of Service</span>
                  {" "}and{" "}
                  <span className="text-blue-600 font-medium hover:underline cursor-pointer">Privacy Policy</span>
                </label>
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">{error}</p>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-0"
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Creating account...</>
                ) : (
                  <>Create Account <ArrowRight className="w-4 h-4 ml-2" /></>
                )}
              </Button>
            </form>
          )}

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{" "}
            <Link to="/login" className="text-blue-600 font-semibold hover:text-blue-700">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
