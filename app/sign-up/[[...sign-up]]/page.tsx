import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#263e49]">
      <div className="bg-white p-8 rounded-lg shadow-lg">
        <SignUp
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "bg-white shadow-none",
              headerTitle: "text-[#ff6d63]",
              headerSubtitle: "text-gray-600",
              socialButtonsBlockButton: "bg-[#ff6d63] hover:bg-[#ff6d63]/90",
              formButtonPrimary: "bg-[#ff6d63] hover:bg-[#ff6d63]/90",
              footerActionLink: "text-[#ff6d63] hover:text-[#ff6d63]/90",
            },
          }}
        />
      </div>
    </div>
  );
} 