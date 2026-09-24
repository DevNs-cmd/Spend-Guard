// Onboarding layout — clean, centered, no sidebar. Owner: Anuj.

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {children}
    </div>
  );
}
