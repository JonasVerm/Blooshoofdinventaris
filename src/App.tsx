import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { Toaster } from "sonner";
import InventoryManagement from "./InventoryManagement";
import ItemDetailPage from "./ItemDetailPage"; // Import the new page
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

export default function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-gray-50">
        <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm h-16 flex justify-between items-center border-b shadow-sm px-4">
          <h2 className="text-xl font-semibold text-primary">Blooshoofd Inventaris</h2>
          <SignOutButton />
        </header>
        <main className="flex-1"> {/* Removed p-4 md:p-8 for full-width pages */}
          <Content />
        </main>
        <Toaster richColors />
      </div>
    </Router>
  );
}

function Content() {
  const loggedInUser = useQuery(api.auth.loggedInUser);

  if (loggedInUser === undefined) {
    return (
      <div className="flex justify-center items-center h-full p-4 md:p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      <Authenticated>
        {loggedInUser ? (
          <Routes>
            <Route path="/" element={<InventoryManagement />} />
            <Route path="/item/:itemId" element={<ItemDetailPage />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        ) : (
          <div className="flex justify-center items-center h-full p-4 md:p-8">
             <p>Loading user data...</p>
          </div>
        )}
      </Authenticated>
      <Unauthenticated>
        <div className="w-full max-w-md mx-auto mt-10 p-4 md:p-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-primary mb-2">
              Blooshoofd
            </h1>
            <p className="text-lg text-secondary">
              Gelieve in te loggen.
            </p>
          </div>
          <SignInForm />
        </div>
      </Unauthenticated>
    </>
  );
}
