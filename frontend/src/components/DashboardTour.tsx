import { useEffect } from "react";
import Tour from "reactour";
import { useUser } from "@clerk/clerk-react";
import { useTour } from "../context/TourContext";

interface DashboardTourProps {
  children: React.ReactNode;
}

const DashboardTour = ({ children }: DashboardTourProps) => {
  const { user } = useUser();
  const { isTourOpen, openTour, closeTour } = useTour();

  // Check if we should show the tour on mount
  useEffect(() => {
    if (user?.lastSignInAt) {
      const lastSignInTime = new Date(user.lastSignInAt).getTime();
      const lastTourTime = localStorage.getItem("lastTourTime");
      
      // Show tour if this is a new sign in (lastTourTime is before lastSignInTime)
      if (!lastTourTime || new Date(lastTourTime).getTime() < lastSignInTime) {
        openTour();
        // Update the last tour time
        localStorage.setItem("lastTourTime", new Date().toISOString());
      }
    }
  }, [user, openTour]);

  // UPDATED TOUR STEPS - Now includes new features
  const steps = [
    {
      selector: ".tour-logo",
      content: "Welcome to FinEdge! Your intelligent personal finance companion powered by MongoDB and AI.",
    },
    {
      selector: ".tour-portfolio",
      content: "📊 Portfolio Overview - See your net worth, asset allocation, risk analysis, and beautiful financial visualizations all in one place!",
    },
    {
      selector: ".tour-my-data",
      content: "💰 My Data - Add and manage your income, expenses, assets, liabilities, financial goals, and risk tolerance. All data is securely stored in MongoDB.",
    },
    {
      selector: ".tour-recommendations",
      content: "💡 Recommendations - Get personalized investment advice based on your financial profile and risk tolerance.",
    },
    {
      selector: ".tour-learn",
      content: "📚 Money Matters - Learn financial concepts, investment strategies, and money management skills.",
    },
    {
      selector: ".tour-ai-assistant",
      content: "🤖 AI Assistant - Chat with our intelligent financial advisor! Ask questions, get advice, or discuss your financial goals.",
    },
    {
      selector: ".tour-theme-toggle",
      content: "🌓 Theme Toggle - Switch between light and dark mode anytime! Your preference is automatically saved.",
    },
    {
      selector: ".tour-profile",
      content: "👤 Your Profile - Access your account settings and personal information.",
    },
  ];

  return (
    <>
      {isTourOpen && (
        <Tour
          steps={steps}
          isOpen={isTourOpen}
          onRequestClose={closeTour}
          nextButton={
            <button style={{ padding: "8px 16px", backgroundColor: "#4F46E5", color: "#FFF", borderRadius: "6px", border: "none", cursor: "pointer" }}>
              Next →
            </button>
          }
          prevButton={
            <button style={{ padding: "8px 16px", backgroundColor: "#6B7280", color: "#FFF", borderRadius: "6px", border: "none", cursor: "pointer" }}>
              ← Prev
            </button>
          }
          closeButton={
            <button
              style={{
                position: "absolute",
                top: "8px",
                right: "8px",
                background: "transparent",
                border: "none",
                fontSize: "20px",
                cursor: "pointer",
                color: "#6B7280",
              }}
              onClick={closeTour}
            >
              ✕
            </button>
          }
          lastStepNextButton={
            <button
              onClick={closeTour}
              style={{
                padding: "8px 16px",
                backgroundColor: "#10B981",
                color: "#FFF",
                borderRadius: "6px",
                border: "none",
                cursor: "pointer"
              }}
            >
              🎉 Finish Tour
            </button>
          }
          customComponents={{
            Navigation: ({ currentStep, stepsLength }: { currentStep: number; stepsLength: number }) => (
              <div style={{ marginTop: "16px", textAlign: "center", fontSize: "12px", color: "#6B7280" }}>
                Step {currentStep + 1} of {stepsLength}
              </div>
            ),
          }}
          styles={{
            options: {
              backgroundColor: user?.publicMetadata?.darkMode ? "#1F2937" : "#FFFFFF",
              textColor: user?.publicMetadata?.darkMode ? "#F3F4F6" : "#1F2937",
              arrowColor: "#4F46E5",
              overlayColor: "rgba(0, 0, 0, 0.7)",
            },
          }}
          rounded={8}
          showNavigation={true}
          showButtons={true}
          showNavigationNumber={false}
          disableInteraction={true}
        />
      )}
      {children}
    </>
  );
};

export default DashboardTour;
