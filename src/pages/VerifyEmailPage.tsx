import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { API_BASE_URL } from "@/config/api";

type Status = "loading" | "success" | "error";

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setStatus("error");
      setMessage("No verification token found in the link.");
      return;
    }

    fetch(`${API_BASE_URL}/auth/verify-email?token=${encodeURIComponent(token)}`)
      .then(async (res) => {
        const data = await res.json();
        if (res.ok) {
          setStatus("success");
          setMessage(data.message || "Email verified successfully.");
        } else {
          setStatus("error");
          setMessage(data.detail || "Verification failed. The link may have expired.");
        }
      })
      .catch(() => {
        setStatus("error");
        setMessage("Could not connect to the server. Please try again.");
      });
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full text-center space-y-6">
        {status === "loading" && (
          <>
            <Loader2 className="h-12 w-12 animate-spin text-violet-600 mx-auto" />
            <p className="text-lg font-medium text-foreground">Verifying your email…</p>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
            <h1 className="text-2xl font-bold text-foreground">Email verified!</h1>
            <p className="text-muted-foreground">{message}</p>
            <Button
              onClick={() => navigate("/dashboard")}
              className="bg-gradient-to-r from-violet-600 to-orange-600 hover:from-violet-700 hover:to-orange-700 text-white"
            >
              Go to dashboard
            </Button>
          </>
        )}

        {status === "error" && (
          <>
            <XCircle className="h-12 w-12 text-red-500 mx-auto" />
            <h1 className="text-2xl font-bold text-foreground">Verification failed</h1>
            <p className="text-muted-foreground">{message}</p>
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
              <Button variant="outline" onClick={() => navigate("/login")}>
                Back to login
              </Button>
              <Button
                onClick={() => navigate("/dashboard")}
                className="bg-gradient-to-r from-violet-600 to-orange-600 hover:from-violet-700 hover:to-orange-700 text-white"
              >
                Go to dashboard
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
